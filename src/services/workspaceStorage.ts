import {
  DEFAULT_INSTRUMENT_TITLE,
  DEFAULT_RUBRIC_SECTIONS,
} from '../constants/rubrics';
import {
  DEFAULT_ACADEMIC_YEAR,
  DEFAULT_HEADMASTER_NAME,
  DEFAULT_HEADMASTER_NIP,
  DEFAULT_INTERNAL_SUPERVISOR_NAME,
  DEFAULT_INTERNAL_SUPERVISOR_NIP,
  DEFAULT_SCHOOL_ADDRESS,
  DEFAULT_SCHOOL_NAME,
  DEFAULT_SCHOOL_NPSN,
  DEFAULT_SUPERVISOR_NAME,
  DEFAULT_SUPERVISOR_NIP,
  KOP_AUTHORITY_CABDIN,
  PROGRAM_TEMPLATE_DEFAULTS,
} from '../constants/school';
import type {
  CloudAppSnapshot,
  CloudSchoolSettingsPayload,
  DriveFileItem,
  FollowUpItem,
  Guru,
  ProgramTemplateConfig,
  RubricSection,
  SupervisionInstrument,
  SupervisionPhoto,
  SupervisionSession,
  UploadedProgramFile,
} from '../types/supervision';

const SHEETS_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';
const DRIVE_FILES_BASE = 'https://www.googleapis.com/drive/v3/files';
const DRIVE_UPLOAD_BASE = 'https://www.googleapis.com/upload/drive/v3/files';

export const SHEET_TABS = {
  CONFIG: 'Config',
  GURU: 'DataGuru',
  SUPERVISI: 'Supervisi',
  FOTO: 'DokumentasiFoto',
  TINDAK_LANJUT: 'TindakLanjut',
} as const;

const TAB_HEADERS: Record<string, string[]> = {
  [SHEET_TABS.CONFIG]: ['key', 'value', 'updatedAt'],
  [SHEET_TABS.GURU]: ['id', 'nama', 'nip', 'pangkat', 'mapel', 'jenjang', 'status', 'kelas'],
  [SHEET_TABS.SUPERVISI]: [
    'id',
    'guruId',
    'namaGuru',
    'mapel',
    'kelas',
    'status',
    'rataSkor',
    'createdAt',
    'instrumentJson',
  ],
  [SHEET_TABS.FOTO]: ['supervisiId', 'photoId', 'caption', 'chunkIndex', 'dataChunk'],
  [SHEET_TABS.TINDAK_LANJUT]: [
    'id',
    'guruNama',
    'guruNip',
    'mapel',
    'kelas',
    'temuan',
    'intervensi',
    'status',
    'dampak',
    'smartRekomendasi',
    'sudahRefleksi',
    'sudahTindakLanjut',
    'perubahanPraktik',
    'perluPendampingan',
    'tglSupervisi',
    'catatan',
  ],
};

export class WorkspaceAuthError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'WorkspaceAuthError';
    this.status = status;
  }
}

async function workspaceFetch<T>(
  url: string,
  token: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(url, { ...init, headers });
  if (!response.ok) {
    let errMsg = `Google API error (${response.status})`;
    try {
      const payload = (await response.json()) as {
        error?: { message?: string; status?: string };
      };
      if (payload?.error?.message) {
        errMsg = payload.error.message;
      }
    } catch {
      // keep default error message
    }
    if (response.status === 401 || response.status === 403) {
      throw new WorkspaceAuthError(
        response.status === 401
          ? 'Sesi Google berakhir. Silakan klik "Masuk dengan Google" kembali.'
          : `Akses ditolak (${errMsg}). Pastikan akun Google Anda memiliki izin Editor ke Spreadsheet & Folder Drive ini.`,
        response.status,
      );
    }
    throw new Error(errMsg);
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

function parseJsonSafe<T>(raw: string | undefined, fallback: T): T {
  if (!raw || typeof raw !== 'string') return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function computeAvgScore(obsScores: Record<string, number> | undefined): number {
  if (!obsScores) return 0;
  const vals = Object.values(obsScores).filter((v) => typeof v === 'number' && v > 0);
  if (vals.length === 0) return 0;
  const sum = vals.reduce((acc, n) => acc + n, 0);
  return Number((sum / vals.length).toFixed(2));
}

export interface SpreadsheetInfo {
  title: string;
  sheetTitles: string[];
  sheetIds: Record<string, number>;
  url: string;
}

export async function fetchSpreadsheetInfo(
  token: string,
  spreadsheetId: string,
): Promise<SpreadsheetInfo> {
  const url = `${SHEETS_BASE}/${encodeURIComponent(
    spreadsheetId,
  )}?fields=properties.title,sheets.properties(sheetId,title)`;

  const data = await workspaceFetch<{
    properties?: { title?: string };
    sheets?: Array<{ properties?: { sheetId?: number; title?: string } }>;
  }>(url, token);

  const sheetTitles: string[] = [];
  const sheetIds: Record<string, number> = {};
  (data.sheets || []).forEach((s) => {
    const title = s.properties?.title;
    const sheetId = s.properties?.sheetId;
    if (title) {
      sheetTitles.push(title);
      if (typeof sheetId === 'number') {
        sheetIds[title] = sheetId;
      }
    }
  });

  return {
    title: data.properties?.title || 'Google Spreadsheet',
    sheetTitles,
    sheetIds,
    url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
  };
}

async function ensureMissingTabs(
  token: string,
  spreadsheetId: string,
  existingTitles: string[],
): Promise<string[]> {
  const required = Object.values(SHEET_TABS);
  const missing = required.filter((tab) => !existingTitles.includes(tab));

  if (missing.length > 0) {
    await workspaceFetch(
      `${SHEETS_BASE}/${encodeURIComponent(spreadsheetId)}:batchUpdate`,
      token,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: missing.map((title) => ({
            addSheet: {
              properties: {
                title,
                gridProperties: { frozenRowCount: 1 },
              },
            },
          })),
        }),
      },
    );
  }

  return [...existingTitles, ...missing];
}

function getDefaultSchoolPayload(): CloudSchoolSettingsPayload {
  return {
    schoolName: DEFAULT_SCHOOL_NAME,
    schoolLevel: 'SMA',
    kopAuthority: KOP_AUTHORITY_CABDIN,
    schoolNpsn: DEFAULT_SCHOOL_NPSN,
    schoolAddress: DEFAULT_SCHOOL_ADDRESS,
    academicYear: DEFAULT_ACADEMIC_YEAR,
    headmasterName: DEFAULT_HEADMASTER_NAME,
    headmasterNip: DEFAULT_HEADMASTER_NIP,
    internalSupervisorName: DEFAULT_INTERNAL_SUPERVISOR_NAME,
    internalSupervisorNip: DEFAULT_INTERNAL_SUPERVISOR_NIP,
    supervisorName: DEFAULT_SUPERVISOR_NAME,
    supervisorNip: DEFAULT_SUPERVISOR_NIP,
    twoStageValidation: true,
  };
}

function getDefaultProgramPayload(): ProgramTemplateConfig {
  return {
    templateId: 'klinis-standar',
    fokusProgram: PROGRAM_TEMPLATE_DEFAULTS['klinis-standar'].fokus,
    semester: 'Semester Ganjil & Genap',
    targetCapaian: PROGRAM_TEMPLATE_DEFAULTS['klinis-standar'].target,
    waktuPelaksanaan: PROGRAM_TEMPLATE_DEFAULTS['klinis-standar'].waktu,
    catatanPengawas:
      'Supervisi dilaksanakan dengan pendekatan coaching non-judgmental untuk menguatkan kompetensi pedagogik guru.',
  };
}

export async function loadCloudSnapshotFromSpreadsheet(
  token: string,
  spreadsheetId: string,
): Promise<{
  info: SpreadsheetInfo;
  snapshot: CloudAppSnapshot;
  isEmptySheet: boolean;
}> {
  const info = await fetchSpreadsheetInfo(token, spreadsheetId);
  const targetTabs = Object.values(SHEET_TABS).filter((t) => info.sheetTitles.includes(t));

  const rangesMap: Record<string, string[][]> = {};
  if (targetTabs.length > 0) {
    const query = targetTabs
      .map((tab) => `ranges=${encodeURIComponent(`${tab}!A1:P`)}`)
      .join('&');
    const batchRes = await workspaceFetch<{
      valueRanges?: Array<{ range?: string; values?: string[][] }>;
    }>(`${SHEETS_BASE}/${encodeURIComponent(spreadsheetId)}/values:batchGet?${query}`, token);

    (batchRes.valueRanges || []).forEach((vr, idx) => {
      const tabName = targetTabs[idx];
      if (tabName) {
        rangesMap[tabName] = vr.values || [];
      }
    });
  }

  // 1. Parse Config tab
  const cfgRows = (rangesMap[SHEET_TABS.CONFIG] || []).slice(1);
  const cfgMap: Record<string, string> = {};
  cfgRows.forEach((row) => {
    const key = String(row[0] || '').trim();
    if (key) {
      cfgMap[key] = String(row[1] || '');
    }
  });

  const savedSchool = parseJsonSafe<Partial<CloudSchoolSettingsPayload>>(cfgMap.school_config, {});
  const schoolConfig: CloudSchoolSettingsPayload = {
    ...getDefaultSchoolPayload(),
    ...savedSchool,
  };

  const savedProgram = parseJsonSafe<Partial<ProgramTemplateConfig>>(cfgMap.program_config, {});
  const programConfig: ProgramTemplateConfig = {
    ...getDefaultProgramPayload(),
    ...savedProgram,
  };

  const uploadedProgramFile = parseJsonSafe<UploadedProgramFile | null>(
    cfgMap.uploaded_program_file,
    null,
  );

  const parsedRubrics = parseJsonSafe<RubricSection[]>(
    cfgMap.rubric_sections,
    DEFAULT_RUBRIC_SECTIONS,
  );
  const rubricSections =
    Array.isArray(parsedRubrics) && parsedRubrics.length > 0
      ? parsedRubrics
      : DEFAULT_RUBRIC_SECTIONS;

  const instrumentTitle = cfgMap.instrument_title || DEFAULT_INSTRUMENT_TITLE;

  // 2. Parse DataGuru
  const guruRows = (rangesMap[SHEET_TABS.GURU] || []).slice(1);
  const gurus: Guru[] = guruRows
    .filter((r) => r[0] || r[1])
    .map((r) => ({
      id: String(r[0] || ''),
      nama: String(r[1] || ''),
      nip: String(r[2] || '-'),
      pangkat: String(r[3] || '-'),
      mapel: String(r[4] || ''),
      jenjang: String(r[5] || schoolConfig.schoolLevel || 'SMA'),
      status: String(r[6] || 'ASN'),
      kelas: String(r[7] || ''),
    }));

  // 3. Parse DokumentasiFoto chunks
  const fotoRows = (rangesMap[SHEET_TABS.FOTO] || []).slice(1);
  const photoChunksGrouped: Record<
    string,
    { svId: string; id: string; caption: string; chunks: string[] }
  > = {};
  fotoRows.forEach((r) => {
    const svId = String(r[0] || '');
    const pId = String(r[1] || '');
    const cap = String(r[2] || '');
    const chunkIdx = Number(r[3]) || 0;
    const dataChunk = String(r[4] || '');
    if (!svId || !pId) return;
    const key = `${svId}::${pId}`;
    if (!photoChunksGrouped[key]) {
      photoChunksGrouped[key] = { svId, id: pId, caption: cap, chunks: [] };
    }
    photoChunksGrouped[key].chunks[chunkIdx] = dataChunk;
  });

  const photosBySupervisi: Record<string, SupervisionPhoto[]> = {};
  Object.values(photoChunksGrouped).forEach((entry) => {
    if (!photosBySupervisi[entry.svId]) {
      photosBySupervisi[entry.svId] = [];
    }
    photosBySupervisi[entry.svId].push({
      id: entry.id,
      caption: entry.caption,
      url: entry.chunks.join(''),
    });
  });

  // 4. Parse Supervisi
  const svRows = (rangesMap[SHEET_TABS.SUPERVISI] || []).slice(1);
  const supervisions: SupervisionSession[] = [];
  svRows.forEach((r) => {
    const svId = String(r[0] || '');
    if (!svId) return;
    const instr = parseJsonSafe<SupervisionInstrument | null>(r[8], null);
    if (!instr) return;
    if ((!instr.photos || instr.photos.length === 0) && photosBySupervisi[svId]) {
      instr.photos = photosBySupervisi[svId];
    }
    supervisions.push({
      id: svId,
      status: String(r[5] || 'Direncakan'),
      createdAt: String(r[7] || new Date().toISOString()),
      instrument: instr,
    });
  });

  // 5. Parse TindakLanjut
  const tlRows = (rangesMap[SHEET_TABS.TINDAK_LANJUT] || []).slice(1);
  const toBool = (val: unknown) => val === true || val === 'true' || val === 'TRUE';
  const followUps: FollowUpItem[] = tlRows
    .filter((r) => r[0] || r[1])
    .map((r) => ({
      id: String(r[0] || ''),
      guruNama: String(r[1] || ''),
      guruNip: String(r[2] || ''),
      mapel: String(r[3] || ''),
      kelas: String(r[4] || ''),
      temuan: String(r[5] || ''),
      intervensi: String(r[6] || ''),
      status: String(r[7] || 'Dipantau'),
      dampak: String(r[8] || 'Dipantau'),
      smartRekomendasi: String(r[9] || ''),
      sudahRefleksi: toBool(r[10]),
      sudahTindakLanjut: toBool(r[11]),
      perubahanPraktik: toBool(r[12]),
      perluPendampingan: toBool(r[13]),
      tglSupervisi: String(r[14] || ''),
      catatan: String(r[15] || ''),
    }));

  const isEmptySheet =
    cfgRows.length === 0 && guruRows.length === 0 && svRows.length === 0 && tlRows.length === 0;

  return {
    info,
    isEmptySheet,
    snapshot: {
      version: 1,
      exportedAt: new Date().toISOString(),
      schoolConfig,
      programConfig,
      uploadedProgramFile,
      rubricSections,
      instrumentTitle,
      gurus,
      supervisions,
      followUps,
    },
  };
}

export async function saveCloudSnapshotToSpreadsheet(
  token: string,
  spreadsheetId: string,
  snapshot: CloudAppSnapshot,
): Promise<{ info: SpreadsheetInfo; syncedAt: string }> {
  const info = await fetchSpreadsheetInfo(token, spreadsheetId);
  const allTabs = await ensureMissingTabs(token, spreadsheetId, info.sheetTitles);

  const existingValidTabs = Object.values(SHEET_TABS).filter((t) => allTabs.includes(t));
  if (existingValidTabs.length > 0) {
    await workspaceFetch(
      `${SHEETS_BASE}/${encodeURIComponent(spreadsheetId)}/values:batchClear`,
      token,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ranges: existingValidTabs.map((t) => `${t}!A1:P`),
        }),
      },
    );
  }

  const nowStr = new Date().toISOString();
  const configRows: string[][] = [
    TAB_HEADERS[SHEET_TABS.CONFIG],
    ['school_config', JSON.stringify(snapshot.schoolConfig), nowStr],
    ['program_config', JSON.stringify(snapshot.programConfig), nowStr],
    ['rubric_sections', JSON.stringify(snapshot.rubricSections), nowStr],
    ['instrument_title', String(snapshot.instrumentTitle || DEFAULT_INSTRUMENT_TITLE), nowStr],
  ];

  if (snapshot.uploadedProgramFile) {
    const serializedFile = JSON.stringify(snapshot.uploadedProgramFile);
    if (serializedFile.length <= 48000) {
      configRows.push(['uploaded_program_file', serializedFile, nowStr]);
    }
  }

  const guruRows: Array<Array<string>> = [
    TAB_HEADERS[SHEET_TABS.GURU],
    ...(snapshot.gurus || []).map((g) => [
      String(g.id || ''),
      String(g.nama || ''),
      String(g.nip || '-'),
      String(g.pangkat || '-'),
      String(g.mapel || ''),
      String(g.jenjang || snapshot.schoolConfig.schoolLevel || 'SMA'),
      String(g.status || 'ASN'),
      String(g.kelas || ''),
    ]),
  ];

  const fotoRows: Array<Array<string | number>> = [TAB_HEADERS[SHEET_TABS.FOTO]];
  const CHUNK_SIZE = 40000;
  const svRows: Array<Array<string | number>> = [
    TAB_HEADERS[SHEET_TABS.SUPERVISI],
    ...(snapshot.supervisions || []).map((sv) => {
      const photos = sv.instrument?.photos || [];
      photos.forEach((p) => {
        const dataUrl = String(p.url || '');
        if (!dataUrl) return;
        const totalChunks = Math.max(1, Math.ceil(dataUrl.length / CHUNK_SIZE));
        for (let c = 0; c < totalChunks; c += 1) {
          fotoRows.push([
            String(sv.id || ''),
            String(p.id || ''),
            String(p.caption || ''),
            c,
            dataUrl.slice(c * CHUNK_SIZE, (c + 1) * CHUNK_SIZE),
          ]);
        }
      });

      const instrWithoutPhotos: SupervisionInstrument = {
        ...sv.instrument,
        photos: [],
      };
      let instrJson = JSON.stringify(instrWithoutPhotos);
      if (instrJson.length > 49000) {
        instrJson = JSON.stringify({
          ...instrWithoutPhotos,
          documents: (instrWithoutPhotos.documents || []).map((d) => ({
            ...d,
            url: d.url && d.url.length > 1000 ? '#stored-in-drive' : d.url,
          })),
        }).slice(0, 49000);
      }

      return [
        String(sv.id || ''),
        String(instrWithoutPhotos.guruId || ''),
        String(instrWithoutPhotos.namaGuru || ''),
        String(instrWithoutPhotos.mapel || ''),
        String(instrWithoutPhotos.kelas || ''),
        String(sv.status || 'Direncakan'),
        computeAvgScore(instrWithoutPhotos.obsScores),
        String(sv.createdAt || nowStr),
        instrJson,
      ];
    }),
  ];

  const tlRows: Array<Array<string | boolean>> = [
    TAB_HEADERS[SHEET_TABS.TINDAK_LANJUT],
    ...(snapshot.followUps || []).map((item) => [
      String(item.id || ''),
      String(item.guruNama || ''),
      String(item.guruNip || ''),
      String(item.mapel || ''),
      String(item.kelas || ''),
      String(item.temuan || ''),
      String(item.intervensi || ''),
      String(item.status || 'Dipantau'),
      String(item.dampak || 'Dipantau'),
      String(item.smartRekomendasi || ''),
      Boolean(item.sudahRefleksi),
      Boolean(item.sudahTindakLanjut),
      Boolean(item.perubahanPraktik),
      Boolean(item.perluPendampingan),
      String(item.tglSupervisi || ''),
      String(item.catatan || ''),
    ]),
  ];

  await workspaceFetch(
    `${SHEETS_BASE}/${encodeURIComponent(spreadsheetId)}/values:batchUpdate`,
    token,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        valueInputOption: 'RAW',
        data: [
          { range: `${SHEET_TABS.CONFIG}!A1`, values: configRows },
          { range: `${SHEET_TABS.GURU}!A1`, values: guruRows },
          { range: `${SHEET_TABS.SUPERVISI}!A1`, values: svRows },
          { range: `${SHEET_TABS.FOTO}!A1`, values: fotoRows },
          { range: `${SHEET_TABS.TINDAK_LANJUT}!A1`, values: tlRows },
        ],
      }),
    },
  );

  return { info, syncedAt: nowStr };
}

export async function listDriveFolderFiles(
  token: string,
  folderId: string,
): Promise<DriveFileItem[]> {
  const q = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
  const fields = encodeURIComponent(
    'files(id,name,mimeType,webViewLink,modifiedTime,size)',
  );
  const url = `${DRIVE_FILES_BASE}?q=${q}&fields=${fields}&orderBy=modifiedTime+desc&pageSize=50&supportsAllDrives=true&includeItemsFromAllDrives=true`;

  const res = await workspaceFetch<{ files?: DriveFileItem[] }>(url, token);
  return res.files || [];
}

export async function uploadFileToDriveFolder(
  token: string,
  folderId: string,
  fileBlob: Blob,
  fileName: string,
  mimeType: string,
): Promise<DriveFileItem> {
  const metadata = {
    name: fileName,
    parents: [folderId],
    mimeType: mimeType || 'application/octet-stream',
  };

  const formData = new FormData();
  formData.append(
    'metadata',
    new Blob([JSON.stringify(metadata)], { type: 'application/json' }),
  );
  formData.append('file', fileBlob, fileName);

  const fields = encodeURIComponent('id,name,mimeType,webViewLink,modifiedTime,size');
  const url = `${DRIVE_UPLOAD_BASE}?uploadType=multipart&supportsAllDrives=true&fields=${fields}`;

  return workspaceFetch<DriveFileItem>(url, token, {
    method: 'POST',
    body: formData,
  });
}

export async function uploadBackupJsonToDrive(
  token: string,
  folderId: string,
  snapshot: CloudAppSnapshot,
): Promise<DriveFileItem> {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const schoolSlug = (snapshot.schoolConfig.schoolName || 'Sekolah')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .slice(0, 28);
  const fileName = `SI_PERAK_Backup_${schoolSlug}_${stamp}.json`;
  const blob = new Blob([JSON.stringify(snapshot, null, 2)], {
    type: 'application/json',
  });
  return uploadFileToDriveFolder(token, folderId, blob, fileName, 'application/json');
}

export async function downloadDriveJsonBackup(
  token: string,
  fileId: string,
): Promise<Partial<CloudAppSnapshot>> {
  const url = `${DRIVE_FILES_BASE}/${encodeURIComponent(fileId)}?alt=media&supportsAllDrives=true`;
  return workspaceFetch<Partial<CloudAppSnapshot>>(url, token);
}

export async function deleteDriveFile(token: string, fileId: string): Promise<void> {
  const url = `${DRIVE_FILES_BASE}/${encodeURIComponent(fileId)}?supportsAllDrives=true`;
  await workspaceFetch<void>(url, token, {
    method: 'DELETE',
  });
}
