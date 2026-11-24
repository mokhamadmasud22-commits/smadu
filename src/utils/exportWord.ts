import {
  DEFAULT_ACADEMIC_YEAR,
  DEFAULT_HEADMASTER_NAME,
  DEFAULT_HEADMASTER_NIP,
  DEFAULT_INTERNAL_SUPERVISOR_NAME,
  DEFAULT_INTERNAL_SUPERVISOR_NIP,
  DEFAULT_SCHOOL_ADDRESS,
  DEFAULT_SCHOOL_NAME,
  KOP_AUTHORITY_CABDIN,
  KOP_AUTHORITY_KAB,
} from '../constants/school';
import { getEffectiveSupervisorName, getEffectiveSupervisorNip } from '../services/storage';
import type {
  Guru,
  RubricSection,
  ScoreStats,
  SupervisionInstrument,
} from '../types/supervision';
import type { ProgramExportPayload } from './exportPdf';

function triggerDocDownload(htmlContent: string, filename: string): void {
  const blob = new Blob(['\uFEFF' + htmlContent], {
    type: 'application/msword;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.doc') ? filename : `${filename}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportProgramWord(
  payload: ProgramExportPayload,
  filename = 'Program_Supervisi_Akademik.doc',
): void {
  const formattedDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const getTitle = (): string => {
    switch (payload.templateId) {
      case 'deep-learning':
        return 'PROGRAM SUPERVISI AKADEMIK BERBASIS PEMBELAJARAN MENDALAM (DEEP LEARNING)';
      case 'diferensiasi':
        return 'PROGRAM SUPERVISI PEMBELAJARAN BERDIFERENSIASI & DISIPLIN POSITIF';
      case 'matriks-rpa':
        return 'MATRIKS RENCANA PENGAWASAN AKADEMIK (RPA) TAHUNAN';
      default:
        return 'PROGRAM SUPERVISI AKADEMIK KLINIS KURIKULUM NASIONAL';
    }
  };

  const getBodySection = (): string => {
    switch (payload.templateId) {
      case 'deep-learning':
        return `
          <div class="section-title">I. LATAR BELAKANG & FILOSOFI PEMBELAJARAN MENDALAM</div>
          <p>
            Pendekatan Pembelajaran Mendalam (<em>Deep Learning</em>) merupakan ikhtiar transformasi pembelajaran yang memfasilitasi murid mencapai pemahaman mendalam, bernalar kritis, dan berkarakter luhur. Supervisi akademik di <strong>${payload.schoolName}</strong> diarahkan untuk mendampingi para pendidik mengembangkan ekosistem pembelajaran yang bermakna (<em>meaningful</em>), membahagiakan (<em>joyful</em>), dan menumbuhkan kesadaran penuh (<em>mindful</em>).
          </p>
          <div class="section-title">II. TIGA PILAR UTAMA PENDAMPINGAN</div>
          <ol>
            <li><strong>Mindful Learning (Sadar & Hadir Penuh):</strong> Membimbing guru merancang kegiatan awal yang berpusat pada keterlibatan emosional dan kognitif murid secara utuh.</li>
            <li><strong>Meaningful Learning (Bermakna & Relevan):</strong> Mengaitkan konsep esensial dengan konteks nyata kehidupan siswa di lingkungan Bojonegoro dan sekitarnya.</li>
            <li><strong>Joyful Learning (Menyenangkan & Menantang):</strong> Menghadirkan diferensiasi proses yang kolaboratif dan memantik daya cipta siswa.</li>
          </ol>
          <div class="section-title">III. FOKUS & SASARAN PENGEMBANGAN</div>
          <p><strong>Fokus Program:</strong> ${payload.fokusProgram || 'Penerapan Pembelajaran Mendalam & Penguatan Karakter Profil Pelajar'}</p>
          <p><strong>Target Capaian:</strong> ${payload.targetCapaian || 'Minimal 90% Guru menerapkan prinsip Mindful, Meaningful, dan Joyful Learning'}</p>
          <p><strong>Waktu Pelaksanaan:</strong> ${payload.waktuPelaksanaan || `Semester Ganjil dan Genap Tahun Pelajaran ${payload.academicYear}`}</p>
        `;
      case 'diferensiasi':
        return `
          <div class="section-title">I. DASAR KEBIJAKAN & LATAR BELAKANG</div>
          <p>
            Setiap murid memiliki keunikan potensi, kesiapan belajar, minat, dan profil belajar yang beragam. Supervisi akademik di <strong>${payload.schoolName}</strong> difokuskan untuk memberdayakan guru dalam merancang skenario pembelajaran berdiferensiasi serta mewujudkan lingkungan kelas dengan budaya dan disiplin positif yang kondusif.
          </p>
          <div class="section-title">II. RUANG LINGKUP SUPERVISI DIFERENSIASI</div>
          <ul>
            <li><strong>Diferensiasi Konten:</strong> Variasi materi dan sumber belajar sesuai tahapan pemahaman murid.</li>
            <li><strong>Diferensiasi Proses:</strong> Ragam aktivitas belajar (berkelompok, berpasangan, mandiri) serta scaffolding yang terukur.</li>
            <li><strong>Diferensiasi Produk:</strong> Pilihan unjuk pemahaman (produk karya, presentasi, laporan visual/audio).</li>
            <li><strong>Budaya Positif:</strong> Penerapan kesepakatan/keyakinan kelas dan pendekatan restitusi dalam menangani disiplin.</li>
          </ul>
          <div class="section-title">III. RENCANA SASARAN & TARGET KINERJA</div>
          <p><strong>Fokus Program:</strong> ${payload.fokusProgram || 'Implementasi Pembelajaran Berdiferensiasi dan Penguatan Disiplin Positif'}</p>
          <p><strong>Target Capaian:</strong> ${payload.targetCapaian || '100% Guru menyusun asesmen diagnostik dan modul ajar berdiferensiasi'}</p>
        `;
      case 'matriks-rpa':
        return `
          <div class="section-title">I. MATRIKS RENCANA PENGAWASAN AKADEMIK (RPA)</div>
          <p>Rencana kerja pengawasan akademik terpadu pada satuan pendidikan <strong>${payload.schoolName}</strong> Tahun Pelajaran <strong>${payload.academicYear}</strong>:</p>
          <table class="grid-table">
            <thead>
              <tr>
                <th style="width: 25px;">No</th>
                <th>Program / Siklus</th>
                <th>Tujuan Khusus</th>
                <th>Sasaran Guru</th>
                <th>Instrumen</th>
                <th>Waktu</th>
                <th>Output / Bukti Fisik</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="text-align: center;">1</td>
                <td><strong>Pra-Observasi (Persiapan)</strong></td>
                <td>Penyelarasan tujuan, modul ajar, asesmen awal, dan target indikator yang diobservasi.</td>
                <td>Seluruh Guru Mata Pelajaran</td>
                <td>Form Wawancara Pra-Observasi & Telaah Perangkat</td>
                <td>Awal Semester</td>
                <td>Catatan Kesepakatan Pra-Observasi & Rubrik Terverifikasi</td>
              </tr>
              <tr>
                <td style="text-align: center;">2</td>
                <td><strong>Observasi Kelas Terstruktur</strong></td>
                <td>Pengamatan langsung aktivitas pembelajaran aktif, diferensiasi, dan keaktifan murid.</td>
                <td>Seluruh Guru Terjadwal</td>
                <td>Instrumen Observasi Kelas Kurikulum Nasional</td>
                <td>Sesuai Jadwal</td>
                <td>Lembar Skor Observasi (1-4) & Catatan Fakta Lapangan</td>
              </tr>
              <tr>
                <td style="text-align: center;">3</td>
                <td><strong>Pasca-Observasi & Refleksi</strong></td>
                <td>Refleksi dialogis terbimbing mengenai pencapaian target dan analisis kendala.</td>
                <td>Guru yang Disupervisi</td>
                <td>Form Refleksi Klinis Pasca-Observasi</td>
                <td>H+1 Observasi</td>
                <td>Catatan Refleksi Mandiri Guru & Solusi Bersama</td>
              </tr>
              <tr>
                <td style="text-align: center;">4</td>
                <td><strong>Rencana Tindak Lanjut (RTL)</strong></td>
                <td>Pemberian rekomendasi coaching, mentoring, workshop, atau lesson study komunitas.</td>
                <td>Guru dengan Indikator Perlu Penguatan</td>
                <td>Form Rekomendasi & Matriks RTL</td>
                <td>Berkelanjutan</td>
                <td>Dokumen Rencana Tindak Lanjut & Monitoring Kinerja</td>
              </tr>
            </tbody>
          </table>
        `;
      default:
        return `
          <div class="section-title">I. LATAR BELAKANG</div>
          <p>
            Supervisi akademik merupakan serangkaian kegiatan sistematis dan terencana untuk mendampingi, memfasilitasi, serta memberdayakan guru dalam meningkatkan mutu proses pembelajaran di <strong>${payload.schoolName}</strong> di bawah naungan pembinaan <strong>${payload.authorityDisplay}</strong>.
          </p>
          <p>
            Dalam implementasi Kurikulum Nasional jenjang <strong>${payload.schoolLevel}</strong>, supervisi klinis dilaksanakan secara non-judgmental (kemitraan, dialogis, dan reflektif). Melalui siklus Pra-Observasi, Observasi Pembelajaran, dan Pasca-Observasi (Rencana Tindak Lanjut), guru dibimbing untuk mewujudkan pembelajaran bermakna dan berorientasi pada pencapaian kompetensi holistik murid.
          </p>
          <div class="section-title">II. TUJUAN PROGRAM SUPERVISI</div>
          <ol>
            <li><strong>Pengembangan Pedagogik:</strong> Meningkatkan kompetensi guru dalam merancang modul ajar berdiferensiasi dan mendalam.</li>
            <li><strong>Pembelajaran Aktif & Kemitraan:</strong> Memastikan interaksi kelas mendorong nalar kritis, kolaborasi, dan kemandirian siswa.</li>
            <li><strong>Refleksi Terbimbing:</strong> Membiasakan guru melakukan evaluasi diri secara konstruktif dan berkelanjutan.</li>
            <li><strong>Peningkatan Kinerja Lulusan:</strong> Mengoptimalkan capaian kompetensi seluruh murid melalui intervensi tindak lanjut yang tepat sasaran.</li>
          </ol>
          <div class="section-title">III. SASARAN & WAKTU PELAKSANAAN</div>
          <p><strong>Sasaran:</strong> Seluruh Guru ASN, PPPK, dan GTT di lingkungan <strong>${payload.schoolName}</strong>.</p>
          <p><strong>Tahun Pelajaran:</strong> ${payload.academicYear}</p>
          <p><strong>Fokus Supervisi:</strong> ${payload.fokusProgram || 'Supervisi Klinis 3 Siklus Berbasis Kurikulum Nasional'}</p>
        `;
    }
  };

  const guruRowsHtml =
    payload.gurus && payload.gurus.length > 0
      ? payload.gurus
          .map(
            (g, idx) => `
        <tr>
          <td style="text-align: center;">${idx + 1}</td>
          <td><strong>${g.nama}</strong></td>
          <td>${g.nip && g.nip !== '-' ? g.nip : '-'}</td>
          <td>${g.mapel || '-'}</td>
          <td>${g.kelas || g.jenjang || payload.schoolLevel}</td>
          <td style="text-align: center;">Pra-Obs, Observasi, Pasca-Obs</td>
          <td style="text-align: center;">Terjadwal</td>
        </tr>`,
          )
          .join('')
      : `
        <tr>
          <td colspan="7" style="text-align: center; font-style: italic; color: #666;">
            Daftar guru terdaftar disinkronkan otomatis dari menu Data Guru (${payload.schoolName})
          </td>
        </tr>`;

  const html = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office'
          xmlns:w='urn:schemas-microsoft-com:office:word'
          xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>${getTitle()}</title>
      <style>
        body { font-family: 'Times New Roman', serif; line-height: 1.5; color: #111; padding: 35px; font-size: 11pt; }
        .kop { text-align: center; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 16px; }
        .kop h1 { font-size: 13pt; margin: 0; font-weight: bold; text-transform: uppercase; }
        .kop h2 { font-size: 11.5pt; margin: 2px 0; font-weight: bold; text-transform: uppercase; }
        .kop p { font-size: 9pt; margin: 0; font-style: italic; }
        .title { text-align: center; margin: 20px 0 15px 0; }
        .title h3 { font-size: 12pt; font-weight: bold; text-decoration: underline; margin: 0; text-transform: uppercase; }
        .title p { font-size: 10pt; margin: 2px 0; }
        .section-title { font-size: 11pt; font-weight: bold; margin-top: 16px; margin-bottom: 6px; border-bottom: 1px solid #333; padding-bottom: 3px; }
        table.grid-table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 15px; font-size: 10pt; }
        table.grid-table th, table.grid-table td { border: 1px solid #000; padding: 6px 8px; vertical-align: top; }
        table.grid-table th { background-color: #f2f2f2; font-weight: bold; }
        table.info-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 10pt; }
        table.info-table td { padding: 3px 6px; border: none; }
        table.sig-table { width: 100%; margin-top: 40px; border-collapse: collapse; }
        table.sig-table td { border: none; width: 50%; text-align: center; vertical-align: top; font-size: 10pt; }
      </style>
    </head>
    <body>
      <div class="kop">
        <h1>${payload.indukPemerintah}</h1>
        <h1>DINAS PENDIDIKAN</h1>
        <h2>${payload.authority}</h2>
        <h2>${payload.schoolName.toUpperCase()}</h2>
        ${payload.address ? `<p>${payload.address} • NPSN: ${payload.npsn}</p>` : ''}
      </div>

      <div class="title">
        <h3>${getTitle()}</h3>
        <p><strong>TAHUN PELAJARAN ${payload.academicYear}</strong></p>
      </div>

      <table class="info-table">
        <tr><td style="width: 170px;"><strong>Satuan Pendidikan</strong></td><td>: ${payload.schoolName}</td></tr>
        <tr><td><strong>Jenjang / NPSN</strong></td><td>: ${payload.schoolLevel} / ${payload.npsn}</td></tr>
        <tr><td><strong>Instansi Pembina</strong></td><td>: ${payload.authorityDisplay}</td></tr>
        <tr><td><strong>Tahun Pelajaran</strong></td><td>: ${payload.academicYear}</td></tr>
        <tr><td><strong>Kepala Sekolah</strong></td><td>: ${payload.headmasterName}</td></tr>
        <tr><td><strong>Pengawas Pembina</strong></td><td>: ${payload.supervisorName}</td></tr>
      </table>

      ${getBodySection()}

      <div class="section-title">IV. MATRIKS GURU SASARAN SUPERVISI</div>
      <table class="grid-table">
        <thead>
          <tr>
            <th style="width: 25px;">No</th>
            <th>Nama Lengkap Guru</th>
            <th>NIP</th>
            <th>Mata Pelajaran</th>
            <th>Kelas/Fase</th>
            <th>Siklus Klinis</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${guruRowsHtml}
        </tbody>
      </table>

      <div class="section-title">V. LEMBAR PENGESAHAN DOKUMEN</div>
      <p style="text-align: right; margin-top: 15px;">Bojonegoro, ${formattedDate}</p>

      <table class="sig-table">
        <tr>
          <td>
            Mengetahui,<br>Kepala ${payload.schoolName}<br><br><br><br><br>
            <strong><u>${payload.headmasterName}</u></strong><br>
            NIP. ${payload.headmasterNip || '-'}
          </td>
          <td>
            Disahkan Oleh,<br>Pengawas ${payload.schoolLevel} ${payload.authorityDisplay}<br><br><br><br><br>
            <strong><u>${payload.supervisorName}</u></strong><br>
            NIP. ${payload.supervisorNip || '-'}
          </td>
        </tr>
      </table>

      <div style="margin-top: 35px; border-top: 1px solid #ccc; padding-top: 6px; font-size: 8pt; color: #666; text-align: center; font-style: italic;">
        SI PERAK • Sistem Informasi Supervisi Akademik Kurikulum Nasional • Hak Cipta © Anis Fatul Cholis, M.Pd
      </div>
    </body>
    </html>`;

  triggerDocDownload(html, filename);
}

export function exportSupervisionWord(
  instrument: SupervisionInstrument,
  guru: Guru | null | undefined,
  stats: { avg: number; category: string } | ScoreStats,
  rubricSections: RubricSection[],
  instrumentTitle?: string,
): void {
  const schoolName =
    localStorage.getItem('school_name') || instrument.namaSekolah || DEFAULT_SCHOOL_NAME;
  const schoolAddress =
    localStorage.getItem('school_address') || instrument.alamatSekolah || DEFAULT_SCHOOL_ADDRESS;
  const internalSup =
    localStorage.getItem('school_internal_supervisor_name') ||
    instrument.namaSupervisor ||
    DEFAULT_INTERNAL_SUPERVISOR_NAME;
  const internalSupNip =
    localStorage.getItem('school_internal_supervisor_nip') ||
    instrument.nipSupervisor ||
    DEFAULT_INTERNAL_SUPERVISOR_NIP;
  const supervisorName = getEffectiveSupervisorName();
  const supervisorNip = getEffectiveSupervisorNip();
  const headmasterName =
    localStorage.getItem('school_headmaster_name') ||
    instrument.namaKepala ||
    DEFAULT_HEADMASTER_NAME;
  const headmasterNip =
    localStorage.getItem('school_headmaster_nip') ||
    instrument.nipKepala ||
    DEFAULT_HEADMASTER_NIP;
  const academicYear =
    localStorage.getItem('school_academic_year')?.replace('/', ' / ') ||
    DEFAULT_ACADEMIC_YEAR.replace('/', ' / ');
  const schoolLevel = localStorage.getItem('school_level') || 'SMA';
  const kopAuthority =
    localStorage.getItem('school_kop_authority') ||
    (['TK', 'SD', 'SMP'].includes(schoolLevel) ? KOP_AUTHORITY_KAB : KOP_AUTHORITY_CABDIN);
  const isDinasKab = kopAuthority === KOP_AUTHORITY_KAB;
  const avgFormatted = stats.avg.toFixed(2);

  const rtlSelected =
    Object.entries(instrument.rtl || {})
      .filter(([, checked]) => Boolean(checked))
      .map(([key]) => key.toUpperCase())
      .join(', ') || 'Belum dipilih';

  const html = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office'
          xmlns:w='urn:schemas-microsoft-com:office:word'
          xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>Laporan Hasil Supervisi Klinis</title>
      <style>
        body { font-family: 'Times New Roman', serif; line-height: 1.5; color: #111; padding: 30px; font-size: 11pt; }
        .kop { text-align: center; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 16px; }
        .kop h1 { font-size: 14pt; margin: 0; font-weight: bold; }
        .kop h2 { font-size: 12pt; margin: 2px 0; font-weight: bold; }
        .kop p { font-size: 9pt; margin: 0; font-style: italic; }
        .title { text-align: center; margin-bottom: 20px; }
        .title h3 { font-size: 12pt; font-weight: bold; text-decoration: underline; margin: 0; }
        .title p { font-size: 10pt; margin: 2px 0; }
        table.info-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 10pt; }
        table.info-table td { padding: 4px 6px; border: none; vertical-align: top; }
        .section-header { font-size: 11pt; font-weight: bold; margin-top: 16px; margin-bottom: 6px; border-bottom: 1px solid #333; padding-bottom: 3px; }
        table.rubric-table { width: 100%; border-collapse: collapse; margin-top: 8px; margin-bottom: 16px; font-size: 10pt; }
        table.rubric-table th, table.rubric-table td { border: 1px solid #000; padding: 6px 8px; vertical-align: top; }
        table.rubric-table th { background-color: #f2f2f2; font-weight: bold; }
        .box { border: 1px solid #999; background: #fafafa; padding: 8px 12px; margin-bottom: 10px; font-style: italic; font-size: 10pt; }
        table.sig-table { width: 100%; margin-top: 35px; border-collapse: collapse; }
        table.sig-table td { border: none; width: 50%; text-align: center; vertical-align: top; font-size: 10pt; }
      </style>
    </head>
    <body>
      <div class="kop">
        <h1>${isDinasKab ? 'PEMERINTAH KABUPATEN BOJONEGORO' : 'PEMERINTAH PROVINSI JAWA TIMUR'}</h1>
        <h1>DINAS PENDIDIKAN</h1>
        <h2>${kopAuthority}</h2>
        <h2>${schoolName.toUpperCase()}</h2>
        ${schoolAddress ? `<p style="font-size: 8.5pt; font-style: italic; margin-top: 2px; margin-bottom: 2px;">${schoolAddress}</p>` : ''}
        <p>Sistem Penjaminan Mutu & Supervisi Klinis Pembelajaran Kurikulum Nasional</p>
      </div>

      <div class="title">
        <h3>LAPORAN HASIL & ANALISIS SUPERVISI KLINIS AKADEMIK</h3>
        <p><strong>TAHUN PELAJARAN ${academicYear}</strong></p>
        <p><em>(${instrumentTitle || 'Berbasis Pembelajaran Mendalam & Kurikulum Nasional'})</em></p>
      </div>

      <table class="info-table">
        <tr><td style="width: 170px;"><strong>Satuan Pendidikan</strong></td><td>: ${schoolName}</td></tr>
        <tr><td><strong>Alamat Sekolah</strong></td><td>: ${schoolAddress}</td></tr>
        <tr><td><strong>Nama Guru</strong></td><td>: ${guru?.nama || 'Guru'}</td></tr>
        <tr><td><strong>NIP / Status</strong></td><td>: ${instrument.nipGuru || guru?.nip || '-'} (${guru?.status || 'ASN'})</td></tr>
        <tr><td><strong>Pangkat / Golongan</strong></td><td>: ${guru?.pangkat || '-'}</td></tr>
        <tr><td><strong>Mata Pelajaran</strong></td><td>: ${instrument.mapel || guru?.mapel || '-'}</td></tr>
        <tr><td><strong>Kelas / Fase</strong></td><td>: ${instrument.kelas || '-'}</td></tr>
        <tr><td><strong>Materi Pokok</strong></td><td>: ${instrument.materi || '-'}</td></tr>
        <tr><td><strong>Jadwal Pra-Observasi</strong></td><td>: ${instrument.tglPra || '-'}</td></tr>
        <tr><td><strong>Jadwal Observasi Kelas</strong></td><td>: ${instrument.tglObs || '-'}</td></tr>
        <tr><td><strong>Jadwal Pasca-Observasi</strong></td><td>: ${instrument.tglPasca || '-'}</td></tr>
      </table>

      <div class="section-header">I. TAHAP PRA-OBSERVASI (PERSIAPAN & KESEPAKATAN)</div>
      <p><strong>Tujuan Pembelajaran:</strong> ${instrument.praFields?.tujuan || '-'}</p>
      <p><strong>Area Pengembangan:</strong> ${instrument.praFields?.area || '-'}</p>
      <p><strong>Strategi yang Dipersiapkan:</strong> ${instrument.praFields?.strategi || '-'}</p>
      ${instrument.praAI ? `<div class="box"><strong>Catatan AI Pra-Observasi:</strong><br>${instrument.praAI}</div>` : ''}

      <div class="section-header">II. TAHAP OBSERVASI KELAS & SKOR RUBRIK (${(instrumentTitle || 'Kurikulum Nasional').toUpperCase()})</div>
      <p><strong>Nilai Rata-rata Skor:</strong> ${avgFormatted} / 4.00 (Kategori: <strong>${stats.category}</strong>)</p>

      ${
        rubricSections && rubricSections.length > 0
          ? `<table class="rubric-table">
              <tr>
                <th style="width: 35px; text-align: center;">No</th>
                <th>Indikator Pengamatan Pembelajaran</th>
                <th style="width: 80px; text-align: center;">Skor (1-4)</th>
              </tr>
              ${rubricSections
                .flatMap((sec, sIdx) =>
                  sec.items.map(
                    (item, iIdx) => `
                  <tr>
                    <td style="text-align: center;">${sIdx + 1}.${iIdx + 1}</td>
                    <td><strong>${item.label}</strong><br><span style="color: #555; font-size: 9pt;">${item.desc}</span></td>
                    <td style="text-align: center; font-weight: bold; font-size: 11pt;">${instrument.obsScores[item.id] || '-'}</td>
                  </tr>`,
                  ),
                )
                .join('')}
            </table>`
          : ''
      }

      ${instrument.analysisScore ? `<div class="box"><strong>Interpretasi & Distribusi Skor:</strong><br>${instrument.analysisScore}</div>` : ''}
      ${instrument.obsAI ? `<div class="box"><strong>Catatan AI Observasi:</strong><br>${instrument.obsAI}</div>` : ''}

      <div class="section-header">III. HASIL REFLEKSI & TINDAK LANJUT PASCA-OBSERVASI (DIALOG DUA ARAH)</div>
      <p><strong>1. Refleksi Guru:</strong> ${instrument.pascaRefleksi || '-'}</p>
      <div class="box" style="background-color: #fffbeb; border: 1px solid #fde68a;">
        <strong>2. Tanggapan / Hak Sanggah Guru:</strong><br>
        ${instrument.pascaSanggah?.trim() ? instrument.pascaSanggah : 'Guru menyetujui seluruh catatan hasil observasi dan tidak mengajukan sanggahan.'}
      </div>
      <p><strong>3. Rencana Pengembangan Diri:</strong> ${instrument.pascaRencana || '-'}</p>
      <p><strong>4. Program RTL Terpilih:</strong> ${rtlSelected}</p>
      ${instrument.pascaAI ? `<div class="box"><strong>Catatan AI Pasca-Observasi:</strong><br>${instrument.pascaAI}</div>` : ''}

      <div class="section-header">IV. CATATAN KLINIS & REKOMENDASI SUPERVISOR</div>
      <table class="rubric-table">
        <tr><th style="width: 140px;">Aspek</th><th>Uraian Deskriptif</th></tr>
        <tr><td><strong>Kekuatan Guru</strong></td><td>${instrument.kekuatan || '-'}</td></tr>
        <tr><td><strong>Area Perbaikan</strong></td><td>${instrument.perbaikan || '-'}</td></tr>
        <tr><td><strong>Rekomendasi Spesifik</strong></td><td>${instrument.rekomendasi || '-'}</td></tr>
      </table>

      ${
        instrument.photos && instrument.photos.length > 0
          ? `<div class="section-header">V. LAMPIRAN DOKUMENTASI KEGIATAN SUPERVISI</div>
            <table style="width: 100%; border-collapse: collapse; margin-top: 8px; margin-bottom: 16px;">
              <tr>
                ${instrument.photos
                  .map(
                    (photo, idx) => `
                  <td style="width: 50%; padding: 8px; text-align: center; vertical-align: top; border: 1px solid #ddd; background-color: #fafafa;">
                    <img src="${typeof photo === 'string' ? photo : photo.url || ''}" style="max-width: 270px; max-height: 180px; object-fit: cover; border: 1px solid #ccc; border-radius: 4px;" alt="Dokumentasi ${idx + 1}" />
                    <p style="font-size: 8.5pt; color: #555; font-style: italic; margin-top: 5px; margin-bottom: 0;">${typeof photo === 'string' ? `Dokumentasi Observasi ${idx + 1}` : photo.caption || `Dokumentasi Observasi ${idx + 1}`}</p>
                  </td>
                  ${(idx + 1) % 2 === 0 && idx + 1 < instrument.photos.length ? '</tr><tr>' : ''}`,
                  )
                  .join('')}
                ${instrument.photos.length % 2 !== 0 ? '<td style="width: 50%; border: none;"></td>' : ''}
              </tr>
            </table>`
          : ''
      }

      <div style="margin-top: 25px; text-align: center; font-weight: bold; font-size: 11pt; border-top: 2px solid #000; padding-top: 10px;">
        LEMBAR PENGESAHAN HASIL SUPERVISI AKADEMIK
      </div>

      <table class="sig-table" style="margin-top: 15px;">
        <tr>
          <td style="width: 50%; text-align: center;">
            Guru yang Disupervisi,<br><br><br><br>
            <strong><u>${guru?.nama || 'Guru'}</u></strong><br>
            NIP. ${instrument.nipGuru || guru?.nip || '-'}
          </td>
          <td style="width: 50%; text-align: center;">
            Supervisor / Penilai Kelas,<br><br><br><br>
            <strong><u>${internalSup}</u></strong><br>
            NIP. ${internalSupNip}
          </td>
        </tr>
        <tr>
          <td style="width: 50%; text-align: center; padding-top: 30px;">
            Mengetahui,<br>Kepala Sekolah<br><br><br><br>
            <strong><u>${headmasterName}</u></strong><br>
            NIP. ${headmasterNip}
          </td>
          <td style="width: 50%; text-align: center; padding-top: 30px;">
            Mengesahkan,<br>Pengawas Pembina<br><br><br><br>
            <strong><u>${supervisorName}</u></strong><br>
            NIP. ${supervisorNip}<br>
            <span style="font-size: 8.5pt; color: #555;">${isDinasKab ? 'Pengawas Dinas Pendidikan Kab. Bojonegoro' : 'Pengawas SMA Cabdindik Wilayah Bojonegoro'}</span>
          </td>
        </tr>
      </table>

      <div style="margin-top: 40px; border-top: 1px solid #ccc; padding-top: 8px; font-size: 8pt; color: #666; text-align: center; font-style: italic;">
        SI PERAK • Hak Cipta © 2026 Anis Fatul Cholis, M.Pd — Pengawas SMA Cabang Dinas Pendidikan Wilayah Bojonegoro. Dilindungi Undang-Undang.
      </div>
    </body>
    </html>`;

  const outName = `Laporan_Supervisi_${guru?.nama?.replace(/\s+/g, '_') || 'Guru'}.doc`;
  triggerDocDownload(html, outName);
}
