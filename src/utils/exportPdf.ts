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
  KOP_AUTHORITY_KAB,
} from '../constants/school';
import { getEffectiveSupervisorName, getEffectiveSupervisorNip } from '../services/storage';
import type {
  AffectedTeacherItem,
  Guru,
  ProgramTemplateId,
  RubricSection,
  ScoreStats,
  SupervisionInstrument,
} from '../types/supervision';

interface JsPdfWithAutoTable {
  lastAutoTable?: { finalY?: number };
}

export interface ProgramExportPayload {
  templateId: ProgramTemplateId;
  schoolName: string;
  schoolLevel: string;
  authority: string;
  authorityDisplay: string;
  indukPemerintah: string;
  npsn: string;
  address: string;
  academicYear: string;
  headmasterName: string;
  headmasterNip: string;
  supervisorName: string;
  supervisorNip: string;
  fokusProgram: string;
  semester: string;
  targetCapaian: string;
  waktuPelaksanaan: string;
  catatanPengawas: string;
  gurus: Array<{
    nama: string;
    nip: string;
    mapel: string;
    kelas?: string;
    jenjang?: string;
  }>;
}

export interface PdfExportStatus {
  state: 'processing' | 'success' | 'error';
  message: string;
}

interface LoadedPdfImage {
  dataUrl: string;
  width: number;
  height: number;
  format: 'PNG' | 'JPEG';
}

async function loadImageForPdf(url: string): Promise<LoadedPdfImage | null> {
  if (!url) return null;
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      const timeout = setTimeout(() => {
        if (url.startsWith('data:image/')) {
          const isPng = url.startsWith('data:image/png');
          resolve({ dataUrl: url, width: 600, height: 450, format: isPng ? 'PNG' : 'JPEG' });
        } else {
          resolve(null);
        }
      }, 5000);

      img.onload = () => {
        clearTimeout(timeout);
        try {
          const canvas = document.createElement('canvas');
          const maxDim = 1200;
          let width = img.naturalWidth || 600;
          let height = img.naturalHeight || 450;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);
            resolve({
              dataUrl: canvas.toDataURL('image/jpeg', 0.85),
              width,
              height,
              format: 'JPEG',
            });
            return;
          }
        } catch {
          if (url.startsWith('data:image/')) {
            const isPng = url.startsWith('data:image/png');
            resolve({
              dataUrl: url,
              width: img.naturalWidth || 600,
              height: img.naturalHeight || 450,
              format: isPng ? 'PNG' : 'JPEG',
            });
            return;
          }
        }
        resolve(null);
      };

      img.onerror = () => {
        clearTimeout(timeout);
        if (url.startsWith('data:image/')) {
          const isPng = url.startsWith('data:image/png');
          resolve({ dataUrl: url, width: 600, height: 450, format: isPng ? 'PNG' : 'JPEG' });
        } else {
          resolve(null);
        }
      };

      img.src = url;
    } catch {
      resolve(null);
    }
  });
}

export function triggerBrowserPrint(
  _elementOrId?: HTMLElement | string | null,
  docTitle = 'Laporan_Hasil_Supervisi',
  onDone?: (opened: boolean) => void,
): void {
  const prevTitle = document.title;
  if (docTitle) {
    document.title = docTitle;
  }
  try {
    window.print();
    onDone?.(true);
  } catch (err) {
    console.warn('Window print error or iframe sandbox block:', err);
    onDone?.(false);
  } finally {
    setTimeout(() => {
      document.title = prevTitle;
    }, 1500);
  }
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 1500);
}

export async function exportProgramPdf(
  payload: ProgramExportPayload,
  filename = 'Program_Supervisi_Akademik.pdf',
): Promise<boolean> {
  try {
    const [{ jsPDF }, { default: autoTable }] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable'),
    ]);

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    let currentY = 14;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(20, 20, 20);
    doc.text(payload.indukPemerintah.toUpperCase(), pageWidth / 2, currentY, { align: 'center' });
    currentY += 5;

    doc.setFontSize(11);
    doc.text('DINAS PENDIDIKAN', pageWidth / 2, currentY, { align: 'center' });
    currentY += 5;

    doc.setFontSize(10.5);
    doc.text(payload.authority.toUpperCase(), pageWidth / 2, currentY, { align: 'center' });
    currentY += 5.5;

    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text(payload.schoolName.toUpperCase(), pageWidth / 2, currentY, { align: 'center' });
    currentY += 4.5;

    if (payload.address) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(80, 80, 80);
      doc.text(`${payload.address} • NPSN: ${payload.npsn}`, pageWidth / 2, currentY, {
        align: 'center',
      });
      currentY += 3.5;
    }

    doc.setDrawColor(30, 30, 30);
    doc.setLineWidth(0.7);
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 0.8;
    doc.setLineWidth(0.2);
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 5;

    const getTemplateHeading = (): string => {
      switch (payload.templateId) {
        case 'deep-learning':
          return 'PROGRAM SUPERVISI PEMBELAJARAN MENDALAM (DEEP LEARNING)';
        case 'diferensiasi':
          return 'PROGRAM SUPERVISI PEMBELAJARAN BERDIFERENSIASI & DISIPLIN POSITIF';
        case 'matriks-rpa':
          return 'MATRIKS RENCANA PENGAWASAN AKADEMIK (RPA) TAHUNAN';
        default:
          return 'PROGRAM SUPERVISI AKADEMIK KLINIS KURIKULUM NASIONAL';
      }
    };

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(22, 101, 52);
    doc.text(
      `TAHUN PELAJARAN ${payload.academicYear} • ${(payload.semester || 'Semester Ganjil & Genap').toUpperCase()}`,
      pageWidth / 2,
      currentY,
      { align: 'center' },
    );
    currentY += 5;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(getTemplateHeading(), pageWidth / 2, currentY, { align: 'center' });
    currentY += 4.5;

    if (payload.fokusProgram) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text(payload.fokusProgram, pageWidth / 2, currentY, {
        align: 'center',
        maxWidth: 170,
      });
      currentY += 5;
    }

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      styles: { fontSize: 8, cellPadding: 1.5, textColor: [30, 41, 59] },
      head: [
        [
          {
            content: 'IDENTITAS SATUAN PENDIDIKAN & KEBIJAKAN PENGAWASAN',
            colSpan: 4,
            styles: { fontStyle: 'bold', fillColor: [241, 245, 249], textColor: [15, 23, 42] },
          },
        ],
      ],
      body: [
        ['Satuan Pendidikan', `: ${payload.schoolName}`, 'Instansi Pembina', `: ${payload.authorityDisplay}`],
        ['Jenjang / NPSN', `: ${payload.schoolLevel} / ${payload.npsn}`, 'Tahun Pelajaran', `: ${payload.academicYear}`],
        [
          'Kepala Sekolah',
          `: ${payload.headmasterName}`,
          'Waktu Pelaksanaan',
          `: ${payload.waktuPelaksanaan || 'Juli 2026 s.d. Juni 2027'}`,
        ],
        [
          'Pengawas Pembina',
          `: ${payload.supervisorName}`,
          'Target Kinerja',
          `: ${payload.targetCapaian || 'Minimal 85% Kategori Baik/Sangat Baik'}`,
        ],
      ],
      columnStyles: {
        0: { cellWidth: 32, fontStyle: 'bold' },
        1: { cellWidth: 59 },
        2: { cellWidth: 32, fontStyle: 'bold' },
        3: { cellWidth: 59 },
      },
    });
    currentY = ((doc as unknown as JsPdfWithAutoTable).lastAutoTable?.finalY ?? currentY) + 4;

    if (payload.templateId === 'matriks-rpa') {
      autoTable(doc, {
        startY: currentY,
        margin: { left: margin, right: margin },
        styles: { fontSize: 7.5, cellPadding: 2, textColor: [30, 41, 59] },
        head: [['No', 'Siklus Kegiatan', 'Tujuan Pengawasan', 'Metode & Instrumen', 'Sasaran & Waktu', 'Bukti Fisik / Output']],
        body: [
          ['1', 'Pra-Observasi (Persiapan)', 'Penyelarasan modul ajar, asesmen awal, & target indikator.', 'Wawancara Pra-Obs & Telaah Modul', 'Semua Guru (Awal Semester)', 'Form Pra-Observasi & Kesepakatan'],
          ['2', 'Observasi Kelas Terstruktur', 'Pengamatan aktivitas belajar aktif, diferensiasi, & keaktifan murid.', 'Rubrik Observasi Kelas (Skor 1-4)', 'Guru Terjadwal (Matriks)', 'Lembar Skor & Catatan Lapangan'],
          ['3', 'Pasca-Observasi (Refleksi)', 'Refleksi dialogis atas pencapaian target dan analisis kendala mengajar.', 'Form Refleksi Klinis Dialogis', 'Guru yang Disupervisi (H+1)', 'Catatan Refleksi & Umpan Balik'],
          ['4', 'Rencana Tindak Lanjut (RTL)', 'Rekomendasi tindak lanjut pembinaan, coaching, mentoring, atau Kombel.', 'Matriks RTL & Coaching', 'Guru Sasaran (Berkelanjutan)', 'Laporan RTL & Evaluasi Kinerja'],
        ],
        columnStyles: {
          0: { cellWidth: 8, halign: 'center', fontStyle: 'bold' },
          1: { cellWidth: 35, fontStyle: 'bold' },
          2: { cellWidth: 42 },
          3: { cellWidth: 35 },
          4: { cellWidth: 30 },
          5: { cellWidth: 32 },
        },
        headStyles: { fillColor: [240, 243, 248], textColor: [15, 23, 42], fontStyle: 'bold' },
      });
    } else {
      autoTable(doc, {
        startY: currentY,
        margin: { left: margin, right: margin },
        styles: { fontSize: 8, cellPadding: 2, textColor: [30, 41, 59] },
        head: [
          [
            {
              content: 'I. LATAR BELAKANG, TUJUAN, & STRATEGI PENGAWASAN',
              colSpan: 2,
              styles: { fontStyle: 'bold', fillColor: [241, 245, 249], textColor: [15, 23, 42] },
            },
          ],
        ],
        body: [
          [
            'Latar Belakang',
            `Supervisi akademik dilaksanakan sebagai upaya penjaminan mutu dan pemberdayaan guru di ${payload.schoolName} di bawah pembinaan ${payload.authorityDisplay}. Berorientasi pada paradigma kemitraan non-judgmental untuk menciptakan iklim belajar yang berpihak pada murid.`,
          ],
          [
            'Tujuan Program',
            '1. Menguatkan kompetensi pedagogik guru dalam merancang modul ajar dan asesmen.\n2. Mengoptimalkan keaktifan murid melalui pembelajaran mendalam dan berdiferensiasi.\n3. Menumbuhkan budaya refleksi dan evaluasi diri secara konstruktif.',
          ],
          ['Alur Pelaksanaan', '1. Pra-Observasi  ->  2. Observasi Kelas  ->  3. Telaah Dokumen  ->  4. Refleksi Pasca-Obs  ->  5. Tindak Lanjut (RTL)'],
          [
            'Target Capaian',
            payload.targetCapaian || 'Minimal 85% guru berpredikat "Baik" atau "Sangat Baik" dalam supervisi klinis.',
          ],
        ],
        columnStyles: { 0: { cellWidth: 32, fontStyle: 'bold' }, 1: { cellWidth: 150 } },
      });
    }
    currentY = ((doc as unknown as JsPdfWithAutoTable).lastAutoTable?.finalY ?? currentY) + 4;

    const guruRows =
      payload.gurus && payload.gurus.length > 0
        ? payload.gurus.map((g, idx) => [
            String(idx + 1),
            g.nama,
            g.nip && g.nip !== '-' ? g.nip : '-',
            g.mapel || '-',
            g.kelas || g.jenjang || payload.schoolLevel,
            'Pra-Obs, Observasi, Pasca-Obs',
            'Terjadwal',
          ])
        : [['1', 'Seluruh Dewan Guru Mata Pelajaran', '-', 'Semua Mapel', payload.schoolLevel, 'Siklus Lengkap', 'Terjadwal']];

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      styles: { fontSize: 7.5, cellPadding: 1.6, textColor: [30, 41, 59] },
      head: [['No', 'Nama Lengkap Guru', 'NIP', 'Mata Pelajaran', 'Kelas / Fase', 'Tahap Supervisi', 'Status']],
      body: guruRows,
      columnStyles: {
        0: { cellWidth: 8, halign: 'center', fontStyle: 'bold' },
        1: { cellWidth: 50, fontStyle: 'bold' },
        2: { cellWidth: 35 },
        3: { cellWidth: 34 },
        4: { cellWidth: 20, halign: 'center' },
        5: { cellWidth: 20, halign: 'center' },
        6: { cellWidth: 15, halign: 'center' },
      },
      headStyles: { fillColor: [240, 243, 248], textColor: [15, 23, 42], fontStyle: 'bold' },
    });
    currentY = ((doc as unknown as JsPdfWithAutoTable).lastAutoTable?.finalY ?? currentY) + 6;

    if (currentY > 230) {
      doc.addPage();
      currentY = 20;
    }

    const formattedDate = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(50, 50, 50);
    doc.text(`Bojonegoro, ${formattedDate}`, pageWidth - margin - 10, currentY, { align: 'right' });
    currentY += 6;

    const leftX = margin + 35;
    const rightX = pageWidth - margin - 35;
    doc.setFont('helvetica', 'normal');
    doc.text('Mengetahui,', leftX, currentY, { align: 'center' });
    doc.text('Disahkan Oleh,', rightX, currentY, { align: 'center' });
    currentY += 4.5;

    doc.setFont('helvetica', 'bold');
    doc.text(`Kepala ${payload.schoolName}`, leftX, currentY, { align: 'center' });
    doc.text(`Pengawas ${payload.schoolLevel} ${payload.authorityDisplay}`, rightX, currentY, {
      align: 'center',
    });
    currentY += 20;

    doc.setFont('helvetica', 'bold');
    doc.text(payload.headmasterName, leftX, currentY, { align: 'center' });
    doc.text(payload.supervisorName, rightX, currentY, { align: 'center' });
    currentY += 4;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(`NIP. ${payload.headmasterNip || '-'}`, leftX, currentY, { align: 'center' });
    doc.text(`NIP. ${payload.supervisorNip || '-'}`, rightX, currentY, { align: 'center' });

    const totalPages = doc.getNumberOfPages();
    for (let page = 1; page <= totalPages; page++) {
      doc.setPage(page);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7);
      doc.setTextColor(140, 140, 140);
      doc.text(
        `SI PERAK • Hak Cipta © Anis Fatul Cholis, M.Pd (${payload.authorityDisplay}) • Halaman ${page} dari ${totalPages}`,
        pageWidth / 2,
        290,
        { align: 'center' },
      );
    }

    const outName = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    downloadBlob(doc.output('blob'), outName);
    return true;
  } catch (err) {
    console.error('exportProgramPdf error:', err);
    return false;
  }
}

export async function exportSupervisionPdf({
  instrument,
  guru,
  stats,
  rubricSections = [],
  instrumentTitle,
  filename,
  onStatusChange,
}: {
  instrument: SupervisionInstrument;
  guru?: Guru | null;
  stats?: { avg: number; category: string } | ScoreStats;
  rubricSections?: RubricSection[];
  instrumentTitle?: string;
  filename?: string;
  onStatusChange?: (status: PdfExportStatus) => void;
}): Promise<boolean> {
  try {
    onStatusChange?.({ state: 'processing', message: 'Membuat berkas PDF resmi (A4)...' });

    const [{ jsPDF }, { default: autoTable }] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable'),
    ]);

    const safeGuruName = (guru?.nama || 'Guru').replace(/[^a-zA-Z0-9]/g, '_');
    const outName = filename
      ? filename.endsWith('.pdf')
        ? filename
        : `${filename}.pdf`
      : `Laporan_Supervisi_${safeGuruName}.pdf`;

    const scoreValues = Object.values(instrument.obsScores || {});
    const avg = stats
      ? stats.avg
      : scoreValues.length > 0
        ? scoreValues.reduce((sum, val) => sum + val, 0) / scoreValues.length
        : 0;
    const category = stats
      ? stats.category
      : avg >= 3.5
        ? 'Sangat Baik'
        : avg >= 3
          ? 'Baik'
          : avg >= 2
            ? 'Cukup'
            : 'Perlu Pembinaan';
    const avgFormatted = avg.toFixed(2);

    const schoolName =
      localStorage.getItem('school_name') || instrument.namaSekolah || DEFAULT_SCHOOL_NAME;
    const schoolAddress =
      localStorage.getItem('school_address') || instrument.alamatSekolah || DEFAULT_SCHOOL_ADDRESS;
    const academicYear =
      localStorage.getItem('school_academic_year')?.replace('/', ' / ') ||
      DEFAULT_ACADEMIC_YEAR.replace('/', ' / ');
    const internalSup =
      localStorage.getItem('school_internal_supervisor_name') ||
      instrument.namaSupervisor ||
      DEFAULT_INTERNAL_SUPERVISOR_NAME;
    const internalSupNip =
      localStorage.getItem('school_internal_supervisor_nip') ||
      instrument.nipSupervisor ||
      DEFAULT_INTERNAL_SUPERVISOR_NIP;
    const effectiveSupervisor = getEffectiveSupervisorName();
    const effectiveSupervisorNip = getEffectiveSupervisorNip();
    const headmasterName =
      localStorage.getItem('school_headmaster_name') ||
      instrument.namaKepala ||
      DEFAULT_HEADMASTER_NAME;
    const headmasterNip =
      localStorage.getItem('school_headmaster_nip') ||
      instrument.nipKepala ||
      DEFAULT_HEADMASTER_NIP;

    const schoolLevel = localStorage.getItem('school_level') || 'SMA';
    const kopAuthority =
      localStorage.getItem('school_kop_authority') ||
      (['TK', 'SD', 'SMP'].includes(schoolLevel) ? KOP_AUTHORITY_KAB : KOP_AUTHORITY_CABDIN);
    const isDinasKab = kopAuthority === KOP_AUTHORITY_KAB;

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    const contentWidth = pageWidth - margin * 2;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(
      isDinasKab ? 'PEMERINTAH KABUPATEN BOJONEGORO' : 'PEMERINTAH PROVINSI JAWA TIMUR',
      pageWidth / 2,
      14,
      { align: 'center' },
    );
    doc.setFontSize(11);
    doc.text('DINAS PENDIDIKAN', pageWidth / 2, 19, { align: 'center' });
    doc.text(kopAuthority, pageWidth / 2, 24, { align: 'center' });
    doc.setFontSize(12);
    doc.text(schoolName.toUpperCase(), pageWidth / 2, 29, { align: 'center' });
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.text(schoolAddress, pageWidth / 2, 33, { align: 'center' });

    doc.setLineWidth(0.8);
    doc.line(margin, 36, margin + contentWidth, 36);
    doc.setLineWidth(0.2);
    doc.line(margin, 37, margin + contentWidth, 37);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('INSTRUMEN SUPERVISI KLINIS AKADEMIK', pageWidth / 2, 44, { align: 'center' });
    doc.setFontSize(9);
    doc.text(`TAHUN PELAJARAN ${academicYear}`, pageWidth / 2, 48.5, { align: 'center' });
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.text(
      `(${instrumentTitle || 'Berbasis Pembelajaran Mendalam & Kurikulum Nasional'})`,
      pageWidth / 2,
      52.5,
      { align: 'center' },
    );

    autoTable(doc, {
      startY: 56,
      margin: { left: margin, right: margin },
      theme: 'plain',
      styles: { fontSize: 8.5, cellPadding: 1.2, textColor: [20, 20, 20] },
      columnStyles: {
        0: { cellWidth: 42, fontStyle: 'bold' },
        1: { cellWidth: 4, halign: 'center' },
        2: { cellWidth: 136 },
      },
      body: [
        ['Satuan Pendidikan', ':', schoolName],
        ['Alamat Sekolah', ':', schoolAddress],
        ['Nama Guru', ':', guru?.nama || 'Guru Mata Pelajaran'],
        ['NIP Guru / Status', ':', `${instrument.nipGuru || guru?.nip || '-'} (${guru?.status || 'ASN'})`],
        ['Pangkat / Golongan', ':', guru?.pangkat || '-'],
        ['Mata Pelajaran', ':', instrument.mapel || guru?.mapel || '-'],
        ['Kelas / Fase', ':', instrument.kelas || '-'],
        ['Materi Pokok', ':', instrument.materi || '-'],
        [
          'Jadwal Supervisi',
          ':',
          `Pra: ${instrument.tglPra || '-'}  |  Obs: ${instrument.tglObs || '-'}  |  Pasca: ${instrument.tglPasca || '-'}`,
        ],
      ],
    });

    let currentY = ((doc as unknown as JsPdfWithAutoTable).lastAutoTable?.finalY ?? 85) + 3;

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      styles: { fontSize: 8.5, cellPadding: 1.8 },
      head: [
        [
          {
            content: 'I. TAHAP PRA-OBSERVASI (PERSIAPAN & KESEPAKATAN)',
            colSpan: 2,
            styles: { fontStyle: 'bold', fillColor: [240, 243, 248], textColor: [15, 23, 42] },
          },
        ],
      ],
      body: [
        ['Tujuan Pembelajaran', instrument.praFields?.tujuan || '-'],
        ['Area Fokus Pengembangan', instrument.praFields?.area || '-'],
        ['Strategi Pembelajaran', instrument.praFields?.strategi || '-'],
        ['Media & Sumber Belajar', instrument.praFields?.media || '-'],
        ...(instrument.praAI ? [['Catatan AI Pra-Observasi', instrument.praAI]] : []),
      ],
      columnStyles: { 0: { cellWidth: 42, fontStyle: 'bold' }, 1: { cellWidth: 140 } },
    });
    currentY = ((doc as unknown as JsPdfWithAutoTable).lastAutoTable?.finalY ?? currentY) + 3;

    const rubricRows: Array<Array<string | { content: string; colSpan?: number; styles?: Record<string, unknown> }>> = [];
    if (rubricSections.length > 0) {
      rubricSections.forEach((sec, sIdx) => {
        rubricRows.push([
          {
            content: `${sIdx + 1}. ${sec.title}`,
            colSpan: 3,
            styles: { fontStyle: 'bold', fillColor: [245, 247, 250], textColor: [30, 41, 59] },
          },
        ]);
        sec.items.forEach((item, iIdx) => {
          const score = instrument.obsScores?.[item.id];
          rubricRows.push([
            `${sIdx + 1}.${iIdx + 1}`,
            `${item.label}\n(${item.desc})`,
            score ? String(score) : '-',
          ]);
        });
      });
    }

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [
        [
          {
            content: `II. OBSERVASI KELAS (${(instrumentTitle || 'Kurikulum Nasional').toUpperCase()}) — Skor Rata-rata: ${avgFormatted} / 4.00 (Kategori: ${category})`,
            colSpan: 3,
            styles: { fontStyle: 'bold', fillColor: [240, 243, 248], textColor: [15, 23, 42] },
          },
        ],
        ['No', 'Indikator Pengamatan Pembelajaran', 'Skor'],
      ],
      body:
        rubricRows.length > 0
          ? rubricRows
          : [[{ content: 'Belum ada data indikator rubrik yang tersimpan.', colSpan: 3, styles: { halign: 'center', fontStyle: 'italic' } }]],
      styles: { fontSize: 8, cellPadding: 1.8 },
      headStyles: { fillColor: [226, 232, 240], textColor: [15, 23, 42], fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 12, halign: 'center' },
        1: { cellWidth: 152 },
        2: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
      },
    });
    currentY = ((doc as unknown as JsPdfWithAutoTable).lastAutoTable?.finalY ?? currentY) + 3;

    if (instrument.analysisScore || instrument.obsAI) {
      const obsAnalysisRows: string[][] = [];
      if (instrument.analysisScore) obsAnalysisRows.push(['Interpretasi Skor', instrument.analysisScore]);
      if (instrument.obsAI) obsAnalysisRows.push(['Catatan AI Observasi', instrument.obsAI]);
      autoTable(doc, {
        startY: currentY,
        margin: { left: margin, right: margin },
        styles: { fontSize: 8, cellPadding: 1.5 },
        body: obsAnalysisRows,
        columnStyles: { 0: { cellWidth: 42, fontStyle: 'bold' }, 1: { cellWidth: 140 } },
      });
      currentY = ((doc as unknown as JsPdfWithAutoTable).lastAutoTable?.finalY ?? currentY) + 3;
    }

    const rtlSummary =
      Object.entries(instrument.rtl || {})
        .filter(([, checked]) => Boolean(checked))
        .map(([key]) => key.toUpperCase())
        .join(', ') || 'Belum dipilih';

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      styles: { fontSize: 8.5, cellPadding: 1.8 },
      head: [
        [
          {
            content: 'III. PASCA-OBSERVASI & RENCANA TINDAK LANJUT (RTL)',
            colSpan: 2,
            styles: { fontStyle: 'bold', fillColor: [240, 243, 248], textColor: [15, 23, 42] },
          },
        ],
      ],
      body: [
        ['1. Refleksi Guru', instrument.pascaRefleksi || '-'],
        [
          '2. Tanggapan / Hak Sanggah Guru',
          instrument.pascaSanggah?.trim()
            ? instrument.pascaSanggah
            : 'Guru menyetujui seluruh catatan hasil observasi.',
        ],
        ['3. Rencana Pengembangan Diri', instrument.pascaRencana || '-'],
        ['4. Program RTL Terpilih', rtlSummary],
        ...(instrument.pascaAI ? [['Catatan AI Pasca-Observasi', instrument.pascaAI]] : []),
      ],
      columnStyles: { 0: { cellWidth: 42, fontStyle: 'bold' }, 1: { cellWidth: 140 } },
    });
    currentY = ((doc as unknown as JsPdfWithAutoTable).lastAutoTable?.finalY ?? currentY) + 3;

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      styles: { fontSize: 8.5, cellPadding: 1.8 },
      head: [
        [
          {
            content: 'IV. CATATAN KLINIS & REKOMENDASI SUPERVISOR',
            colSpan: 2,
            styles: { fontStyle: 'bold', fillColor: [240, 243, 248], textColor: [15, 23, 42] },
          },
        ],
      ],
      body: [
        ['Kekuatan Guru', instrument.kekuatan || '-'],
        ['Area Perbaikan', instrument.perbaikan || '-'],
        ['Rekomendasi Spesifik', instrument.rekomendasi || '-'],
      ],
      columnStyles: { 0: { cellWidth: 42, fontStyle: 'bold' }, 1: { cellWidth: 140 } },
    });
    currentY = ((doc as unknown as JsPdfWithAutoTable).lastAutoTable?.finalY ?? currentY) + 5;

    if (instrument.photos && instrument.photos.length > 0) {
      if (currentY > 195) {
        doc.addPage();
        currentY = 20;
      }
      autoTable(doc, {
        startY: currentY,
        margin: { left: margin, right: margin },
        styles: { fontSize: 8.5, cellPadding: 1.8 },
        head: [
          [
            {
              content: 'V. LAMPIRAN DOKUMENTASI KEGIATAN SUPERVISI',
              styles: { fontStyle: 'bold', fillColor: [240, 243, 248], textColor: [15, 23, 42] },
            },
          ],
        ],
        body: [],
      });
      currentY = ((doc as unknown as JsPdfWithAutoTable).lastAutoTable?.finalY ?? currentY) + 4;

      const boxWidth = 86;
      const boxGap = 10;
      const imgHeight = 55;

      for (let i = 0; i < instrument.photos.length; i += 2) {
        const photo1 = instrument.photos[i];
        const photo2 = instrument.photos[i + 1];
        if (currentY + imgHeight + 16 > 272) {
          doc.addPage();
          currentY = 20;
        }

        const url1 = typeof photo1 === 'string' ? photo1 : photo1.url || '';
        const cap1 =
          typeof photo1 === 'string'
            ? `Dokumentasi Observasi ${i + 1}`
            : photo1.caption || `Dokumentasi Observasi ${i + 1}`;
        const loaded1 = await loadImageForPdf(url1);
        if (loaded1) {
          const x1 = margin;
          doc.setDrawColor(210, 215, 225);
          doc.setFillColor(255, 255, 255);
          doc.roundedRect(x1, currentY, boxWidth, imgHeight + 8, 1, 1, 'FD');
          try {
            doc.addImage(loaded1.dataUrl, loaded1.format, x1 + 1, currentY + 1, boxWidth - 2, imgHeight);
          } catch (err) {
            console.warn('Error adding image 1 to PDF:', err);
          }
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(7.5);
          doc.setTextColor(80, 80, 80);
          doc.text(cap1, x1 + boxWidth / 2, currentY + imgHeight + 5.5, {
            align: 'center',
            maxWidth: boxWidth - 4,
          });
        }

        if (photo2) {
          const url2 = typeof photo2 === 'string' ? photo2 : photo2.url || '';
          const cap2 =
            typeof photo2 === 'string'
              ? `Dokumentasi Observasi ${i + 2}`
              : photo2.caption || `Dokumentasi Observasi ${i + 2}`;
          const loaded2 = await loadImageForPdf(url2);
          if (loaded2) {
            const x2 = margin + boxWidth + boxGap;
            doc.setDrawColor(210, 215, 225);
            doc.setFillColor(255, 255, 255);
            doc.roundedRect(x2, currentY, boxWidth, imgHeight + 8, 1, 1, 'FD');
            try {
              doc.addImage(loaded2.dataUrl, loaded2.format, x2 + 1, currentY + 1, boxWidth - 2, imgHeight);
            } catch (err) {
              console.warn('Error adding image 2 to PDF:', err);
            }
            doc.setFont('helvetica', 'italic');
            doc.setFontSize(7.5);
            doc.setTextColor(80, 80, 80);
            doc.text(cap2, x2 + boxWidth / 2, currentY + imgHeight + 5.5, {
              align: 'center',
              maxWidth: boxWidth - 4,
            });
          }
        }
        currentY += imgHeight + 12;
      }
      currentY += 4;
    }

    if (currentY > 215) {
      doc.addPage();
      currentY = 20;
    }

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      theme: 'plain',
      styles: { fontSize: 8, halign: 'center', cellPadding: 1 },
      body: [
        [
          {
            content: 'LEMBAR PENGESAHAN HASIL SUPERVISI AKADEMIK',
            colSpan: 2,
            styles: { fontStyle: 'bold', fontSize: 8.5 },
          },
        ],
        ['Guru yang Disupervisi,', 'Supervisor / Penilai Kelas,'],
        ['\n\n\n', '\n\n\n'],
        [
          `${guru?.nama || 'Guru Mata Pelajaran'}\nNIP. ${instrument.nipGuru || guru?.nip || '-'}`,
          `${internalSup}\nNIP. ${internalSupNip}`,
        ],
        ['\n', '\n'],
        ['Mengetahui,\nKepala Sekolah', 'Mengesahkan,\nPengawas Pembina'],
        ['\n\n\n', '\n\n\n'],
        [
          `${headmasterName}\nNIP. ${headmasterNip}`,
          `${effectiveSupervisor}\nNIP. ${effectiveSupervisorNip}\n${isDinasKab ? 'Pengawas Dinas Pendidikan Kab. Bojonegoro' : 'Pengawas SMA Cabdindik Bojonegoro'}`,
        ],
      ],
    });

    const totalPages = doc.getNumberOfPages();
    for (let page = 1; page <= totalPages; page++) {
      doc.setPage(page);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(130, 130, 130);
      doc.text(
        `SI PERAK • Hak Cipta © Anis Fatul Cholis, M.Pd (Pengawas SMA Cabang Dinas Pendidikan Wilayah Bojonegoro) • Halaman ${page} dari ${totalPages}`,
        pageWidth / 2,
        292,
        { align: 'center' },
      );
    }

    downloadBlob(doc.output('blob'), outName);
    onStatusChange?.({
      state: 'success',
      message: `Berkas PDF "${outName}" berhasil diunduh ke perangkat Anda.`,
    });
    return true;
  } catch (err) {
    console.error('exportSupervisionPdf error:', err);
    onStatusChange?.({
      state: 'error',
      message: `Gagal membuat PDF: ${err instanceof Error ? err.message : 'Terjadi kesalahan sistem.'}`,
    });
    return false;
  }
}

export async function exportCategoryTeachersPdf({
  categoryName,
  teachers,
  solusiIHT,
}: {
  categoryName: string;
  teachers: AffectedTeacherItem[];
  solusiIHT?: string;
  totalTeachersCount?: number;
}): Promise<boolean> {
  try {
    const [{ jsPDF }, { default: autoTable }] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable'),
    ]);

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const schoolName = localStorage.getItem('school_name') || DEFAULT_SCHOOL_NAME;
    const schoolLevel = localStorage.getItem('school_level') || 'SMA';
    const kopAuthority =
      localStorage.getItem('school_kop_authority') ||
      (['TK', 'SD', 'SMP'].includes(schoolLevel) ? KOP_AUTHORITY_KAB : KOP_AUTHORITY_CABDIN);
    const schoolAddress = localStorage.getItem('school_address') || DEFAULT_SCHOOL_ADDRESS;
    const schoolNpsn = localStorage.getItem('school_npsn') || DEFAULT_SCHOOL_NPSN;
    const academicYear = localStorage.getItem('school_academic_year') || DEFAULT_ACADEMIC_YEAR;
    const headmasterName =
      localStorage.getItem('school_headmaster_name') || DEFAULT_HEADMASTER_NAME;
    const headmasterNip =
      localStorage.getItem('school_headmaster_nip') || DEFAULT_HEADMASTER_NIP;
    const supervisorName =
      localStorage.getItem('school_supervisor_name') || DEFAULT_SUPERVISOR_NAME;
    const supervisorNip =
      localStorage.getItem('school_supervisor_nip') || DEFAULT_SUPERVISOR_NIP;

    const parentGovLines = kopAuthority.includes('CABANG DINAS')
      ? ['PEMERINTAH PROVINSI JAWA TIMUR', 'DINAS PENDIDIKAN']
      : ['PEMERINTAH KABUPATEN BOJONEGORO'];

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    let currentY = 14;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(20, 20, 20);
    parentGovLines.forEach((line) => {
      doc.text(line, pageWidth / 2, currentY, { align: 'center' });
      currentY += 4.5;
    });
    doc.setFontSize(11);
    doc.text(kopAuthority.toUpperCase(), pageWidth / 2, currentY, { align: 'center' });
    currentY += 5;
    doc.setFontSize(13);
    doc.text(schoolName.toUpperCase(), pageWidth / 2, currentY, { align: 'center' });
    currentY += 4.5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(70, 70, 70);
    doc.text(`${schoolAddress} | NPSN: ${schoolNpsn}`, pageWidth / 2, currentY, { align: 'center' });
    currentY += 3.5;

    doc.setDrawColor(20, 20, 20);
    doc.setLineWidth(0.8);
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 1;
    doc.setLineWidth(0.25);
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 6;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(24, 43, 73);
    doc.text('PEMETAAN KEBUTUHAN GURU & REKOMENDASI TINDAK LANJUT', pageWidth / 2, currentY, {
      align: 'center',
    });
    currentY += 5;

    doc.setFontSize(10);
    doc.setTextColor(180, 83, 9);
    doc.text(`FOKUS MASALAH: ${categoryName.toUpperCase()}`, pageWidth / 2, currentY, {
      align: 'center',
    });
    currentY += 4.5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 100, 100);
    doc.text(
      `Tahun Ajaran ${academicYear} • Siklus Pendampingan Klinis Pasca-Observasi`,
      pageWidth / 2,
      currentY,
      { align: 'center' },
    );
    currentY += 6;

    const boxWidth = pageWidth - margin * 2;
    doc.setFillColor(254, 243, 199);
    doc.setDrawColor(245, 158, 11);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, currentY, boxWidth, 18, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(120, 53, 15);
    doc.text('Rekomendasi Rencana Aksi Kolektif Sekolah (IHT / Kombel / MGMP):', margin + 3.5, currentY + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(60, 60, 60);
    const wrappedSolusi = doc.splitTextToSize(
      solusiIHT ||
        'Menyelenggarakan In-House Training (IHT), peer coaching sesama guru serumpun mata pelajaran, dan pendampingan rubrik implementasi kelas secara terjadwal.',
      boxWidth - 36,
    );
    doc.text(wrappedSolusi, margin + 3.5, currentY + 9.5);

    doc.setFillColor(217, 119, 6);
    doc.roundedRect(pageWidth - margin - 30, currentY + 3.5, 26, 11, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text('TOTAL SASARAN', pageWidth - margin - 17, currentY + 7.5, { align: 'center' });
    doc.setFontSize(9);
    doc.text(`${teachers.length} Guru`, pageWidth - margin - 17, currentY + 12, { align: 'center' });
    currentY += 22;

    const head = [['No', 'Nama Guru & NIP', 'Mata Pelajaran', 'Temuan Kendala / Skor Rubrik', 'Rencana Intervensi', 'Status & Dampak']];
    const body =
      teachers.length > 0
        ? teachers.map((teacher, idx) => {
            const nipText = teacher.guruNip && teacher.guruNip !== '-' ? `\nNIP. ${teacher.guruNip}` : '';
            const kelasText = teacher.kelas && teacher.kelas !== '-' ? ` (${teacher.kelas})` : '';
            const skorText = teacher.skorRubrik ? `\n[${teacher.skorRubrik}]` : '';
            const srcBadge = teacher.source === 'supervisi' ? ' [Observasi]' : ' [Tindak Lanjut]';
            return [
              String(idx + 1),
              `${teacher.guruNama}${nipText}`,
              `${teacher.mapel}${kelasText}`,
              `${teacher.detailMasalah}${skorText}${srcBadge}`,
              `${teacher.intervensi}\n\nSmart Rekomendasi:\n${teacher.smartRekomendasi}`,
              `${teacher.status}\n(${teacher.dampak})`,
            ];
          })
        : [
            [
              '-',
              'Belum ada guru dengan kendala pada aspek ini.',
              '-',
              `Seluruh guru yang disupervisi memenuhi standar capaian pada aspek ${categoryName}.`,
              'Pertahankan praktik baik melalui komunitas belajar (Kombel).',
              'Memenuhi Standar',
            ],
          ];

    autoTable(doc, {
      startY: currentY,
      head,
      body,
      theme: 'grid',
      margin: { left: margin, right: margin },
      styles: {
        fontSize: 7.5,
        cellPadding: 2.2,
        overflow: 'linebreak',
        textColor: [30, 30, 30],
        lineColor: [200, 200, 200],
        lineWidth: 0.15,
        font: 'helvetica',
      },
      headStyles: {
        fillColor: [30, 58, 138],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center',
        valign: 'middle',
      },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 38, fontStyle: 'bold' },
        2: { cellWidth: 26 },
        3: { cellWidth: 44 },
        4: { cellWidth: 46 },
        5: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
      },
      didDrawPage: (data) => {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(7);
        doc.setTextColor(140, 140, 140);
        doc.text(
          'SI PERAK — Sistem Informasi Supervisi Akademik • Dokumen Resmi Pengawas Pembina (Anis Fatul Cholis, M.Pd)',
          margin,
          doc.internal.pageSize.getHeight() - 7,
        );
        doc.text(
          `Hal. ${data.pageNumber}`,
          pageWidth - margin,
          doc.internal.pageSize.getHeight() - 7,
          { align: 'right' },
        );
      },
    });

    let sigY = ((doc as unknown as JsPdfWithAutoTable).lastAutoTable?.finalY ?? currentY + 40) + 8;
    if (sigY + 36 > doc.internal.pageSize.getHeight() - 10) {
      doc.addPage();
      sigY = 20;
    }

    const formattedDate = new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date());
    const sigLeftX = margin + 10;
    const sigRightX = pageWidth - margin - 60;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 30, 30);
    doc.text('Mengetahui,', sigLeftX, sigY);
    doc.text('Kepala Sekolah', sigLeftX, sigY + 4.5);
    doc.text(`Bojonegoro, ${formattedDate}`, sigRightX, sigY);
    doc.text('Pengawas Pembina / Supervisor', sigRightX, sigY + 4.5);
    sigY += 22;

    doc.setFont('helvetica', 'bold');
    doc.text(headmasterName, sigLeftX, sigY);
    doc.setFont('helvetica', 'normal');
    doc.text(`NIP. ${headmasterNip}`, sigLeftX, sigY + 4);
    doc.setFont('helvetica', 'bold');
    doc.text(supervisorName, sigRightX, sigY);
    doc.setFont('helvetica', 'normal');
    doc.text(`NIP. ${supervisorNip}`, sigRightX, sigY + 4);

    const outName = `Daftar_Guru_Kendala_${categoryName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    doc.save(outName);
    return true;
  } catch (err) {
    console.error('Error generating teachers issue PDF:', err);
    return false;
  }
}
