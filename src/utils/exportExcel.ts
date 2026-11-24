import type { Guru, ImportedScheduleRow } from '../types/supervision';

export async function downloadGuruTemplateExcel(): Promise<void> {
  const XLSX = await import('xlsx');
  const defaultLevel = localStorage.getItem('school_level') || 'SMA';
  const rows = [
    {
      'Nama Lengkap & Gelar': 'Budi Santoso, S.Pd.',
      NIP: '19850101 201001 1 001',
      'Pangkat / Golongan': 'Penata / IIIc',
      'Mata Pelajaran': 'Matematika',
      Jenjang: defaultLevel,
      'Status Kepegawaian': 'ASN',
    },
    {
      'Nama Lengkap & Gelar': 'Siti Aminah, M.Pd.',
      NIP: '19900512 201503 2 005',
      'Pangkat / Golongan': 'Penata Muda Tk.I / IIIb',
      'Mata Pelajaran': 'Bahasa Indonesia',
      Jenjang: defaultLevel,
      'Status Kepegawaian': 'P3K',
    },
  ];

  const sheet = XLSX.utils.json_to_sheet(rows);
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, 'Format Data Guru');
  sheet['!cols'] = [{ wch: 25 }, { wch: 22 }, { wch: 22 }, { wch: 20 }, { wch: 15 }, { wch: 20 }];
  XLSX.writeFile(book, 'Template_Import_Data_Guru.xlsx');
}

export async function parseGuruExcelFile(file: File): Promise<Omit<Guru, 'id'>[]> {
  const XLSX = await import('xlsx');
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
  const defaultLevel = localStorage.getItem('school_level') || 'SMA';

  return rows
    .map((row) => ({
      nama: String(row['Nama Lengkap & Gelar'] || row.Nama || row['Nama Lengkap'] || '').trim(),
      nip: String(row.NIP || row.nip || '-').trim(),
      pangkat: String(row['Pangkat / Golongan'] || row.Pangkat || '-').trim(),
      mapel: String(row['Mata Pelajaran'] || row.Mapel || '').trim(),
      jenjang: String(row.Jenjang || defaultLevel).trim(),
      status: String(row['Status Kepegawaian'] || row.Status || 'ASN').trim(),
    }))
    .filter((g) => g.nama && g.mapel);
}

export async function downloadScheduleTemplateExcel(): Promise<void> {
  const XLSX = await import('xlsx');
  const rows = [
    {
      'Nama Guru': 'Budi Santoso, S.Pd.',
      'NIP Guru': '198501012010011001',
      'Mata Pelajaran': 'Matematika',
      Kelas: 'XII MIPA 1',
      'Materi Pokok': 'Turunan Fungsi Aljabar',
      'Tanggal Pra-Observasi': '2026-05-25',
      'Tanggal Observasi': '2026-05-26',
      'Tanggal Pasca-Observasi': '2026-05-27',
      'Status (Opsional)': 'Direncakan',
    },
    {
      'Nama Guru': 'Siti Aminah, M.Pd.',
      'NIP Guru': '199005122015032005',
      'Mata Pelajaran': 'Bahasa Indonesia',
      Kelas: 'XI F-2',
      'Materi Pokok': 'Teks Eksplanasi Kompleks',
      'Tanggal Pra-Observasi': '2026-05-28',
      'Tanggal Observasi': '2026-05-29',
      'Tanggal Pasca-Observasi': '2026-05-30',
      'Status (Opsional)': 'Pra-Observasi',
    },
  ];

  const sheet = XLSX.utils.json_to_sheet(rows);
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, 'Format Jadwal Supervisi');
  sheet['!cols'] = [
    { wch: 25 },
    { wch: 22 },
    { wch: 20 },
    { wch: 15 },
    { wch: 28 },
    { wch: 25 },
    { wch: 22 },
    { wch: 25 },
    { wch: 20 },
  ];
  XLSX.writeFile(book, 'Template_Jadwal_Supervisi.xlsx');
}

export async function parseScheduleExcelFile(file: File): Promise<ImportedScheduleRow[]> {
  const XLSX = await import('xlsx');
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

  return rows
    .map((row) => ({
      namaGuru: String(row['Nama Guru'] || row['Nama Lengkap'] || row.Nama || '').trim(),
      nipGuru: String(row['NIP Guru'] || row.NIP || '-').trim(),
      mapel: String(row['Mata Pelajaran'] || row.Mapel || '').trim(),
      kelas: String(row.Kelas || row.kelas || '').trim(),
      materi: String(row['Materi Pokok'] || row.Materi || '').trim(),
      tglPra: String(row['Tanggal Pra-Observasi'] || row['Tgl Pra'] || '').trim(),
      tglObs: String(row['Tanggal Observasi'] || row['Tgl Observasi'] || '').trim(),
      tglPasca: String(row['Tanggal Pasca-Observasi'] || row['Tgl Pasca'] || '').trim(),
      status: String(row['Status (Opsional)'] || row.Status || 'Direncakan').trim(),
    }))
    .filter((row) => row.namaGuru && row.mapel);
}
