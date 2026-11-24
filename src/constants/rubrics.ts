import type { RubricPreset, RubricSection } from '../types/supervision';

export const DEFAULT_INSTRUMENT_TITLE = 'Standar Nasional & Deep Learning';

export const DEFAULT_RUBRIC_SECTIONS: RubricSection[] = [
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

export const PRESET_INSTRUMENTS: RubricPreset[] = [
  {
    id: 'default_deep_learning',
    name: 'Standar Nasional & Deep Learning (Default)',
    badge: 'Standar BSNP/Kurnas',
    description:
      'Fokus pada kesiapan apersepsi, penguasaan materi mendalam, pembelajaran bermakna, dan evaluasi reflektif.',
    sections: DEFAULT_RUBRIC_SECTIONS,
  },
  {
    id: 'kurikulum_merdeka_diferensiasi',
    name: 'Kurikulum Merdeka - Pembelajaran Berdiferensiasi & PSE',
    badge: 'Kurikulum Merdeka',
    description:
      'Instrumen supervisi fokus pada pemetaan kesiapan belajar, diferensiasi konten/proses/produk, dan integrasi Pembelajaran Sosial Emosional (PSE).',
    sections: [
      {
        id: 'km_pendahuluan',
        title: 'A. PRA-PEMBELAJARAN & KONDISI EMOSIONAL (PSE)',
        items: [
          {
            id: 'km_p1',
            label: 'Asesmen Diagnostik Awal & Mindful Check-in',
            desc: 'Melakukan checking emosional murid (roda emosi/PSE) dan memetakan pemahaman awal topik.',
          },
          {
            id: 'km_p2',
            label: 'Penyampaian Tujuan & Kesepakatan Kelas',
            desc: 'Membangun komitmen belajar yang partisipatif dan memperjelas kriteria ketercapaian tujuan pembelajaran (KKTP).',
          },
        ],
      },
      {
        id: 'km_inti',
        title: 'B. PELAKSANAAN PEMBELAJARAN BERDIFERENSIASI',
        items: [
          {
            id: 'km_i1',
            label: 'Diferensiasi Konten & Bahan Ajar',
            desc: 'Menyediakan ragam media ajar (audio, visual, kinestetik/teks) sesuai profil belajar murid.',
          },
          {
            id: 'km_i2',
            label: 'Diferensiasi Proses & Scaffolding',
            desc: 'Memberikan pendampingan bertingkat bagi murid yang memerlukan bimbingan intensif vs eksplorasi mandiri.',
          },
          {
            id: 'km_i3',
            label: 'Pilihan Diferensiasi Produk / Unjuk Kerja',
            desc: 'Memberi ruang bagi murid mengekspresikan pemahaman dalam berbagai format karya.',
          },
          {
            id: 'km_i4',
            label: 'Pemanfaatan Platform Digital / PMM',
            desc: 'Memanfaatkan asesmen digital atau sumber belajar interaktif yang kontekstual.',
          },
        ],
      },
      {
        id: 'km_penutup',
        title: 'C. ASESMEN FORMATIF & REFLEKSI BERMAKNA',
        items: [
          {
            id: 'km_t1',
            label: 'Exit Ticket & Umpan Balik Formatif Berkelanjutan',
            desc: 'Mengukur pemahaman harian dengan instrumen evaluasi formatif cepat.',
          },
          {
            id: 'km_t2',
            label: 'Refleksi Diri (Self-Assessment) & Rencana Tindak Lanjut Siswa',
            desc: 'Memandu murid menilai proses belajarnya sendiri dan menetapkan target belajar lanjutan.',
          },
        ],
      },
    ],
  },
  {
    id: 'pmm_observasi_kinerja',
    name: 'Pengelolaan Kinerja Guru PMM (Platform Merdeka Mengajar)',
    badge: 'Regulasi Dirjen GTK',
    description:
      'Rubrik observasi kinerja 3 indikator utama: Keteraturan Suasana Kelas, Penerapan Disiplin Positif, dan Eksplorasi Konsep Interaktif.',
    sections: [
      {
        id: 'pmm_keteraturan',
        title: 'A. KETERATURAN SUASANA KELAS',
        items: [
          {
            id: 'pmm_k1',
            label: 'Penyampaian Aturan & Harapan Positif',
            desc: 'Guru memanggil murid dengan namanya, menyampaikan harapan kelas, dan mengelola transisi aktivitas dengan teratur.',
          },
          {
            id: 'pmm_k2',
            label: 'Pengelolaan Fokus & Perhatian Belajar',
            desc: 'Mampu menarik perhatian murid saat terjadi kegaduhan dengan sinyal yang disepakati bersama.',
          },
        ],
      },
      {
        id: 'pmm_disiplin',
        title: 'B. PENERAPAN DISIPLIN POSITIF & UMPAN BALIK',
        items: [
          {
            id: 'pmm_d1',
            label: 'Refleksi terhadap Keyakinan Kelas',
            desc: 'Guru mengajak murid mengingat kembali keyakinan kelas ketika terjadi pelanggaran, bukan memberi hukuman sepihak.',
          },
          {
            id: 'pmm_d2',
            label: 'Pemberian Penguatan & Apresiasi Terarah',
            desc: 'Memberikan umpan balik konstruktif yang berfokus pada proses dan usaha murid, bukan sekadar nilai.',
          },
        ],
      },
      {
        id: 'pmm_instruksi',
        title: 'C. INSTRUKSI YANG ADAPTIF & INTERAKTIF',
        items: [
          {
            id: 'pmm_i1',
            label: 'Pertanyaan Pemantik Tingkat Tinggi (HOTS)',
            desc: 'Mengajukan pertanyaan terbuka yang merangsang nalar kritis dan diskusi antar murid.',
          },
          {
            id: 'pmm_i2',
            label: 'Penyesuaian Responsif terhadap Kendala Murid',
            desc: 'Mengubah strategi penjelasan saat mendapati murid mengalami miskonsepsi.',
          },
        ],
      },
    ],
  },
  {
    id: 'smk_praktik_kejuruan',
    name: 'Supervisi Praktik Kejuruan / Bengkel / Laboratorium (SMK)',
    badge: 'Vokasi & Laboratorium',
    description:
      'Standar pengawasan pembelajaran praktik laboratorium, bengkel kejuruan, kepatuhan K3LH, dan unjuk kerja kompetensi.',
    sections: [
      {
        id: 'smk_k3lh',
        title: 'A. KESIAPAN ALAT, SOP & K3LH BENGKEL/LABORATORIUM',
        items: [
          {
            id: 'smk_k1',
            label: 'Penerapan K3LH & APD (Alat Pelindung Diri)',
            desc: 'Guru dan siswa menerapkan standar keselamatan kerja, mengenakan APD lengkap sebelum memasuki area praktik.',
          },
          {
            id: 'smk_k2',
            label: 'Pengecekan Job Sheet & Kesiapan Tool/Bahan',
            desc: 'Menjelaskan alur lembar kerja (job sheet), SOP mesin, dan memastikan alat serta bahan dalam kondisi prima.',
          },
        ],
      },
      {
        id: 'smk_praktik',
        title: 'B. PELAKSANAAN BIMBINGAN PRAKTIK & DEMONSTRASI',
        items: [
          {
            id: 'smk_p1',
            label: 'Demonstrasi Keterampilan & Ketelitian Kerja',
            desc: 'Memberikan demonstrasi operasional secara presisi, jelas, dan menekankan titik kritis keselamatan kerja.',
          },
          {
            id: 'smk_p2',
            label: 'Pendampingan Teknis & Troubleshooting Mandiri',
            desc: 'Mendampingi kelompok siswa saat praktik, membimbing penyelesaian trouble sesuai prosedur standar industri.',
          },
          {
            id: 'smk_p3',
            label: 'Manajemen Waktu & Efisiensi Kerja Kejuruan',
            desc: 'Mengatur alokasi waktu kerja siswa agar sesuai dengan target takt time atau standar durasi industri.',
          },
        ],
      },
      {
        id: 'smk_evaluasi',
        title: 'C. PENGUJIAN PRODUK, KONTROL KUALITAS (QC) & 5R',
        items: [
          {
            id: 'smk_e1',
            label: 'Uji Fungsi / Penilaian Hasil Kerja (Job Result)',
            desc: 'Melakukan pengujian fungsi atau pengukuran dimensi produk bersama siswa menggunakan lembar penilaian standar.',
          },
          {
            id: 'smk_e2',
            label: 'Penerapan Budaya Kerja 5R (Ringkas, Rapi, Resik, Rawat, Rajin)',
            desc: 'Memastikan pembersihan mesin, penataan kembali perkakas, dan penutupan kegiatan praktik sesuai SOP.',
          },
        ],
      },
    ],
  },
];

export const CSV_TEMPLATE_CONTENT = `Kategori,Indikator,Deskripsi
A. PENDAHULUAN,Kesiapan Fisik & Psikis Siswa,Membangun suasana kelas yang positif dan kondusif
A. PENDAHULUAN,Apersepsi & Motivasi Berkelanjutan,Mengaitkan materi sebelumnya dengan topik nyata yang akan dipelajari
A. PENDAHULUAN,Penyampaian Tujuan Pembelajaran,Menjelaskan target capaian dan alur kegiatan pembelajaran
B. KEGIATAN INTI,Penguasaan Materi & Konsep Esensial,Menjelaskan konsep dengan akurat dan merangsang nalar kritis
B. KEGIATAN INTI,Penerapan Pembelajaran Berdiferensiasi,Menyediakan variasi konten dan pendampingan bertingkat
B. KEGIATAN INTI,Pemanfaatan Media Digital & IT,Menggunakan media interaktif untuk memperjelas konsep belajar
B. KEGIATAN INTI,Kolaborasi & Komunikasi Siswa,Mendorong diskusi aktif kerja kelompok dan apresiasi ide teman
C. PENUTUP,Refleksi Bersama Siswa,Membimbing siswa merangkum pembelajaran dan menarik kesimpulan
C. PENUTUP,Asesmen Formatif & Umpan Balik,Memberikan konfirmasi pemahaman dan tindak lanjut tugas mandiri`;

export function getJsonTemplateContent(): string {
  return JSON.stringify(
    {
      instrumentName: 'Instrumen Supervisi Kustom Sekolah',
      academicYear: '2026/2027',
      sections: DEFAULT_RUBRIC_SECTIONS,
    },
    null,
    2,
  );
}
