import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Download,
  Eye,
  FileText,
  FileUp,
  Info,
  Layers,
  Loader2,
  Printer,
  RefreshCw,
  Sliders,
  Trash2,
  Upload,
  UploadCloud,
  X,
} from 'lucide-react';
import type { ChangeEvent } from 'react';
import { useRef, useState } from 'react';
import {
  DEFAULT_SUPERVISOR_NAME,
  PROGRAM_TEMPLATE_DEFAULTS,
  PROGRAM_TEMPLATE_OPTIONS,
} from '../../constants/school';
import { useSchoolConfig } from '../../hooks/useSchoolConfig';
import {
  loadProgramTemplateConfig,
  loadStoredGurus,
  loadUploadedProgramFile,
  saveProgramTemplateConfig,
  saveUploadedProgramFile,
} from '../../services/storage';
import type {
  Guru,
  ProgramTemplateConfig,
  ProgramTemplateId,
  ToastNotice,
  UploadedProgramFile,
} from '../../types/supervision';
import type { ProgramExportPayload } from '../../utils/exportPdf';
import { exportProgramPdf, triggerBrowserPrint } from '../../utils/exportPdf';
import { exportProgramWord } from '../../utils/exportWord';
import { formatFileSize } from '../../utils/id';

interface ProgramSupervisiProps {
  gurus?: Guru[];
}

export default function ProgramSupervisi({ gurus: propGurus }: ProgramSupervisiProps) {
  const { config: schoolConfig } = useSchoolConfig();
  const [templateConfig, setTemplateConfig] = useState<ProgramTemplateConfig>(() =>
    loadProgramTemplateConfig(),
  );
  const [viewMode, setViewMode] = useState<'template' | 'uploaded'>(() =>
    loadUploadedProgramFile() ? 'uploaded' : 'template',
  );
  const [uploadedFile, setUploadedFile] = useState<UploadedProgramFile | null>(() =>
    loadUploadedProgramFile(),
  );
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [notice, setNotice] = useState<ToastNotice | null>(null);
  const [showPrintFallbackModal, setShowPrintFallbackModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [showFullscreenPdf, setShowFullscreenPdf] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const gurus = propGurus ?? loadStoredGurus();

  const showToast = (text: string, type: ToastNotice['type']) => {
    setNotice({ text, type });
    setTimeout(() => setNotice(null), 4000);
  };

  const buildPayload = (): ProgramExportPayload => ({
    templateId: templateConfig.templateId,
    schoolName: schoolConfig.schoolName,
    schoolLevel: schoolConfig.schoolLevel,
    authority: schoolConfig.kopAuthority,
    authorityDisplay: schoolConfig.authorityName,
    indukPemerintah: schoolConfig.parentGovUpper,
    npsn: schoolConfig.schoolNpsn,
    address: schoolConfig.schoolAddress,
    academicYear: schoolConfig.academicYear.replace('/', ' / '),
    headmasterName: schoolConfig.headmasterName,
    headmasterNip: schoolConfig.headmasterNip,
    supervisorName: schoolConfig.supervisorName,
    supervisorNip: schoolConfig.supervisorNip,
    fokusProgram: templateConfig.fokusProgram,
    semester: templateConfig.semester,
    targetCapaian: templateConfig.targetCapaian,
    waktuPelaksanaan: templateConfig.waktuPelaksanaan,
    catatanPengawas: templateConfig.catatanPengawas,
    gurus: gurus.map((g) => ({
      nama: g.nama,
      nip: g.nip,
      mapel: g.mapel,
      kelas: g.kelas,
      jenjang: g.jenjang,
    })),
  });

  const handleSelectTemplate = (templateId: ProgramTemplateId) => {
    const preset = PROGRAM_TEMPLATE_DEFAULTS[templateId];
    const next: ProgramTemplateConfig = {
      ...templateConfig,
      templateId,
      fokusProgram: preset.fokus,
      targetCapaian: preset.target,
      waktuPelaksanaan: preset.waktu,
    };
    setTemplateConfig(next);
    saveProgramTemplateConfig(next);
    setViewMode('template');
    showToast('Format template program supervisi diperbarui.', 'success');
  };

  const handleSaveCustomTemplate = () => {
    saveProgramTemplateConfig(templateConfig);
    setShowCustomModal(false);
    setViewMode('template');
    showToast('Konfigurasi program supervisi berhasil disimpan.', 'success');
  };

  const handlePrint = () => {
    triggerBrowserPrint(
      null,
      `Program_Supervisi_${schoolConfig.schoolName.replace(/\s+/g, '_')}`,
      (opened) => {
        if (!opened) setShowPrintFallbackModal(true);
      },
    );
    setShowPrintFallbackModal(true);
  };

  const handleDownloadPdf = async () => {
    setIsExportingPdf(true);
    try {
      const ok = await exportProgramPdf(
        buildPayload(),
        `Program_Supervisi_${schoolConfig.schoolName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
      );
      if (ok) {
        showToast('Berkas PDF Program Supervisi (A4) berhasil diunduh.', 'success');
      } else {
        showToast('Gagal membuat dokumen PDF Program Supervisi.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Terjadi kesalahan teknis saat mengekspor PDF.', 'error');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleDownloadWord = () => {
    exportProgramWord(
      buildPayload(),
      `Program_Supervisi_${schoolConfig.schoolName.replace(/[^a-zA-Z0-9]/g, '_')}.doc`,
    );
    showToast('Dokumen Word (.doc) Program Supervisi berhasil diunduh.', 'success');
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      showToast('Ukuran berkas maksimal 8 MB.', 'error');
      return;
    }
    setIsReadingFile(true);
    const reader = new FileReader();
    reader.onload = () => {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'pdf';
      const uploaded: UploadedProgramFile = {
        id: `prog-${Date.now()}`,
        name: file.name,
        size: file.size,
        type: file.type,
        extension: ext,
        dataUrl: String(reader.result || ''),
        uploadedAt: new Date().toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }),
      };
      saveUploadedProgramFile(uploaded);
      setUploadedFile(uploaded);
      setViewMode('uploaded');
      setShowUploadModal(false);
      setIsReadingFile(false);
      showToast(`Dokumen "${file.name}" berhasil diunggah & disimpan.`, 'success');
    };
    reader.onerror = () => {
      setIsReadingFile(false);
      showToast('Gagal membaca berkas unggahan.', 'error');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleDownloadUploaded = () => {
    if (!uploadedFile) return;
    const link = document.createElement('a');
    link.href = uploadedFile.dataUrl;
    link.download = uploadedFile.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleConfirmDeleteUploaded = () => {
    saveUploadedProgramFile(null);
    setUploadedFile(null);
    setViewMode('template');
    setShowDeleteConfirmModal(false);
    showToast('Dokumen unggahan berhasil dihapus.', 'success');
  };

  const isPdfUploaded = uploadedFile?.extension === 'pdf';
  const formattedToday = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="no-print flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <h2 className="text-xl font-display font-bold text-gray-900">
            Program &amp; Panduan Supervisi Akademik
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {schoolConfig.schoolName} • {schoolConfig.authorityName} • Tahun Pelajaran{' '}
            {schoolConfig.academicYear.replace('/', ' / ')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-500/20 transition-all cursor-pointer"
            title="Buka dialog cetak dokumen format A4"
          >
            <Printer size={15} />
            <span>CETAK DOKUMEN (A4)</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isExportingPdf}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
            title="Unduh file PDF resmi A4 langsung ke perangkat"
          >
            {isExportingPdf ? (
              <Loader2 size={14} className="animate-spin text-emerald-600" />
            ) : (
              <Download size={14} className="text-emerald-700" />
            )}
            <span>UNDUH PDF A4</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadWord}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-300 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
            title="Unduh dokumen program dalam format Microsoft Word (.doc)"
          >
            <FileText size={14} className="text-blue-700" />
            <span>UNDUH WORD (.DOC)</span>
          </button>

          <button
            type="button"
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
            title="Unggah berkas program mandiri format PDF atau Word"
          >
            <Upload size={14} />
            <span>UNGGAH BERKAS</span>
          </button>
        </div>
      </div>

      {notice && (
        <div
          className={`no-print p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between border ${
            notice.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <span className="flex items-center gap-2">
            <CheckCircle2 size={15} />
            <span>{notice.text}</span>
          </span>
          <button type="button" onClick={() => setNotice(null)} className="cursor-pointer">
            <X size={14} />
          </button>
        </div>
      )}

      <div className="no-print bg-white p-3 rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setViewMode('template')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'template'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            <FileText size={15} />
            <span>Format Template Resmi SI PERAK</span>
          </button>

          {uploadedFile && (
            <button
              type="button"
              onClick={() => setViewMode('uploaded')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'uploaded'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              <FileUp size={15} />
              <span>Dokumen Unggahan ({uploadedFile.extension.toUpperCase()})</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => setShowCustomModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-50 hover:bg-brand-50 border border-gray-300 hover:border-brand-300 text-gray-700 hover:text-brand-800 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
          title="Buka formulir penyesuaian isi template program supervisi"
        >
          <Sliders size={14} className="text-brand-600" />
          <span>Kustomisasi Form &amp; Template</span>
        </button>
      </div>

      {viewMode === 'template' && (
        <div className="no-print space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-500 px-1">
            <span className="font-semibold text-gray-700 flex items-center gap-1.5">
              <Layers size={14} className="text-brand-600" /> Pilihan Format Template Program
              Supervisi:
            </span>
            <span className="text-[11px]">Klik untuk beralih format secara langsung</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {PROGRAM_TEMPLATE_OPTIONS.map((opt) => {
              const active = templateConfig.templateId === opt.id;
              return (
                <div
                  key={opt.id}
                  onClick={() => handleSelectTemplate(opt.id)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer text-left flex flex-col justify-between ${
                    active
                      ? 'bg-brand-50/70 border-brand-500 shadow-sm ring-1 ring-brand-500/30'
                      : 'bg-white hover:bg-gray-50 border-gray-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                          active ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {opt.badge}
                      </span>
                      {active && <CheckCircle2 size={15} className="text-brand-600" />}
                    </div>
                    <h4 className="font-bold text-xs text-gray-900 leading-snug">{opt.title}</h4>
                    <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">{opt.desc}</p>
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-gray-100 text-[10px] font-semibold text-brand-700">
                    {active ? '✓ Aktif Digunakan' : 'Pilih Template Ini'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {uploadedFile && viewMode === 'uploaded' ? (
        <div className="no-print bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden p-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-gray-100">
            <div className="flex items-center gap-3.5">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 font-black text-sm ${
                  isPdfUploaded
                    ? 'bg-rose-100 text-rose-700 border border-rose-200'
                    : 'bg-blue-100 text-blue-700 border border-blue-200'
                }`}
              >
                {uploadedFile.extension.toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-gray-900 break-all">
                    {uploadedFile.name}
                  </h3>
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-bold">
                    Tersimpan Permanen
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Ukuran:{' '}
                  <strong className="text-gray-700">{formatFileSize(uploadedFile.size)}</strong> •
                  Diunggah pada: {uploadedFile.uploadedAt}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleDownloadUploaded}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                <Download size={14} />
                <span>UNDUH DOKUMEN</span>
              </button>

              {isPdfUploaded && (
                <button
                  type="button"
                  onClick={() => setShowFullscreenPdf(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  <Eye size={14} />
                  <span>LAYAR PENUH</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowUploadModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <RefreshCw size={14} />
                <span>GANTI BERKAS</span>
              </button>

              <button
                type="button"
                onClick={() => setShowDeleteConfirmModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <Trash2 size={14} />
                <span>HAPUS</span>
              </button>
            </div>
          </div>

          {isPdfUploaded ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span className="font-semibold text-gray-700 flex items-center gap-1.5">
                  <Eye size={14} className="text-brand-600" /> Pratinjau Dokumen PDF Terunggah
                </span>
                <span>Gunakan kontrol viewer untuk zoom, scroll, atau cetak</span>
              </div>
              <div className="w-full h-[750px] bg-gray-100 rounded-2xl border border-gray-200 overflow-hidden shadow-inner">
                <iframe
                  src={uploadedFile.dataUrl}
                  title={uploadedFile.name}
                  className="w-full h-full border-0"
                />
              </div>
            </div>
          ) : (
            <div className="p-8 bg-blue-50/50 border border-blue-200 rounded-2xl text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center mx-auto shadow-sm">
                <FileText size={32} />
              </div>
              <div className="max-w-md mx-auto space-y-1.5">
                <h4 className="font-bold text-gray-900 text-base">
                  Dokumen Microsoft Word ({uploadedFile.extension.toUpperCase()})
                </h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Berkas <strong>{uploadedFile.name}</strong> telah tersimpan aman di sistem. Klik
                  tombol &quot;UNDUH DOKUMEN&quot; di atas untuk membuka atau menyunting di aplikasi
                  Word.
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-8 sm:p-12 space-y-8 print-document-container">
          <div className="text-center border-b-2 border-black pb-4">
            <h3 className="text-base sm:text-lg font-display font-bold uppercase tracking-wide text-gray-900">
              {schoolConfig.parentGovUpper}
            </h3>
            <h3 className="text-base sm:text-lg font-display font-bold uppercase tracking-wide text-gray-900">
              DINAS PENDIDIKAN
            </h3>
            <h4 className="text-sm sm:text-base font-display font-bold uppercase tracking-wide text-gray-800">
              {schoolConfig.kopAuthority}
            </h4>
            <h2 className="text-lg sm:text-xl font-display font-black uppercase tracking-tight text-gray-900 mt-1">
              {schoolConfig.schoolName.toUpperCase()}
            </h2>
            {schoolConfig.schoolAddress && (
              <p className="text-[11px] text-gray-600 italic mt-0.5">
                {schoolConfig.schoolAddress} • NPSN: {schoolConfig.schoolNpsn}
              </p>
            )}
          </div>

          <div className="text-center space-y-2 border-b border-gray-200 pb-6">
            <span className="px-3 py-1 bg-brand-50 text-brand-700 rounded-full text-[10px] font-bold uppercase tracking-widest border border-brand-200">
              TAHUN PELAJARAN {schoolConfig.academicYear.replace('/', ' / ')} •{' '}
              {templateConfig.semester.toUpperCase()}
            </span>
            <h2 className="text-xl sm:text-2xl font-display font-black text-gray-900 uppercase tracking-tight">
              {templateConfig.templateId === 'deep-learning' &&
                'PROGRAM SUPERVISI PEMBELAJARAN MENDALAM (DEEP LEARNING)'}
              {templateConfig.templateId === 'diferensiasi' &&
                'PROGRAM SUPERVISI PEMBELAJARAN BERDIFERENSIASI & DISIPLIN POSITIF'}
              {templateConfig.templateId === 'matriks-rpa' &&
                'MATRIKS RENCANA PENGAWASAN AKADEMIK (RPA) TAHUNAN'}
              {templateConfig.templateId === 'klinis-standar' &&
                'PROGRAM SUPERVISI AKADEMIK KLINIS KURIKULUM NASIONAL'}
            </h2>
            <p className="text-xs text-gray-600 font-medium max-w-2xl mx-auto">
              {templateConfig.fokusProgram}
            </p>
          </div>

          <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200 space-y-3 avoid-break">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
              <Building2 size={14} className="text-brand-600" /> Identitas Satuan Pendidikan &amp;
              Kepengawasan
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-gray-200/60">
                <span className="text-gray-500">Satuan Pendidikan:</span>
                <strong className="text-gray-900 font-semibold">{schoolConfig.schoolName}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-200/60">
                <span className="text-gray-500">Jenjang Pendidikan / NPSN:</span>
                <strong className="text-gray-900 font-semibold">
                  {schoolConfig.schoolLevel} / {schoolConfig.schoolNpsn}
                </strong>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-200/60">
                <span className="text-gray-500">Instansi Pembina:</span>
                <strong className="text-gray-900 font-semibold">{schoolConfig.authorityName}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-200/60">
                <span className="text-gray-500">Tahun Pelajaran:</span>
                <strong className="text-gray-900 font-semibold">
                  {schoolConfig.academicYear.replace('/', ' / ')}
                </strong>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-200/60">
                <span className="text-gray-500">Kepala Sekolah:</span>
                <strong className="text-gray-900 font-semibold">
                  {schoolConfig.headmasterName}
                </strong>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-200/60">
                <span className="text-gray-500">Pengawas Pembina:</span>
                <strong className="text-gray-900 font-semibold">
                  {schoolConfig.supervisorName}
                </strong>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-200/60">
                <span className="text-gray-500">Waktu Pelaksanaan:</span>
                <strong className="text-gray-900 font-semibold">
                  {templateConfig.waktuPelaksanaan}
                </strong>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-200/60">
                <span className="text-gray-500">Target Capaian:</span>
                <strong className="text-gray-900 font-semibold text-right max-w-[200px] truncate">
                  {templateConfig.targetCapaian}
                </strong>
              </div>
            </div>
          </div>

          {templateConfig.templateId === 'klinis-standar' && (
            <div className="space-y-8">
              <section className="space-y-2.5">
                <h3 className="text-base font-display font-bold text-gray-900 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center text-xs font-bold">
                    1
                  </div>
                  Latar Belakang &amp; Landasan Regulasi
                </h3>
                <div className="pl-9 text-xs sm:text-sm text-gray-600 space-y-2.5">
                  <p>
                    Supervisi akademik merupakan serangkaian proses sistematis, dialogis, dan
                    berkelanjutan untuk memberdayakan guru dalam meningkatkan kualitas pembelajaran di{' '}
                    <strong>{schoolConfig.schoolName}</strong> binaan{' '}
                    <strong>{schoolConfig.authorityName}</strong>.
                  </p>
                  <p>
                    Berdasarkan regulasi Kurikulum Nasional, supervisi klinis dilaksanakan melalui
                    paradigma kemitraan (non-judgmental). Supervisi diposisikan sebagai ruang refleksi
                    bersama agar guru merasa aman mengeksplorasi strategi pedagogik mutakhir yang
                    berorientasi pada pencapaian murid.
                  </p>
                </div>
              </section>

              <section className="space-y-2.5">
                <h3 className="text-base font-display font-bold text-gray-900 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center text-xs font-bold">
                    2
                  </div>
                  Tujuan &amp; Sasaran Program Supervisi
                </h3>
                <div className="pl-9">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    {[
                      {
                        title: 'Pengembangan Pedagogik',
                        desc: 'Mendampingi guru menyusun modul ajar berdiferensiasi dan instrumen asesmen bermakna.',
                      },
                      {
                        title: 'Pembelajaran Interaktif',
                        desc: 'Mendorong partisipasi aktif, nalar kritis, dan keterlibatan emosional murid dalam belajar.',
                      },
                      {
                        title: 'Refleksi Terbimbing',
                        desc: 'Membudayakan refleksi pasca-pembelajaran untuk menemukan akar tantangan dan solusi mandiri.',
                      },
                      {
                        title: 'Rencana Tindak Lanjut Terarah',
                        desc: 'Menyediakan program coaching, mentoring, dan komunitas belajar (Kombel) yang berkelanjutan.',
                      },
                    ].map((item) => (
                      <div
                        key={item.title}
                        className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl space-y-1"
                      >
                        <div className="flex items-center gap-2 text-brand-700 font-bold">
                          <CheckCircle2 size={15} />
                          <span>{item.title}</span>
                        </div>
                        <p className="text-gray-600 pl-6 leading-relaxed">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <section className="space-y-2.5">
                <h3 className="text-base font-display font-bold text-gray-900 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center text-xs font-bold">
                    3
                  </div>
                  Lima Alur Siklus Supervisi Klinis
                </h3>
                <div className="pl-9 grid grid-cols-1 sm:grid-cols-5 gap-2 text-center text-xs">
                  {[
                    { step: '01', name: 'Pra-Observasi', sub: 'Penyelarasan target & modul ajar' },
                    { step: '02', name: 'Observasi Kelas', sub: 'Pengamatan berbasis rubrik objektif' },
                    { step: '03', name: 'Telaah Dokumen', sub: 'Verifikasi kelengkapan perangkat' },
                    { step: '04', name: 'Pasca-Observasi', sub: 'Refleksi dialogis & umpan balik' },
                    { step: '05', name: 'Tindak Lanjut (RTL)', sub: 'Coaching / mentoring terencana' },
                  ].map((s) => (
                    <div
                      key={s.step}
                      className="p-3 bg-white border border-gray-200 rounded-xl space-y-1 shadow-2xs"
                    >
                      <span className="text-[10px] font-black text-brand-600 bg-brand-50 px-2 py-0.5 rounded-md">
                        Tahap {s.step}
                      </span>
                      <h5 className="font-bold text-gray-900 text-xs mt-1">{s.name}</h5>
                      <p className="text-[10px] text-gray-500 leading-tight">{s.sub}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {templateConfig.templateId === 'deep-learning' && (
            <div className="space-y-8">
              <section className="space-y-2.5">
                <h3 className="text-base font-display font-bold text-gray-900 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center text-xs font-bold">
                    1
                  </div>
                  Filosofi &amp; Transformasi Deep Learning
                </h3>
                <div className="pl-9 text-xs sm:text-sm text-gray-600 space-y-2.5">
                  <p>
                    Pembelajaran Mendalam (<em>Deep Learning</em>) menempatkan murid sebagai subjek
                    pembelajar yang aktif mengkonstruksi pemahaman secara mendalam, bukan sekadar
                    menghafal konten permukaan. Supervisi akademik di{' '}
                    <strong>{schoolConfig.schoolName}</strong> ditujukan untuk menumbuhkan 3 pilar
                    utama: <strong>Mindful</strong>, <strong>Meaningful</strong>, dan{' '}
                    <strong>Joyful Learning</strong>.
                  </p>
                </div>
              </section>

              <section className="space-y-2.5">
                <h3 className="text-base font-display font-bold text-gray-900 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center text-xs font-bold">
                    2
                  </div>
                  Tiga Dimensi Pendampingan Guru
                </h3>
                <div className="pl-9 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-4 bg-indigo-50/50 border border-indigo-200 rounded-xl space-y-1.5">
                    <span className="font-bold text-indigo-900 text-sm block">
                      1. Mindful Learning
                    </span>
                    <p className="text-gray-600 leading-relaxed">
                      Membimbing guru menghadirkan atensi penuh murid, menumbuhkan rasa ingin tahu,
                      dan menciptakan suasana kelas yang aman secara psikologis.
                    </p>
                  </div>
                  <div className="p-4 bg-purple-50/50 border border-purple-200 rounded-xl space-y-1.5">
                    <span className="font-bold text-purple-900 text-sm block">
                      2. Meaningful Learning
                    </span>
                    <p className="text-gray-600 leading-relaxed">
                      Menghubungkan konsep pelajaran dengan kehidupan nyata, problem solving
                      kontekstual, dan penguatan nilai karakter luhur.
                    </p>
                  </div>
                  <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-1.5">
                    <span className="font-bold text-emerald-900 text-sm block">
                      3. Joyful Learning
                    </span>
                    <p className="text-gray-600 leading-relaxed">
                      Mendesain aktivitas belajar yang dinamis, kolaboratif, memantik kegembiraan
                      berpikir, dan merayakan proses bertumbuh murid.
                    </p>
                  </div>
                </div>
              </section>
            </div>
          )}

          {templateConfig.templateId === 'diferensiasi' && (
            <div className="space-y-8">
              <section className="space-y-2.5">
                <h3 className="text-base font-display font-bold text-gray-900 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center text-xs font-bold">
                    1
                  </div>
                  Landasan Pembelajaran Berdiferensiasi
                </h3>
                <div className="pl-9 text-xs sm:text-sm text-gray-600 space-y-2.5">
                  <p>
                    Keberagaman murid dalam kesiapan belajar, gaya belajar, dan minat membutuhkan
                    respons pedagogik yang fleksibel. Supervisi diferensiasi memfasilitasi pendidik
                    di <strong>{schoolConfig.schoolName}</strong> untuk memetakan kebutuhan awal
                    belajar serta menyusun skenario yang adil bagi seluruh murid.
                  </p>
                </div>
              </section>

              <section className="space-y-2.5">
                <h3 className="text-base font-display font-bold text-gray-900 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center text-xs font-bold">
                    2
                  </div>
                  Tiga Ranah Supervisi Diferensiasi &amp; Budaya Positif
                </h3>
                <div className="pl-9 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-1">
                    <strong className="text-emerald-900 block font-bold">
                      Diferensiasi Konten &amp; Bahan
                    </strong>
                    <p className="text-gray-600 leading-relaxed">
                      Penyediaan ragam format bahan ajar (teks, audio, infografis, manipulatif)
                      sesuai kesiapan murid.
                    </p>
                  </div>
                  <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-1">
                    <strong className="text-emerald-900 block font-bold">
                      Diferensiasi Proses Belajar
                    </strong>
                    <p className="text-gray-600 leading-relaxed">
                      Pengelompokan fleksibel, scaffolding terukur, dan pendampingan bertingkat bagi
                      siswa yang butuh bantuan ekstra.
                    </p>
                  </div>
                  <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-1">
                    <strong className="text-emerald-900 block font-bold">
                      Budaya &amp; Disiplin Positif
                    </strong>
                    <p className="text-gray-600 leading-relaxed">
                      Penerapan keyakinan kelas, segitiga restitusi, dan penumbuhan motivasi
                      intrinsik tanpa hukuman.
                    </p>
                  </div>
                </div>
              </section>
            </div>
          )}

          {templateConfig.templateId === 'matriks-rpa' && (
            <div className="space-y-6">
              <section className="space-y-2.5">
                <h3 className="text-base font-display font-bold text-gray-900 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center text-xs font-bold">
                    1
                  </div>
                  Matriks Rencana Kerja Pengawasan Akademik Terpadu
                </h3>
                <div className="pl-9 overflow-x-auto">
                  <table className="w-full text-left border-collapse border border-black text-xs">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border border-black px-3 py-2 text-center w-8">No</th>
                        <th className="border border-black px-3 py-2">Siklus Kegiatan</th>
                        <th className="border border-black px-3 py-2">Tujuan Pengawasan</th>
                        <th className="border border-black px-3 py-2">Instrumen &amp; Metode</th>
                        <th className="border border-black px-3 py-2">Sasaran &amp; Waktu</th>
                        <th className="border border-black px-3 py-2">Output / Bukti Fisik</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black">
                      <tr>
                        <td className="border border-black px-3 py-2 text-center font-bold">1</td>
                        <td className="border border-black px-3 py-2 font-bold">
                          Pra-Observasi (Persiapan)
                        </td>
                        <td className="border border-black px-3 py-2">
                          Penyelarasan modul ajar, asesmen awal, dan target indikator observasi.
                        </td>
                        <td className="border border-black px-3 py-2">
                          Wawancara Pra-Obs &amp; Telaah Modul
                        </td>
                        <td className="border border-black px-3 py-2">
                          Semua Guru (Awal Semester)
                        </td>
                        <td className="border border-black px-3 py-2">
                          Formulir Pra-Obs &amp; Kesepakatan Jadwal
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-black px-3 py-2 text-center font-bold">2</td>
                        <td className="border border-black px-3 py-2 font-bold">
                          Observasi Kelas Terstruktur
                        </td>
                        <td className="border border-black px-3 py-2">
                          Pengamatan pelaksanaan pembelajaran aktif dan keaktifan murid.
                        </td>
                        <td className="border border-black px-3 py-2">
                          Rubrik Observasi Kelas (Skor 1-4)
                        </td>
                        <td className="border border-black px-3 py-2">
                          Guru Terjadwal (Sesuai Matriks)
                        </td>
                        <td className="border border-black px-3 py-2">
                          Lembar Skor &amp; Catatan Lapangan
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-black px-3 py-2 text-center font-bold">3</td>
                        <td className="border border-black px-3 py-2 font-bold">
                          Pasca-Observasi (Refleksi)
                        </td>
                        <td className="border border-black px-3 py-2">
                          Refleksi dialogis atas pencapaian target dan analisis kendala mengajar.
                        </td>
                        <td className="border border-black px-3 py-2">
                          Form Refleksi Klinis Dialogis
                        </td>
                        <td className="border border-black px-3 py-2">
                          Guru Disupervisi (H+1)
                        </td>
                        <td className="border border-black px-3 py-2">
                          Catatan Refleksi &amp; Umpan Balik
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-black px-3 py-2 text-center font-bold">4</td>
                        <td className="border border-black px-3 py-2 font-bold">
                          Rencana Tindak Lanjut (RTL)
                        </td>
                        <td className="border border-black px-3 py-2">
                          Rekomendasi pembinaan, coaching, mentoring, atau Kombel sekolah.
                        </td>
                        <td className="border border-black px-3 py-2">
                          Matriks RTL &amp; Coaching
                        </td>
                        <td className="border border-black px-3 py-2">
                          Guru Sasaran (Berkelanjutan)
                        </td>
                        <td className="border border-black px-3 py-2">
                          Laporan RTL &amp; Evaluasi Kinerja
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}

          <section className="space-y-2.5 avoid-break">
            <h3 className="text-base font-display font-bold text-gray-900 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center text-xs font-bold">
                IV
              </div>
              Daftar Guru Sasaran Supervisi ({schoolConfig.schoolName})
            </h3>
            <div className="pl-9 overflow-x-auto">
              <table className="w-full text-left border-collapse border border-gray-300 text-xs">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border border-gray-300 px-3 py-2 text-center w-8">No</th>
                    <th className="border border-gray-300 px-3 py-2">Nama Lengkap Guru</th>
                    <th className="border border-gray-300 px-3 py-2">NIP</th>
                    <th className="border border-gray-300 px-3 py-2">Mata Pelajaran</th>
                    <th className="border border-gray-300 px-3 py-2 text-center">Jenjang</th>
                  </tr>
                </thead>
                <tbody>
                  {gurus.length > 0 ? (
                    gurus.map((g, idx) => (
                      <tr key={g.id}>
                        <td className="border border-gray-300 px-3 py-1.5 text-center font-semibold">
                          {idx + 1}
                        </td>
                        <td className="border border-gray-300 px-3 py-1.5 font-bold text-gray-900">
                          {g.nama}
                        </td>
                        <td className="border border-gray-300 px-3 py-1.5 font-mono text-[11px]">
                          {g.nip || '-'}
                        </td>
                        <td className="border border-gray-300 px-3 py-1.5">{g.mapel}</td>
                        <td className="border border-gray-300 px-3 py-1.5 text-center">
                          {g.jenjang || schoolConfig.schoolLevel}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={5}
                        className="border border-gray-300 px-3 py-4 text-center italic text-gray-500"
                      >
                        Seluruh Dewan Guru Mata Pelajaran terdaftar pada {schoolConfig.schoolName}.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {templateConfig.catatanPengawas && (
            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 text-xs text-amber-950 avoid-break">
              <strong className="uppercase tracking-wider text-[10px] text-amber-800 block mb-1">
                Arahan &amp; Catatan Pengawas Pembina:
              </strong>
              <p className="leading-relaxed italic">{templateConfig.catatanPengawas}</p>
            </div>
          )}

          <div className="pt-4 avoid-break border-t border-gray-200 text-xs">
            <p className="text-right mb-6 text-gray-700">Bojonegoro, {formattedToday}</p>
            <div className="grid grid-cols-2 gap-8 text-center">
              <div className="space-y-16">
                <div>
                  <p>Mengetahui,</p>
                  <p className="font-bold text-gray-900">Kepala {schoolConfig.schoolName}</p>
                </div>
                <div>
                  <p className="font-bold underline text-gray-900">{schoolConfig.headmasterName}</p>
                  <p className="text-gray-600">NIP. {schoolConfig.headmasterNip || '-'}</p>
                </div>
              </div>
              <div className="space-y-16">
                <div>
                  <p>Disahkan Oleh,</p>
                  <p className="font-bold text-gray-900">
                    Pengawas {schoolConfig.schoolLevel} {schoolConfig.authorityName}
                  </p>
                </div>
                <div>
                  <p className="font-bold underline text-gray-900">{schoolConfig.supervisorName}</p>
                  <p className="text-gray-600">NIP. {schoolConfig.supervisorNip || '-'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center text-[10px] text-gray-400 avoid-break">
            <span>SI PERAK • Program Kerja Supervisi Akademik</span>
            <span className="font-semibold text-gray-600">
              Hak Cipta © {DEFAULT_SUPERVISOR_NAME} ({schoolConfig.authorityName})
            </span>
          </div>
        </div>
      )}

      {showPrintFallbackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-xs no-print">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center">
                  <Info size={18} />
                </div>
                <h3 className="font-bold text-gray-900 text-sm">Cetak / Unduh Dokumen</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPrintFallbackModal(false)}
                className="text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Dialog cetak peramban telah dipicu. Jika peramban memblokir pratinjau cetak di dalam
              iframe, Anda dapat mengunduh berkas PDF atau Word langsung di bawah ini:
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  handleDownloadPdf();
                  setShowPrintFallbackModal(false);
                }}
                className="p-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl text-left flex flex-col justify-between transition-all cursor-pointer group"
              >
                <div>
                  <Download
                    size={22}
                    className="mb-2 text-emerald-700 group-hover:scale-110 transition-transform"
                  />
                  <h4 className="font-bold text-sm">Unduh File PDF</h4>
                  <p className="text-[11px] text-emerald-700/80 mt-1">
                    Unduh berkas PDF A4 langsung ke komputer.
                  </p>
                </div>
                <span className="text-[10px] font-bold text-emerald-800 mt-3 underline">
                  Unduh PDF →
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  handleDownloadWord();
                  setShowPrintFallbackModal(false);
                }}
                className="p-4 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-300 rounded-xl text-left flex flex-col justify-between transition-all cursor-pointer group"
              >
                <div>
                  <FileText
                    size={22}
                    className="mb-2 text-blue-700 group-hover:scale-110 transition-transform"
                  />
                  <h4 className="font-bold text-sm">Unduh File Word</h4>
                  <p className="text-[11px] text-blue-700/80 mt-1">
                    Format .doc yang dapat diedit di Microsoft Word.
                  </p>
                </div>
                <span className="text-[10px] font-bold text-blue-800 mt-3 underline">
                  Unduh Word →
                </span>
              </button>
            </div>
            <div className="flex justify-end pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowPrintFallbackModal(false)}
                className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-all cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs no-print">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-gray-200 overflow-hidden space-y-4 p-6">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <Upload size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">
                    Unggah Dokumen Program Supervisi
                  </h3>
                  <p className="text-xs text-gray-500">
                    Mendukung berkas format PDF (.pdf) dan Word (.doc, .docx)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="p-1.5 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileUpload}
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/40 hover:bg-emerald-50/70 p-8 rounded-2xl text-center cursor-pointer transition-all space-y-3"
            >
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
                <UploadCloud size={28} />
              </div>
              <div>
                <p className="font-bold text-gray-800 text-sm">
                  Klik di sini untuk memilih berkas dari komputer
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Format yang didukung: <strong>.pdf</strong>, <strong>.doc</strong>,{' '}
                  <strong>.docx</strong> (Maks. 8 MB)
                </p>
              </div>
              <span className="inline-block px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs">
                {isReadingFile ? 'Sedang Memproses...' : 'Pilih Berkas Sekarang'}
              </span>
            </div>

            {uploadedFile && (
              <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5 truncate max-w-[320px]">
                  <FileText size={16} className="text-brand-600 shrink-0" />
                  <span className="font-semibold text-gray-800 truncate">{uploadedFile.name}</span>
                </div>
                <span className="text-[10px] text-gray-400 shrink-0">
                  {formatFileSize(uploadedFile.size)}
                </span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-all cursor-pointer"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs no-print">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl border border-gray-200 overflow-hidden space-y-4 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center">
                  <Sliders size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">
                    Kustomisasi Form &amp; Template Program
                  </h3>
                  <p className="text-xs text-gray-500">
                    Sesuaikan judul, fokus, periode, dan target kinerja supervisi
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCustomModal(false)}
                className="p-1.5 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="block font-bold text-gray-800 text-xs">
                Pilih Format Template Resmi
              </label>
              <div className="grid grid-cols-2 gap-2">
                {PROGRAM_TEMPLATE_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() =>
                      setTemplateConfig({
                        ...templateConfig,
                        templateId: opt.id,
                        fokusProgram: PROGRAM_TEMPLATE_DEFAULTS[opt.id].fokus,
                        targetCapaian: PROGRAM_TEMPLATE_DEFAULTS[opt.id].target,
                        waktuPelaksanaan: PROGRAM_TEMPLATE_DEFAULTS[opt.id].waktu,
                      })
                    }
                    className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                      templateConfig.templateId === opt.id
                        ? 'bg-brand-50 border-brand-500 font-bold text-brand-900'
                        : 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700'
                    }`}
                  >
                    <span className="block truncate">{opt.title}</span>
                    <span className="text-[10px] text-gray-400 font-normal">{opt.badge}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs pt-1">
              <div className="md:col-span-2">
                <label className="block font-bold text-gray-700 mb-1">
                  Fokus / Tema Khusus Supervisi
                </label>
                <input
                  type="text"
                  value={templateConfig.fokusProgram}
                  onChange={(e) =>
                    setTemplateConfig({ ...templateConfig, fokusProgram: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-brand-500 focus:outline-none"
                  placeholder="Contoh: Optimalisasi Pembelajaran Mendalam & Kurikulum Nasional"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Periode / Semester Pelaksanaan
                </label>
                <select
                  value={templateConfig.semester}
                  onChange={(e) =>
                    setTemplateConfig({ ...templateConfig, semester: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-brand-500 focus:outline-none"
                >
                  <option value="Semester Ganjil & Genap">
                    Semester Ganjil &amp; Genap (Sepanjang Tahun)
                  </option>
                  <option value="Semester Ganjil">Semester Ganjil Saja</option>
                  <option value="Semester Genap">Semester Genap Saja</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Alokasi Waktu Pelaksanaan
                </label>
                <input
                  type="text"
                  value={templateConfig.waktuPelaksanaan}
                  onChange={(e) =>
                    setTemplateConfig({ ...templateConfig, waktuPelaksanaan: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-brand-500 focus:outline-none"
                  placeholder="Contoh: Juli 2026 s.d. Juni 2027"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-bold text-gray-700 mb-1">
                  Target Capaian Kinerja Guru
                </label>
                <input
                  type="text"
                  value={templateConfig.targetCapaian}
                  onChange={(e) =>
                    setTemplateConfig({ ...templateConfig, targetCapaian: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-brand-500 focus:outline-none"
                  placeholder="Contoh: Minimal 85% guru mencapai predikat Baik atau Sangat Baik"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-bold text-gray-700 mb-1">
                  Catatan &amp; Arahan Khusus Pengawas Pembina
                </label>
                <textarea
                  rows={2}
                  value={templateConfig.catatanPengawas}
                  onChange={(e) =>
                    setTemplateConfig({ ...templateConfig, catatanPengawas: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-brand-500 focus:outline-none resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowCustomModal(false)}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveCustomTemplate}
                className="px-5 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md shadow-brand-500/20 cursor-pointer"
              >
                Terapkan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-xs no-print">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-gray-100 text-center space-y-4">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 text-base">Hapus Dokumen Unggahan?</h4>
              <p className="text-xs text-gray-500 mt-1">
                Berkas program supervisi yang diunggah akan dihapus dan tampilan kembali ke template
                resmi.
              </p>
            </div>
            <div className="flex justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirmModal(false)}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteUploaded}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {showFullscreenPdf && uploadedFile && isPdfUploaded && (
        <div className="fixed inset-0 z-50 bg-gray-950/85 backdrop-blur-sm flex flex-col p-4 no-print">
          <div className="flex items-center justify-between text-white pb-3">
            <h4 className="text-sm font-bold truncate">{uploadedFile.name}</h4>
            <button
              type="button"
              onClick={() => setShowFullscreenPdf(false)}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <X size={15} />
              <span>Tutup Layar Penuh</span>
            </button>
          </div>
          <iframe
            src={uploadedFile.dataUrl}
            title={uploadedFile.name}
            className="flex-1 w-full bg-white rounded-2xl border-0"
          />
        </div>
      )}
    </div>
  );
}
