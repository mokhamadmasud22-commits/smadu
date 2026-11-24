import {
  DEFAULT_ACADEMIC_YEAR,
  DEFAULT_DRIVE_FOLDER_ID,
  DEFAULT_HEADMASTER_NAME,
  DEFAULT_HEADMASTER_NIP,
  DEFAULT_INTERNAL_SUPERVISOR_NAME,
  DEFAULT_INTERNAL_SUPERVISOR_NIP,
  DEFAULT_SCHOOL_ADDRESS,
  DEFAULT_SCHOOL_NAME,
  DEFAULT_SCHOOL_NPSN,
  DEFAULT_SPREADSHEET_ID,
  DEFAULT_SUPERVISOR_NAME,
  DEFAULT_SUPERVISOR_NIP,
  KOP_AUTHORITY_CABDIN,
  KOP_AUTHORITY_KAB,
  PROGRAM_TEMPLATE_DEFAULTS,
} from '../constants/school';
import {
  DEFAULT_INSTRUMENT_TITLE,
  DEFAULT_RUBRIC_SECTIONS,
} from '../constants/rubrics';
import type {
  CloudAppSnapshot,
  FollowUpItem,
  Guru,
  ProgramTemplateConfig,
  RubricSection,
  SchoolConfig,
  SupervisionInstrument,
  SupervisionSession,
  UploadedProgramFile,
} from '../types/supervision';

const MOCK_GURU_NAMES = [
  'Budi Santoso, S.Pd.',
  'Siti Aminah, M.Pd.',
  'Dedi Kurniawan, S.T.',
  'Ani Wijaya, S.Pd.',
];

export const STORAGE_EVENTS = {
  SCHOOL_CONFIG_UPDATED: 'school_config_updated',
  INSTRUMENT_CONFIG_UPDATED: 'instrument_config_updated',
  FOLLOW_UPS_UPDATED: 'supervisi_follow_ups_updated',
  CLOUD_DATA_LOADED: 'cloud_data_loaded',
} as const;

export function getEffectiveSupervisorName(): string {
  const stored = localStorage.getItem('school_supervisor_name');
  if (!stored || stored.toLowerCase().includes('subhan') || stored === 'Supervisor Akademik') {
    localStorage.setItem('school_supervisor_name', DEFAULT_SUPERVISOR_NAME);
    return DEFAULT_SUPERVISOR_NAME;
  }
  return stored;
}

export function getEffectiveSupervisorNip(): string {
  const stored = localStorage.getItem('school_supervisor_nip');
  if (!stored || stored === '-') {
    localStorage.setItem('school_supervisor_nip', DEFAULT_SUPERVISOR_NIP);
    return DEFAULT_SUPERVISOR_NIP;
  }
  return stored;
}

export function getEffectiveAcademicYear(): string {
  const stored = localStorage.getItem('school_academic_year');
  if (stored && stored !== '2025/2026' && stored !== '2025 / 2026') {
    return stored;
  }
  return DEFAULT_ACADEMIC_YEAR;
}

export function loadSchoolConfig(defaultName = DEFAULT_SCHOOL_NAME): SchoolConfig {
  const schoolLevel = localStorage.getItem('school_level') || 'SMA';
  const defaultKop = ['TK', 'SD', 'SMP'].includes(schoolLevel)
    ? KOP_AUTHORITY_KAB
    : KOP_AUTHORITY_CABDIN;
  const kopAuthority = localStorage.getItem('school_kop_authority') || defaultKop;
  const isDinasPendidikan = kopAuthority === KOP_AUTHORITY_KAB;
  const twoStageRaw = localStorage.getItem('school_two_stage');

  return {
    schoolName: localStorage.getItem('school_name') || defaultName,
    schoolLevel,
    kopAuthority,
    isDinasPendidikan,
    authorityName: isDinasPendidikan
      ? 'Dinas Pendidikan Kabupaten Bojonegoro'
      : 'Cabang Dinas Pendidikan Wilayah Bojonegoro',
    authorityShort: isDinasPendidikan
      ? 'Disdik Kab. Bojonegoro'
      : 'Cabdindik Wil. Bojonegoro',
    parentGov: isDinasPendidikan
      ? 'Pemerintah Kabupaten Bojonegoro'
      : 'Pemerintah Provinsi Jawa Timur',
    parentGovUpper: isDinasPendidikan
      ? 'PEMERINTAH KABUPATEN BOJONEGORO'
      : 'PEMERINTAH PROVINSI JAWA TIMUR',
    schoolNpsn: localStorage.getItem('school_npsn') || DEFAULT_SCHOOL_NPSN,
    schoolAddress: localStorage.getItem('school_address') || DEFAULT_SCHOOL_ADDRESS,
    academicYear: getEffectiveAcademicYear(),
    headmasterName: localStorage.getItem('school_headmaster_name') || DEFAULT_HEADMASTER_NAME,
    headmasterNip: localStorage.getItem('school_headmaster_nip') || DEFAULT_HEADMASTER_NIP,
    internalSupervisorName:
      localStorage.getItem('school_internal_supervisor_name') ||
      DEFAULT_INTERNAL_SUPERVISOR_NAME,
    internalSupervisorNip:
      localStorage.getItem('school_internal_supervisor_nip') ||
      DEFAULT_INTERNAL_SUPERVISOR_NIP,
    supervisorName: getEffectiveSupervisorName(),
    supervisorNip: getEffectiveSupervisorNip(),
    supervisorRole: isDinasPendidikan
      ? `Pengawas ${schoolLevel} Dinas Pendidikan Kabupaten Bojonegoro`
      : `Pengawas ${schoolLevel} Cabang Dinas Pendidikan Wilayah Bojonegoro`,
    twoStageValidation: twoStageRaw !== null ? twoStageRaw === 'true' : true,
  };
}

export function saveSchoolConfigAndSync(config: {
  schoolName: string;
  schoolLevel: string;
  kopAuthority: string;
  schoolNpsn: string;
  schoolAddress: string;
  academicYear: string;
  headmasterName: string;
  headmasterNip: string;
  internalSupervisorName: string;
  internalSupervisorNip: string;
  supervisorName: string;
  supervisorNip: string;
  twoStageValidation: boolean;
}): void {
  const cleanName = config.schoolName.trim();
  const cleanAddress = config.schoolAddress.trim();
  const cleanHead = config.headmasterName.trim();
  const cleanHeadNip = config.headmasterNip.trim();
  const cleanInternal = config.internalSupervisorName.trim();
  const cleanInternalNip = config.internalSupervisorNip.trim();
  const cleanSupervisor = config.supervisorName.trim();
  const cleanSupervisorNip = config.supervisorNip.trim();

  localStorage.setItem('school_name', cleanName);
  localStorage.setItem('school_level', config.schoolLevel);
  localStorage.setItem('school_kop_authority', config.kopAuthority);
  localStorage.setItem('school_npsn', config.schoolNpsn.trim());
  localStorage.setItem('school_address', cleanAddress);
  localStorage.setItem('school_academic_year', config.academicYear);
  localStorage.setItem('school_headmaster_name', cleanHead);
  localStorage.setItem('school_headmaster_nip', cleanHeadNip);
  localStorage.setItem('school_internal_supervisor_name', cleanInternal);
  localStorage.setItem('school_internal_supervisor_nip', cleanInternalNip);
  localStorage.setItem('school_supervisor_name', cleanSupervisor);
  localStorage.setItem('school_supervisor_nip', cleanSupervisorNip);
  localStorage.setItem('school_two_stage', config.twoStageValidation.toString());

  const supervisionsRaw = localStorage.getItem('supervisions');
  if (supervisionsRaw) {
    try {
      const parsed = JSON.parse(supervisionsRaw) as SupervisionSession[];
      const synced = parsed.map((sv) => ({
        ...sv,
        instrument: {
          ...sv.instrument,
          namaSekolah: cleanName,
          alamatSekolah: cleanAddress,
          namaKepala: cleanHead,
          nipKepala: cleanHeadNip,
          namaPengawas: cleanInternal,
          nipPengawas: cleanInternalNip,
        },
      }));
      localStorage.setItem('supervisions', JSON.stringify(synced));
    } catch (err) {
      console.error('Failed to sync supervisions with new school settings', err);
    }
  }

  window.dispatchEvent(new Event(STORAGE_EVENTS.SCHOOL_CONFIG_UPDATED));
  window.dispatchEvent(new Event('storage'));
}

export function createEmptyInstrument(guruId = '', guruNama = ''): SupervisionInstrument {
  return {
    guruId,
    namaGuru: guruNama,
    nipGuru: '',
    namaSekolah: localStorage.getItem('school_name') || DEFAULT_SCHOOL_NAME,
    alamatSekolah: localStorage.getItem('school_address') || DEFAULT_SCHOOL_ADDRESS,
    namaKepala: localStorage.getItem('school_headmaster_name') || DEFAULT_HEADMASTER_NAME,
    nipKepala: localStorage.getItem('school_headmaster_nip') || DEFAULT_HEADMASTER_NIP,
    namaPengawas: getEffectiveSupervisorName(),
    nipPengawas: getEffectiveSupervisorNip(),
    mapel: '',
    kelas: '',
    materi: '',
    tglPra: '',
    tglObs: '',
    tglPasca: '',
    praFields: { tujuan: '', area: '', strategi: '', media: '' },
    praAI: '',
    obsScores: {},
    obsNotes: {},
    obsAI: '',
    pascaRefleksi: '',
    pascaSanggah: '',
    pascaRencana: '',
    pascaAI: '',
    rtl: {
      coaching: false,
      mentoring: false,
      workshop: false,
      lessonStudy: false,
      selfDevelopment: false,
    },
    analysisScore: '',
    kekuatan: '',
    perbaikan: '',
    rekomendasi: '',
    photos: [],
    documents: [],
  };
}

export function loadActiveRubricSections(): RubricSection[] {
  try {
    const raw = localStorage.getItem('school_custom_rubric_sections');
    if (!raw) return DEFAULT_RUBRIC_SECTIONS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.items) {
      return parsed;
    }
  } catch (err) {
    console.error('Error loading custom rubric sections:', err);
  }
  return DEFAULT_RUBRIC_SECTIONS;
}

export function loadActiveInstrumentTitle(): string {
  return localStorage.getItem('school_instrument_name') || DEFAULT_INSTRUMENT_TITLE;
}

export function saveActiveRubricConfig(sections: RubricSection[], name?: string): void {
  try {
    localStorage.setItem('school_custom_rubric_sections', JSON.stringify(sections));
    if (name) {
      localStorage.setItem('school_instrument_name', name);
    }
    window.dispatchEvent(new Event(STORAGE_EVENTS.INSTRUMENT_CONFIG_UPDATED));
    window.dispatchEvent(new Event('storage'));
  } catch (err) {
    console.error('Error saving rubric sections:', err);
  }
}

export function resetActiveRubricConfig(): void {
  try {
    localStorage.removeItem('school_custom_rubric_sections');
    localStorage.removeItem('school_instrument_name');
    window.dispatchEvent(new Event(STORAGE_EVENTS.INSTRUMENT_CONFIG_UPDATED));
    window.dispatchEvent(new Event('storage'));
  } catch (err) {
    console.error('Error resetting rubric sections:', err);
  }
}

export function loadStoredGurus(): Guru[] {
  const raw = localStorage.getItem('gurus');
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Guru[];
    return parsed.filter((g) => !MOCK_GURU_NAMES.includes(g.nama));
  } catch (err) {
    console.error(err);
    return [];
  }
}

export function loadStoredSupervisions(): SupervisionSession[] {
  const raw = localStorage.getItem('supervisions');
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as SupervisionSession[];
    return parsed.filter(
      (sv) =>
        !sv.id.startsWith('sv-mock-') &&
        !MOCK_GURU_NAMES.includes(sv.instrument?.namaGuru || ''),
    );
  } catch (err) {
    console.error(err);
    return [];
  }
}

export function loadStoredFollowUps(): FollowUpItem[] {
  const raw = localStorage.getItem('supervisi_follow_ups');
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (item) =>
          !item.id?.startsWith('tl-default-') &&
          item.guruNama !== 'Guru A' &&
          item.guruNama !== 'Guru B' &&
          item.guruNama !== 'Guru C',
      );
    }
  } catch (err) {
    console.error('Failed to parse supervisi_follow_ups', err);
  }
  return [];
}

export function saveStoredFollowUps(items: FollowUpItem[]): void {
  localStorage.setItem('supervisi_follow_ups', JSON.stringify(items));
  window.dispatchEvent(new Event(STORAGE_EVENTS.FOLLOW_UPS_UPDATED));
  window.dispatchEvent(new Event('storage'));
}

export function runInitialStorageMigrations(): SupervisionSession[] | null {
  const year = localStorage.getItem('school_academic_year');
  if (!year || year === '2025/2026' || year === '2025 / 2026') {
    localStorage.setItem('school_academic_year', DEFAULT_ACADEMIC_YEAR);
  }

  getEffectiveSupervisorName();
  getEffectiveSupervisorNip();

  if (!localStorage.getItem('school_address')) {
    localStorage.setItem('school_address', DEFAULT_SCHOOL_ADDRESS);
  }

  let migratedSupervisions: SupervisionSession[] | null = null;
  const supervisionsRaw = localStorage.getItem('supervisions');
  if (supervisionsRaw && supervisionsRaw.toLowerCase().includes('subhan')) {
    try {
      const parsed = JSON.parse(supervisionsRaw) as SupervisionSession[];
      migratedSupervisions = parsed.map((sv) => {
        const supName = sv.instrument?.namaPengawas;
        if (supName?.toLowerCase().includes('subhan') || !supName) {
          return {
            ...sv,
            instrument: {
              ...sv.instrument,
              namaPengawas: DEFAULT_SUPERVISOR_NAME,
              nipPengawas: sv.instrument?.nipPengawas || DEFAULT_SUPERVISOR_NIP,
            },
          };
        }
        return sv;
      });
      localStorage.setItem('supervisions', JSON.stringify(migratedSupervisions));
    } catch (err) {
      console.error(err);
    }
  }

  const followUpsRaw = localStorage.getItem('supervisi_follow_ups');
  if (followUpsRaw) {
    try {
      const parsed = JSON.parse(followUpsRaw);
      if (Array.isArray(parsed)) {
        const filtered = parsed.filter(
          (item: FollowUpItem) =>
            !item.id?.startsWith('tl-default-') &&
            item.guruNama !== 'Guru A' &&
            item.guruNama !== 'Guru B' &&
            item.guruNama !== 'Guru C',
        );
        localStorage.setItem('supervisi_follow_ups', JSON.stringify(filtered));
      }
    } catch (err) {
      console.error(err);
    }
  }

  window.dispatchEvent(new Event('storage'));
  return migratedSupervisions;
}

export function loadProgramTemplateConfig(): ProgramTemplateConfig {
  try {
    const raw = localStorage.getItem('school_program_template_config');
    if (raw) return JSON.parse(raw) as ProgramTemplateConfig;
  } catch (err) {
    console.error(err);
  }
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

export function saveProgramTemplateConfig(config: ProgramTemplateConfig): void {
  localStorage.setItem('school_program_template_config', JSON.stringify(config));
}

export function loadUploadedProgramFile(): UploadedProgramFile | null {
  try {
    const raw = localStorage.getItem('school_program_custom_file');
    return raw ? (JSON.parse(raw) as UploadedProgramFile) : null;
  } catch (err) {
    console.error('Error loading uploaded program document:', err);
    return null;
  }
}

export function saveUploadedProgramFile(file: UploadedProgramFile | null): void {
  if (file) {
    localStorage.setItem('school_program_custom_file', JSON.stringify(file));
  } else {
    localStorage.removeItem('school_program_custom_file');
  }
}

export function extractGoogleIdFromInput(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  const folderMatch = trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (folderMatch?.[1]) return folderMatch[1];
  const sheetMatch = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (sheetMatch?.[1]) return sheetMatch[1];
  const fileMatch = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch?.[1]) return fileMatch[1];
  return trimmed.split(/[?#]/)[0];
}

export function getStoredSpreadsheetId(): string {
  return localStorage.getItem('siperak_spreadsheet_id') || DEFAULT_SPREADSHEET_ID;
}

export function setStoredSpreadsheetId(id: string): void {
  const clean = extractGoogleIdFromInput(id);
  if (clean) {
    localStorage.setItem('siperak_spreadsheet_id', clean);
  } else {
    localStorage.removeItem('siperak_spreadsheet_id');
  }
}

export function getStoredDriveFolderId(): string {
  return localStorage.getItem('siperak_drive_folder_id') || DEFAULT_DRIVE_FOLDER_ID;
}

export function setStoredDriveFolderId(id: string): void {
  const clean = extractGoogleIdFromInput(id);
  if (clean) {
    localStorage.setItem('siperak_drive_folder_id', clean);
  } else {
    localStorage.removeItem('siperak_drive_folder_id');
  }
}

export function collectLocalSnapshotForCloud(): CloudAppSnapshot {
  const cfg = loadSchoolConfig();
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    schoolConfig: {
      schoolName: cfg.schoolName,
      schoolLevel: cfg.schoolLevel,
      kopAuthority: cfg.kopAuthority,
      schoolNpsn: cfg.schoolNpsn,
      schoolAddress: cfg.schoolAddress,
      academicYear: cfg.academicYear,
      headmasterName: cfg.headmasterName,
      headmasterNip: cfg.headmasterNip,
      internalSupervisorName: cfg.internalSupervisorName,
      internalSupervisorNip: cfg.internalSupervisorNip,
      supervisorName: cfg.supervisorName,
      supervisorNip: cfg.supervisorNip,
      twoStageValidation: cfg.twoStageValidation,
    },
    programConfig: loadProgramTemplateConfig(),
    uploadedProgramFile: loadUploadedProgramFile(),
    rubricSections: loadActiveRubricSections(),
    instrumentTitle: loadActiveInstrumentTitle(),
    gurus: loadStoredGurus(),
    supervisions: loadStoredSupervisions(),
    followUps: loadStoredFollowUps(),
  };
}

export function applyCloudSnapshotToLocalStorage(snapshot: Partial<CloudAppSnapshot>): void {
  if (snapshot.schoolConfig) {
    const sc = snapshot.schoolConfig;
    if (sc.schoolName !== undefined) localStorage.setItem('school_name', sc.schoolName);
    if (sc.schoolLevel !== undefined) localStorage.setItem('school_level', sc.schoolLevel);
    if (sc.kopAuthority !== undefined) localStorage.setItem('school_kop_authority', sc.kopAuthority);
    if (sc.schoolNpsn !== undefined) localStorage.setItem('school_npsn', sc.schoolNpsn);
    if (sc.schoolAddress !== undefined) localStorage.setItem('school_address', sc.schoolAddress);
    if (sc.academicYear !== undefined) localStorage.setItem('school_academic_year', sc.academicYear);
    if (sc.headmasterName !== undefined) localStorage.setItem('school_headmaster_name', sc.headmasterName);
    if (sc.headmasterNip !== undefined) localStorage.setItem('school_headmaster_nip', sc.headmasterNip);
    if (sc.internalSupervisorName !== undefined) {
      localStorage.setItem('school_internal_supervisor_name', sc.internalSupervisorName);
    }
    if (sc.internalSupervisorNip !== undefined) {
      localStorage.setItem('school_internal_supervisor_nip', sc.internalSupervisorNip);
    }
    if (sc.supervisorName !== undefined) localStorage.setItem('school_supervisor_name', sc.supervisorName);
    if (sc.supervisorNip !== undefined) localStorage.setItem('school_supervisor_nip', sc.supervisorNip);
    if (sc.twoStageValidation !== undefined) {
      localStorage.setItem('school_two_stage', String(sc.twoStageValidation));
    }
  }

  if (snapshot.programConfig) {
    saveProgramTemplateConfig(snapshot.programConfig);
  }
  if (snapshot.uploadedProgramFile !== undefined) {
    saveUploadedProgramFile(snapshot.uploadedProgramFile);
  }
  if (Array.isArray(snapshot.rubricSections) && snapshot.rubricSections.length > 0) {
    localStorage.setItem('school_custom_rubric_sections', JSON.stringify(snapshot.rubricSections));
  }
  if (snapshot.instrumentTitle) {
    localStorage.setItem('school_instrument_name', snapshot.instrumentTitle);
  }
  if (Array.isArray(snapshot.gurus)) {
    localStorage.setItem('gurus', JSON.stringify(snapshot.gurus));
  }
  if (Array.isArray(snapshot.supervisions)) {
    localStorage.setItem('supervisions', JSON.stringify(snapshot.supervisions));
  }
  if (Array.isArray(snapshot.followUps)) {
    localStorage.setItem('supervisi_follow_ups', JSON.stringify(snapshot.followUps));
  }

  window.dispatchEvent(new Event(STORAGE_EVENTS.SCHOOL_CONFIG_UPDATED));
  window.dispatchEvent(new Event(STORAGE_EVENTS.INSTRUMENT_CONFIG_UPDATED));
  window.dispatchEvent(new Event(STORAGE_EVENTS.FOLLOW_UPS_UPDATED));
  window.dispatchEvent(new Event(STORAGE_EVENTS.CLOUD_DATA_LOADED));
  window.dispatchEvent(new Event('storage'));
}

