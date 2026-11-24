import type { ProblemCategoryDefinition } from '../types/supervision';

export const SMART_RECOMMENDATIONS_MAP: Record<string, string> = {
  Diferensiasi:
    'Berdasarkan temuan diferensiasi: Fasilitasi bimbingan teknis penyusunan modul ajar berbasis 3 aspek diferensiasi (konten, proses, produk) sesuai kesiapan belajar murid. Dorong pelaksanaan asesmen diagnostik non-kognitif di awal bab.',
  'Diferensiasi Pembelajaran':
    'Berdasarkan temuan diferensiasi: Fasilitasi bimbingan teknis penyusunan modul ajar berbasis 3 aspek diferensiasi (konten, proses, produk) sesuai kesiapan belajar murid. Dorong pelaksanaan asesmen diagnostik non-kognitif di awal bab.',
  'Keaktifan siswa':
    'Berdasarkan temuan keaktifan siswa: Terapkan model Problem Based Learning (PBL) atau Project Based Learning (PjBL) dengan teknik Think-Pair-Share. Bentuk kelompok heterogen dengan penugasan peran terstruktur agar seluruh murid aktif berdialog.',
  'Keaktifan & Partisipasi Siswa':
    'Berdasarkan temuan keaktifan siswa: Terapkan model Problem Based Learning (PBL) atau Project Based Learning (PjBL) dengan teknik Think-Pair-Share. Bentuk kelompok heterogen dengan penugasan peran terstruktur agar seluruh murid aktif berdialog.',
  'Asesmen formatif':
    'Berdasarkan temuan asesmen formatif: Terapkan instrumen evaluasi cepat seperti Exit Ticket, rubrik refleksi diri (Self-Assessment), atau digital polling (Mentimeter/Quizizz) setiap akhir sesi untuk memetakan capaian pemahaman siswa.',
  'Asesmen Formatif & Umpan Balik':
    'Berdasarkan temuan asesmen formatif: Terapkan instrumen evaluasi cepat seperti Exit Ticket, rubrik refleksi diri (Self-Assessment), atau digital polling (Mentimeter/Quizizz) setiap akhir sesi untuk memetakan capaian pemahaman siswa.',
  'Pemanfaatan Teknologi':
    'Berdasarkan temuan media & IT: Lakukan coaching penggunaan platform digital interaktif (Canva for Education, simulasi PhET, Padlet) yang diintegrasikan langsung ke tahapan inti kegiatan belajar murid.',
  'Pemanfaatan Teknologi / Media':
    'Berdasarkan temuan media & IT: Lakukan coaching penggunaan platform digital interaktif (Canva for Education, simulasi PhET, Padlet) yang diintegrasikan langsung ke tahapan inti kegiatan belajar murid.',
  'Manajemen Kelas':
    'Berdasarkan temuan manajemen kelas: Susun Keyakinan Kelas bersama peserta didik dan terapkan pendekatan Segitiga Restitusi guna menumbuhkan disiplin positif serta lingkungan belajar yang aman dan inklusif.',
  'Manajemen Kelas & Disiplin Positif':
    'Berdasarkan temuan manajemen kelas: Susun Keyakinan Kelas bersama peserta didik dan terapkan pendekatan Segitiga Restitusi guna menumbuhkan disiplin positif serta lingkungan belajar yang aman dan inklusif.',
  'Literasi & Numerasi':
    'Berdasarkan temuan literasi & numerasi: Integrasikan teks multimodal kaya makna dan studi kasus numerasi kontekstual ke dalam lembar aktivitas siswa (LKPD) berbasis HOTS.',
  'Literasi & Numerasi Mendalam':
    'Berdasarkan temuan literasi & numerasi: Integrasikan teks multimodal kaya makna dan studi kasus numerasi kontekstual ke dalam lembar aktivitas siswa (LKPD) berbasis HOTS.',
};

export function getSmartRecommendation(finding: string): string {
  const matchedKey = Object.keys(SMART_RECOMMENDATIONS_MAP).find(
    (key) =>
      finding.toLowerCase().includes(key.toLowerCase()) ||
      key.toLowerCase().includes(finding.toLowerCase()),
  );
  if (matchedKey) {
    return SMART_RECOMMENDATIONS_MAP[matchedKey];
  }
  return `Berdasarkan temuan "${finding}": Rekomendasikan pendampingan klinis terjadwal bersama supervisor atau rekan sejawat, fokus pada pemodelan praktik baik di kelas serta refleksi siklus pembelajaran mingguan.`;
}

export const PROBLEM_CATEGORIES: ProblemCategoryDefinition[] = [
  {
    name: 'Diferensiasi Pembelajaran',
    shortName: 'Diferensiasi',
    rubricIds: ['i2', 'km_i1', 'km_i2', 'km_i3'],
    keywords: [
      'diferensiasi',
      'konten',
      'proses',
      'produk',
      'gaya belajar',
      'kesiapan belajar',
      'profil belajar',
      'scaffolding',
    ],
    defaultIntervensi: 'Modul berdiferensiasi',
    solusiIHT:
      'In-House Training (IHT) penyusunan modul ajar berdiferensiasi dan asesmen diagnostik non-kognitif.',
  },
  {
    name: 'Keaktifan Siswa (Student Agency)',
    shortName: 'Keaktifan Siswa',
    rubricIds: ['i4', 'p1', 'km_p2', 'pmm_i1'],
    keywords: [
      'aktif',
      'partisipasi',
      'pbl',
      'pjbl',
      'kolaborasi',
      'diskusi',
      'pasif',
      'student agency',
      'keterlibatan',
    ],
    defaultIntervensi: 'PBL (Problem Based Learning)',
    solusiIHT:
      'Workshop model pembelajaran partisipatif berbasis masalah (PBL) dan kerja kelompok heterogen.',
  },
  {
    name: 'Asesmen Formatif & Umpan Balik',
    shortName: 'Asesmen Formatif',
    rubricIds: ['t2', 'km_t1', 'km_t2', 'pmm_d2'],
    keywords: [
      'asesmen',
      'formatif',
      'umpan balik',
      'feedback',
      'exit ticket',
      'evaluasi',
      'refleksi',
    ],
    defaultIntervensi: 'Exit ticket (Asesmen Cepat)',
    solusiIHT:
      'Pelatihan teknik evaluasi cepat harian (Exit Ticket digital & self-assessment murid).',
  },
  {
    name: 'Pemanfaatan Teknologi / Media',
    shortName: 'Teknologi & Media',
    rubricIds: ['i3', 'km_i4'],
    keywords: [
      'teknologi',
      'media',
      'it',
      'digital',
      'ict',
      'canva',
      'phet',
      'padlet',
      'quizizz',
      'chromebook',
      'ppt',
      'video',
    ],
    defaultIntervensi: 'Workshop Pembelajaran Berbasis IT',
    solusiIHT:
      'Coaching pemanfaatan platform digital interaktif (Canva for Education, Quizizz, PMM).',
  },
  {
    name: 'Manajemen Kelas & Disiplin Positif',
    shortName: 'Manajemen Kelas',
    rubricIds: ['pmm_k1', 'pmm_k2', 'pmm_d1', 'p1'],
    keywords: [
      'manajemen kelas',
      'disiplin',
      'kondusif',
      'kegaduhan',
      'keyakinan kelas',
      'restitusi',
      'emosional',
      'tertib',
      'fokus',
    ],
    defaultIntervensi: 'Segitiga Restitusi Kelas',
    solusiIHT:
      'Penyusunan Keyakinan Kelas partisipatif dan penerapan Segitiga Restitusi tanpa hukuman.',
  },
  {
    name: 'Literasi & Numerasi Mendalam',
    shortName: 'Literasi & Numerasi',
    rubricIds: ['i1', 'pmm_i1'],
    keywords: [
      'literasi',
      'numerasi',
      'hots',
      'menalar',
      'kritis',
      'materi mendalam',
      'teks',
      'studi kasus',
    ],
    defaultIntervensi: 'Bimtek LKPD HOTS & Literasi',
    solusiIHT:
      'Workshop integrasi teks multimodal LKPD HOTS dan studi kasus kontekstual.',
  },
];
