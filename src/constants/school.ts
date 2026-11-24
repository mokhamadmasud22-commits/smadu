import type {
  Guru,
  ProgramTemplateId,
  SchoolLevel,
  SupervisionSession,
} from '../types/supervision';

export const SCHOOL_LEVELS: SchoolLevel[] = ['TK', 'SD', 'SMP', 'SMA', 'SMK', 'PKPLK'];

export const STATUS_KEPEGAWAIAN_OPTIONS = ['ASN', 'P3K', 'GTT', 'Guru Yayasan'] as const;

export const KOP_AUTHORITY_KAB = 'DINAS PENDIDIKAN KABUPATEN BOJONEGORO';
export const KOP_AUTHORITY_CABDIN = 'CABANG DINAS PENDIDIKAN WILAYAH BOJONEGORO';

export const JENJANG_OPTIONS: Array<{
  id: SchoolLevel;
  label: string;
  full: string;
  color: string;
}> = [
  { id: 'TK', label: 'TK / PAUD', full: 'Taman Kanak-Kanak / PAUD', color: 'from-pink-500 to-rose-500' },
  { id: 'SD', label: 'SD / MI', full: 'Sekolah Dasar / MI', color: 'from-red-500 to-amber-500' },
  { id: 'SMP', label: 'SMP / MTs', full: 'Sekolah Menengah Pertama', color: 'from-sky-500 to-blue-600' },
  { id: 'SMA', label: 'SMA / MA', full: 'Sekolah Menengah Atas', color: 'from-emerald-500 to-teal-600' },
  { id: 'SMK', label: 'SMK / MAK', full: 'Sekolah Menengah Kejuruan', color: 'from-amber-500 to-orange-600' },
  { id: 'PKPLK', label: 'PKPLK / SLB', full: 'Pendidikan Khusus & Layanan Khusus', color: 'from-purple-500 to-indigo-600' },
];

export const DEFAULT_SUPERVISOR_NAME = 'Anis Fatul Cholis, M.Pd';
export const DEFAULT_SUPERVISOR_NIP = '19740825 199802 2 004';
export const DEFAULT_HEADMASTER_NAME = 'SALIM,S.Pd.';
export const DEFAULT_HEADMASTER_NIP = '-';
export const DEFAULT_INTERNAL_SUPERVISOR_NAME = 'Waka Kurikulum / Guru Senior';
export const DEFAULT_INTERNAL_SUPERVISOR_NIP = '19780512 200501 1 009';
export const DEFAULT_SCHOOL_NAME = 'SMAS DARUL ULUM KEPOHBARU';
export const DEFAULT_SCHOOL_NPSN = '20541216';
export const DEFAULT_SCHOOL_ADDRESS = 'Jl. Raya Desa Nglumber Kecamatan Kepohbaru Bojonegoro - Jawa Timur';
export const DEFAULT_ACADEMIC_YEAR = '2026/2027';

export const PROGRAM_TEMPLATE_DEFAULTS: Record<
  ProgramTemplateId,
  { fokus: string; target: string; waktu: string }
> = {
  'klinis-standar': {
    fokus: 'Supervisi Klinis Kemitraan Berbasis Siklus 5 Tahap Kurikulum Nasional',
    target: 'Minimal 85% guru mencapai predikat kinerja "Baik" atau "Sangat Baik" dalam siklus refleksi',
    waktu: 'Juli 2026 s.d. Juni 2027 (Semester Ganjil & Genap)',
  },
  'deep-learning': {
    fokus: 'Implementasi 3 Pilar Pembelajaran Mendalam (Mindful, Meaningful, & Joyful Learning)',
    target: '100% guru menerapkan asesmen bermakna dan pembelajaran berpusat pada nalar kritis siswa',
    waktu: 'Agustus 2026 s.d. Mei 2027',
  },
  diferensiasi: {
    fokus: 'Optimalisasi Modul Ajar Berdiferensiasi dan Penguatan Disiplin Positif Kelas',
    target: 'Seluruh guru mampu memetakan kesiapan murid serta menerapkan restitusi budaya positif',
    waktu: 'Sepanjang Tahun Pelajaran 2026/2027',
  },
  'matriks-rpa': {
    fokus: 'Rencana Pengawasan Akademik Terpadu (Pra-Observasi, Observasi, Pasca-Obs, dan RTL)',
    target: 'Terlaksananya 100% siklus supervisi akademik dan tersusunnya laporan rekomendasi tindak lanjut',
    waktu: 'Semester Ganjil & Genap Tahun Pelajaran 2026/2027',
  },
};

export const PROGRAM_TEMPLATE_OPTIONS: Array<{
  id: ProgramTemplateId;
  title: string;
  desc: string;
  badge: string;
}> = [
  {
    id: 'klinis-standar',
    title: 'Kurikulum Nasional (5 Alur Klinis)',
    desc: 'Supervisi kemitraan 3 siklus lengkap (Pra-Obs, Observasi, Pasca-Obs/RTL).',
    badge: 'Standar Resmi',
  },
  {
    id: 'deep-learning',
    title: 'Pembelajaran Mendalam (Deep Learning)',
    desc: 'Fokus 3 pilar: Mindful Learning, Meaningful Learning, dan Joyful Learning.',
    badge: 'Deep Learning',
  },
  {
    id: 'diferensiasi',
    title: 'Pembelajaran Berdiferensiasi & Disiplin Positif',
    desc: 'Diferensiasi konten, proses, produk serta penegakan budaya positif & restitusi.',
    badge: 'Diferensiasi',
  },
  {
    id: 'matriks-rpa',
    title: 'Matriks Rencana Pengawasan (RPA)',
    desc: 'Format tabel matriks ringkas eksekutif siap tanda tangan untuk pengawas.',
    badge: 'Format Matriks',
  },
];

export const DEMO_GURU: Guru = {
  id: 'guru-contoh-1',
  nama: 'Budi Santoso, S.Pd., M.Si.',
  nip: '19850101 201001 1 001',
  pangkat: 'Pembina / IVa',
  mapel: 'Matematika (Fase E)',
  status: 'ASN',
};

export function createDemoSupervision(): SupervisionSession {
  return {
    id: 'sv-sample-demo',
    status: 'Selesai',
    createdAt: new Date().toISOString(),
    instrument: {
      guruId: 'guru-contoh-1',
      nipGuru: '19850101 201001 1 001',
      namaKepala:
        typeof localStorage !== 'undefined'
          ? localStorage.getItem('school_headmaster_name') || DEFAULT_HEADMASTER_NAME
          : DEFAULT_HEADMASTER_NAME,
      nipKepala:
        typeof localStorage !== 'undefined'
          ? localStorage.getItem('school_headmaster_nip') || DEFAULT_HEADMASTER_NIP
          : DEFAULT_HEADMASTER_NIP,
      namaPengawas:
        typeof localStorage !== 'undefined'
          ? localStorage.getItem('school_supervisor_name') || DEFAULT_SUPERVISOR_NAME
          : DEFAULT_SUPERVISOR_NAME,
      nipPengawas:
        typeof localStorage !== 'undefined'
          ? localStorage.getItem('school_supervisor_nip') || DEFAULT_SUPERVISOR_NIP
          : DEFAULT_SUPERVISOR_NIP,
      mapel: 'Matematika (Fase E)',
      kelas: 'X-E 2',
      materi: 'Sistem Persamaan Linear Tiga Variabel (SPLTV) Kontekstual',
      tglPra: '2026-04-20',
      tglObs: '2026-04-22',
      tglPasca: '2026-04-24',
      praFields: {
        tujuan:
          'Peserta didik mampu memodelkan masalah kontekstual ke dalam SPLTV serta menyelesaikannya secara kolaboratif.',
        area: 'Penerapan diferensiasi proses dan penguatan literasi numerasi kritis.',
        strategi: 'Problem-Based Learning (PBL) berbantuan LKPD interaktif dan media digital.',
        media: 'Modul Ajar Kurikulum Nasional, LKPD Berdiferensiasi, LCD Proyektor',
      },
      praAI:
        'Rancangan pra-observasi sangat terstruktur dan selaras dengan prinsip Pembelajaran Mendalam (Deep Learning).',
      obsScores: { p1: 4, p2: 4, i1: 4, i2: 3, i3: 4, i4: 4, t1: 4, t2: 4 },
      obsNotes: {
        p1: 'Apersepsi kontekstual harga tiket festival sangat memotivasi siswa.',
        i2: 'Diferensiasi proses berjalan baik pada kelompok pemula dan mahir.',
      },
      obsAI:
        'Pelaksanaan pembelajaran menunjukkan penguasaan materi yang prima (Skor rata-rata 3.88). Interaksi siswa aktif dan kritis.',
      pascaRefleksi:
        'Pembelajaran berjalan lancar, siswa sangat antusias saat mempresentasikan hasil diskusi model matematika.',
      pascaSanggah:
        'Saya sepakat dengan catatan supervisor mengenai manajemen waktu. Terkait catatan apersepsi, alokasi waktu agak molor karena siswa mengajukan pertanyaan kontekstual menarik yang perlu direspon agar pemahaman konsep awal matang.',
      pascaRencana:
        'Akan mengintensifkan pendampingan scaffolding bagi kelompok siswa yang memerlukan waktu lebih dalam interpretasi grafik.',
      pascaAI:
        'Refleksi guru menunjukkan kesadaran metakognitif yang tinggi dalam mendeteksi kebutuhan individual murid.',
      rtl: {
        coaching: true,
        mentoring: false,
        workshop: true,
        lessonStudy: true,
        selfDevelopment: true,
      },
      analysisScore:
        'Kategori Sangat Baik (3.88 / 4.00). Guru memenuhi standar kompetensi pedagogik dan profesional tingkat tinggi.',
      kekuatan:
        'Kemampuan mengaitkan matematika dengan konteks riil, pengelolaan kelas interaktif, dan pemanfaatan media digital.',
      perbaikan: 'Manajemen alokasi waktu pada sesi penarikan kesimpulan akhir pembelajaran.',
      rekomendasi:
        'Diusulkan menjadi Guru Penggerak / Model Pembelajaran Berdiferensiasi di tingkat MGMP sekolah.',
      photos: [],
      documents: [
        {
          id: 'doc-1',
          name: 'Modul_Ajar_SPLTV_BudiSantoso.pdf',
          type: 'application/pdf',
          url: '#',
          stage: 'pra',
        },
      ],
    },
  };
}
