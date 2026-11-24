import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Edit3,
  Eye,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  Plus,
  Search,
  Trash2,
  UserPlus,
  X,
} from 'lucide-react';
import { motion } from 'motion/react';
import type { ChangeEvent, FormEvent } from 'react';
import { useRef, useState } from 'react';
import { SCHOOL_LEVELS, STATUS_KEPEGAWAIAN_OPTIONS } from '../../constants/school';
import type { ActiveTab, Guru, SupervisionSession, ToastNotice } from '../../types/supervision';
import { downloadGuruTemplateExcel, parseGuruExcelFile } from '../../utils/exportExcel';
import { generateUUID } from '../../utils/id';

interface DataGuruProps {
  gurus: Guru[];
  supervisions: SupervisionSession[];
  onAddGuru: (guru: Guru, openImmediately?: boolean) => void;
  onUpdateGuru?: (guru: Guru) => void;
  onDeleteGuru: (id: string) => void;
  onAddSupervision: (guruId: string) => void;
  onImportGurus: (rows: Omit<Guru, 'id'>[]) => void;
  setSelectedSupervisiId?: (id: string | null) => void;
  setActiveTab?: (tab: ActiveTab) => void;
}

function getJenjangBadgeClass(jenjang: string): string {
  switch (jenjang) {
    case 'TK':
      return 'bg-pink-50 text-pink-700 border-pink-200';
    case 'SD':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    case 'SMP':
      return 'bg-sky-50 text-sky-700 border-sky-200';
    case 'SMA':
      return 'bg-teal-50 text-teal-700 border-teal-200';
    case 'SMK':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'PKPLK':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200';
  }
}

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'ASN':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'P3K':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'GTT':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'Guru Yayasan':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200';
  }
}

export default function DataGuru({
  gurus,
  supervisions,
  onAddGuru,
  onUpdateGuru,
  onDeleteGuru,
  onAddSupervision,
  onImportGurus,
  setSelectedSupervisiId,
  setActiveTab,
}: DataGuruProps) {
  const defaultLevel = localStorage.getItem('school_level') || 'SMA';

  const [showFormModal, setShowFormModal] = useState(false);
  const [editingGuruId, setEditingGuruId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Guru | null>(null);
  const [docInspectTarget, setDocInspectTarget] = useState<{
    guru: Guru;
    session?: SupervisionSession;
  } | null>(null);
  const [notice, setNotice] = useState<ToastNotice | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterJenjang, setFilterJenjang] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [formState, setFormState] = useState<{
    nama: string;
    nip: string;
    mapel: string;
    pangkat: string;
    jenjang: string;
    status: string;
  }>({
    nama: '',
    nip: '',
    mapel: '',
    pangkat: '',
    jenjang: defaultLevel,
    status: 'ASN',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (text: string, type: ToastNotice['type']) => {
    setNotice({ text, type });
    setTimeout(() => setNotice(null), 4000);
  };

  const resetForm = () => {
    setShowFormModal(false);
    setEditingGuruId(null);
    setFormState({
      nama: '',
      nip: '',
      mapel: '',
      pangkat: '',
      jenjang: localStorage.getItem('school_level') || 'SMA',
      status: 'ASN',
    });
  };

  const openEditModal = (guru: Guru) => {
    setEditingGuruId(guru.id);
    setFormState({
      nama: guru.nama,
      nip: guru.nip === '-' ? '' : guru.nip,
      mapel: guru.mapel,
      pangkat: guru.pangkat === '-' ? '' : guru.pangkat,
      jenjang: guru.jenjang || localStorage.getItem('school_level') || 'SMA',
      status: guru.status || 'ASN',
    });
    setShowFormModal(true);
  };

  const handleDownloadTemplate = async () => {
    try {
      await downloadGuruTemplateExcel();
      showToast('Template Excel berhasil diunduh.', 'success');
    } catch (err) {
      console.error(err);
      showToast('Gagal mengunduh template Excel.', 'error');
    }
  };

  const handleImportFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const parsed = await parseGuruExcelFile(file);
      if (parsed.length > 0) {
        onImportGurus(parsed);
        showToast(`${parsed.length} data guru berhasil diimpor dari Excel!`, 'success');
      } else {
        showToast(
          'Tidak ditemukan data valid di Excel. Pastikan kolom Nama & Mata Pelajaran terisi.',
          'error',
        );
      }
    } catch (err) {
      console.error(err);
      showToast('Gagal membaca berkas Excel. Coba lagi dengan file .xlsx yang valid.', 'error');
    } finally {
      e.target.value = '';
    }
  };

  const handleSubmitForm = (e: FormEvent) => {
    e.preventDefault();
    const nama = formState.nama.trim();
    const mapel = formState.mapel.trim();
    if (!nama || !mapel) return;

    const payload: Guru = {
      id: editingGuruId || generateUUID(),
      nama,
      nip: formState.nip.trim() || '-',
      mapel,
      pangkat: formState.pangkat.trim() || '-',
      jenjang: formState.jenjang || localStorage.getItem('school_level') || 'SMA',
      status: formState.status || 'ASN',
    };

    if (editingGuruId && onUpdateGuru) {
      onUpdateGuru(payload);
      showToast(`Data guru "${nama}" berhasil diperbarui.`, 'success');
    } else {
      onAddGuru(payload);
      showToast(`Guru "${nama}" berhasil ditambahkan.`, 'success');
    }
    resetForm();
  };

  const filteredGurus = gurus.filter((guru) => {
    const matchesSearch =
      guru.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guru.nip.includes(searchQuery) ||
      guru.mapel.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesJenjang = filterJenjang === 'ALL' || (guru.jenjang || 'SMA') === filterJenjang;
    const matchesStatus = filterStatus === 'ALL' || guru.status === filterStatus;
    return matchesSearch && matchesJenjang && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-gray-900">
            Manajemen Database Guru
          </h2>
          <p className="text-gray-500 text-sm">
            Kelola profil tenaga pendidik lintas jenjang (TK, SD, SMP, SMA, SMK, PKPLK) &amp;
            jadwal supervisi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-50 transition-all shadow-xs cursor-pointer"
          >
            <Download size={15} className="text-brand-600" />
            <span>Template Excel</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-all shadow-xs cursor-pointer"
          >
            <FileSpreadsheet size={15} className="text-emerald-600" />
            <span>Import Data Guru (Excel)</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleImportFile}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => {
              setEditingGuruId(null);
              setFormState({
                nama: '',
                nip: '',
                mapel: '',
                pangkat: '',
                jenjang: localStorage.getItem('school_level') || 'SMA',
                status: 'ASN',
              });
              setShowFormModal(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-brand-500/20 hover:bg-brand-700 transition-all cursor-pointer"
          >
            <UserPlus size={16} />
            <span>Tambah Guru</span>
          </button>
        </div>
      </div>

      {notice && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex items-center gap-2.5 p-3.5 rounded-xl text-xs font-semibold border shadow-xs ${
            notice.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {notice.type === 'success' ? (
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle size={16} className="text-rose-600 shrink-0" />
          )}
          <span>{notice.text}</span>
        </motion.div>
      )}

      <div className="bg-white p-4 rounded-2xl border border-gray-200/90 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
              size={16}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama guru, NIP, atau mata pelajaran..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Status:
            </span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 cursor-pointer"
            >
              <option value="ALL">Semua Status</option>
              {STATUS_KEPEGAWAIAN_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-gray-100">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mr-1">
            Filter Jenjang:
          </span>
          <button
            type="button"
            onClick={() => setFilterJenjang('ALL')}
            className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              filterJenjang === 'ALL'
                ? 'bg-brand-600 text-white shadow-xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Semua ({gurus.length})
          </button>
          {SCHOOL_LEVELS.map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => setFilterJenjang(lvl)}
              className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                filterJenjang === lvl
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50/70 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Nama &amp; NIP
                </th>
                <th className="px-5 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">
                  Jenjang
                </th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Mata Pelajaran
                </th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Jadwal Supervisi
                </th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Dokumen
                </th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">
                  Status
                </th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredGurus.map((guru) => {
                const session = supervisions.find((sv) => sv.instrument.guruId === guru.id);
                const level = guru.jenjang || localStorage.getItem('school_level') || 'SMA';
                const totalDocs =
                  (session?.instrument.documents.length || 0) +
                  (session?.instrument.photos.length || 0);

                return (
                  <tr key={guru.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <p className="font-bold text-sm text-gray-900">{guru.nama}</p>
                      <p className="text-[10px] text-gray-400 font-mono tracking-tighter">
                        {guru.nip && guru.nip !== '-' ? `NIP. ${guru.nip}` : 'NIP. -'}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-center">
                      <span
                        className={`text-[10px] px-2.5 py-1 rounded-md font-bold uppercase tracking-wider border ${getJenjangBadgeClass(
                          level,
                        )}`}
                      >
                        {level}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-700 font-medium">{guru.mapel}</td>

                    <td className="px-6 py-4">
                      {session ? (
                        <div>
                          <p className="text-xs font-bold text-gray-900">{session.status}</p>
                          <p className="text-[10px] text-gray-500 uppercase">
                            {session.instrument.kelas || 'Belum diatur'}
                          </p>
                        </div>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-400 rounded-full italic">
                          Belum Terjadwal
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => setDocInspectTarget({ guru, session })}
                        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-brand-50 text-gray-600 hover:text-brand-700 transition-colors cursor-pointer group/doc"
                        title="Lihat / kelola dokumen guru ini"
                      >
                        <FileText
                          size={14}
                          className="text-brand-500 group-hover/doc:scale-110 transition-transform"
                        />
                        <span className="text-xs font-semibold">{totalDocs} File</span>
                      </button>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <span
                        className={`text-[10px] px-2.5 py-1 rounded-md font-bold uppercase tracking-wider border ${getStatusBadgeClass(
                          guru.status,
                        )}`}
                      >
                        {guru.status}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end items-center gap-1.5">
                        {session ? (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedSupervisiId?.(session.id);
                                setActiveTab?.('instrumen');
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                              title="Buka / Lanjutkan Lembar Supervisi Guru Ini"
                            >
                              <Eye size={13} />
                              <span>Supervisi</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedSupervisiId?.(session.id);
                                setActiveTab?.('laporan');
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                              title="Buka Dokumen Laporan Resmi Guru Ini"
                            >
                              <FileText size={13} />
                              <span>Laporan</span>
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onAddSupervision(guru.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
                            title="Mulai Supervisi Klinis Guru Ini"
                          >
                            <Plus size={13} />
                            <span>Mulai Supervisi</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => openEditModal(guru)}
                          className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit Data & Jenjang Guru"
                        >
                          <Edit3 size={14} />
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeleteTarget(guru)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Hapus Data Guru"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredGurus.length === 0 && (
          <div className="py-20 text-center text-gray-400">
            <p className="text-sm">Tidak ada data guru yang sesuai dengan pencarian atau filter.</p>
          </div>
        )}
      </div>

      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
            onClick={resetForm}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative z-10 overflow-hidden"
          >
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div>
                <h3 className="font-display font-bold text-lg text-gray-900">
                  {editingGuruId ? 'Edit Data Guru' : 'Tambah Data Guru Baru'}
                </h3>
                <p className="text-xs text-gray-500">
                  {editingGuruId
                    ? 'Perbarui informasi identitas, jenjang, dan status kepegawaian guru terpilih'
                    : 'Input data tenaga pendidik untuk supervisi klinis'}
                </p>
              </div>
              <button
                type="button"
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                  Nama Lengkap &amp; Gelar *
                </label>
                <input
                  type="text"
                  required
                  value={formState.nama}
                  onChange={(e) => setFormState({ ...formState, nama: e.target.value })}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-sm font-semibold"
                  placeholder="Contoh: Dr. Ahmad Fauzi, M.Pd"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                    NIP (Opsional)
                  </label>
                  <input
                    type="text"
                    value={formState.nip}
                    onChange={(e) => setFormState({ ...formState, nip: e.target.value })}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-sm"
                    placeholder="19XXXX... atau -"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                    Pangkat / Golongan
                  </label>
                  <input
                    type="text"
                    value={formState.pangkat}
                    onChange={(e) => setFormState({ ...formState, pangkat: e.target.value })}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-sm"
                    placeholder="Contoh: Pembina / IVa"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-widest flex items-center justify-between">
                    <span>Jenjang Satuan</span>
                    <span className="text-[10px] text-brand-600 font-bold">Wajib</span>
                  </label>
                  <select
                    value={formState.jenjang}
                    onChange={(e) => setFormState({ ...formState, jenjang: e.target.value })}
                    className="w-full p-3 bg-brand-50/50 border border-brand-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-sm font-bold text-gray-800"
                  >
                    <option value="TK">TK (Taman Kanak-Kanak / PAUD)</option>
                    <option value="SD">SD (Sekolah Dasar / MI)</option>
                    <option value="SMP">SMP (Sekolah Menengah Pertama / MTs)</option>
                    <option value="SMA">SMA (Sekolah Menengah Atas / MA)</option>
                    <option value="SMK">SMK (Sekolah Menengah Kejuruan)</option>
                    <option value="PKPLK">PKPLK (Pendidikan Khusus / SLB)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-widest flex items-center justify-between">
                    <span>Status Pegawai</span>
                    <span className="text-[10px] text-brand-600 font-bold">Wajib</span>
                  </label>
                  <select
                    value={formState.status}
                    onChange={(e) => setFormState({ ...formState, status: e.target.value })}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-sm font-bold text-gray-800"
                  >
                    {STATUS_KEPEGAWAIAN_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                  Mata Pelajaran / Bidang *
                </label>
                <input
                  type="text"
                  required
                  value={formState.mapel}
                  onChange={(e) => setFormState({ ...formState, mapel: e.target.value })}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-sm"
                  placeholder="Misal: Biologi, Tematik SD, Guru Kelas TK, Vokasional SLB..."
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 py-3 border border-gray-200 rounded-xl font-bold text-gray-500 hover:bg-gray-50 transition-all cursor-pointer text-sm"
                >
                  BATAL
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-brand-600 text-white rounded-xl font-bold shadow-lg shadow-brand-500/20 hover:bg-brand-700 transition-all cursor-pointer text-sm"
                >
                  {editingGuruId ? 'SIMPAN PERUBAHAN' : 'SIMPAN DATA GURU'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-gray-900/40 backdrop-blur-xs"
            onClick={() => setDeleteTarget(null)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-100 relative z-10"
          >
            <button
              type="button"
              onClick={() => setDeleteTarget(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 text-rose-600 mb-4">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <AlertTriangle size={20} className="text-rose-600" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-base">Hapus Data Guru?</h4>
                <p className="text-xs text-gray-500">Tindakan ini permanen untuk guru terpilih</p>
              </div>
            </div>

            <div className="text-xs text-gray-600 mb-6 bg-rose-50/60 p-3.5 rounded-xl border border-rose-100 space-y-1.5">
              <p>Apakah Anda yakin ingin menghapus data guru ini dari sistem supervisi?</p>
              <div className="pt-2 text-xs font-semibold text-gray-800 space-y-0.5 border-t border-rose-100">
                <p>
                  • <strong>Nama:</strong> {deleteTarget.nama}
                </p>
                <p>
                  • <strong>NIP:</strong> {deleteTarget.nip || '-'}
                </p>
                <p>
                  • <strong>Mata Pelajaran:</strong> {deleteTarget.mapel}
                </p>
                <p>
                  • <strong>Jenjang:</strong> {deleteTarget.jenjang || 'SMA'} (
                  {deleteTarget.status || 'ASN'})
                </p>
              </div>
              <p className="text-[10px] text-gray-400 italic pt-1">
                Catatan: Data guru lain tidak akan terpengaruh.
              </p>
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
                onClick={() => {
                  const deletedName = deleteTarget.nama;
                  onDeleteGuru(deleteTarget.id);
                  setDeleteTarget(null);
                  showToast(
                    `Data ${deletedName} berhasil dihapus. Data guru lain tetap tersimpan aman.`,
                    'success',
                  );
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md shadow-rose-600/20 transition-all cursor-pointer"
              >
                <Trash2 size={14} />
                <span>YA, HAPUS GURU INI</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {docInspectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-gray-900/40 backdrop-blur-xs"
            onClick={() => setDocInspectTarget(null)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-gray-100 relative z-10 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center">
                  <FolderOpen size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">
                    Dokumen: {docInspectTarget.guru.nama}
                  </h4>
                  <p className="text-xs text-gray-500">
                    {docInspectTarget.guru.mapel} • NIP: {docInspectTarget.guru.nip || '-'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDocInspectTarget(null)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              {(!docInspectTarget.session?.instrument.documents ||
                docInspectTarget.session.instrument.documents.length === 0) &&
              (!docInspectTarget.session?.instrument.photos ||
                docInspectTarget.session.instrument.photos.length === 0) ? (
                <div className="py-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <FileText className="mx-auto text-gray-300 mb-2" size={32} />
                  <p className="text-xs font-semibold text-gray-600">
                    Belum ada berkas lampiran untuk guru ini.
                  </p>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Unggah dokumen atau foto pada lembar Instrumen Supervisi guru ini.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {docInspectTarget.session?.instrument.documents?.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-3 bg-gray-50 rounded-xl border border-gray-200/80 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <FileText size={15} className="text-brand-600 shrink-0" />
                        <span className="font-semibold text-gray-800 truncate">{doc.name}</span>
                        <span className="text-[10px] uppercase font-bold text-gray-400 bg-white px-2 py-0.5 rounded border">
                          Tahap {doc.stage}
                        </span>
                      </div>
                      <a
                        href={doc.url}
                        download={doc.name}
                        className="text-brand-600 hover:underline font-bold text-[11px] shrink-0 ml-2"
                      >
                        Unduh
                      </a>
                    </div>
                  ))}

                  {docInspectTarget.session?.instrument.photos?.map((photo, idx) => (
                    <div
                      key={photo.id}
                      className="p-3 bg-gray-50 rounded-xl border border-gray-200/80 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <img
                          src={photo.url}
                          alt="Foto"
                          className="w-8 h-8 rounded object-cover border"
                        />
                        <span className="font-semibold text-gray-800 truncate">
                          {photo.caption || `Foto Observasi Kelas #${idx + 1}`}
                        </span>
                      </div>
                      <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                        Foto Observasi
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => {
                  if (docInspectTarget.session) {
                    setSelectedSupervisiId?.(docInspectTarget.session.id);
                  } else {
                    onAddSupervision(docInspectTarget.guru.id);
                  }
                  setActiveTab?.('instrumen');
                  setDocInspectTarget(null);
                }}
                className="px-4 py-2 bg-brand-50 hover:bg-brand-100 text-brand-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Kelola di Lembar Instrumen →
              </button>
              <button
                type="button"
                onClick={() => setDocInspectTarget(null)}
                className="px-4 py-2 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
