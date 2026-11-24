import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  Printer,
  X,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useRef, useState } from 'react';
import type { Guru, RubricSection, SupervisionInstrument, ToastNotice } from '../../types/supervision';
import { exportSupervisionPdf, triggerBrowserPrint } from '../../utils/exportPdf';
import { exportSupervisionWord } from '../../utils/exportWord';
import { calculateScoreStats } from '../../utils/score';
import ReportPreview from './ReportPreview';

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  instrument: SupervisionInstrument;
  guru?: Guru | null;
  stage?: string;
  rubricSections?: RubricSection[];
  instrumentTitle?: string;
}

export default function PreviewModal({
  isOpen,
  onClose,
  instrument,
  guru,
  stage,
  rubricSections = [],
  instrumentTitle,
}: PreviewModalProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [notice, setNotice] = useState<ToastNotice | null>(null);

  if (!isOpen) return null;

  const handleDownloadPdf = async () => {
    setIsExportingPdf(true);
    setNotice({ text: 'Menyiapkan berkas PDF resmi (A4)...', type: 'info' });
    const safeName = (guru?.nama || 'Guru').replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `Supervisi_${safeName}_${stage || 'Lengkap'}.pdf`;

    try {
      await exportSupervisionPdf({
        instrument,
        guru,
        rubricSections,
        instrumentTitle,
        filename,
        onStatusChange: (status) => {
          if (status.message) {
            setNotice({
              text: status.message,
              type:
                status.state === 'error'
                  ? 'error'
                  : status.state === 'success'
                    ? 'success'
                    : 'info',
            });
          }
        },
      });
    } catch (err) {
      console.error('PDF export error:', err);
      setNotice({ text: 'Gagal membuat berkas PDF.', type: 'error' });
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handlePrint = () => {
    const el = printRef.current;
    if (!el) return;
    setIsPrinting(true);
    setNotice({ text: 'Membuka dialog cetak A4 bersih...', type: 'info' });
    const docTitle = `Laporan Supervisi - ${guru?.nama || 'Guru'}`;
    triggerBrowserPrint(el, docTitle, () => {
      setIsPrinting(false);
      setNotice({
        text: 'Dialog cetak aktif. Anda juga dapat memilih "Save as PDF" di menu printer.',
        type: 'success',
      });
    });
  };

  const handleDownloadWord = () => {
    const stats = calculateScoreStats(instrument.obsScores || {});
    exportSupervisionWord(instrument, guru, stats, rubricSections, instrumentTitle);
    setNotice({ text: 'Dokumen Word (.doc) berhasil diunduh.', type: 'success' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 no-print">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white w-full max-w-5xl h-[90vh] rounded-3xl overflow-hidden shadow-2xl relative z-10 flex flex-col"
      >
        <header className="p-6 border-b flex justify-between items-center bg-gray-50">
          <div>
            <h3 className="font-display font-bold text-xl">
              Pratinjau Dokumen Hasil Supervisi
            </h3>
            <p className="text-xs text-gray-500">
              Tampilan simulasi cetak A4 Kurikulum Nasional (Siap Unduh PDF & Word)
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handlePrint}
              disabled={isPrinting || isExportingPdf}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-100 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
              title="Cetak langsung menggunakan printer (A4 bersih)"
            >
              {isPrinting ? (
                <>
                  <Loader2 size={15} className="animate-spin text-brand-600" />
                  <span>MEMBUKA...</span>
                </>
              ) : (
                <>
                  <Printer size={15} />
                  <span>CETAK</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownloadWord}
              disabled={isPrinting || isExportingPdf}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-xl text-xs font-bold hover:bg-blue-100 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
              title="Unduh file Word (.doc)"
            >
              <FileText size={15} />
              <span>SIMPAN WORD</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isPrinting || isExportingPdf}
              className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-black transition-colors shadow-lg cursor-pointer disabled:opacity-50"
              title="Unduh file PDF resmi A4"
            >
              {isExportingPdf ? (
                <>
                  <Loader2 size={15} className="animate-spin text-rose-400" />
                  <span>MENYIAPKAN PDF...</span>
                </>
              ) : (
                <>
                  <Download size={15} className="text-rose-400" />
                  <span>SIMPAN PDF</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer ml-1"
              title="Tutup Pratinjau"
            >
              <X size={20} />
            </button>
          </div>
        </header>

        {notice && (
          <div
            className={`px-6 py-2.5 text-xs font-medium flex items-center justify-between transition-all ${
              notice.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-200'
                : notice.type === 'error'
                  ? 'bg-rose-50 text-rose-800 border-b border-rose-200'
                  : 'bg-blue-50 text-blue-800 border-b border-blue-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {notice.type === 'success' && <CheckCircle2 size={15} className="text-emerald-600" />}
              {notice.type === 'error' && <AlertCircle size={15} className="text-rose-600" />}
              {notice.type === 'info' && <Loader2 size={15} className="animate-spin text-blue-600" />}
              <span>{notice.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setNotice(null)}
              className="text-gray-400 hover:text-gray-700 cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-gray-100">
          <div className="bg-white p-8 md:p-14 rounded-2xl border border-gray-200 shadow-lg max-w-4xl mx-auto">
            <ReportPreview
              guru={guru}
              instrument={instrument}
              rubricSections={rubricSections}
              instrumentTitle={instrumentTitle}
              innerRef={printRef}
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
