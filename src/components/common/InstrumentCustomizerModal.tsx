import {
  AlertCircle,
  Check,
  CheckCircle2,
  Download,
  Edit3,
  FileText,
  Layers,
  Plus,
  RotateCcw,
  Sliders,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { motion } from 'motion/react';
import type { ChangeEvent, DragEvent } from 'react';
import { useRef, useState } from 'react';
import {
  CSV_TEMPLATE_CONTENT,
  DEFAULT_INSTRUMENT_TITLE,
  PRESET_INSTRUMENTS,
  getJsonTemplateContent,
} from '../../constants/rubrics';
import { useRubricConfig } from '../../hooks/useRubricConfig';
import { getEffectiveAcademicYear } from '../../services/storage';
import type { RubricSection } from '../../types/supervision';
import { triggerTextFileDownload } from '../../utils/id';
import { parseImportedInstrument } from '../../utils/rubricParser';
import { countRubricItems } from '../../utils/score';

interface InstrumentCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

type ModalTab = 'import' | 'presets' | 'editor';

interface ParsedPreviewState {
  sections?: RubricSection[];
  name?: string;
  count: number;
  error?: string;
}

export default function InstrumentCustomizerModal({
  isOpen,
  onClose,
  onSaved,
}: InstrumentCustomizerModalProps) {
  const {
    rubricSections: initialSections,
    instrumentTitle: initialTitle,
    saveConfig,
    resetConfig,
  } = useRubricConfig();

  const [activeTab, setActiveTab] = useState<ModalTab>('import');
  const [pasteFormat, setPasteFormat] = useState<'csv' | 'json'>('csv');
  const [pasteText, setPasteText] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [parsedPreview, setParsedPreview] = useState<ParsedPreviewState | null>(null);
  const [editorSections, setEditorSections] = useState<RubricSection[]>(() => initialSections);
  const [editorTitle, setEditorTitle] = useState<string>(() => initialTitle);
  const [bannerMsg, setBannerMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const showNotice = (msg: string) => {
    setBannerMsg(msg);
    setTimeout(() => setBannerMsg(null), 3500);
  };

  const processFile = (file: File) => {
    const format: 'csv' | 'json' =
      file.name.endsWith('.json') || file.type.includes('json') ? 'json' : 'csv';
    setPasteFormat(format);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result;
      if (typeof content === 'string') {
        const res = parseImportedInstrument(content, format);
        if (res.success && res.sections) {
          setParsedPreview({
            sections: res.sections,
            name: res.name || file.name.replace(/\.[^/.]+$/, ''),
            count: res.count,
          });
        } else {
          setParsedPreview({
            count: 0,
            error: res.error || 'Format file tidak dapat dibaca.',
          });
        }
      }
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleValidatePaste = () => {
    if (!pasteText.trim()) {
      showNotice('Silakan tempel (paste) data CSV atau JSON terlebih dahulu.');
      return;
    }
    const res = parseImportedInstrument(pasteText, pasteFormat);
    if (res.success && res.sections) {
      setParsedPreview({
        sections: res.sections,
        name: res.name || 'Instrumen Hasil Tempel',
        count: res.count,
      });
      showNotice(`Berhasil membaca ${res.count} indikator!`);
    } else {
      setParsedPreview({
        count: 0,
        error: res.error || 'Format teks tidak valid.',
      });
    }
  };

  const handleApplyImported = () => {
    if (!parsedPreview?.sections || parsedPreview.sections.length === 0) return;
    const title = parsedPreview.name || 'Instrumen Kustom Sekolah';
    saveConfig(parsedPreview.sections, title);
    setEditorSections(parsedPreview.sections);
    setEditorTitle(title);
    showNotice(`Instrumen berhasil diubah (${parsedPreview.count} indikator aktif)`);
    onSaved();
    setTimeout(() => onClose(), 1000);
  };

  const handleApplyPreset = (presetId: string) => {
    const preset = PRESET_INSTRUMENTS.find((p) => p.id === presetId);
    if (!preset) return;
    saveConfig(preset.sections, preset.name);
    setEditorSections(preset.sections);
    setEditorTitle(preset.name);
    showNotice(`Preset "${preset.name}" berhasil diterapkan!`);
    onSaved();
    setTimeout(() => onClose(), 900);
  };

  const handleResetDefault = () => {
    if (
      window.confirm(
        'Kembalikan instrumen ke standar awal (Standar Nasional & Deep Learning)?',
      )
    ) {
      resetConfig();
      const defaultPreset = PRESET_INSTRUMENTS[0];
      setEditorSections(defaultPreset.sections);
      setEditorTitle(DEFAULT_INSTRUMENT_TITLE);
      setParsedPreview(null);
      showNotice('Instrumen dikembalikan ke pengaturan standar.');
      onSaved();
    }
  };

  const handleAddSection = () => {
    const newSection: RubricSection = {
      id: `sec_${Date.now()}`,
      title: `BAGIAN BARU ${editorSections.length + 1}`,
      items: [
        {
          id: `item_${Date.now()}_1`,
          label: 'Indikator Baru',
          desc: 'Deskripsi fokus pengamatan indikator pembelajaran.',
        },
      ],
    };
    setEditorSections((prev) => [...prev, newSection]);
  };

  const handleRemoveSection = (sectionIndex: number) => {
    if (editorSections.length <= 1) {
      showNotice('Minimal harus terdapat satu bagian instrumen.');
      return;
    }
    setEditorSections((prev) => prev.filter((_, idx) => idx !== sectionIndex));
  };

  const handleUpdateSectionTitle = (sectionIndex: number, title: string) => {
    setEditorSections((prev) =>
      prev.map((sec, idx) => (idx === sectionIndex ? { ...sec, title } : sec)),
    );
  };

  const handleAddIndicator = (sectionIndex: number) => {
    setEditorSections((prev) =>
      prev.map((sec, idx) =>
        idx === sectionIndex
          ? {
              ...sec,
              items: [
                ...sec.items,
                {
                  id: `itm_${Date.now()}`,
                  label: 'Indikator Fokus Baru',
                  desc: 'Uraian pengamatan kinerja pembelajaran di kelas.',
                },
              ],
            }
          : sec,
      ),
    );
  };

  const handleRemoveIndicator = (sectionIndex: number, itemIndex: number) => {
    const targetSection = editorSections[sectionIndex];
    if (targetSection.items.length <= 1) {
      showNotice('Setiap bagian harus memiliki minimal 1 indikator.');
      return;
    }
    setEditorSections((prev) =>
      prev.map((sec, idx) =>
        idx === sectionIndex
          ? { ...sec, items: sec.items.filter((_, iIdx) => iIdx !== itemIndex) }
          : sec,
      ),
    );
  };

  const handleUpdateIndicator = (
    sectionIndex: number,
    itemIndex: number,
    field: 'label' | 'desc',
    value: string,
  ) => {
    setEditorSections((prev) =>
      prev.map((sec, idx) =>
        idx === sectionIndex
          ? {
              ...sec,
              items: sec.items.map((itm, iIdx) =>
                iIdx === itemIndex ? { ...itm, [field]: value } : itm,
              ),
            }
          : sec,
      ),
    );
  };

  const handleSaveEditor = () => {
    saveConfig(editorSections, editorTitle);
    showNotice('Seluruh perubahan indikator instrumen tersimpan.');
    onSaved();
    setTimeout(() => onClose(), 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto no-print">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-gray-100 flex flex-col max-h-[92vh] overflow-hidden"
      >
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center shadow-md shadow-brand-500/20">
              <Sliders size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-display font-bold text-gray-900">
                  Kustomisasi Instrumen Supervisi Sekolah
                </h2>
                <span className="px-2 py-0.5 rounded-md bg-brand-100 text-brand-700 text-[10px] font-bold uppercase tracking-wider">
                  Fleksibel
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Sesuaikan aspek dan indikator pengamatan kelas sesuai Kurikulum Nasional,
                Kurikulum Merdeka, atau standar sekolah Anda.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex border-b border-gray-200 bg-white px-6 gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('import')}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'import'
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Upload size={15} />
            <span>1. Import Data (CSV / Excel / JSON)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('presets')}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'presets'
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Layers size={15} />
            <span>2. Preset Standar Sekolah</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('editor')}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'editor'
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Edit3 size={15} />
            <span>3. Editor Visual Indikator</span>
          </button>
        </div>

        {bannerMsg && (
          <div className="bg-emerald-500 text-white text-xs font-bold px-6 py-2 flex items-center justify-between shadow-sm">
            <span className="flex items-center gap-2">
              <Check size={16} /> {bannerMsg}
            </span>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          {activeTab === 'import' && (
            <div className="space-y-6">
              <div className="bg-blue-50/80 border border-blue-200/80 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-blue-100 text-blue-700 mt-0.5">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-blue-950">
                      Unduh Format Template Instrumen
                    </h4>
                    <p className="text-xs text-blue-700/90 leading-relaxed max-w-xl mt-0.5">
                      Anda dapat mengisi indikator supervisi sekolah menggunakan{' '}
                      <strong>Microsoft Excel</strong> atau <strong>Google Sheets</strong> (ekspor
                      CSV), kemudian langsung upload ke sistem.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      triggerTextFileDownload(
                        'template-instrumen-supervisi.csv',
                        CSV_TEMPLATE_CONTENT,
                        'text/csv;charset=utf-8;',
                      )
                    }
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-blue-300 text-blue-700 hover:bg-blue-100/50 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer whitespace-nowrap"
                  >
                    <Download size={14} /> Template CSV (Excel)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      triggerTextFileDownload(
                        'template-instrumen-supervisi.json',
                        getJsonTemplateContent(),
                        'application/json',
                      )
                    }
                    className="flex items-center gap-1.5 px-3 py-2 bg-white border border-blue-300 text-blue-700 hover:bg-blue-100/50 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer whitespace-nowrap"
                  >
                    <Download size={14} /> Template JSON
                  </button>
                </div>
              </div>

              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer bg-white ${
                  isDragging
                    ? 'border-brand-500 bg-brand-50/50 scale-[1.01]'
                    : 'border-gray-300 hover:border-brand-400 hover:bg-slate-50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.json,.txt"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="w-14 h-14 mx-auto rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mb-3">
                  <Upload size={28} />
                </div>
                <p className="text-sm font-bold text-gray-800">
                  Klik untuk pilih file atau tarik & lepas (drag-and-drop) di sini
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Mendukung file format <strong>.CSV (Kategori, Indikator, Deskripsi)</strong> atau{' '}
                  <strong>.JSON</strong>
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                    <span>Atau Tempel (Paste) Data Teks Langsung</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPasteFormat('csv')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${
                        pasteFormat === 'csv'
                          ? 'bg-brand-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      Format CSV
                    </button>
                    <button
                      type="button"
                      onClick={() => setPasteFormat('json')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${
                        pasteFormat === 'json'
                          ? 'bg-brand-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      Format JSON
                    </button>
                  </div>
                </div>

                <textarea
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder={
                    pasteFormat === 'csv'
                      ? 'Kategori,Indikator,Deskripsi\nA. PENDAHULUAN,Apersepsi & Motivasi,Menyiapkan fisik dan psikis siswa\nB. INTI,Penguasaan Materi,Menjelaskan konsep esensial...'
                      : '{\n  "instrumentName": "Instrumen Khusus Sekolah",\n  "sections": [...]\n}'
                  }
                  rows={4}
                  className="w-full p-3 font-mono text-xs bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:bg-white resize-none"
                />

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleValidatePaste}
                    className="px-4 py-2 bg-gray-800 text-white rounded-xl text-xs font-bold hover:bg-black transition-all cursor-pointer"
                  >
                    Periksa & Validasi Teks
                  </button>
                </div>
              </div>

              {parsedPreview && (
                <div
                  className={`p-5 rounded-2xl border transition-all ${
                    parsedPreview.error
                      ? 'bg-rose-50 border-rose-200 text-rose-800'
                      : 'bg-emerald-50/90 border-emerald-200 text-emerald-950'
                  }`}
                >
                  {parsedPreview.error ? (
                    <div className="flex items-start gap-3">
                      <AlertCircle className="text-rose-600 shrink-0 mt-0.5" size={20} />
                      <div>
                        <h4 className="text-sm font-bold text-rose-900">Gagal Memproses Data</h4>
                        <p className="text-xs text-rose-700 mt-0.5">{parsedPreview.error}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-200/80 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="text-emerald-600" size={18} />
                            <h4 className="text-sm font-bold text-emerald-950">
                              Data Instrumen Siap Diterapkan!
                            </h4>
                          </div>
                          <p className="text-xs text-emerald-700 mt-0.5">
                            Nama: <strong>{parsedPreview.name}</strong> • Terdeteksi{' '}
                            <strong>{parsedPreview.sections?.length} Bagian</strong> (
                            {parsedPreview.count} Total Indikator)
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={handleApplyImported}
                          className="px-5 py-2.5 bg-emerald-700 text-white hover:bg-emerald-800 rounded-xl text-xs font-bold shadow-md shadow-emerald-700/20 transition-all cursor-pointer whitespace-nowrap"
                        >
                          Terapkan & Simpan Instrumen Ini
                        </button>
                      </div>

                      <div className="max-h-56 overflow-y-auto space-y-3 pr-2">
                        {parsedPreview.sections?.map((sec, sIdx) => (
                          <div
                            key={sec.id || sIdx}
                            className="bg-white/80 p-3 rounded-xl border border-emerald-100"
                          >
                            <p className="text-xs font-bold text-gray-900 mb-1.5 uppercase">
                              {sec.title}
                            </p>
                            <ul className="space-y-1 text-xs text-gray-600">
                              {sec.items.map((item, iIdx) => (
                                <li key={item.id || iIdx} className="flex items-start gap-2">
                                  <span className="text-brand-600 font-bold">•</span>
                                  <span>
                                    <strong className="text-gray-900">{item.label}:</strong>{' '}
                                    {item.desc}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'presets' && (
            <div className="space-y-4">
              <p className="text-xs text-gray-500">
                Pilih preset yang telah disesuaikan dengan kerangka kebijakan pendidikan terbaru,
                atau pilih preset untuk segera diadaptasi:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {PRESET_INSTRUMENTS.map((preset) => {
                  const totalItems = countRubricItems(preset.sections);
                  const isCurrent = editorTitle === preset.name;
                  return (
                    <div
                      key={preset.id}
                      className={`p-5 rounded-2xl border transition-all flex flex-col justify-between bg-white ${
                        isCurrent
                          ? 'border-brand-500 ring-2 ring-brand-400/20 shadow-md'
                          : 'border-gray-200 hover:border-brand-300 hover:shadow-sm'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="px-2.5 py-0.5 rounded-md bg-brand-50 text-brand-700 text-[10px] font-bold">
                            {preset.badge}
                          </span>
                          <span className="text-[11px] font-semibold text-gray-400">
                            {totalItems} Indikator ({preset.sections.length} Aspek)
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-gray-900 mb-1">{preset.name}</h4>
                        <p className="text-xs text-gray-500 leading-relaxed mb-4">
                          {preset.description}
                        </p>
                        <div className="bg-slate-50 p-3 rounded-xl border border-gray-100 space-y-1 mb-4 text-[11px] text-gray-600">
                          {preset.sections.map((sec, idx) => (
                            <div key={sec.id || idx} className="truncate">
                              <strong>{sec.title.split('(')[0].trim()}:</strong> {sec.items.length}{' '}
                              Indikator
                            </div>
                          ))}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleApplyPreset(preset.id)}
                        className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          isCurrent
                            ? 'bg-brand-50 text-brand-700 border border-brand-200'
                            : 'bg-brand-600 text-white hover:bg-brand-700 shadow-sm'
                        }`}
                      >
                        {isCurrent ? <Check size={14} /> : <Sparkles size={14} />}
                        <span>{isCurrent ? 'Preset Aktif Saat Ini' : 'Terapkan Preset Ini'}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'editor' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-200">
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                    Nama / Judul Instrumen Supervisi
                  </label>
                  <input
                    type="text"
                    value={editorTitle}
                    onChange={(e) => setEditorTitle(e.target.value)}
                    className="w-full font-bold text-sm text-gray-900 bg-transparent border-b border-gray-200 pb-1 focus:outline-none focus:border-brand-600"
                    placeholder="Contoh: Instrumen Supervisi Klinis 2026/2027"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAddSection}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-brand-50 text-brand-700 hover:bg-brand-100 border border-brand-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    <Plus size={14} /> Tambah Bagian Aspek
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                {editorSections.map((sec, sIdx) => (
                  <div
                    key={sec.id || sIdx}
                    className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden"
                  >
                    <div className="p-4 bg-slate-50 border-b border-gray-100 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 flex-1">
                        <span className="w-6 h-6 rounded-lg bg-gray-200 text-gray-700 text-xs font-bold flex items-center justify-center">
                          {sIdx + 1}
                        </span>
                        <input
                          type="text"
                          value={sec.title}
                          onChange={(e) => handleUpdateSectionTitle(sIdx, e.target.value)}
                          className="font-bold text-xs text-gray-900 bg-transparent focus:outline-none focus:bg-white px-2 py-1 rounded border border-transparent focus:border-gray-300 flex-1 uppercase"
                          placeholder="Judul Bagian / Aspek Supervisi"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleAddIndicator(sIdx)}
                          className="flex items-center gap-1 px-2.5 py-1 bg-white border border-gray-200 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-50 transition-all cursor-pointer"
                          title="Tambah Indikator ke bagian ini"
                        >
                          <Plus size={13} /> Indikator
                        </button>
                        {editorSections.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveSection(sIdx)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Hapus bagian ini"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="p-4 divide-y divide-gray-100 space-y-3">
                      {sec.items.map((item, iIdx) => (
                        <div key={item.id || iIdx} className="pt-3 first:pt-0 flex items-start gap-3 group">
                          <span className="text-xs font-bold text-gray-400 mt-2">
                            {sIdx + 1}.{iIdx + 1}
                          </span>
                          <div className="flex-1 space-y-2">
                            <input
                              type="text"
                              value={item.label}
                              onChange={(e) =>
                                handleUpdateIndicator(sIdx, iIdx, 'label', e.target.value)
                              }
                              placeholder="Nama Fokus Indikator"
                              className="w-full text-xs font-bold text-gray-900 px-3 py-1.5 bg-slate-50 border border-gray-200 rounded-lg focus:outline-none focus:bg-white focus:ring-1 focus:ring-brand-500"
                            />
                            <textarea
                              value={item.desc}
                              onChange={(e) =>
                                handleUpdateIndicator(sIdx, iIdx, 'desc', e.target.value)
                              }
                              placeholder="Uraian indikator yang dinilai supervisor (Skor 1-4)..."
                              rows={2}
                              className="w-full text-xs text-gray-600 px-3 py-1.5 bg-slate-50 border border-gray-200 rounded-lg focus:outline-none focus:bg-white focus:ring-1 focus:ring-brand-500 resize-none"
                            />
                          </div>
                          {sec.items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveIndicator(sIdx, iIdx)}
                              className="p-1.5 text-gray-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer mt-1 opacity-60 group-hover:opacity-100"
                              title="Hapus indikator"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleSaveEditor}
                  className="flex items-center gap-2 px-6 py-2.5 bg-brand-600 text-white rounded-xl text-xs font-bold hover:bg-brand-700 shadow-md shadow-brand-500/20 transition-all cursor-pointer"
                >
                  <Check size={16} /> Simpan Perubahan Indikator
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-white">
          <button
            type="button"
            onClick={handleResetDefault}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-rose-600 font-bold transition-colors cursor-pointer"
          >
            <RotateCcw size={14} /> Reset ke Instrumen Standar Awal
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                const payload = {
                  instrumentName: editorTitle,
                  academicYear: getEffectiveAcademicYear(),
                  sections: editorSections,
                };
                triggerTextFileDownload(
                  `instrumen-supervisi-${editorTitle.toLowerCase().replace(/[^a-z0-9]/g, '-')}.json`,
                  JSON.stringify(payload, null, 2),
                  'application/json',
                );
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              title="Ekspor instrumen ini sebagai file cadangan JSON"
            >
              <Download size={14} /> Cadangkan (JSON)
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
