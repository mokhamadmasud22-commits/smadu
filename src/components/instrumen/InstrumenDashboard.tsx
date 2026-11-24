import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Download,
  Plus,
  Trash2,
  Upload,
  X,
  XCircle,
} from 'lucide-react';
import { motion } from 'motion/react';
import type { ChangeEvent, FormEvent } from 'react';
import { useEffect, useState } from 'react';
import {
  SCHOOL_LEVELS,
  STATUS_KEPEGAWAIAN_OPTIONS,
} from '../../constants/school';
import { useSchoolConfig } from '../../hooks/useSchoolConfig';
import type {
  ActiveTab,
  Guru,
  ImportedScheduleRow,
  SupervisionSession,
  ToastNotice,
} from '../../types/supervision';
import {
  downloadScheduleTemplateExcel,
  parseScheduleExcelFile,
} from '../../utils/exportExcel';
import { generateUUID } from '../../utils/id';

interface InstrumenDashboardProps {
  setSelectedSupervisiId: (id: string | null) => void;
  setActiveTab: (tab: ActiveTab) => void;
  gurus: Guru[];
  supervisions: SupervisionSession[];
  onAdd: (guruId: string) => void;
  onDelete?: (id: string) => void;
  onImportSchedules?: (rows: ImportedScheduleRow[]) => void;
  onAddGuru?: (guru: Guru, openImmediately?: boolean) => void;
}

interface DeleteTarget {
  id: string;
  guruNama: string;
  mapel: string;
}

export default function InstrumenDashboard({
  setSelectedSupervisiId,
  setActiveTab,
  gurus,
  supervisions,
  onAdd,
  onDelete,
  onImportSchedules,
  onAddGuru,
}: InstrumenDashboardProps) {
  const { config: schoolConfig } = useSchoolConfig();
  const [notice, setNotice] = useState<ToastNotice | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedGuruId, setSelectedGuruId] = useState<string>(() => gurus[0]?.id || '');
  const [createNewTeacherMode, setCreateNewTeacherMode] = useState(gurus.length === 0);
  const [newGuruForm, setNewGuruForm] = useState({
    nama: '',
    nip: '',
    mapel: '',
    jenjang: schoolConfig.schoolLevel || 'SMA',
    status: 'ASN',
  });

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 5000);
    return () => clearTimeout(timer);
  }, [notice]);

  const handleDownloadTemplate = async () => {
    try {
      await downloadScheduleTemplateExcel();
      setNotice({
        text: 'Template Jadwal Supervisi berhasil diunduh!',
        type: 'success',
      });
    } catch (err) {
      console.error(err);
      setNotice({
        text: 'Gagal mengunduh template Excel jadwal supervisi.',
        type: 'error',
      });
    }
  };

  const handleImportExcel = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const parsed = await parseScheduleExcelFile(file);
      if (parsed.length > 0) {
        onImportSchedules?.(parsed);
        setNotice({
          text: `Berhasil mengimpor ${parsed.length} jadwal supervisi klinis baru!`,
          type: 'success',
        });
      } else {
        setNotice({
          text: 'Kolom template kosong atau tidak valid. Mohon lengkapi Nama Guru dan Mata Pelajaran.',
          type: 'error',
        });
      }
    } catch (err) {
      console.error(err);
      setNotice({
        text: 'Gagal memproses file Excel. Mohon periksa file Anda kembali.',
        type: 'error',
      });
    } finally {
      e.target.value = '';
    }
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget || !onDelete) return;
    onDelete(deleteTarget.id);
    setNotice({
      text: `Jadwal supervisi untuk ${deleteTarget.guruNama} berhasil dihapus.`,
      type: 'success',
    });
    setDeleteTarget(null);
  };

  const handleCreateNewGuruSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!newGuruForm.nama.trim() || !newGuruForm.mapel.trim()) return;
    const created: Guru = {
      id: generateUUID(),
      nama: newGuruForm.nama.trim(),
      nip: newGuruForm.nip.trim() || '-',
      pangkat: '-',
      mapel: newGuruForm.mapel.trim(),
      jenjang: newGuruForm.jenjang,
      status: newGuruForm.status,
    };
    if (onAddGuru) {
      onAddGuru(created, true);
    } else {
      onAdd(created.id);
    }
    setShowCreateModal(false);
    setNewGuruForm({
      nama: '',
      nip: '',
      mapel: '',
      jenjang: schoolConfig.schoolLevel || 'SMA',
      status: 'ASN',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-4 text-neutral-900">
        <div>
          <h2 className="text-2xl font-display font-bold">Dasbor Jadwal Supervisi Klinis</h2>
          <p className="text-neutral-500 text-sm">
            Kelola daftar supervisi aktif di lingkungan{' '}
            {schoolConfig.isDinasPendidikan
              ? 'Dinas Pendidikan Kabupaten Bojonegoro'
              : 'Cabdindik Wilayah Bojonegoro'}
            .
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer uppercase tracking-wide"
            title="Unduh Format Pengisian Jadwal"
          >
            <Download size={14} /> Template Jadwal
          </button>

          <label
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer uppercase tracking-wide"
            title="Impor Jadwal dari File Excel"
          >
            <Upload size={14} /> Impor Jadwal
            <input
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleImportExcel}
              className="hidden"
            />
          </label>

          <button
            type="button"
            onClick={() => {
              setSelectedGuruId(gurus[0]?.id || '');
              setCreateNewTeacherMode(gurus.length === 0);
              setShowCreateModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-[#2563eb] text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/20 hover:bg-[#1e40af] transition-colors cursor-pointer uppercase"
          >
            <Plus size={16} /> BUAT SUPERVISI BARU
          </button>
        </div>
      </div>

      {notice && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex items-center gap-2.5 p-3 rounded-xl text-xs font-semibold border ${
            notice.type === 'success'
              ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
              : 'bg-red-50 border-red-100 text-red-800'
          }`}
        >
          {notice.type === 'success' ? (
            <CheckCircle2 className="text-emerald-500 flex-shrink-0" size={16} />
          ) : (
            <XCircle className="text-red-500 flex-shrink-0" size={16} />
          )}
          <span>{notice.text}</span>
        </motion.div>
      )}

      <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-200">
              <th className="px-6 py-4 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                Guru / Mapel
              </th>
              <th className="px-6 py-4 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                Kelas
              </th>
              <th className="px-6 py-4 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                Tahap Aktif
              </th>
              <th className="px-6 py-4 text-[10px] font-bold text-neutral-400 uppercase tracking-widest text-center">
                Hasil
              </th>
              <th className="px-6 py-4 text-[10px] font-bold text-neutral-400 uppercase tracking-widest text-right">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {supervisions.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-12 text-center text-neutral-400 italic text-sm"
                >
                  Belum ada jadwal supervisi. Silakan klik &quot;Buat Supervisi Baru&quot;.
                </td>
              </tr>
            )}
            {supervisions.map((sv) => {
              const matchedGuru = gurus.find((g) => g.id === sv.instrument.guruId);
              const scoreVals = Object.values(sv.instrument.obsScores || {});
              const avgScore =
                scoreVals.length > 0
                  ? (
                      scoreVals.reduce((acc, v) => acc + v, 0) / scoreVals.length
                    ).toFixed(2)
                  : '0';

              return (
                <tr key={sv.id} className="hover:bg-neutral-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <p className="font-bold text-sm text-neutral-900">
                      {matchedGuru?.nama || sv.instrument.namaGuru || 'Unknown'}
                    </p>
                    <p className="text-xs text-[#2563eb] font-medium">
                      {sv.instrument.mapel || 'Belum diisi'}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm border border-neutral-200 px-2 py-0.5 rounded-md font-medium text-neutral-700">
                      {sv.instrument.kelas || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          sv.status === 'Selesai' ? 'bg-green-500' : 'bg-[#2563eb]'
                        }`}
                      />
                      <p className="text-sm font-medium text-neutral-700">{sv.status}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="inline-block px-3 py-1 bg-neutral-50 border border-neutral-100 rounded-lg">
                      <p className="text-xs font-bold text-neutral-900">{avgScore}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {onDelete && (
                        <button
                          type="button"
                          onClick={() =>
                            setDeleteTarget({
                              id: sv.id,
                              guruNama: matchedGuru?.nama || sv.instrument.namaGuru || 'Guru',
                              mapel: sv.instrument.mapel || 'Mata Pelajaran',
                            })
                          }
                          className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                          title="Hapus Jadwal Supervisi"
                        >
                          <Trash2 size={14} className="text-rose-600" />
                          <span>HAPUS</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSupervisiId(sv.id);
                          setActiveTab('instrumen');
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2563eb] text-white rounded-lg text-xs font-bold hover:bg-[#1e40af] transition-all shadow-sm cursor-pointer"
                      >
                        INSTRUMEN <ArrowRight size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-100 relative"
          >
            <button
              type="button"
              onClick={() => setDeleteTarget(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 text-rose-600 mb-4">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={20} className="text-rose-600" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-base">Hapus Jadwal Supervisi?</h4>
                <p className="text-xs text-gray-500">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>

            <div className="text-sm text-gray-600 mb-6 bg-rose-50/60 p-3.5 rounded-xl border border-rose-100 space-y-1">
              <p>Apakah Anda yakin ingin menghapus jadwal supervisi ini?</p>
              <div className="pt-2 text-xs font-medium text-gray-700">
                <p>
                  • <strong>Guru:</strong> {deleteTarget.guruNama}
                </p>
                <p>
                  • <strong>Mapel:</strong> {deleteTarget.mapel}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
              >
                BATAL
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md shadow-rose-600/20 transition-all cursor-pointer"
              >
                <Trash2 size={14} />
                <span>YA, HAPUS JADWAL</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-gray-100 relative"
          >
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 text-brand-600 mb-5">
              <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600">
                <Plus size={20} />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-base">Buat Sesi Supervisi Baru</h4>
                <p className="text-xs text-gray-500">Pilih guru atau masukkan data guru baru</p>
              </div>
            </div>

            {gurus.length > 0 && (
              <div className="flex rounded-xl bg-gray-100 p-1 mb-5">
                <button
                  type="button"
                  onClick={() => setCreateNewTeacherMode(false)}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    createNewTeacherMode
                      ? 'text-gray-500 hover:text-gray-800'
                      : 'bg-white text-brand-700 shadow-xs'
                  }`}
                >
                  Pilih Guru yang Ada ({gurus.length})
                </button>
                <button
                  type="button"
                  onClick={() => setCreateNewTeacherMode(true)}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    createNewTeacherMode
                      ? 'bg-white text-brand-700 shadow-xs'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  + Tambah Guru Baru
                </button>
              </div>
            )}

            {!createNewTeacherMode && gurus.length > 0 ? (
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block mb-1">
                    Pilih Guru Sasaran Supervisi
                  </label>
                  <select
                    value={selectedGuruId}
                    onChange={(e) => setSelectedGuruId(e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  >
                    {gurus.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.nama} — {g.mapel} {g.jenjang ? `(${g.jenjang})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                  >
                    BATAL
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedGuruId) {
                        onAdd(selectedGuruId);
                        setShowCreateModal(false);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md shadow-brand-600/20 transition-all cursor-pointer"
                  >
                    <span>BUKA INSTRUMEN SUPERVISI</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateNewGuruSubmit} className="space-y-3.5">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                    Nama Lengkap &amp; Gelar *
                  </label>
                  <input
                    type="text"
                    required
                    value={newGuruForm.nama}
                    onChange={(e) =>
                      setNewGuruForm((prev) => ({ ...prev, nama: e.target.value }))
                    }
                    placeholder="Contoh: Siti Rahmawati, M.Pd."
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                      NIP (Opsional)
                    </label>
                    <input
                      type="text"
                      value={newGuruForm.nip}
                      onChange={(e) =>
                        setNewGuruForm((prev) => ({ ...prev, nip: e.target.value }))
                      }
                      placeholder="1980... atau kosong"
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                      Mata Pelajaran *
                    </label>
                    <input
                      type="text"
                      required
                      value={newGuruForm.mapel}
                      onChange={(e) =>
                        setNewGuruForm((prev) => ({ ...prev, mapel: e.target.value }))
                      }
                      placeholder="Contoh: Matematika"
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                      Jenjang Sekolah
                    </label>
                    <select
                      value={newGuruForm.jenjang}
                      onChange={(e) =>
                        setNewGuruForm((prev) => ({ ...prev, jenjang: e.target.value }))
                      }
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    >
                      {SCHOOL_LEVELS.map((lvl) => (
                        <option key={lvl} value={lvl}>
                          {lvl}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                      Status Kepegawaian
                    </label>
                    <select
                      value={newGuruForm.status}
                      onChange={(e) =>
                        setNewGuruForm((prev) => ({ ...prev, status: e.target.value }))
                      }
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    >
                      {STATUS_KEPEGAWAIAN_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                  >
                    BATAL
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md shadow-brand-600/20 transition-all cursor-pointer"
                  >
                    <span>SIMPAN &amp; MULAI SUPERVISI</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
