/**
 * ============================================================================
 * SI PERAK — Sistem Informasi Supervisi Akademik Kurikulum Nasional
 * Google Apps Script Backend (Code.gs)
 *
 * Karya & Hak Cipta: Anis Fatul Cholis, M.Pd
 * Pengawas Sekolah / Cabang Dinas Pendidikan Wilayah Bojonegoro
 *
 * Cara Pemasangan di Google Apps Script (script.google.com):
 * 1. Buat project Apps Script baru (atau buka Extensions > Apps Script di Google Sheets).
 * 2. Salin seluruh isi file Code.gs ini ke file Code.gs pada editor Apps Script.
 * 3. Buat file HTML baru bernama "index" (index.html) lalu salin isi apps-script/index.html.
 * 4. (Opsional untuk fitur Analisis AI) Buka Project Settings > Script Properties,
 *    tambahkan property: GEMINI_API_KEY, atau isi langsung dari menu Pengaturan Sekolah.
 * 5. Klik Deploy > New deployment > Web app.
 * ============================================================================
 */

var APP_TITLE = 'SI PERAK — Sistem Informasi Supervisi Akademik';
var PROP_SPREADSHEET_ID = 'SIPERAK_SPREADSHEET_ID';
var PROP_DRIVE_FOLDER_ID = 'SIPERAK_DRIVE_FOLDER_ID';
var PROP_GEMINI_API_KEY = 'GEMINI_API_KEY';
var DEFAULT_SPREADSHEET_ID = '1CxeDZvZnIEMwY94lar7oILEF-vpb6acW50m5pJzZJMo';
var DEFAULT_DRIVE_FOLDER_ID = '1eWU2jbJpHb3vWLFggrEMBjIJtvEjjNW6';

var SHEET_NAMES = {
  CONFIG: 'Config',
  GURU: 'DataGuru',
  SUPERVISI: 'Supervisi',
  FOTO: 'DokumentasiFoto',
  TINDAK_LANJUT: 'TindakLanjut',
};

var DEFAULT_SCHOOL_CONFIG = {
  schoolName: 'SMAS DARUL ULUM KEPOHBARU',
  schoolLevel: 'SMA',
  kopAuthority: 'CABANG DINAS PENDIDIKAN WILAYAH BOJONEGORO',
  schoolNpsn: '20541216',
  schoolAddress: 'Jl. Raya Desa Nglumber Kecamatan Kepohbaru Bojonegoro - Jawa Timur',
  academicYear: '2026/2027',
  headmasterName: 'SALIM,S.Pd.',
  headmasterNip: '-',
  internalSupervisorName: 'Waka Kurikulum / Guru Senior',
  internalSupervisorNip: '19780512 200501 1 009',
  supervisorName: 'Anis Fatul Cholis, M.Pd',
  supervisorNip: '19740825 199802 2 004',
  twoStageValidation: true,
};

var DEFAULT_PROGRAM_CONFIG = {
  templateId: 'klinis-standar',
  fokusProgram: 'Supervisi Klinis Kemitraan Berbasis Siklus 5 Tahap Kurikulum Nasional',
  semester: 'Semester Ganjil & Genap',
  targetCapaian:
    'Minimal 85% guru mencapai predikat kinerja "Baik" atau "Sangat Baik" dalam siklus refleksi',
  waktuPelaksanaan: 'Juli 2026 s.d. Juni 2027 (Semester Ganjil & Genap)',
  catatanPengawas:
    'Supervisi dilaksanakan dengan pendekatan coaching non-judgmental untuk menguatkan kompetensi pedagogik guru.',
};

var DEFAULT_INSTRUMENT_TITLE = 'Standar Nasional & Deep Learning';

var DEFAULT_RUBRIC_SECTIONS = [
  {
    id: 'pendahuluan',
    title: 'A. PENDAHULUAN (Fokus: Kesiapan & Apersepsi)',
    items: [
      {
        id: 'p1',
        label: 'Membangun Kesiapan & Motivasi',
        desc: 'Membangun suasana kelas yang positif, apersepsi yang relevan, dan memotivasi siswa untuk belajar mendalam.',
      },
      {
        id: 'p2',
        label: 'Penyampaian Tujuan & Alur',
        desc: 'Menjelaskan tujuan pembelajaran dan skenario kegiatan dengan bahasa yang dipahami siswa.',
      },
    ],
  },
  {
    id: 'inti',
    title: 'B. INTI (Fokus: Deep Learning & Kurikulum Nasional)',
    items: [
      {
        id: 'i1',
        label: 'Penguasaan Materi Mendalam',
        desc: 'Mampu menghubungkan materi dengan konteks nyata dan memantik berpikir kritis.',
      },
      {
        id: 'i2',
        label: 'Strategi Berdiferensiasi',
        desc: 'Melayani kebutuhan belajar yang berbeda melalui variasi konten, proses, atau produk.',
      },
      {
        id: 'i3',
        label: 'Pemanfaatan Media & IT',
        desc: 'Menggunakan alat bantu pembelajaran secara efektif untuk meningkatkan keterlibatan.',
      },
      {
        id: 'i4',
        label: 'Interaksi & Kolaborasi',
        desc: 'Mendorong diskusi antar siswa dan membimbing kerja kelompok secara aktif.',
      },
    ],
  },
  {
    id: 'penutup',
    title: 'C. PENUTUP (Fokus: Refleksi & Evaluasi)',
    items: [
      {
        id: 't1',
        label: 'Refleksi Pembelajaran',
        desc: 'Mengajak siswa menyimpulkan apa yang telah dipelajari dan dampaknya.',
      },
      {
        id: 't2',
        label: 'Evaluasi & Umpan Balik',
        desc: 'Memberikan penguatan dan feedback yang konstruktif untuk perbaikan selanjutnya.',
      },
    ],
  },
];

/**
 * Entry point Web App Apps Script.
 * Menggunakan createHtmlOutputFromFile agar seluruh script & HTML tampil utuh tanpa parsing scriptlet.
 */
function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle(APP_TITLE)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Menu kustom ketika Apps Script terpasang pada Google Spreadsheet.
 */
function onOpen() {
  try {
    SpreadsheetApp.getUi()
      .createMenu('SI PERAK')
      .addItem('Inisialisasi Tab Database', 'initDatabaseMenu_')
      .addItem('Atur Gemini API Key', 'promptGeminiKeyMenu_')
      .addToUi();
  } catch (err) {
    Logger.log('onOpen skipped: ' + err);
  }
}

function initDatabaseMenu_() {
  var ss = getOrCreateSpreadsheet_();
  ensureAllSheets_(ss);
  SpreadsheetApp.getUi().alert('Database SI PERAK siap digunakan pada Spreadsheet: ' + ss.getName());
}

function promptGeminiKeyMenu_() {
  var ui = SpreadsheetApp.getUi();
  var res = ui.prompt(
    'Konfigurasi Gemini API Key',
    'Masukkan GEMINI_API_KEY untuk mengaktifkan Analisis AI pada SI PERAK:',
    ui.ButtonSet.OK_CANCEL,
  );
  if (res.getSelectedButton() === ui.Button.OK) {
    var key = (res.getResponseText() || '').trim();
    if (key) {
      PropertiesService.getScriptProperties().setProperty(PROP_GEMINI_API_KEY, key);
      ui.alert('GEMINI_API_KEY berhasil disimpan ke Script Properties.');
    }
  }
}

/**
 * Konversi nilai sel Google Sheets (termasuk Date) menjadi string aman untuk google.script.run.
 * google.script.run dapat mengembalikan null apabila payload mengandung objek Date!
 */
function safeCellString_(val) {
  if (val === null || val === undefined) return '';
  if (Object.prototype.toString.call(val) === '[object Date]') {
    try {
      return Utilities.formatDate(val, Session.getScriptTimeZone() || 'Asia/Jakarta', 'yyyy-MM-dd');
    } catch (e) {
      return val.toISOString().split('T')[0];
    }
  }
  return String(val);
}

function getTargetDriveFolderId_() {
  var scriptProps = PropertiesService.getScriptProperties();
  return scriptProps.getProperty(PROP_DRIVE_FOLDER_ID) || DEFAULT_DRIVE_FOLDER_ID;
}

/**
 * Mendapatkan atau membuat Spreadsheet database secara otomatis.
 * Memprioritaskan Spreadsheet aktif / tersimpan / DEFAULT_SPREADSHEET_ID agar sinkron lintas perangkat.
 */
function getOrCreateSpreadsheet_() {
  var scriptProps = PropertiesService.getScriptProperties();
  var userProps = PropertiesService.getUserProperties();
  var storedId = scriptProps.getProperty(PROP_SPREADSHEET_ID) || userProps.getProperty(PROP_SPREADSHEET_ID);
  if (storedId) {
    try {
      return SpreadsheetApp.openById(storedId);
    } catch (err) {
      storedId = null;
    }
  }

  try {
    var defaultSs = SpreadsheetApp.openById(DEFAULT_SPREADSHEET_ID);
    if (defaultSs) {
      scriptProps.setProperty(PROP_SPREADSHEET_ID, defaultSs.getId());
      return defaultSs;
    }
  } catch (err) {
    Logger.log('Cannot open DEFAULT_SPREADSHEET_ID directly: ' + err);
  }

  var active = null;
  try {
    active = SpreadsheetApp.getActiveSpreadsheet();
  } catch (err) {
    active = null;
  }
  if (active) {
    return active;
  }

  var newSs = SpreadsheetApp.create('SI PERAK - Database Supervisi Akademik');
  scriptProps.setProperty(PROP_SPREADSHEET_ID, newSs.getId());
  userProps.setProperty(PROP_SPREADSHEET_ID, newSs.getId());
  ensureAllSheets_(newSs);
  return newSs;
}

/**
 * Memastikan seluruh sheet dan header kolom tersedia.
 */
function ensureAllSheets_(ss) {
  ensureSheetWithHeaders_(ss, SHEET_NAMES.CONFIG, ['key', 'value', 'updatedAt']);
  ensureSheetWithHeaders_(ss, SHEET_NAMES.GURU, [
    'id',
    'nama',
    'nip',
    'pangkat',
    'mapel',
    'jenjang',
    'status',
    'kelas',
  ]);
  ensureSheetWithHeaders_(ss, SHEET_NAMES.SUPERVISI, [
    'id',
    'guruId',
    'namaGuru',
    'mapel',
    'kelas',
    'status',
    'rataSkor',
    'createdAt',
    'instrumentJson',
  ]);
  ensureSheetWithHeaders_(ss, SHEET_NAMES.FOTO, ['supervisiId', 'photoId', 'caption', 'chunkIndex', 'dataChunk']);
  ensureSheetWithHeaders_(ss, SHEET_NAMES.TINDAK_LANJUT, [
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
  ]);
}

function ensureSheetWithHeaders_(ss, name, headers) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#EFF6FF');
  } else if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#EFF6FF');
  }
  return sheet;
}

function getConfigMap_(ss) {
  var sheet = ensureSheetWithHeaders_(ss, SHEET_NAMES.CONFIG, ['key', 'value', 'updatedAt']);
  var lastRow = sheet.getLastRow();
  var map = {};
  if (lastRow < 2) return map;

  var rows = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
  for (var i = 0; i < rows.length; i++) {
    var k = safeCellString_(rows[i][0]).trim();
    if (k) {
      map[k] = safeCellString_(rows[i][1]);
    }
  }
  return map;
}

function setConfigValue_(ss, key, valueObj) {
  var sheet = ensureSheetWithHeaders_(ss, SHEET_NAMES.CONFIG, ['key', 'value', 'updatedAt']);
  var lastRow = sheet.getLastRow();
  var serialized = typeof valueObj === 'string' ? valueObj : JSON.stringify(valueObj);
  var nowStr = new Date().toISOString();

  if (lastRow >= 2) {
    var keys = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (var i = 0; i < keys.length; i++) {
      if (safeCellString_(keys[i][0]).trim() === key) {
        sheet.getRange(i + 2, 2, 1, 2).setValues([[serialized, nowStr]]);
        return;
      }
    }
  }
  sheet.appendRow([key, serialized, nowStr]);
}

function deleteConfigKey_(ss, key) {
  var sheet = ss.getSheetByName(SHEET_NAMES.CONFIG);
  if (!sheet || sheet.getLastRow() < 2) return;
  var keys = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues();
  for (var i = keys.length - 1; i >= 0; i--) {
    if (safeCellString_(keys[i][0]).trim() === key) {
      sheet.deleteRow(i + 2);
    }
  }
}

function parseJsonSafe_(raw, fallback) {
  if (!raw || typeof raw !== 'string') return fallback;
  try {
    return JSON.parse(raw);
  } catch (e) {
    return fallback;
  }
}

function computeAvgScore_(obsScores) {
  if (!obsScores || typeof obsScores !== 'object') return 0;
  var keys = Object.keys(obsScores);
  if (keys.length === 0) return 0;
  var sum = 0;
  var count = 0;
  for (var i = 0; i < keys.length; i++) {
    var val = Number(obsScores[keys[i]]);
    if (!isNaN(val) && val > 0) {
      sum += val;
      count++;
    }
  }
  return count > 0 ? Number((sum / count).toFixed(2)) : 0;
}

/**
 * Mengambil seluruh data awal aplikasi untuk klien Web App.
 */
function getInitialAppData() {
  var ss = getOrCreateSpreadsheet_();
  ensureAllSheets_(ss);

  var cfgMap = getConfigMap_(ss);
  var savedSchool = parseJsonSafe_(cfgMap.school_config, {});
  var schoolConfig = Object.assign({}, DEFAULT_SCHOOL_CONFIG, savedSchool);
  var programConfig = Object.assign(
    {},
    DEFAULT_PROGRAM_CONFIG,
    parseJsonSafe_(cfgMap.program_config, {}),
  );
  var uploadedProgramFile = parseJsonSafe_(cfgMap.uploaded_program_file, null);

  var rubricSections = parseJsonSafe_(cfgMap.rubric_sections, DEFAULT_RUBRIC_SECTIONS);
  if (!Array.isArray(rubricSections) || rubricSections.length === 0) {
    rubricSections = DEFAULT_RUBRIC_SECTIONS;
  }
  var instrumentTitle = cfgMap.instrument_title
    ? String(cfgMap.instrument_title)
    : DEFAULT_INSTRUMENT_TITLE;

  var gurus = readGurusSheet_(ss);
  var supervisions = readSupervisionsSheet_(ss);
  var followUps = readFollowUpsSheet_(ss);

  var hasGeminiKey = Boolean(
    PropertiesService.getScriptProperties().getProperty(PROP_GEMINI_API_KEY),
  );

  var driveFolderId = getTargetDriveFolderId_();

  return {
    schoolConfig: schoolConfig,
    programConfig: programConfig,
    uploadedProgramFile: uploadedProgramFile,
    rubricSections: rubricSections,
    instrumentTitle: instrumentTitle,
    gurus: gurus,
    supervisions: supervisions,
    followUps: followUps,
    spreadsheetId: ss.getId(),
    spreadsheetUrl: ss.getUrl(),
    driveFolderId: driveFolderId,
    driveFolderUrl: 'https://drive.google.com/drive/folders/' + driveFolderId,
    hasGeminiKey: hasGeminiKey,
  };
}

function saveStorageTargets(payload) {
  var scriptProps = PropertiesService.getScriptProperties();
  var userProps = PropertiesService.getUserProperties();
  var ssId = String((payload && payload.spreadsheetId) || DEFAULT_SPREADSHEET_ID).trim();
  var folderId = String((payload && payload.driveFolderId) || DEFAULT_DRIVE_FOLDER_ID).trim();

  var ss = SpreadsheetApp.openById(ssId);
  ensureAllSheets_(ss);
  scriptProps.setProperty(PROP_SPREADSHEET_ID, ss.getId());
  userProps.setProperty(PROP_SPREADSHEET_ID, ss.getId());
  scriptProps.setProperty(PROP_DRIVE_FOLDER_ID, folderId);

  return {
    ok: true,
    spreadsheetId: ss.getId(),
    spreadsheetUrl: ss.getUrl(),
    driveFolderId: folderId,
    driveFolderUrl: 'https://drive.google.com/drive/folders/' + folderId,
  };
}

function backupAllDataToDriveFolder() {
  var data = getInitialAppData();
  var folderId = getTargetDriveFolderId_();
  var folder = DriveApp.getFolderById(folderId);
  var stamp = Utilities.formatDate(
    new Date(),
    Session.getScriptTimeZone() || 'Asia/Jakarta',
    'yyyyMMdd_HHmmss',
  );
  var fileName = 'SI_PERAK_Backup_' + stamp + '.json';
  var file = folder.createFile(fileName, JSON.stringify(data, null, 2), MimeType.PLAIN_TEXT);
  return {
    ok: true,
    fileId: file.getId(),
    fileName: file.getName(),
    fileUrl: file.getUrl(),
  };
}

function readGurusSheet_(ss) {
  var sheet = ensureSheetWithHeaders_(ss, SHEET_NAMES.GURU, [
    'id',
    'nama',
    'nip',
    'pangkat',
    'mapel',
    'jenjang',
    'status',
    'kelas',
  ]);
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  var rows = sheet.getRange(2, 1, lastRow - 1, 8).getValues();
  var result = [];
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    if (!r[0] && !r[1]) continue;
    result.push({
      id: safeCellString_(r[0]),
      nama: safeCellString_(r[1]),
      nip: safeCellString_(r[2]) || '-',
      pangkat: safeCellString_(r[3]) || '-',
      mapel: safeCellString_(r[4]),
      jenjang: safeCellString_(r[5]) || 'SMA',
      status: safeCellString_(r[6]) || 'ASN',
      kelas: safeCellString_(r[7]),
    });
  }
  return result;
}

function writeGurusSheet_(ss, gurus) {
  var sheet = ensureSheetWithHeaders_(ss, SHEET_NAMES.GURU, [
    'id',
    'nama',
    'nip',
    'pangkat',
    'mapel',
    'jenjang',
    'status',
    'kelas',
  ]);
  if (sheet.getLastRow() > 1) {
    sheet.getRange(2, 1, sheet.getLastRow() - 1, 8).clearContent();
  }
  if (!gurus || gurus.length === 0) return;

  var rows = gurus.map(function (g) {
    return [
      String(g.id || ''),
      String(g.nama || ''),
      String(g.nip || '-'),
      String(g.pangkat || '-'),
      String(g.mapel || ''),
      String(g.jenjang || 'SMA'),
      String(g.status || 'ASN'),
      String(g.kelas || ''),
    ];
  });
  sheet.getRange(2, 1, rows.length, 8).setValues(rows);
}

function readPhotosMap_(ss) {
  var sheet = ensureSheetWithHeaders_(ss, SHEET_NAMES.FOTO, [
    'supervisiId',
    'photoId',
    'caption',
    'chunkIndex',
    'dataChunk',
  ]);
  var lastRow = sheet.getLastRow();
  var map = {};
  if (lastRow < 2) return map;
  var rows = sheet.getRange(2, 1, lastRow - 1, 5).getValues();
  var grouped = {};
  for (var i = 0; i < rows.length; i++) {
    var svId = safeCellString_(rows[i][0]);
    var pId = safeCellString_(rows[i][1]);
    var cap = safeCellString_(rows[i][2]);
    var idx = Number(rows[i][3]) || 0;
    var chunk = safeCellString_(rows[i][4]);
    if (!svId || !pId) continue;
    var key = svId + '::' + pId;
    if (!grouped[key]) grouped[key] = { svId: svId, id: pId, caption: cap, chunks: [] };
    grouped[key].chunks[idx] = chunk;
  }
  Object.keys(grouped).forEach(function (k) {
    var item = grouped[k];
    if (!map[item.svId]) map[item.svId] = [];
    map[item.svId].push({
      id: item.id,
      caption: item.caption,
      url: item.chunks.join(''),
    });
  });
  return map;
}

function writePhotosSheet_(ss, supervisions) {
  var sheet = ensureSheetWithHeaders_(ss, SHEET_NAMES.FOTO, [
    'supervisiId',
    'photoId',
    'caption',
    'chunkIndex',
    'dataChunk',
  ]);
  if (sheet.getLastRow() > 1) {
    sheet.getRange(2, 1, sheet.getLastRow() - 1, 5).clearContent();
  }
  var rows = [];
  var CHUNK_SIZE = 40000;
  (supervisions || []).forEach(function (sv) {
    var photos = (sv.instrument && sv.instrument.photos) || [];
    photos.forEach(function (p) {
      var dataUrl = String(p.url || '');
      if (!dataUrl) return;
      var totalChunks = Math.max(1, Math.ceil(dataUrl.length / CHUNK_SIZE));
      for (var c = 0; c < totalChunks; c++) {
        rows.push([
          String(sv.id || ''),
          String(p.id || ''),
          String(p.caption || ''),
          c,
          dataUrl.slice(c * CHUNK_SIZE, (c + 1) * CHUNK_SIZE),
        ]);
      }
    });
  });
  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, 5).setValues(rows);
  }
}

function readSupervisionsSheet_(ss) {
  var sheet = ensureSheetWithHeaders_(ss, SHEET_NAMES.SUPERVISI, [
    'id',
    'guruId',
    'namaGuru',
    'mapel',
    'kelas',
    'status',
    'rataSkor',
    'createdAt',
    'instrumentJson',
  ]);
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  var photosMap = readPhotosMap_(ss);
  var rows = sheet.getRange(2, 1, lastRow - 1, 9).getValues();
  var result = [];
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    if (!r[0]) continue;
    var svId = safeCellString_(r[0]);
    var instr = parseJsonSafe_(safeCellString_(r[8]), null);
    if (!instr) continue;
    if ((!instr.photos || instr.photos.length === 0) && photosMap[svId]) {
      instr.photos = photosMap[svId];
    }
    result.push({
      id: svId,
      status: safeCellString_(r[5]) || 'Direncakan',
      createdAt: safeCellString_(r[7]) || new Date().toISOString(),
      instrument: instr,
    });
  }
  return result;
}

function writeSupervisionsSheet_(ss, supervisions) {
  var sheet = ensureSheetWithHeaders_(ss, SHEET_NAMES.SUPERVISI, [
    'id',
    'guruId',
    'namaGuru',
    'mapel',
    'kelas',
    'status',
    'rataSkor',
    'createdAt',
    'instrumentJson',
  ]);
  writePhotosSheet_(ss, supervisions);

  if (sheet.getLastRow() > 1) {
    sheet.getRange(2, 1, sheet.getLastRow() - 1, 9).clearContent();
  }
  if (!supervisions || supervisions.length === 0) return;

  var rows = supervisions.map(function (sv) {
    var instrCopy = Object.assign({}, sv.instrument || {});
    // Simpan foto di sheet DokumentasiFoto agar sel instrumentJson tidak melebihi batas 50.000 karakter Sheets
    instrCopy.photos = [];
    return [
      String(sv.id || ''),
      String(instrCopy.guruId || ''),
      String(instrCopy.namaGuru || ''),
      String(instrCopy.mapel || ''),
      String(instrCopy.kelas || ''),
      String(sv.status || 'Direncakan'),
      computeAvgScore_(instrCopy.obsScores),
      String(sv.createdAt || new Date().toISOString()),
      JSON.stringify(instrCopy).slice(0, 49000),
    ];
  });
  sheet.getRange(2, 1, rows.length, 9).setValues(rows);
}

function readFollowUpsSheet_(ss) {
  var sheet = ensureSheetWithHeaders_(ss, SHEET_NAMES.TINDAK_LANJUT, [
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
  ]);
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  var rows = sheet.getRange(2, 1, lastRow - 1, 16).getValues();
  var result = [];
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    if (!r[0] && !r[1]) continue;
    result.push({
      id: safeCellString_(r[0]),
      guruNama: safeCellString_(r[1]),
      guruNip: safeCellString_(r[2]),
      mapel: safeCellString_(r[3]),
      kelas: safeCellString_(r[4]),
      temuan: safeCellString_(r[5]),
      intervensi: safeCellString_(r[6]),
      status: safeCellString_(r[7]) || 'Dipantau',
      dampak: safeCellString_(r[8]) || 'Dipantau',
      smartRekomendasi: safeCellString_(r[9]),
      sudahRefleksi: r[10] === true || r[10] === 'true' || r[10] === 'TRUE',
      sudahTindakLanjut: r[11] === true || r[11] === 'true' || r[11] === 'TRUE',
      perubahanPraktik: r[12] === true || r[12] === 'true' || r[12] === 'TRUE',
      perluPendampingan: r[13] === true || r[13] === 'true' || r[13] === 'TRUE',
      tglSupervisi: safeCellString_(r[14]),
      catatan: safeCellString_(r[15]),
    });
  }
  return result;
}

function writeFollowUpsSheet_(ss, items) {
  var sheet = ensureSheetWithHeaders_(ss, SHEET_NAMES.TINDAK_LANJUT, [
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
  ]);
  if (sheet.getLastRow() > 1) {
    sheet.getRange(2, 1, sheet.getLastRow() - 1, 16).clearContent();
  }
  if (!items || items.length === 0) return;

  var rows = items.map(function (item) {
    return [
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
    ];
  });
  sheet.getRange(2, 1, rows.length, 16).setValues(rows);
}

/**
 * Menyimpan Pengaturan Sekolah & menyinkronkan ke sesi supervisi.
 */
function saveSchoolConfig(config) {
  var ss = getOrCreateSpreadsheet_();
  setConfigValue_(ss, 'school_config', config);

  var supervisions = readSupervisionsSheet_(ss);
  if (supervisions.length > 0) {
    var synced = supervisions.map(function (sv) {
      sv.instrument.namaSekolah = config.schoolName;
      sv.instrument.alamatSekolah = config.schoolAddress;
      sv.instrument.namaKepala = config.headmasterName;
      sv.instrument.nipKepala = config.headmasterNip;
      sv.instrument.namaPengawas = config.internalSupervisorName;
      sv.instrument.nipPengawas = config.internalSupervisorNip;
      return sv;
    });
    writeSupervisionsSheet_(ss, synced);
  }
  return { ok: true };
}

function saveProgramConfig(programConfig) {
  var ss = getOrCreateSpreadsheet_();
  setConfigValue_(ss, 'program_config', programConfig);
  return { ok: true };
}

function saveUploadedProgramFile(fileObj) {
  var ss = getOrCreateSpreadsheet_();
  if (!fileObj) {
    deleteConfigKey_(ss, 'uploaded_program_file');
  } else {
    var serialized = JSON.stringify(fileObj);
    if (serialized.length > 48000) {
      throw new Error('Ukuran dokumen program melebihi batas sel Google Sheets (maks ~35KB). Gunakan file ringkas atau templat resmi.');
    }
    setConfigValue_(ss, 'uploaded_program_file', fileObj);
  }
  return { ok: true };
}

function saveRubricConfig(sections, instrumentTitle) {
  var ss = getOrCreateSpreadsheet_();
  setConfigValue_(ss, 'rubric_sections', sections);
  if (instrumentTitle) {
    setConfigValue_(ss, 'instrument_title', instrumentTitle);
  }
  return { ok: true };
}

function resetRubricConfig() {
  var ss = getOrCreateSpreadsheet_();
  deleteConfigKey_(ss, 'rubric_sections');
  deleteConfigKey_(ss, 'instrument_title');
  return {
    ok: true,
    rubricSections: DEFAULT_RUBRIC_SECTIONS,
    instrumentTitle: DEFAULT_INSTRUMENT_TITLE,
  };
}

function saveGeminiApiKey(apiKey) {
  var clean = String(apiKey || '').trim();
  if (!clean) {
    PropertiesService.getScriptProperties().deleteProperty(PROP_GEMINI_API_KEY);
    return { ok: true, hasGeminiKey: false };
  }
  PropertiesService.getScriptProperties().setProperty(PROP_GEMINI_API_KEY, clean);
  return { ok: true, hasGeminiKey: true };
}

function syncAllGurus(gurus) {
  var ss = getOrCreateSpreadsheet_();
  writeGurusSheet_(ss, gurus || []);
  return { ok: true, count: (gurus || []).length };
}

function syncAllSupervisions(supervisions) {
  var ss = getOrCreateSpreadsheet_();
  writeSupervisionsSheet_(ss, supervisions || []);
  return { ok: true, count: (supervisions || []).length };
}

function syncAllFollowUps(items) {
  var ss = getOrCreateSpreadsheet_();
  writeFollowUpsSheet_(ss, items || []);
  return { ok: true, count: (items || []).length };
}

/**
 * Analisis Supervisi Klinis menggunakan Gemini API via UrlFetchApp.
 * API Key dibaca dari Script Properties (GEMINI_API_KEY).
 */
function analyzeSupervisionWithAI(payload) {
  var apiKey = PropertiesService.getScriptProperties().getProperty(PROP_GEMINI_API_KEY);
  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY belum dikonfigurasi. Buka Pengaturan Sekolah atau Script Properties untuk mengisi API Key.',
    );
  }

  var stage = (payload && payload.stage) || 'all';
  var guruNama = (payload && payload.guruNama) || 'Guru';
  var instrument = (payload && payload.instrument) || {};

  var systemInstruction =
    'Anda adalah Pakar Pendidikan Senior dan Supervisor Klinis Pengawas Sekolah berpengalaman. ' +
    'Tugas Anda adalah menganalisis data observasi pembelajaran berdasarkan Kurikulum Nasional dan prinsip Deep Learning ' +
    '(Pembelajaran Mendalam: Mindful, Meaningful, Joyful Learning). ' +
    'Analisis harus bersifat empatik, profesional, objektif, berbasis bukti, dan mendukung pengembangan kompetensi guru berkelanjutan. ' +
    'Gunakan Bahasa Indonesia formal baku yang inspiratif dan berdaya guna tinggi.';

  var prompt =
    'Guru: ' +
    guruNama +
    ', Mata Pelajaran: ' +
    (instrument.mapel || '-') +
    ', Materi: ' +
    (instrument.materi || '-') +
    '.\n';

  if (stage === 'pra' || stage === 'all') {
    var pra = instrument.praFields || {};
    prompt +=
      '[FASE PRA-OBSERVASI]\n' +
      'Tujuan: ' +
      (pra.tujuan || '-') +
      '\nArea Pengembangan: ' +
      (pra.area || '-') +
      '\nStrategi: ' +
      (pra.strategi || '-') +
      '\nMedia/Sumber: ' +
      (pra.media || '-') +
      '\nAnalisis kesiapan guru berdasarkan data di atas sesuai Kurikulum Nasional dan Pembelajaran Mendalam (Deep Learning).\n';
  }

  if (stage === 'observasi' || stage === 'all') {
    var avg = computeAvgScore_(instrument.obsScores);
    prompt +=
      '[FASE OBSERVASI KELAS]\n' +
      'Skor Rata-rata: ' +
      avg +
      ' / 4.00\n' +
      'Distribusi Skor: ' +
      JSON.stringify(instrument.obsScores || {}) +
      '\nCatatan Temuan Lapangan: ' +
      JSON.stringify(instrument.obsNotes || {}) +
      '\nAnalisislah performa guru secara komprehensif. Sebutkan kekuatan spesifik, area perbaikan, dan interpretasi terhadap mutu pembelajaran.\n';
  }

  if (stage === 'pasca' || stage === 'all') {
    prompt +=
      '[FASE PASCA-OBSERVASI (DIALOG DUA ARAH)]\n' +
      'Refleksi Guru: ' +
      (instrument.pascaRefleksi || '-') +
      '\nTanggapan / Sanggahan Guru: ' +
      (instrument.pascaSanggah || 'Guru menyetujui seluruh hasil observasi') +
      '\nRencana Pengembangan: ' +
      (instrument.pascaRencana || '-') +
      '\nBerikan rekomendasi spesifik langkah tindak lanjut konkret (coaching/mentoring/workshop/lesson study/self development) dengan mempertimbangkan refleksi dua arah dan sanggahan guru.\n';
  }

  var url =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' +
    encodeURIComponent(apiKey);

  var body = {
    systemInstruction: {
      parts: [{ text: systemInstruction }],
    },
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'OBJECT',
        properties: {
          analysis: { type: 'STRING' },
          kekuatan: { type: 'STRING' },
          perbaikan: { type: 'STRING' },
          rekomendasi: { type: 'STRING' },
          scoreInterpretation: { type: 'STRING' },
          rtlSuggestion: {
            type: 'OBJECT',
            properties: {
              coaching: { type: 'BOOLEAN' },
              mentoring: { type: 'BOOLEAN' },
              workshop: { type: 'BOOLEAN' },
              lessonStudy: { type: 'BOOLEAN' },
              selfDevelopment: { type: 'BOOLEAN' },
            },
          },
        },
        required: ['analysis', 'kekuatan', 'perbaikan', 'rekomendasi'],
      },
    },
  };

  var response = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(body),
    muteHttpExceptions: true,
  });

  var statusCode = response.getResponseCode();
  var text = response.getContentText();
  if (statusCode < 200 || statusCode >= 300) {
    throw new Error('Gemini API error (' + statusCode + '): ' + text);
  }

  var apiJson = JSON.parse(text);
  var candidateText =
    apiJson &&
    apiJson.candidates &&
    apiJson.candidates[0] &&
    apiJson.candidates[0].content &&
    apiJson.candidates[0].content.parts &&
    apiJson.candidates[0].content.parts[0] &&
    apiJson.candidates[0].content.parts[0].text;

  if (!candidateText) {
    throw new Error('Model AI tidak mengembalikan ringkasan analisis yang valid.');
  }

  return JSON.parse(candidateText);
}
