import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Download,
  FileText,
  Info,
  Loader2,
  MapPin,
  Printer,
  Sparkles,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { DEMO_GURU, createDemoSupervision } from '../../constants/school';
import { useRubricConfig } from '../../hooks/useRubricConfig';
import { useSchoolConfig } from '../../hooks/useSchoolConfig';
import { generateSupervisionAnalysis } from '../../services/aiService';
import type {
  ActiveTab,
  Guru,
  SupervisionInstrument,
  SupervisionSession,
  ToastNotice,
} from '../../types/supervision';
import { exportSupervisionPdf, triggerBrowserPrint } from '../../utils/exportPdf';
import { exportSupervisionWord } from '../../utils/exportWord';
import { calculateScoreStats } from '../../utils/score';
import ReportPreview from '../common/ReportPreview';

interface LaporanHasilProps {
  gurus: Guru[];
  supervisions: SupervisionSession[];
  setActiveTab: (tab: ActiveTab) => void;
  selectedSupervisiId: string | null;
  setSelectedSupervisiId: (id: string | null) => void;
  onAddSupervision?: (session: SupervisionSession) => void;
  onAddGuru?: (guru: Guru, openImmediately?: boolean) => void;
}

export default function LaporanHasil({
  gurus,
  supervisions,
  setActiveTab,
  selectedSupervisiId,
  setSelectedSupervisiId,
  onAddSupervision,
  onAddGuru,
}: LaporanHasilProps) {
  const [selectedId, setSelectedId] = useState<string | null>(
    () => selectedSupervisiId || supervisions[0]?.id || null,
  );
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [showPrintFallbackModal, setShowPrintFallbackModal] = useState(false);
  const [notice, setNotice] = useState<ToastNotice | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  const printRef = useRef<HTMLDivElement>(null);
  const { config: schoolConfig } = useSchoolConfig();
  const { rubricSections, instrumentTitle } = useRubricConfig();

  const demoSession = useMemo(() => createDemoSupervision(), []);

  useEffect(() => {
    if (selectedSupervisiId && supervisions.some((sv) => sv.id === selectedSupervisiId)) {
      setSelectedId(selectedSupervisiId);
      return;
    }
    if (supervisions.length > 0 && (!selectedId || !supervisions.some((sv) => sv.id === selectedId))) {
      setSelectedId(supervisions[0].id);
    }
  }, [supervisions, selectedSupervisiId, selectedId]);

  const isDemoMode = supervisions.length === 0;
  const activeSession: SupervisionSession =
    !isDemoMode && selectedId
      ? supervisions.find((sv) => sv.id === selectedId) || supervisions[0]
      : demoSession;

  const activeGuru: Guru = isDemoMode
    ? DEMO_GURU
    : gurus.find((g) => g.id === activeSession.instrument.guruId) || {
        id: activeSession.instrument.guruId,
        nama: activeSession.instrument.namaGuru || 'Guru Mata Pelajaran',
        nip: activeSession.instrument.nipGuru || '-',
        pangkat: '-',
        mapel: activeSession.instrument.mapel || '-',
        status: 'ASN',
      };

  const scoreStats = useMemo(
    () => calculateScoreStats(activeSession.instrument.obsScores || {}),
    [activeSession.instrument.obsScores],
  );

  const handleDownloadPdf = async () => {
    setIsExportingPdf(true);
    setNotice({ text: 'Menyiapkan berkas PDF resmi (A4)...', type: 'info' });
    const safeName = (activeGuru.nama || 'Guru').replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `Laporan_Supervisi_${safeName}.pdf`;
    try {
      await exportSupervisionPdf({
        instrument: activeSession.instrument,
        guru: activeGuru,
        stats: scoreStats,
        rubricSections,
        instrumentTitle,
        filename,
        onStatusChange: (status) => {
          if (status.state === 'success') {
            setNotice({
              text: status.message || 'Berkas PDF berhasil diunduh ke perangkat Anda.',
              type: 'success',
            });
          } else if (status.state === 'error') {
            setNotice({
              text: status.message || 'Gagal membuat berkas PDF.',
              type: 'error',
            });
          } else if (status.state === 'processing') {
            setNotice({
              text: status.message || 'Memproses berkas PDF...',
              type: 'info',
            });
          }
        },
      });
    } catch (err) {
      console.error('Error generating PDF:', err);
      setNotice({ text: 'Terjadi kendala saat merender PDF.', type: 'error' });
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleDownloadWord = () => {
    exportSupervisionWord(
      activeSession.instrument,
      activeGuru,
      scoreStats,
      rubricSections,
      instrumentTitle,
    );
    setNotice({
      text: `Dokumen Word (.doc) untuk "${activeGuru.nama || 'Guru'}" berhasil diunduh.`,
      type: 'success',
    });
  };

  const handlePrint = () => {
    setIsPrinting(true);
    setNotice({ text: 'Membuka dialog cetak...', type: 'info' });
    const targetEl = printRef.current || document.getElementById('laporan-supervisi-print-area');
    const safeName = (activeGuru.nama || 'Guru').replace(/[^a-zA-Z0-9]/g, '_');
    triggerBrowserPrint(targetEl, `Laporan_Supervisi_${safeName}`, () => {
      setIsPrinting(false);
    });
    setShowPrintFallbackModal(true);
  };

  const handleSaveDemoToDatabase = () => {
    onAddGuru?.(DEMO_GURU);
    onAddSupervision?.(demoSession);
    setSelectedId(demoSession.id);
    setNotice({
      text: 'Data contoh berhasil disimpan ke database supervisi sekolah.',
      type: 'success',
    });
  };

  const handleGenerateAiReport = async () => {
    setIsGeneratingAi(true);
    setNotice({
      text: 'Sedang menganalisis data supervisi & menyusun rekomendasi klinis dengan AI...',
      type: 'info',
    });
    try {
      const result = await generateSupervisionAnalysis(
        'all',
        activeSession.instrument,
        activeGuru.nama || 'Guru',
      );
      const nextInstrument: SupervisionInstrument = {
        ...activeSession.instrument,
        praAI: result.analysis || activeSession.instrument.praAI,
        obsAI: result.analysis || activeSession.instrument.obsAI,
        analysisScore: result.scoreInterpretation || activeSession.instrument.analysisScore,
        pascaAI: result.analysis || activeSession.instrument.pascaAI,
        kekuatan: result.kekuatan || activeSession.instrument.kekuatan,
        perbaikan: result.perbaikan || activeSession.instrument.perbaikan,
        rekomendasi: result.rekomendasi || activeSession.instrument.rekomendasi,
        rtl: result.rtlSuggestion
          ? { ...activeSession.instrument.rtl, ...result.rtlSuggestion }
          : activeSession.instrument.rtl,
      };
      const updatedSession: SupervisionSession = {
        ...activeSession,
        instrument: nextInstrument,
      };
      onAddSupervision?.(updatedSession);
      setNotice({
        text: `Analisis AI Kurikulum Nasional untuk "${activeGuru.nama || 'Guru'}" berhasil diperbarui ke dalam dokumen!`,
        type: 'success',
      });
    } catch (err) {
      console.error('Error generating AI report:', err);
      setNotice({
        text: err instanceof Error ? err.message : 'Gagal memproses analisis AI.',
        type: 'error',
      });
    } finally {
      setIsGeneratingAi(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 no-print bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <h2 className="text-xl font-display font-bold text-gray-900 flex items-center gap-2">
            <FileText className="text-brand-600" size={22} /> Laporan Hasil &amp; Analisis
            Supervisi Klinis
          </h2>
          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600 mt-1">
            <span className="font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-md flex items-center gap-1.5 border border-brand-200">
              <Building2 size={12} className="text-brand-600" />
              <span>{schoolConfig.schoolName}</span>
              <span className="px-1.5 py-0.5 bg-brand-200 text-brand-900 rounded text-[10px] font-black">
                {schoolConfig.schoolLevel}
              </span>
            </span>
            <span className="text-gray-400">•</span>
            <span className="text-gray-700 font-semibold bg-gray-100 px-2 py-0.5 rounded-md text-[11px]">
              {schoolConfig.authorityShort}
            </span>
            {schoolConfig.schoolAddress && (
              <>
                <span className="text-gray-400">•</span>
                <span className="text-gray-600 flex items-center gap-1">
                  <MapPin size={12} className="text-gray-400 flex-shrink-0" />
                  {schoolConfig.schoolAddress}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {!isDemoMode && (
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-gray-600 hidden sm:inline">
                Pilih Guru:
              </label>
              <select
                id="select-guru-laporan"
                value={selectedId || ''}
                onChange={(e) => {
                  setSelectedId(e.target.value);
                  setSelectedSupervisiId(e.target.value);
                }}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-gray-800 cursor-pointer"
              >
                {supervisions.map((sv) => {
                  const matched = gurus.find((g) => g.id === sv.instrument.guruId);
                  return (
                    <option key={sv.id} value={sv.id}>
                      {matched?.nama || sv.instrument.namaGuru || 'Guru'} -{' '}
                      {sv.instrument.mapel || 'Mapel'} ({sv.status})
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          <button
            id="btn-generate-ai-laporan"
            type="button"
            onClick={handleGenerateAiReport}
            disabled={isGeneratingAi}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer active:scale-95"
            title="Generate Analisis Mendalam & Rekomendasi Supervisi Berbasis AI Kurikulum Nasional"
          >
            {isGeneratingAi ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Sparkles size={14} />
            )}
            <span>{isGeneratingAi ? 'MEMPROSES AI...' : 'GENERATE AI LAPORAN'}</span>
          </button>

          <button
            id="btn-unduh-pdf"
            type="button"
            onClick={handleDownloadPdf}
            disabled={isExportingPdf}
            className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm disabled:opacity-50 cursor-pointer active:scale-95"
            title="Unduh Laporan Format PDF Resmi (A4)"
          >
            {isExportingPdf ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Download size={14} />
            )}
            <span>{isExportingPdf ? 'MEMPROSES...' : 'UNDUH PDF'}</span>
          </button>

          <button
            id="btn-unduh-word"
            type="button"
            onClick={handleDownloadWord}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer active:scale-95"
            title="Unduh Laporan Format Dokumen Word (.doc Editable)"
          >
            <FileText size={14} /> UNDUH WORD
          </button>

          <button
            id="btn-cetak-laporan"
            type="button"
            onClick={handlePrint}
            disabled={isPrinting}
            className="flex items-center gap-1.5 px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-xl text-xs font-bold transition-all shadow-sm disabled:opacity-50 cursor-pointer active:scale-95"
            title="Cetak Laporan Format A4 Bersih (atau Simpan sebagai PDF)"
          >
            {isPrinting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Printer size={14} />
            )}
            <span>{isPrinting ? 'MEMPROSES...' : 'CETAK'}</span>
          </button>
        </div>
      </div>

      {isDemoMode && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900 no-print">
          <div className="flex items-center gap-2.5">
            <Info size={18} className="text-amber-600 flex-shrink-0" />
            <div>
              <span className="font-bold">Mode Pratinjau Dokumen Aktif:</span> Menampilkan contoh
              hasil supervisi lengkap ({DEMO_GURU.nama}). Tombol <strong>UNDUH PDF</strong> dan{' '}
              <strong>CETAK</strong> dapat langsung digunakan.
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="btn-simpan-contoh"
              type="button"
              onClick={handleSaveDemoToDatabase}
              className="px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white font-bold rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              Simpan Contoh ke Data
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('instrumen')}
              className="px-3 py-1.5 bg-white border border-amber-300 hover:bg-amber-100 font-bold text-amber-800 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              Buat Supervisi Baru
            </button>
          </div>
        </div>
      )}

      {notice && (
        <div
          className={`p-3.5 rounded-xl text-xs font-medium flex items-center justify-between border no-print transition-all ${
            notice.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : notice.type === 'error'
                ? 'bg-rose-50 text-rose-800 border-rose-200'
                : 'bg-blue-50 text-blue-800 border-blue-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {notice.type === 'success' && (
              <CheckCircle2 size={16} className="text-emerald-600" />
            )}
            {notice.type === 'error' && (
              <AlertCircle size={16} className="text-rose-600" />
            )}
            {notice.type === 'info' && (
              <Loader2 size={16} className="animate-spin text-blue-600" />
            )}
            <span>{notice.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="text-xs font-bold hover:opacity-75 cursor-pointer ml-4"
          >
            TUTUP
          </button>
        </div>
      )}

      <div className="bg-white p-8 md:p-14 rounded-2xl border border-gray-200 shadow-md max-w-4xl mx-auto w-full print-document-container">
        <ReportPreview
          guru={activeGuru}
          instrument={activeSession.instrument}
          rubricSections={rubricSections}
          instrumentTitle={instrumentTitle}
          innerRef={printRef}
        />
      </div>

      {showPrintFallbackModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 no-print animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 relative">
            <button
              type="button"
              onClick={() => setShowPrintFallbackModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                <Printer size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Dialog Cetak &amp; Unduh Laporan
                </h3>
                <p className="text-xs text-gray-500">Guru: {activeGuru.nama}</p>
              </div>
            </div>

            <div className="space-y-3 mb-5 text-xs text-gray-600 bg-gray-50 p-3.5 rounded-xl border border-gray-200/80">
              <div className="flex items-start gap-2">
                <Info size={16} className="text-brand-600 flex-shrink-0 mt-0.5" />
                <p>
                  Perintah cetak telah dikirimkan ke peramban. Jika jendela cetak peramban tidak
                  terbuka secara otomatis (misalnya karena batasan proteksi iframe peramban),
                  silakan gunakan tombol <strong>Unduh PDF Langsung</strong> di bawah ini.
                </p>
              </div>
              <div className="border-t border-gray-200 pt-2 text-gray-500">
                <strong>Tips Cetak:</strong> Pada jendela cetak peramban, Anda dapat memilih opsi{' '}
                <em>&quot;Simpan sebagai PDF / Save as PDF&quot;</em> atau printer fisik A4.
              </div>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  setShowPrintFallbackModal(false);
                  handleDownloadPdf();
                }}
                disabled={isExportingPdf}
                className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                {isExportingPdf ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Download size={15} />
                )}
                <span>Unduh PDF Resmi (A4 Standar)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const el =
                    printRef.current ||
                    document.getElementById('laporan-supervisi-print-area');
                  const safeName = (activeGuru.nama || 'Guru').replace(/[^a-zA-Z0-9]/g, '_');
                  triggerBrowserPrint(el, `Laporan_Supervisi_${safeName}`);
                }}
                className="w-full py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Printer size={15} /> Buka Ulang Jendela Cetak
              </button>

              <button
                type="button"
                onClick={() => setShowPrintFallbackModal(false)}
                className="w-full py-2 text-gray-400 hover:text-gray-600 text-xs font-medium transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
