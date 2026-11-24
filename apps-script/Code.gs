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
 *    tambahkan property bernama: GEMINI_API_KEY dengan API Key Gemini Anda.
 * 5. Klik Deploy > New deployment > Web app (Execute as: Me, Who has access: Anyone / Organization).
 * ============================================================================
 */

var APP_TITLE = 'SI PERAK — Sistem Informasi Supervisi Akademik';
var PROP_SPREADSHEET_ID = 'SIPERAK_SPREADSHEET_ID';
var PROP_GEMINI_API_KEY = 'GEMINI_API_KEY';

var SHEET_NAMES = {
  CONFIG: 'Config',
  GURU: 'DataGuru',
  SUPERVISI: 'Supervisi',
  TINDAK_LANJUT: 'TindakLanjut',
};

var DEFAULT_SCHOOL_CONFIG = {
  schoolName: 'SMA NEGERI SI PERAK',
  schoolLevel: 'SMA',
  kopAuthority: 'CABANG DINAS PENDIDIKAN WILAYAH BOJONEGORO',
  schoolNpsn: '12345678',
  schoolAddress: 'Jl. Raya Bojonegoro No. 123, Bojonegoro - Jawa Timur',
  academicYear: '2026/2027',
  headmasterName: 'Drs. H. Mulyono, M.Pd.',
  headmasterNip: '19660812 199003 1 007',
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
 */
function doGet() {
  var template = HtmlService.createTemplateFromFile('index');
  return template
    .evaluate()
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
 * Mendapatkan atau membuat Spreadsheet database secara otomatis.
 */
function getOrCreateSpreadsheet_() {
  var active = null;
  try {
    active = SpreadsheetApp.getActiveSpreadsheet();
  } catch (err) {
    active = null;
  }
  if (active) {
    return active;
  }

  var userProps = PropertiesService.getUserProperties();
  var storedId = userProps.getProperty(PROP_SPREADSHEET_ID);
  if (storedId) {
    try {
      return SpreadsheetApp.openById(storedId);
    } catch (err) {
      storedId = null;
    }
  }

  var newSs = SpreadsheetApp.create('SI PERAK - Database Supervisi Akademik');
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
    var k = String(rows[i][0] || '').trim();
    if (k) {
      map[k] = rows[i][1];
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
      if (String(keys[i][0] || '').trim() === key) {
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
    if (String(keys[i][0] || '').trim() === key) {
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
  var schoolConfig = Object.assign(
    {},
    DEFAULT_SCHOOL_CONFIG,
    parseJsonSafe_(cfgMap.school_config, {}),
  );
  var programConfig = Object.assign(
    {},
    DEFAULT_PROGRAM_CONFIG,
    parseJsonSafe_(cfgMap.program_config, {}),
  );
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

  return {
    schoolConfig: schoolConfig,
    programConfig: programConfig,
    rubricSections: rubricSections,
    instrumentTitle: instrumentTitle,
    gurus: gurus,
    supervisions: supervisions,
    followUps: followUps,
    spreadsheetUrl: ss.getUrl(),
    hasGeminiKey: hasGeminiKey,
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
      id: String(r[0]),
      nama: String(r[1] || ''),
      nip: String(r[2] || '-'),
      pangkat: String(r[3] || '-'),
      mapel: String(r[4] || ''),
      jenjang: String(r[5] || 'SMA'),
      status: String(r[6] || 'ASN'),
      kelas: String(r[7] || ''),
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
  var rows = sheet.getRange(2, 1, lastRow - 1, 9).getValues();
  var result = [];
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    if (!r[0]) continue;
    var instr = parseJsonSafe_(String(r[8] || ''), null);
    if (!instr) continue;
    result.push({
      id: String(r[0]),
      status: String(r[5] || 'Direncakan'),
      createdAt: String(r[7] || new Date().toISOString()),
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
  if (sheet.getLastRow() > 1) {
    sheet.getRange(2, 1, sheet.getLastRow() - 1, 9).clearContent();
  }
  if (!supervisions || supervisions.length === 0) return;

  var rows = supervisions.map(function (sv) {
    var instr = sv.instrument || {};
    return [
      String(sv.id || ''),
      String(instr.guruId || ''),
      String(instr.namaGuru || ''),
      String(instr.mapel || ''),
      String(instr.kelas || ''),
      String(sv.status || 'Direncakan'),
      computeAvgScore_(instr.obsScores),
      String(sv.createdAt || new Date().toISOString()),
      JSON.stringify(instr),
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
      id: String(r[0]),
      guruNama: String(r[1] || ''),
      guruNip: String(r[2] || ''),
      mapel: String(r[3] || ''),
      kelas: String(r[4] || ''),
      temuan: String(r[5] || ''),
      intervensi: String(r[6] || ''),
      status: String(r[7] || 'Dipantau'),
      dampak: String(r[8] || 'Dipantau'),
      smartRekomendasi: String(r[9] || ''),
      sudahRefleksi: r[10] === true || r[10] === 'true' || r[10] === 'TRUE',
      sudahTindakLanjut: r[11] === true || r[11] === 'true' || r[11] === 'TRUE',
      perubahanPraktik: r[12] === true || r[12] === 'true' || r[12] === 'TRUE',
      perluPendampingan: r[13] === true || r[13] === 'true' || r[13] === 'TRUE',
      tglSupervisi: String(r[14] || ''),
      catatan: String(r[15] || ''),
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

/**
 * Sinkronisasi penuh array Guru, Supervisi, atau FollowUps dari klien.
 */
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
      'GEMINI_API_KEY belum dikonfigurasi pada Project Settings > Script Properties di Apps Script.',
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
