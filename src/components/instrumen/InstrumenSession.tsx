import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  CheckCircle2,
  ChevronRight,
  Download,
  Eye,
  FileText,
  Loader2,
  MessageSquare,
  Printer,
  Save,
  ShieldCheck,
  Sliders,
  Sparkles,
  Trash2,
  Upload,
  UserCheck,
  UserPlus,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { ChangeEvent, ComponentType, FormEvent } from 'react';
import { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';
import { useRubricConfig } from '../../hooks/useRubricConfig';
import { generateSupervisionAnalysis } from '../../services/aiService';
import type {
  ActiveTab,
  Guru,
  RubricItem,
  SupervisionDocument,
  SupervisionInstrument,
  SupervisionPhoto,
  SupervisionSession,
  ToastNotice,
} from '../../types/supervision';
import { exportSupervisionPdf, triggerBrowserPrint } from '../../utils/exportPdf';
import { exportSupervisionWord } from '../../utils/exportWord';
import { generateUUID } from '../../utils/id';
import { calculateScoreStats, countRubricItems } from '../../utils/score';
import ReportPreview from '../common/ReportPreview';

const PreviewModal = lazy(() => import('../common/PreviewModal'));
const InstrumentCustomizerModal = lazy(() => import('../common/InstrumentCustomizerModal'));

type SessionStage = 'pra' | 'obs' | 'pasca' | 'docs' | 'analysis';

interface InstrumenSessionProps {
  session: SupervisionSession;
  gurus: Guru[];
  supervisions?: SupervisionSession[];
  onUpdate: (id: string, instrument: SupervisionInstrument, status?: string) => void;
  setSupervisiId: (id: string | null) => void;
  onUpdateGuru?: (guru: Guru) => void;
  onAddGuru?: (guru: Guru, openImmediately?: boolean) => void;
  onAddSupervision?: (guruId: string) => void;
  setActiveTab?: (tab: ActiveTab) => void;
}

function StageNavButton({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: ComponentType<{ size?: number }>;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer ${
        active
          ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20'
          : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
      }`}
    >
      <Icon size={18} />
      <span>{label}</span>
      {active && <ChevronRight size={16} className="ml-auto opacity-50" />}
    </button>
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  readOnly = false,
}: {
  label: string;
  value: string;
  onChange?: (val: string) => void;
  placeholder?: string;
  type?: string;
  readOnly?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        readOnly={readOnly}
        placeholder={placeholder}
        className={`w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:bg-white transition-all ${
          readOnly ? 'opacity-60 cursor-not-allowed' : ''
        }`}
      />
    </div>
  );
}

function TextareaField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange?: (val: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:bg-white transition-all resize-none"
      />
    </div>
  );
}

function RtlCheckbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label
      className={`flex items-center gap-3 p-4 rounded-xl border border-gray-100 cursor-pointer transition-all ${
        checked ? 'bg-brand-50 border-brand-200' : 'hover:bg-gray-50'
      }`}
    >
      <div
        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
          checked
            ? 'bg-brand-600 border-brand-600 text-white'
            : 'border-gray-200'
        }`}
      >
        {checked && <Check size={14} />}
      </div>
      <span className={`text-sm font-bold ${checked ? 'text-brand-700' : 'text-gray-600'}`}>
        {label}
      </span>
      <input
        type="checkbox"
        className="hidden"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
}

function RubricSectionCard({
  title,
  items,
  scores,
  onScore,
}: {
  title: string;
  items: RubricItem[];
  scores: Record<string, number>;
  onScore: (itemId: string, score: number) => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-6 bg-gray-50 border-b border-gray-100">
        <h3 className="font-display font-bold text-sm text-gray-900 uppercase tracking-wide">
          {title}
        </h3>
      </div>
      <div className="divide-y divide-gray-50">
        {items.map((item) => (
          <div
            key={item.id}
            className="p-6 flex gap-8 items-start hover:bg-gray-50/50 transition-colors"
          >
            <div className="flex-1">
              <p className="text-sm font-bold text-gray-900 mb-1">{item.label}</p>
              <p className="text-xs text-gray-400 leading-relaxed italic">{item.desc}</p>
            </div>
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => onScore(item.id, val)}
                  className={`w-10 h-10 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                    scores[item.id] === val
                      ? 'bg-brand-600 text-white scale-110 shadow-lg shadow-brand-200'
                      : 'bg-white border border-gray-100 text-gray-400 hover:border-brand-200 hover:text-brand-600'
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AiAnalysisPanel({
  title,
  content,
  isLoading,
  onGenerate,
}: {
  title: string;
  content: string;
  isLoading: boolean;
  onGenerate: () => void;
}) {
  return (
    <section className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-2xl text-white shadow-xl relative overflow-hidden">
      <div className="relative z-10">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-white/10 rounded-lg">
              <Sparkles className="text-brand-400" size={20} />
            </div>
            <h3 className="font-display font-bold text-lg">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onGenerate}
            disabled={isLoading}
            className="px-4 py-2.5 bg-white text-gray-900 rounded-xl text-xs font-bold hover:bg-brand-50 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer shadow-md active:scale-95"
            title="Klik untuk menghasilkan atau memperbarui analisis AI"
          >
            {isLoading ? (
              <Loader2 size={14} className="animate-spin text-brand-600" />
            ) : (
              <Sparkles size={14} className="text-brand-600" />
            )}
            <span>
              {isLoading
                ? 'MENGHASILKAN...'
                : content
                  ? 'PERBARUI ANALISIS AI'
                  : 'GENERATE ANALISIS AI'}
            </span>
          </button>
        </div>

        {content ? (
          <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-sm leading-relaxed text-gray-200 whitespace-pre-wrap">
            {content}
          </div>
        ) : (
          <p className="text-sm text-gray-400 italic">
            Belum ada analisis. Klik tombol &quot;GENERATE ANALISIS AI&quot; di atas untuk
            menghasilkan telaah supervisi profesional.
          </p>
        )}
      </div>
      <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-brand-500/20 rounded-full blur-3xl opacity-50" />
    </section>
  );
}

function DocumentUploadRow({
  label,
  stage,
  documents,
  onUpload,
  onRemove,
}: {
  label: string;
  stage: string;
  documents: SupervisionDocument[];
  onUpload: (e: ChangeEvent<HTMLInputElement>, stage: string) => void;
  onRemove: (docId: string) => void;
}) {
  const existingDoc = documents.find((d) => d.stage === stage);

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
      <div>
        <p className="text-sm font-bold text-gray-900">{label}</p>
        {existingDoc && (
          <p className="text-[10px] text-brand-600 font-medium">
            Terlampir: {existingDoc.name}
          </p>
        )}
      </div>
      <div className="flex gap-2">
        {existingDoc ? (
          <>
            <a
              href={existingDoc.url}
              download={existingDoc.name}
              className="p-2 bg-white border border-gray-200 text-gray-500 rounded-lg hover:text-brand-600 transition-colors inline-flex items-center"
              title="Unduh Dokumen"
            >
              <Download size={16} />
            </a>
            <button
              type="button"
              onClick={() => onRemove(existingDoc.id)}
              className="p-2 bg-white border border-gray-200 text-gray-500 rounded-lg hover:text-rose-500 transition-colors cursor-pointer"
              title="Hapus Dokumen"
            >
              <Trash2 size={16} />
            </button>
          </>
        ) : (
          <label className="p-2 bg-white border border-gray-200 text-gray-500 rounded-lg cursor-pointer hover:text-brand-600 transition-colors">
            <Upload size={16} />
            <input type="file" className="hidden" onChange={(e) => onUpload(e, stage)} />
          </label>
        )}
      </div>
    </div>
  );
}

export default function InstrumenSession({
  session,
  gurus,
  supervisions = [],
  onUpdate,
  setSupervisiId,
  onUpdateGuru,
  onAddGuru,
}: InstrumenSessionProps) {
  const [instrument, setInstrument] = useState<SupervisionInstrument>(session.instrument);
  const [stage, setStage] = useState<SessionStage>('pra');
  const [status, setStatus] = useState<string>(session.status);
  const [saveHighlight, setSaveHighlight] = useState(false);
  const [saveBanner, setSaveBanner] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [showAddGuruModal, setShowAddGuruModal] = useState(false);
  const [newGuruForm, setNewGuruForm] = useState({
    nama: '',
    nip: '',
    mapel: '',
    kelas: '',
    pangkat: '',
    status: 'ASN',
  });
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewStage, setPreviewStage] = useState('all');
  const [showCustomizerModal, setShowCustomizerModal] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [exportNotice, setExportNotice] = useState<ToastNotice | null>(null);

  const reportRef = useRef<HTMLDivElement>(null);
  const { rubricSections, instrumentTitle, refresh: refreshRubrics } = useRubricConfig();

  useEffect(() => {
    setInstrument(session.instrument);
    setStatus(session.status);
  }, [session.id, session.instrument, session.status]);

  const activeGuru = useMemo(
    () => gurus.find((g) => g.id === instrument.guruId),
    [gurus, instrument.guruId],
  );

  const scoreStats = useMemo(
    () => calculateScoreStats(instrument.obsScores || {}),
    [instrument.obsScores],
  );

  const patchInstrument = (patch: Partial<SupervisionInstrument>) => {
    const updated: SupervisionInstrument = { ...instrument, ...patch };
    setInstrument(updated);
    onUpdate(session.id, updated, status);
  };

  const handleSaveSession = (overrideStatus?: string) => {
    const nextStatus = overrideStatus || status;
    setStatus(nextStatus);
    const displayName = activeGuru?.nama || instrument.namaGuru || 'Guru';
    const nextInstrument: SupervisionInstrument = {
      ...instrument,
      guruId: activeGuru?.id || instrument.guruId,
      namaGuru: displayName,
      nipGuru: instrument.nipGuru || activeGuru?.nip || '-',
      mapel: instrument.mapel || activeGuru?.mapel || '-',
    };
    setInstrument(nextInstrument);
    onUpdate(session.id, nextInstrument, nextStatus);
    setSaveHighlight(true);
    setSaveBanner(
      `Data guru "${displayName}" dan seluruh hasil laporannya berhasil disimpan! (Status: ${
        nextStatus === 'Selesai' ? 'Selesai (Sudah Disupervisi)' : nextStatus
      })`,
    );
    setTimeout(() => setSaveHighlight(false), 3000);
    setTimeout(() => setSaveBanner(null), 4500);
  };

  const handleCreateIsolatedGuru = (e: FormEvent) => {
    e.preventDefault();
    if (!newGuruForm.nama.trim() || !newGuruForm.mapel.trim()) return;
    onUpdate(session.id, instrument, status);
    const created: Guru = {
      id: generateUUID(),
      nama: newGuruForm.nama.trim(),
      nip: newGuruForm.nip.trim() || '-',
      mapel: newGuruForm.mapel.trim(),
      status: newGuruForm.status || 'ASN',
      pangkat: newGuruForm.pangkat.trim() || '-',
    };
    onAddGuru?.(created, true);
    setShowAddGuruModal(false);
    setNewGuruForm({
      nama: '',
      nip: '',
      mapel: '',
      kelas: '',
      pangkat: '',
      status: 'ASN',
    });
    setSaveBanner(
      `Guru baru "${created.nama}" berhasil dibuat dengan lembar supervisi terpisah. Data guru sebelumnya tetap aman.`,
    );
  };

  const handleSwitchSession = (nextId: string) => {
    if (nextId === 'ADD_NEW') {
      setShowAddGuruModal(true);
      return;
    }
    onUpdate(session.id, instrument, status);
    setSupervisiId(nextId);
  };

  const handleDownloadPdf = async () => {
    setIsExportingPdf(true);
    setExportNotice({ text: 'Menyiapkan berkas PDF resmi (A4)...', type: 'info' });
    const safeName = (activeGuru?.nama || 'Guru').replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `Supervisi_${safeName}_Laporan_Hasil.pdf`;
    try {
      await exportSupervisionPdf({
        instrument,
        guru: activeGuru,
        stats: scoreStats,
        rubricSections,
        instrumentTitle,
        filename,
        onStatusChange: (st) => {
          if (st.state === 'success') {
            setExportNotice({
              text: st.message || 'File PDF berhasil diunduh.',
              type: 'success',
            });
          } else if (st.state === 'error') {
            setExportNotice({
              text: st.message || 'Gagal membuat file PDF.',
              type: 'error',
            });
          } else if (st.state === 'processing') {
            setExportNotice({
              text: st.message || 'Memproses PDF...',
              type: 'info',
            });
          }
        },
      });
    } catch (err) {
      console.error('Error generating PDF:', err);
      setExportNotice({ text: 'Terjadi kendala saat membuat PDF.', type: 'error' });
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handlePrint = () => {
    if (!reportRef.current) return;
    setIsPrinting(true);
    setExportNotice({ text: 'Mempersiapkan pratinjau cetak A4...', type: 'info' });
    const safeName = (activeGuru?.nama || 'Guru').replace(/[^a-zA-Z0-9]/g, '_');
    triggerBrowserPrint(reportRef.current, `Supervisi_${safeName}_Laporan_Hasil`, () => {
      setIsPrinting(false);
      setExportNotice({ text: 'Dialog cetak/PDF berhasil dibuka.', type: 'success' });
    });
  };

  const handleDownloadWord = () => {
    exportSupervisionWord(instrument, activeGuru, scoreStats, rubricSections, instrumentTitle);
    setExportNotice({
      text: `Dokumen Word (.doc) untuk "${activeGuru?.nama || 'Guru'}" berhasil diunduh.`,
      type: 'success',
    });
  };

  const handleGenerateAi = async (targetStage: 'pra' | 'observasi' | 'pasca' | 'all') => {
    setIsAiLoading(true);
    setAiError(null);
    try {
      const result = await generateSupervisionAnalysis(
        targetStage,
        instrument,
        activeGuru?.nama || instrument.namaGuru || '',
      );
      const patch: Partial<SupervisionInstrument> = {};
      if (targetStage === 'pra' || targetStage === 'all') {
        patch.praAI = result.analysis;
      }
      if (targetStage === 'observasi' || targetStage === 'all') {
        patch.obsAI = result.analysis;
        if (result.scoreInterpretation) {
          patch.analysisScore = result.scoreInterpretation;
        }
      }
      if (targetStage === 'pasca' || targetStage === 'all') {
        patch.pascaAI = result.analysis;
      }
      if (targetStage === 'all') {
        patch.kekuatan = result.kekuatan;
        patch.perbaikan = result.perbaikan;
        patch.rekomendasi = result.rekomendasi;
        if (result.rtlSuggestion) {
          patch.rtl = { ...instrument.rtl, ...result.rtlSuggestion };
        }
      }
      patchInstrument(patch);
      setSaveBanner('Analisis AI Kurikulum Nasional & Deep Learning berhasil dimuat!');
      setPreviewStage(targetStage === 'observasi' ? 'obs' : targetStage);
      setShowPreviewModal(true);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Gagal memproses analisis AI.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleUploadDocument = (e: ChangeEvent<HTMLInputElement>, docStage: string) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const nextDoc: SupervisionDocument = {
          id: generateUUID(),
          name: file.name,
          type: file.type,
          url: String(reader.result || ''),
          stage: docStage,
        };
        patchInstrument({ documents: [...instrument.documents, nextDoc] });
      };
      reader.readAsDataURL(file);
    });
  };

  const handleUploadPhotos = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const nextPhoto: SupervisionPhoto = {
          id: generateUUID(),
          url: String(reader.result || ''),
        };
        patchInstrument({ photos: [...instrument.photos, nextPhoto] });
      };
      reader.readAsDataURL(file);
    });
  };

  const totalRubricIndicators = countRubricItems(rubricSections);

  return (
    <div className="flex bg-gray-50 min-h-screen -m-6 relative">
      <aside className="w-72 bg-white border-r border-gray-200 p-6 flex flex-col gap-8 no-print">
        <div>
          <button
            type="button"
            onClick={() => setSupervisiId(null)}
            className="flex items-center gap-2 text-gray-500 hover:text-brand-600 transition-colors text-sm font-bold mb-8 cursor-pointer"
          >
            <ArrowLeft size={16} /> KEMBALI KE DASBOR
          </button>

          <div className="space-y-1">
            <StageNavButton
              active={stage === 'pra'}
              onClick={() => setStage('pra')}
              icon={FileText}
              label="Pra-Observasi"
            />
            <StageNavButton
              active={stage === 'obs'}
              onClick={() => setStage('obs')}
              icon={Eye}
              label="Observasi Kelas"
            />
            <StageNavButton
              active={stage === 'pasca'}
              onClick={() => setStage('pasca')}
              icon={MessageSquare}
              label="Pasca-Observasi"
            />
            <StageNavButton
              active={stage === 'docs'}
              onClick={() => setStage('docs')}
              icon={Camera}
              label="Dokumentasi"
            />
            <StageNavButton
              active={stage === 'analysis'}
              onClick={() => setStage('analysis')}
              icon={Sparkles}
              label="Hasil & Analisis"
            />
          </div>
        </div>

        <div className="mt-auto space-y-2">
          <div className="p-4 bg-brand-50 rounded-2xl border border-brand-100">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
                <p className="text-[10px] font-bold text-brand-700 uppercase tracking-widest">
                  Sesi Aktif
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddGuruModal(true)}
                className="text-[10px] font-bold text-brand-700 hover:text-brand-900 underline cursor-pointer"
                title="Input Guru Baru (Sesi Terpisah)"
              >
                + Guru Baru
              </button>
            </div>
            <p className="text-sm font-bold text-gray-900 truncate">
              {activeGuru?.nama || instrument.namaGuru || 'Guru'}
            </p>
            <p className="text-[10px] text-brand-600 font-medium truncate">
              {instrument.mapel || 'Mapel belum ditentukan'}
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-gray-200/70 text-[11px]">
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="font-bold text-gray-500 uppercase tracking-wider text-[9px]">
                Instrumen:
              </span>
              <button
                type="button"
                onClick={() => setShowCustomizerModal(true)}
                className="text-brand-600 hover:text-brand-800 font-bold text-[10px] cursor-pointer"
              >
                Ubah
              </button>
            </div>
            <p className="font-bold text-gray-800 truncate" title={instrumentTitle}>
              {instrumentTitle}
            </p>
            <p className="text-gray-400 text-[10px]">{totalRubricIndicators} Indikator Aktif</p>
          </div>
        </div>
      </aside>

      <main className="flex-1 p-10 overflow-y-auto max-h-screen">
        <header className="flex justify-between items-end mb-10 no-print">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 bg-brand-100 text-brand-700 text-[10px] font-bold rounded-md uppercase tracking-wider">
                Sesi #022-SV
              </span>
              <span className="text-gray-400">•</span>
              <p className="text-xs text-gray-500 font-medium">{instrumentTitle}</p>
            </div>
            <h1 className="text-3xl font-display font-bold text-gray-900">
              {stage === 'pra' && 'Tahap 1: Pra-Observasi'}
              {stage === 'obs' && 'Tahap 2: Observasi Kelas'}
              {stage === 'pasca' && 'Tahap 3: Pasca-Observasi'}
              {stage === 'docs' && 'Lampiran & Dokumentasi'}
              {stage === 'analysis' && 'Catatan Klinis & Rekapitulasi'}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setShowCustomizerModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 text-brand-700 hover:bg-brand-100 border border-brand-200 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              title="Ubah atau import instrumen observasi sesuai kebutuhan sekolah"
            >
              <Sliders size={14} /> KUSTOM / IMPORT INSTRUMEN
            </button>

            <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-gray-200 text-xs shadow-sm">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Status:
              </span>
              <select
                value={status}
                onChange={(e) => handleSaveSession(e.target.value)}
                className="font-bold text-gray-800 bg-transparent focus:outline-none cursor-pointer text-xs"
              >
                <option value="Direncakan">Direncanakan</option>
                <option value="Pra-Observasi">Pra-Observasi</option>
                <option value="Observasi">Observasi Kelas</option>
                <option value="Pasca-Observasi">Pasca-Observasi</option>
                <option value="Tindak Lanjut">Tindak Lanjut</option>
                <option value="Selesai">Selesai (Sudah Disupervisi)</option>
              </select>
            </div>

            {status !== 'Selesai' ? (
              <button
                type="button"
                onClick={() => handleSaveSession('Selesai')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                title="Tandai supervisi selesai dan simpan data"
              >
                <CheckCircle2 size={14} /> TANDAI SELESAI
              </button>
            ) : (
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-300">
                <CheckCircle2 size={14} className="text-emerald-600" /> SUDAH DISUPERVISI
              </span>
            )}

            <button
              type="button"
              onClick={() => {
                setPreviewStage('all');
                setShowPreviewModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-xs font-bold hover:border-brand-600 hover:text-brand-600 transition-all shadow-sm cursor-pointer"
              title="Pratinjau Hasil Supervisi Lengkap"
            >
              <Eye size={15} /> PRATINJAU
            </button>

            <button
              type="button"
              onClick={() => {
                setPreviewStage('all');
                setShowPreviewModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
              title="Unduh Format Dokumen PDF Resmi (A4)"
            >
              <Download size={14} /> PDF
            </button>

            <button
              type="button"
              onClick={handleDownloadWord}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
              title="Unduh Format Dokumen Word (.doc Editable)"
            >
              <FileText size={14} /> WORD
            </button>

            <button
              type="button"
              onClick={() => handleSaveSession()}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer ${
                saveHighlight
                  ? 'bg-emerald-600 text-white shadow-emerald-500/20 ring-2 ring-emerald-400'
                  : 'bg-brand-600 text-white hover:bg-brand-700 shadow-brand-500/20'
              }`}
            >
              {saveHighlight ? (
                <Check size={16} className="stroke-[3]" />
              ) : (
                <Save size={16} />
              )}
              <span>{saveHighlight ? 'DATA TERSIMPAN!' : 'SIMPAN DATA'}</span>
            </button>
          </div>
        </header>

        <AnimatePresence>
          {saveBanner && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between shadow-sm text-emerald-900 no-print"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                    Penyimpanan Berhasil
                  </p>
                  <p className="text-sm font-bold">{saveBanner}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSaveBanner(null)}
                className="text-emerald-500 hover:text-emerald-800 p-1 cursor-pointer"
              >
                <X size={16} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {aiError && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-3 text-rose-700 no-print">
            <AlertCircle size={20} />
            <p className="text-sm font-medium">{aiError}</p>
          </div>
        )}

        <div className="max-w-4xl mx-auto space-y-10">
          <AnimatePresence mode="wait">
            {stage === 'pra' && (
              <motion.div
                key="pra"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <section className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
                    <div className="flex items-center gap-2">
                      <FileText className="text-brand-600" size={20} />
                      <h3 className="font-display font-bold text-lg">
                        Identitas Guru &amp; Penjadwalan
                      </h3>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {supervisions.length > 0 && (
                        <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs">
                          <UserCheck size={13} className="text-gray-400" />
                          <span className="font-semibold text-gray-500 text-[11px]">
                            Pilih Guru:
                          </span>
                          <select
                            value={session.id}
                            onChange={(e) => handleSwitchSession(e.target.value)}
                            className="bg-transparent font-bold text-gray-800 text-xs focus:outline-none cursor-pointer max-w-[200px] truncate"
                          >
                            {supervisions.map((sv) => {
                              const g = gurus.find((item) => item.id === sv.instrument.guruId);
                              const labelName = g?.nama || sv.instrument.namaGuru || 'Guru';
                              return (
                                <option key={sv.id} value={sv.id}>
                                  {labelName} - {sv.instrument.mapel || 'Mapel'} ({sv.status})
                                </option>
                              );
                            })}
                            <option value="ADD_NEW">
                              + Input Guru Baru (Sesi Terpisah)...
                            </option>
                          </select>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => setShowAddGuruModal(true)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 whitespace-nowrap"
                        title="Tambah guru baru untuk disupervisi (data guru yang sudah ada tetap aman)"
                      >
                        <UserPlus size={14} /> + INPUT GURU BARU
                      </button>
                    </div>
                  </div>

                  <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl flex items-center justify-between text-xs text-blue-900">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={15} className="text-blue-600 flex-shrink-0" />
                      <span>
                        Sedang mengerjakan supervisi untuk:{' '}
                        <strong>{activeGuru?.nama || instrument.namaGuru || 'Guru'}</strong>.
                        Seluruh instrumen dan laporan tersimpan aman untuk guru ini.
                      </span>
                    </div>
                    <span className="text-[10px] bg-blue-200 text-blue-800 px-2 py-0.5 rounded font-bold uppercase tracking-wider ml-2 shrink-0">
                      Sesi Terisolasi
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <InputField
                        label="Nama Guru Aktif"
                        value={activeGuru?.nama || instrument.namaGuru || ''}
                        onChange={(val) => {
                          patchInstrument({ namaGuru: val });
                          if (activeGuru && onUpdateGuru) {
                            onUpdateGuru({ ...activeGuru, nama: val });
                          }
                        }}
                        placeholder="Ketik Nama Lengkap Guru"
                      />
                      <p className="text-[10px] text-gray-400 italic mt-1">
                        * Untuk mensupervisi guru baru lainnya, gunakan tombol{' '}
                        <strong>&quot;+ INPUT GURU BARU&quot;</strong> di atas agar hasil supervisi
                        guru ini tidak tertimpa.
                      </p>
                    </div>

                    <InputField
                      label="NIP Guru"
                      value={instrument.nipGuru}
                      onChange={(val) => {
                        patchInstrument({ nipGuru: val });
                        if (activeGuru && onUpdateGuru) {
                          onUpdateGuru({ ...activeGuru, nip: val });
                        }
                      }}
                    />

                    <InputField
                      label="Mata Pelajaran"
                      value={instrument.mapel}
                      onChange={(val) => {
                        patchInstrument({ mapel: val });
                        if (activeGuru && onUpdateGuru) {
                          onUpdateGuru({ ...activeGuru, mapel: val });
                        }
                      }}
                    />

                    <InputField
                      label="Materi Pokok"
                      value={instrument.materi}
                      onChange={(val) => patchInstrument({ materi: val })}
                    />

                    <InputField
                      label="Kelas / Fase"
                      value={instrument.kelas}
                      onChange={(val) => patchInstrument({ kelas: val })}
                      placeholder="Contoh: X-A / E"
                    />

                    <div className="grid grid-cols-2 gap-3 col-span-2">
                      <InputField
                        label="Tgl Pra-Observasi"
                        type="date"
                        value={instrument.tglPra}
                        onChange={(val) => patchInstrument({ tglPra: val })}
                      />
                      <InputField
                        label="Tgl Observasi"
                        type="date"
                        value={instrument.tglObs}
                        onChange={(val) => patchInstrument({ tglObs: val })}
                      />
                      <InputField
                        label="Tgl Pasca-Observasi"
                        type="date"
                        value={instrument.tglPasca}
                        onChange={(val) => patchInstrument({ tglPasca: val })}
                      />
                    </div>
                  </div>
                </section>

                <section className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                  <h3 className="font-display font-bold text-lg border-b pb-4 flex items-center gap-2">
                    <ShieldCheck className="text-brand-600" size={20} /> Otoritas (Kepala Sekolah
                    &amp; Supervisor)
                  </h3>
                  <div className="grid grid-cols-2 gap-6">
                    <InputField
                      label="Nama Kepala Sekolah"
                      value={instrument.namaKepala}
                      onChange={(val) => patchInstrument({ namaKepala: val })}
                    />
                    <InputField
                      label="NIP Kepala Sekolah"
                      value={instrument.nipKepala}
                      onChange={(val) => patchInstrument({ nipKepala: val })}
                    />
                    <InputField
                      label="Nama Supervisor"
                      value={instrument.namaPengawas}
                      onChange={(val) => patchInstrument({ namaPengawas: val })}
                    />
                    <InputField
                      label="NIP Supervisor"
                      value={instrument.nipPengawas}
                      onChange={(val) => patchInstrument({ nipPengawas: val })}
                    />
                  </div>
                </section>

                <section className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                  <h3 className="font-display font-bold text-lg border-b pb-4">
                    Instrumen Wawancara Pra-Observasi
                  </h3>
                  <div className="space-y-6">
                    <TextareaField
                      label="1. Apa tujuan pembelajaran yang ingin dicapai dalam sesi ini?"
                      value={instrument.praFields.tujuan}
                      onChange={(val) =>
                        patchInstrument({
                          praFields: { ...instrument.praFields, tujuan: val },
                        })
                      }
                    />
                    <TextareaField
                      label="2. Area pengembangan mana yang secara spesifik ingin diobservasi?"
                      value={instrument.praFields.area}
                      onChange={(val) =>
                        patchInstrument({
                          praFields: { ...instrument.praFields, area: val },
                        })
                      }
                    />
                    <TextareaField
                      label="3. Strategi apa yang telah dipersiapkan untuk mencapai tujuan tersebut?"
                      value={instrument.praFields.strategi}
                      onChange={(val) =>
                        patchInstrument({
                          praFields: { ...instrument.praFields, strategi: val },
                        })
                      }
                    />
                  </div>
                </section>

                <AiAnalysisPanel
                  title="Analisis Kesiapan Pra-Observasi"
                  content={instrument.praAI}
                  isLoading={isAiLoading}
                  onGenerate={() => handleGenerateAi('pra')}
                />

                <div className="flex items-center justify-between pt-6 border-t border-gray-100 no-print">
                  <div />
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleSaveSession()}
                      className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-50 transition-all shadow-sm cursor-pointer"
                    >
                      <Save size={15} /> SIMPAN DRAF PRA-OBSERVASI
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleSaveSession();
                        setStage('obs');
                      }}
                      className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white rounded-xl text-xs font-bold hover:bg-brand-700 transition-all shadow-md shadow-brand-500/20 cursor-pointer"
                    >
                      SIMPAN &amp; LANJUT OBSERVASI <ArrowRight size={15} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {stage === 'obs' && (
              <motion.div
                key="obs"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-gray-200/80 shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold shrink-0">
                      <Sliders size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wide">
                          Instrumen Observasi Sekolah:
                        </h4>
                        <span className="px-2.5 py-0.5 rounded-md bg-brand-100 text-brand-700 text-[10px] font-bold">
                          {instrumentTitle}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Memuat <strong>{totalRubricIndicators} Indikator Pengamatan</strong> (
                        {rubricSections.length} Bagian). Disesuaikan dengan kebutuhan kurikulum
                        satuan pendidikan.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCustomizerModal(true)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-brand-500/20 cursor-pointer whitespace-nowrap"
                  >
                    <Sliders size={14} /> Kustomisasi / Import Instrumen
                  </button>
                </div>

                <div className="bg-brand-600 p-8 rounded-2xl text-white shadow-xl flex justify-between items-center overflow-hidden relative">
                  <div className="relative z-10">
                    <p className="text-brand-200 text-xs font-bold uppercase tracking-widest mb-1">
                      Rangkuman Real-time
                    </p>
                    <h3 className="text-4xl font-display font-bold">
                      {scoreStats.avg.toFixed(2)}
                    </h3>
                    <p className="text-sm font-medium opacity-80">
                      Kategori: <span className="font-bold">{scoreStats.category}</span>
                    </p>
                  </div>
                  <div className="relative z-10 flex gap-4 text-center">
                    {([1, 2, 3, 4] as const).map((scoreKey) => (
                      <div key={scoreKey}>
                        <p className="text-xs font-bold opacity-60 mb-1">Skor {scoreKey}</p>
                        <p className="text-xl font-bold">{scoreStats.dist[scoreKey]}</p>
                      </div>
                    ))}
                  </div>
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl" />
                </div>

                <section className="space-y-6">
                  {rubricSections.map((sec) => (
                    <RubricSectionCard
                      key={sec.id}
                      title={sec.title}
                      items={sec.items}
                      scores={instrument.obsScores}
                      onScore={(itemId, val) =>
                        patchInstrument({
                          obsScores: { ...instrument.obsScores, [itemId]: val },
                        })
                      }
                    />
                  ))}
                </section>

                <AiAnalysisPanel
                  title="Analisis Pelaksanaan Observasi"
                  content={instrument.obsAI}
                  isLoading={isAiLoading}
                  onGenerate={() => handleGenerateAi('observasi')}
                />

                <div className="flex items-center justify-between pt-6 border-t border-gray-100 no-print">
                  <button
                    type="button"
                    onClick={() => setStage('pra')}
                    className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 text-xs font-bold cursor-pointer"
                  >
                    <ArrowLeft size={14} /> Kembali ke Pra-Observasi
                  </button>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleSaveSession()}
                      className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-50 transition-all shadow-sm cursor-pointer"
                    >
                      <Save size={15} /> SIMPAN SKOR OBSERVASI
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleSaveSession();
                        setStage('pasca');
                      }}
                      className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white rounded-xl text-xs font-bold hover:bg-brand-700 transition-all shadow-md shadow-brand-500/20 cursor-pointer"
                    >
                      SIMPAN &amp; LANJUT PASCA-OBSERVASI <ArrowRight size={15} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {stage === 'pasca' && (
              <motion.div
                key="pasca"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <section className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-brand-100 text-brand-800">
                          Refleksi Dua Arah (Kemitraan Klinis)
                        </span>
                        <span className="text-xs text-gray-400">
                          • Ruang Sanggah &amp; Kesepakatan
                        </span>
                      </div>
                      <h3 className="font-display font-bold text-lg text-gray-900 mt-1">
                        Refleksi &amp; Tanggapan Pasca-Observasi
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Supervisi klinis bersifat dialogis dua arah. Guru memiliki hak penuh untuk
                        memberikan tanggapan, klarifikasi, atau sanggahan terhadap catatan
                        pengamatan kelas.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <TextareaField
                      label="1. Catatan Refleksi Guru (Apa yang sudah berjalan baik? Apa kendala/tantangan di kelas?)"
                      value={instrument.pascaRefleksi}
                      onChange={(val) => patchInstrument({ pascaRefleksi: val })}
                      placeholder="Tuliskan refleksi pengalaman mengajar Anda, hal yang telah berhasil diterapkan, serta tantangan yang dihadapi saat proses pembelajaran..."
                    />

                    <div className="p-5 bg-gradient-to-br from-amber-50/70 to-orange-50/40 border border-amber-200/80 rounded-2xl space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wide">
                            <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-800 flex items-center justify-center text-xs font-black">
                              💬
                            </span>
                            <span>2. Menu Tanggapan / Hak Sanggah Guru (Dua Arah)</span>
                          </div>
                          <p className="text-xs text-amber-900/90 leading-relaxed">
                            Apakah ada catatan hasil observasi supervisor yang membutuhkan
                            klarifikasi, konteks tambahan, penjelasan situasi khusus murid, atau
                            sanggahan dari pihak guru?
                          </p>
                        </div>
                        {instrument.pascaSanggah && (
                          <span className="px-2 py-0.5 bg-amber-200/80 text-amber-900 rounded text-[10px] font-bold uppercase shrink-0">
                            Ada Tanggapan
                          </span>
                        )}
                      </div>

                      <textarea
                        value={instrument.pascaSanggah || ''}
                        onChange={(e) => patchInstrument({ pascaSanggah: e.target.value })}
                        placeholder="Contoh: Terkait catatan alokasi waktu pada penutup materi, sesi agak molor karena terdapat pertanyaan kontekstual menarik dari murid yang membutuhkan penguatan konsep sebelum latihan mandiri..."
                        rows={3}
                        className="w-full px-4 py-3 bg-white border border-amber-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-gray-900 placeholder:text-gray-400 shadow-xs"
                      />
                      <p className="text-[11px] text-amber-800 italic">
                        * Tanggapan/sanggahan ini akan dicantumkan secara resmi pada lembar laporan
                        supervisi akhir sebagai bukti dialog dua arah.
                      </p>
                    </div>

                    <TextareaField
                      label="3. Rencana Pengembangan Diri (Apa komitmen dan target perbaikan guru selanjutnya?)"
                      value={instrument.pascaRencana}
                      onChange={(val) => patchInstrument({ pascaRencana: val })}
                      placeholder="Tuliskan komitmen langkah konkret yang akan dilakukan guru, misalnya penyesuaian modul ajar, asesmen diagnostik, atau strategi interaksi..."
                    />
                  </div>
                </section>

                <section className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                  <h3 className="font-display font-bold text-lg border-b pb-4">
                    Rencana Tindak Lanjut
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <RtlCheckbox
                      label="Coaching Individu"
                      checked={instrument.rtl.coaching}
                      onChange={(checked) =>
                        patchInstrument({ rtl: { ...instrument.rtl, coaching: checked } })
                      }
                    />
                    <RtlCheckbox
                      label="Mentoring / Peer Teaching"
                      checked={instrument.rtl.mentoring}
                      onChange={(checked) =>
                        patchInstrument({ rtl: { ...instrument.rtl, mentoring: checked } })
                      }
                    />
                    <RtlCheckbox
                      label="Workshop / Pelatihan"
                      checked={instrument.rtl.workshop}
                      onChange={(checked) =>
                        patchInstrument({ rtl: { ...instrument.rtl, workshop: checked } })
                      }
                    />
                    <RtlCheckbox
                      label="Lesson Study"
                      checked={instrument.rtl.lessonStudy}
                      onChange={(checked) =>
                        patchInstrument({ rtl: { ...instrument.rtl, lessonStudy: checked } })
                      }
                    />
                    <RtlCheckbox
                      label="Pengembangan Mandiri (PMM)"
                      checked={instrument.rtl.selfDevelopment}
                      onChange={(checked) =>
                        patchInstrument({
                          rtl: { ...instrument.rtl, selfDevelopment: checked },
                        })
                      }
                    />
                  </div>
                </section>

                <AiAnalysisPanel
                  title="Analisis Pasca-Observasi & RTL"
                  content={instrument.pascaAI}
                  isLoading={isAiLoading}
                  onGenerate={() => handleGenerateAi('pasca')}
                />

                <div className="flex items-center justify-between pt-6 border-t border-gray-100 no-print">
                  <button
                    type="button"
                    onClick={() => setStage('obs')}
                    className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 text-xs font-bold cursor-pointer"
                  >
                    <ArrowLeft size={14} /> Kembali ke Observasi
                  </button>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleSaveSession()}
                      className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-50 transition-all shadow-sm cursor-pointer"
                    >
                      <Save size={15} /> SIMPAN REFLEKSI &amp; RTL
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleSaveSession();
                        setStage('docs');
                      }}
                      className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white rounded-xl text-xs font-bold hover:bg-brand-700 transition-all shadow-md shadow-brand-500/20 cursor-pointer"
                    >
                      SIMPAN &amp; LANJUT DOKUMENTASI <ArrowRight size={15} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {stage === 'docs' && (
              <motion.div
                key="docs"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <section className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                  <div className="flex justify-between items-center border-b pb-4">
                    <h3 className="font-display font-bold text-lg">
                      Dokumentasi Foto Kegiatan
                    </h3>
                    <label className="flex items-center gap-2 px-4 py-2 bg-brand-50 text-brand-700 rounded-xl text-xs font-bold border border-brand-100 cursor-pointer hover:bg-brand-100 transition-colors">
                      <Upload size={16} /> UNGGAH FOTO
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={handleUploadPhotos}
                      />
                    </label>
                  </div>

                  {instrument.photos.length === 0 ? (
                    <div className="py-12 border-2 border-dashed border-gray-100 rounded-2xl text-center">
                      <Camera className="mx-auto text-gray-200 mb-4" size={48} />
                      <p className="text-gray-400 text-sm">Belum ada foto yang diunggah.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-6">
                      {instrument.photos.map((photo) => (
                        <div
                          key={photo.id}
                          className="relative group rounded-xl overflow-hidden aspect-video border border-gray-100"
                        >
                          <img
                            src={photo.url}
                            alt={photo.caption || 'Dokumentasi Supervisi'}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              patchInstrument({
                                photos: instrument.photos.filter((p) => p.id !== photo.id),
                              })
                            }
                            className="absolute top-2 right-2 p-1.5 bg-rose-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            title="Hapus Foto"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <section className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                  <div className="flex justify-between items-center border-b pb-4">
                    <h3 className="font-display font-bold text-lg">
                      Dokumen Perangkat &amp; Administrasi
                    </h3>
                  </div>
                  <div className="space-y-4">
                    <DocumentUploadRow
                      label="Modul Ajar / RPP Unit"
                      stage="modul"
                      documents={instrument.documents}
                      onUpload={handleUploadDocument}
                      onRemove={(docId) =>
                        patchInstrument({
                          documents: instrument.documents.filter((d) => d.id !== docId),
                        })
                      }
                    />
                    <DocumentUploadRow
                      label="Instrumen Asesmen"
                      stage="pra"
                      documents={instrument.documents}
                      onUpload={handleUploadDocument}
                      onRemove={(docId) =>
                        patchInstrument({
                          documents: instrument.documents.filter((d) => d.id !== docId),
                        })
                      }
                    />
                    <DocumentUploadRow
                      label="Media Pembelajaran"
                      stage="observasi"
                      documents={instrument.documents}
                      onUpload={handleUploadDocument}
                      onRemove={(docId) =>
                        patchInstrument({
                          documents: instrument.documents.filter((d) => d.id !== docId),
                        })
                      }
                    />
                  </div>
                </section>

                <div className="flex items-center justify-between pt-6 border-t border-gray-100 no-print">
                  <button
                    type="button"
                    onClick={() => setStage('pasca')}
                    className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 text-xs font-bold cursor-pointer"
                  >
                    <ArrowLeft size={14} /> Kembali ke Pasca-Observasi
                  </button>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleSaveSession()}
                      className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-50 transition-all shadow-sm cursor-pointer"
                    >
                      <Save size={15} /> SIMPAN DOKUMENTASI
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleSaveSession();
                        setStage('analysis');
                      }}
                      className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white rounded-xl text-xs font-bold hover:bg-brand-700 transition-all shadow-md shadow-brand-500/20 cursor-pointer"
                    >
                      SIMPAN &amp; LIHAT HASIL AKHIR <ArrowRight size={15} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {stage === 'analysis' && (
              <motion.div
                key="analysis"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-5 bg-white rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        Skor Rata-rata
                      </p>
                      <p className="text-3xl font-display font-bold text-brand-600 mt-1">
                        {scoreStats.avg.toFixed(2)}
                      </p>
                    </div>
                    <span className="text-[11px] font-bold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-lg border border-brand-100">
                      / 4.00
                    </span>
                  </div>

                  <div className="p-5 bg-white rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        Kategori Kelayakan
                      </p>
                      <p className="text-lg font-display font-bold text-emerald-700 mt-1">
                        {scoreStats.category}
                      </p>
                    </div>
                    <CheckCircle2 size={24} className="text-emerald-500 opacity-80" />
                  </div>

                  <div className="p-5 bg-white rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        Status Modul Ajar
                      </p>
                      <p className="text-base font-bold text-gray-800 mt-1">
                        {instrument.documents.some((d) => d.stage === 'modul')
                          ? 'Terlampir'
                          : 'Tersedia'}
                      </p>
                    </div>
                    <FileText size={24} className="text-blue-500 opacity-80" />
                  </div>

                  <div className="p-5 bg-white rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        Status Supervisi
                      </p>
                      <p className="text-base font-bold text-purple-700 mt-1">{status}</p>
                    </div>
                    <ShieldCheck size={24} className="text-purple-500 opacity-80" />
                  </div>
                </div>

                <section className="bg-white p-7 rounded-2xl border border-gray-200 shadow-sm space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                    <div>
                      <h3 className="font-display font-bold text-lg text-gray-900 flex items-center gap-2">
                        <Sparkles className="text-brand-600" size={20} /> Catatan Klinis &amp;
                        Rekomendasi Supervisi
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Tinjau atau lengkapi catatan kualitatif supervisor. Perubahan otomatis
                        tercermin pada dokumen laporan di bawah.
                      </p>
                    </div>
                    <button
                      id="btn-generate-klinis-ai"
                      type="button"
                      onClick={() => handleGenerateAi('all')}
                      disabled={isAiLoading}
                      className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer flex-shrink-0 active:scale-95"
                      title="Generate Rekomendasi & Catatan Klinis Komprehensif Berbasis AI"
                    >
                      {isAiLoading ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Sparkles size={16} />
                      )}
                      <span>
                        {isAiLoading
                          ? 'MENGHASILKAN DENGAN AI...'
                          : 'GENERATE CATATAN KLINIS AI'}
                      </span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <TextareaField
                      label="Analisis & Interpretasi Skor"
                      value={instrument.analysisScore}
                      onChange={(val) => patchInstrument({ analysisScore: val })}
                      placeholder="AI atau supervisor akan menganalisis distribusi skor..."
                    />
                    <TextareaField
                      label="Kekuatan Guru yang Teramati"
                      value={instrument.kekuatan}
                      onChange={(val) => patchInstrument({ kekuatan: val })}
                      placeholder="Praktik baik, kelebihan pedagogik dan interaksi kelas..."
                    />
                    <TextareaField
                      label="Area Perbaikan / Aspek Perlu Ditingkatkan"
                      value={instrument.perbaikan}
                      onChange={(val) => patchInstrument({ perbaikan: val })}
                      placeholder="Hal-hal yang membutuhkan peningkatan fokus..."
                    />
                    <TextareaField
                      label="Rekomendasi Spesifik & Solusi Tindak Lanjut"
                      value={instrument.rekomendasi}
                      onChange={(val) => patchInstrument({ rekomendasi: val })}
                      placeholder="Langkah terarah intervensi, coaching, atau pelatihan..."
                    />
                  </div>
                </section>

                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm no-print">
                  <div>
                    <h4 className="font-display font-bold text-base text-gray-900 flex items-center gap-2">
                      <FileText className="text-emerald-600" size={18} /> Dokumen Resmi Hasil
                      Supervisi
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Struktur dokumen identik dengan Laporan Hasil resmi Kurikulum Nasional
                      (Kop, Identitas, Tahap I-V, &amp; Pengesahan).
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleDownloadPdf}
                      disabled={isExportingPdf}
                      className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm disabled:opacity-50 cursor-pointer"
                      title="Unduh Format Dokumen PDF Resmi (A4)"
                    >
                      {isExportingPdf ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Download size={14} />
                      )}
                      <span>{isExportingPdf ? 'MEMPROSES...' : 'UNDUH PDF'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadWord}
                      className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                      title="Unduh Format Dokumen Word (.doc Editable)"
                    >
                      <FileText size={14} /> UNDUH WORD
                    </button>

                    <button
                      type="button"
                      onClick={handlePrint}
                      disabled={isPrinting}
                      className="flex items-center gap-1.5 px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-xl text-xs font-bold transition-all shadow-sm disabled:opacity-50 cursor-pointer"
                      title="Cetak Dokumen A4 Bersih"
                    >
                      {isPrinting ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Printer size={14} />
                      )}
                      <span>{isPrinting ? 'MEMPROSES...' : 'CETAK'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setPreviewStage('all');
                        setShowPreviewModal(true);
                      }}
                      className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
                      title="Buka Pratinjau Dokumen Layar Penuh"
                    >
                      <Eye size={14} /> PRATINJAU A4
                    </button>
                  </div>
                </div>

                {exportNotice && (
                  <div
                    className={`p-3.5 rounded-xl text-xs font-medium flex items-center justify-between border no-print transition-all ${
                      exportNotice.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : exportNotice.type === 'error'
                          ? 'bg-rose-50 text-rose-800 border-rose-200'
                          : 'bg-blue-50 text-blue-800 border-blue-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {exportNotice.type === 'success' && (
                        <CheckCircle2 size={16} className="text-emerald-600" />
                      )}
                      {exportNotice.type === 'error' && (
                        <AlertCircle size={16} className="text-rose-600" />
                      )}
                      {exportNotice.type === 'info' && (
                        <Loader2 size={16} className="animate-spin text-blue-600" />
                      )}
                      <span>{exportNotice.text}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setExportNotice(null)}
                      className="text-xs font-bold hover:opacity-75 cursor-pointer ml-4"
                    >
                      TUTUP
                    </button>
                  </div>
                )}

                <div className="bg-white p-8 md:p-14 rounded-2xl border border-gray-200 shadow-md max-w-4xl mx-auto w-full">
                  <ReportPreview
                    guru={activeGuru}
                    instrument={instrument}
                    rubricSections={rubricSections}
                    instrumentTitle={instrumentTitle}
                    innerRef={reportRef}
                  />
                </div>

                <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 no-print">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center flex-shrink-0">
                      <Save size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">Simpan Data Supervisi Guru</p>
                      <p className="text-xs text-gray-500">
                        Status saat ini:{' '}
                        <span className="font-bold text-brand-700">{status}</span>. Klik simpan
                        untuk memastikan data guru tersimpan permanen.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    <button
                      type="button"
                      onClick={() => handleSaveSession()}
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-300 text-gray-800 rounded-xl text-xs font-bold hover:bg-gray-50 transition-all shadow-sm cursor-pointer"
                    >
                      <Save size={16} /> SIMPAN PERUBAHAN
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveSession('Selesai')}
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 px-7 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
                    >
                      <CheckCircle2 size={16} /> SIMPAN &amp; TANDAI SELESAI
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <Suspense fallback={null}>
        {showPreviewModal && (
          <PreviewModal
            isOpen={showPreviewModal}
            onClose={() => setShowPreviewModal(false)}
            instrument={instrument}
            guru={activeGuru}
            stage={previewStage}
            rubricSections={rubricSections}
            instrumentTitle={instrumentTitle}
          />
        )}

        {showCustomizerModal && (
          <InstrumentCustomizerModal
            isOpen={showCustomizerModal}
            onClose={() => setShowCustomizerModal(false)}
            onSaved={refreshRubrics}
          />
        )}
      </Suspense>

      {showAddGuruModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 no-print animate-fade-in">
          <div
            className="absolute inset-0 bg-gray-900/50 backdrop-blur-xs"
            onClick={() => setShowAddGuruModal(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative z-10 overflow-hidden border border-gray-100"
          >
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <UserPlus size={18} />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-gray-900">
                    Tambah Guru Baru untuk Disupervisi
                  </h3>
                  <p className="text-xs text-gray-500">
                    Membuat sesi instrumen terpisah tanpa mengubah data guru lain.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddGuruModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateIsolatedGuru} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Nama Lengkap &amp; Gelar Guru *
                </label>
                <input
                  type="text"
                  required
                  value={newGuruForm.nama}
                  onChange={(e) => setNewGuruForm({ ...newGuruForm, nama: e.target.value })}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-sm font-semibold"
                  placeholder="Contoh: Dra. Hj. Siti Aminah, M.Pd."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                    NIP (Opsional)
                  </label>
                  <input
                    type="text"
                    value={newGuruForm.nip}
                    onChange={(e) => setNewGuruForm({ ...newGuruForm, nip: e.target.value })}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-sm"
                    placeholder="1980XXXX..."
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Status Kepegawaian
                  </label>
                  <select
                    value={newGuruForm.status}
                    onChange={(e) => setNewGuruForm({ ...newGuruForm, status: e.target.value })}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-sm"
                  >
                    <option value="ASN">ASN</option>
                    <option value="P3K">P3K</option>
                    <option value="Non-ASN">Non-ASN / Honorer</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Mata Pelajaran *
                  </label>
                  <input
                    type="text"
                    required
                    value={newGuruForm.mapel}
                    onChange={(e) => setNewGuruForm({ ...newGuruForm, mapel: e.target.value })}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-sm"
                    placeholder="Contoh: Bahasa Inggris"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Kelas / Fase
                  </label>
                  <input
                    type="text"
                    value={newGuruForm.kelas}
                    onChange={(e) => setNewGuruForm({ ...newGuruForm, kelas: e.target.value })}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-sm"
                    placeholder="Contoh: XI-F 1"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Pangkat / Golongan Ruang
                </label>
                <input
                  type="text"
                  value={newGuruForm.pangkat}
                  onChange={(e) => setNewGuruForm({ ...newGuruForm, pangkat: e.target.value })}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-sm"
                  placeholder="Contoh: Pembina / IVa (atau kosongkan)"
                />
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800">
                <p className="font-semibold flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                  Keamanan Data Terjamin:
                </p>
                <p className="mt-0.5 text-emerald-700">
                  Guru baru akan mendapatkan formulir supervisi dan laporan terpisah. Guru yang
                  sudah disupervisi sebelumnya ({activeGuru?.nama || 'Guru Sebelumnya'}) tetap
                  tersimpan 100% utuh beserta nilai dan laporannya.
                </p>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddGuruModal(false)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50 text-xs transition-all cursor-pointer"
                >
                  BATAL
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl font-bold shadow-md shadow-emerald-500/20 hover:bg-emerald-700 text-xs transition-all cursor-pointer"
                >
                  BUAT &amp; MULAI SUPERVISI
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
