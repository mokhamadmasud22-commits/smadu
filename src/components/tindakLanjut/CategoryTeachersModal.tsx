import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Edit3,
  ExternalLink,
  Lightbulb,
  Plus,
  Printer,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import { motion } from 'motion/react';
import { PROBLEM_CATEGORIES } from '../../constants/followUp';
import type { AffectedTeacherItem } from '../../types/supervision';

interface CategoryTeachersModalProps {
  selectedCategory: string;
  onSelectCategory: (categoryName: string) => void;
  categoryMap: Record<string, AffectedTeacherItem[]>;
  teachers: AffectedTeacherItem[];
  isExportingPdf: boolean;
  onExportPdf: () => void;
  onClose: () => void;
  onAssignTeacher: (categoryName: string) => void;
  onOpenSupervisi: (supervisiId?: string, guruId?: string) => void;
  onFollowUpTeacher: (teacher: AffectedTeacherItem) => void;
}

export default function CategoryTeachersModal({
  selectedCategory,
  onSelectCategory,
  categoryMap,
  teachers,
  isExportingPdf,
  onExportPdf,
  onClose,
  onAssignTeacher,
  onOpenSupervisi,
  onFollowUpTeacher,
}: CategoryTeachersModalProps) {
  const categoryDef = PROBLEM_CATEGORIES.find((c) => c.name === selectedCategory);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-gray-950/60 backdrop-blur-xs overflow-y-auto no-print">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-gray-100 flex flex-col max-h-[90vh] my-4 overflow-hidden"
      >
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-brand-950 to-indigo-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center shrink-0">
              <ShieldCheck size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-amber-400 text-gray-950">
                  PETA GURU &amp; KEBUTUHAN PEMBINAAN
                </span>
                <span className="text-xs text-slate-300">Supervisi Klinis</span>
              </div>
              <h3 className="text-lg font-display font-bold text-white mt-0.5">
                Daftar Guru dengan Kendala:{' '}
                <span className="text-amber-300">{selectedCategory}</span>
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onExportPdf}
              disabled={isExportingPdf}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold disabled:opacity-50"
              title="Cetak & Unduh Dokumen PDF Resmi (A4)"
            >
              <Download size={15} />
              <span>{isExportingPdf ? 'Membuat PDF...' : 'Unduh PDF'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              title="Tutup Modal"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="px-6 py-3 bg-gray-50/95 border-b border-gray-200/80 overflow-x-auto shrink-0 flex items-center gap-2 no-scrollbar">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap mr-1">
            Pilih Masalah:
          </span>
          {PROBLEM_CATEGORIES.map((cat, idx) => {
            const count = categoryMap[cat.name]?.length || 0;
            const isSelected = selectedCategory === cat.name;
            return (
              <button
                key={cat.name}
                type="button"
                onClick={() => onSelectCategory(cat.name)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
                  isSelected
                    ? 'bg-amber-600 text-white shadow-xs ring-2 ring-amber-600/20'
                    : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
                }`}
              >
                <span>
                  #{idx + 1} {cat.shortName}
                </span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                    isSelected ? 'bg-amber-700 text-amber-100' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="px-6 py-3.5 bg-amber-50/70 border-b border-amber-200/60 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start gap-2.5">
            <Lightbulb size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-950">
                Rekomendasi Rencana Aksi Kolektif Sekolah:
              </p>
              <p className="text-amber-900/90 text-[11px] mt-0.5">
                {categoryDef?.solusiIHT ||
                  'Pendampingan klinis dan peer coaching MGMP/Kombel sekolah.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-semibold text-amber-900 bg-amber-100/80 px-2.5 py-1 rounded-lg">
              Total:{' '}
              <strong className="text-amber-950 font-bold">{teachers.length} Guru</strong>
            </span>
          </div>
        </div>

        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {teachers.length > 0 ? (
            <div className="space-y-3.5">
              {teachers.map((teacher, idx) => (
                <div
                  key={teacher.id || idx}
                  className="p-4 bg-white rounded-xl border border-gray-200 hover:border-brand-300 hover:shadow-md transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-sm shrink-0">
                        {teacher.guruNama ? teacher.guruNama.slice(0, 2).toUpperCase() : 'G'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-gray-900 text-sm">{teacher.guruNama}</h4>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs font-semibold text-brand-700">
                            {teacher.mapel}
                          </span>
                          {teacher.kelas && teacher.kelas !== '-' && (
                            <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-600 text-[11px] font-medium">
                              Kelas {teacher.kelas}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-0.5 flex-wrap">
                          {teacher.guruNip && teacher.guruNip !== '-' && (
                            <span className="font-mono">NIP. {teacher.guruNip}</span>
                          )}
                          {teacher.tglSupervisi && (
                            <span>• Tanggal Observasi: {teacher.tglSupervisi}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                          teacher.source === 'supervisi'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}
                      >
                        {teacher.source === 'supervisi'
                          ? '🔍 Observasi Supervisi'
                          : '📋 Catatan Tindak Lanjut'}
                      </span>
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                          teacher.status === 'Terealisasi'
                            ? 'bg-emerald-100 text-emerald-800'
                            : teacher.status === 'Dipantau'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {teacher.status}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-rose-50/70 rounded-xl border border-rose-100 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 text-rose-800 font-bold text-[11px] uppercase tracking-wide">
                      <AlertTriangle size={13} className="text-rose-600" />
                      <span>Catatan Temuan / Kendala Kelas:</span>
                    </div>
                    <p className="text-gray-800 leading-relaxed font-medium">
                      {teacher.detailMasalah}
                    </p>
                    {teacher.skorRubrik && (
                      <p className="text-[11px] text-rose-700 font-bold mt-1">
                        ⚠️ {teacher.skorRubrik}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-1">
                      <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                        Rencana Intervensi Pedagogik:
                      </span>
                      <p className="font-semibold text-gray-800">
                        {teacher.intervensi || 'Pendampingan Modul & Simulasi'}
                      </p>
                    </div>
                    <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 space-y-1">
                      <div className="flex items-center gap-1 text-indigo-700 font-bold text-[11px]">
                        <Sparkles size={12} />
                        <span>Smart Rekomendasi Solusi:</span>
                      </div>
                      <p className="text-[11px] text-gray-600 leading-relaxed">
                        {teacher.smartRekomendasi}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                    {teacher.supervisiId && (
                      <button
                        type="button"
                        onClick={() => onOpenSupervisi(teacher.supervisiId, teacher.guruId)}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-brand-50 text-gray-700 hover:text-brand-700 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <ExternalLink size={13} />
                        <span>Buka Sesi Supervisi</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onFollowUpTeacher(teacher)}
                      className="px-3.5 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                    >
                      <Edit3 size={13} />
                      <span>
                        {teacher.tindakLanjutItem
                          ? 'Edit Tindak Lanjut'
                          : 'Tindak Lanjuti Guru Ini'}
                      </span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 px-6 text-center space-y-4 bg-gray-50/70 rounded-2xl border border-dashed border-gray-300">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 size={32} />
              </div>
              <div className="max-w-md mx-auto space-y-1.5">
                <h4 className="font-bold text-gray-900 text-base">
                  Belum Ada Guru Teridentifikasi Kendala
                </h4>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Saat ini belum ada guru yang teridentifikasi mengalami kendala pada aspek{' '}
                  <strong className="text-gray-800">{selectedCategory}</strong> (semua guru yang
                  telah disupervisi memenuhi standar minimal atau belum ada catatan observasi
                  khusus).
                </p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => onAssignTeacher(selectedCategory)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md shadow-amber-600/20 transition-all cursor-pointer"
                >
                  <Plus size={15} />
                  <span>Tetapkan Guru untuk Pembinaan Aspek Ini</span>
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200/80 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => onAssignTeacher(selectedCategory)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-700 hover:text-brand-900 cursor-pointer"
          >
            <Plus size={15} />
            <span>+ Tambahkan Guru Baru ke Aspek Ini</span>
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onExportPdf}
              disabled={isExportingPdf}
              className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-600/20 cursor-pointer flex items-center gap-2 disabled:opacity-50"
              title="Cetak dan Unduh Dokumen PDF Resmi (A4)"
            >
              <Download size={15} />
              <span>{isExportingPdf ? 'Menyusun PDF...' : 'Cetak Daftar (PDF)'}</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="px-3 py-2.5 bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
              title="Cetak langsung via dialog browser"
            >
              <Printer size={14} />
              <span className="hidden sm:inline">Print</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
