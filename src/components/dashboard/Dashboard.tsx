import {
  AlertTriangle,
  Award,
  BookOpen,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Printer,
  Settings,
  ShieldCheck,
  Sparkles,
  Trash2,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';
import { motion } from 'motion/react';
import type { ComponentType } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { DEFAULT_SUPERVISOR_NAME } from '../../constants/school';
import { useSchoolConfig } from '../../hooks/useSchoolConfig';
import { STORAGE_EVENTS, loadStoredFollowUps } from '../../services/storage';
import type { ActiveTab, FollowUpItem, Guru, SupervisionSession } from '../../types/supervision';

interface DashboardProps {
  setActiveTab: (tab: ActiveTab) => void;
  gurus: Guru[];
  supervisions: SupervisionSession[];
  onDeleteSupervision?: (id: string) => void;
  setSelectedSupervisiId?: (id: string | null) => void;
}

interface DeleteTarget {
  id: string;
  guruNama: string;
  mapel: string;
}

interface StatCardProps {
  label: string;
  value: number;
  icon: ComponentType<{ size?: number }>;
  color: string;
}

function StatCard({ label, value, icon: Icon, color }: StatCardProps) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
        <p className="text-3xl font-display font-bold text-gray-900">{value}</p>
      </div>
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color}`}>
        <Icon size={24} />
      </div>
    </div>
  );
}

export default function Dashboard({
  setActiveTab,
  gurus,
  supervisions,
  onDeleteSupervision,
  setSelectedSupervisiId,
}: DashboardProps) {
  const { config: schoolConfig } = useSchoolConfig();
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [noticeText, setNoticeText] = useState<string | null>(null);
  const [followUps, setFollowUps] = useState<FollowUpItem[]>(() => loadStoredFollowUps());

  useEffect(() => {
    const syncFollowUps = () => {
      setFollowUps(loadStoredFollowUps());
    };
    window.addEventListener('storage', syncFollowUps);
    window.addEventListener(STORAGE_EVENTS.FOLLOW_UPS_UPDATED, syncFollowUps);
    return () => {
      window.removeEventListener('storage', syncFollowUps);
      window.removeEventListener(STORAGE_EVENTS.FOLLOW_UPS_UPDATED, syncFollowUps);
    };
  }, []);

  const stats = useMemo(
    () => ({
      totalGuru: gurus.length,
      selesai: supervisions.filter((sv) => sv.status === 'Selesai').length,
      proses: supervisions.filter((sv) => sv.status !== 'Selesai' && sv.status !== 'Direncakan')
        .length,
      rencana: supervisions.filter((sv) => sv.status === 'Direncakan').length,
    }),
    [gurus.length, supervisions],
  );

  const impactStats = useMemo(() => {
    const disupervisiSet = new Set<string>();
    const refleksiSet = new Set<string>();
    const tindakLanjutSet = new Set<string>();
    const praktikSet = new Set<string>();
    const pendampinganSet = new Set<string>();

    supervisions.forEach((sv) => {
      const hasScores = Object.keys(sv.instrument?.obsScores || {}).length > 0;
      const hasRefleksi = Boolean(sv.instrument?.pascaRefleksi?.trim());
      const started = sv.status !== 'Direncakan';
      const matchedGuru = gurus.find((g) => g.id === sv.instrument?.guruId);
      const key = (sv.instrument?.namaGuru || matchedGuru?.nama || sv.instrument?.guruId || '')
        .trim()
        .toLowerCase();
      if (!key) return;

      if (started || hasScores || hasRefleksi) disupervisiSet.add(key);
      if (
        hasRefleksi ||
        sv.status === 'Pasca-Observasi' ||
        sv.status === 'Tindak Lanjut' ||
        sv.status === 'Selesai'
      ) {
        refleksiSet.add(key);
      }

      const hasRtl = sv.instrument?.rtl && Object.values(sv.instrument.rtl).some(Boolean);
      if (sv.status === 'Tindak Lanjut' || sv.status === 'Selesai' || hasRtl) {
        tindakLanjutSet.add(key);
      }

      const scoreVals = Object.values(sv.instrument?.obsScores || {});
      const avg =
        scoreVals.length > 0 ? scoreVals.reduce((acc, val) => acc + val, 0) / scoreVals.length : 0;

      if (sv.status === 'Selesai' && avg >= 3) {
        praktikSet.add(key);
      } else if (
        sv.status === 'Tindak Lanjut' ||
        (sv.status === 'Pasca-Observasi' && avg > 0 && avg < 3)
      ) {
        pendampinganSet.add(key);
      }
    });

    followUps.forEach((item) => {
      const key = (item.guruNama || '').trim().toLowerCase();
      if (!key) return;
      disupervisiSet.add(key);
      if (item.sudahRefleksi) refleksiSet.add(key);
      if (item.sudahTindakLanjut) tindakLanjutSet.add(key);
      if (item.perubahanPraktik || item.dampak === 'Meningkat') praktikSet.add(key);
      if (
        item.perluPendampingan ||
        item.dampak === 'Dipantau' ||
        item.dampak === 'Perlu Pendampingan'
      ) {
        pendampinganSet.add(key);
      }
    });

    return {
      totalDisupervisi: disupervisiSet.size,
      sudahRefleksi: refleksiSet.size,
      sudahTindakLanjut: tindakLanjutSet.size,
      perubahanPraktik: praktikSet.size,
      perluPendampingan: pendampinganSet.size,
    };
  }, [supervisions, gurus, followUps]);

  const handleConfirmDelete = () => {
    if (!deleteTarget || !onDeleteSupervision) return;
    onDeleteSupervision(deleteTarget.id);
    setNoticeText(`Jadwal supervisi untuk ${deleteTarget.guruNama} berhasil dihapus.`);
    setDeleteTarget(null);
    setTimeout(() => setNoticeText(null), 4000);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-brand-50 border border-brand-200 text-brand-700 text-xs font-bold tracking-wide">
              <Calendar size={13} className="text-brand-600" />
              <span>
                Tahun Akademik: <strong>{schoolConfig.academicYear.replace('/', ' / ')}</strong>
              </span>
            </span>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium">
              <Building2 size={13} className="text-slate-500" />
              <span>{schoolConfig.schoolName}</span>
            </span>

            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border ${
                schoolConfig.isDinasPendidikan
                  ? 'bg-blue-50 border-blue-200 text-blue-800'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}
            >
              <ShieldCheck
                size={13}
                className={schoolConfig.isDinasPendidikan ? 'text-blue-600' : 'text-emerald-600'}
              />
              <span>{schoolConfig.authorityName}</span>
            </span>
          </div>

          <h2 className="text-3xl font-display font-bold text-gray-900 mb-2">
            SI PERAK — Supervisi Akademik
          </h2>
          <p className="text-gray-600 max-w-3xl text-sm leading-relaxed">
            {schoolConfig.schoolName} ({schoolConfig.schoolLevel}) • {schoolConfig.authorityName} (
            {schoolConfig.parentGov}) • Tahun Pelajaran{' '}
            {schoolConfig.academicYear.replace('/', ' / ')}. Instrumen Supervisi Klinis Berbasis
            Kurikulum Nasional &amp; Pembelajaran Mendalam.
          </p>

          <div className="mt-2.5 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200/80 text-xs text-amber-900 font-medium">
            <Award size={15} className="text-amber-600 shrink-0" />
            <span>
              Karya &amp; Hak Cipta:{' '}
              <strong className="text-amber-950 font-bold">{DEFAULT_SUPERVISOR_NAME}</strong> (
              {schoolConfig.isDinasPendidikan
                ? 'Pengawas Dinas Pendidikan Kabupaten Bojonegoro'
                : 'Pengawas SMA Cabang Dinas Pendidikan Wilayah Bojonegoro'}
              )
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setActiveTab('tindak-lanjut')}
            className="inline-flex items-center gap-2.5 px-5 py-3 bg-gradient-to-r from-brand-600 to-indigo-700 hover:from-brand-700 hover:to-indigo-800 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider shadow-lg shadow-brand-600/25 transition-all cursor-pointer hover:shadow-xl active:scale-95"
          >
            <TrendingUp size={18} />
            <span>TINDAK LANJUT SUPERVISI</span>
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200/90 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center font-bold shrink-0">
              <Building2 size={16} />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                Satuan Pendidikan
              </p>
              <p className="font-bold text-gray-900">
                {schoolConfig.schoolName}{' '}
                <span className="text-gray-400 font-normal">
                  ({schoolConfig.schoolLevel} • NPSN: {schoolConfig.schoolNpsn})
                </span>
              </p>
            </div>
          </div>

          <div className="h-8 w-px bg-gray-200 hidden md:block" />

          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold shrink-0 ${
                schoolConfig.isDinasPendidikan
                  ? 'bg-blue-50 text-blue-700'
                  : 'bg-emerald-50 text-emerald-700'
              }`}
            >
              <ShieldCheck size={16} />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                Instansi Pembina
              </p>
              <p
                className={`font-bold ${
                  schoolConfig.isDinasPendidikan ? 'text-blue-900' : 'text-emerald-900'
                }`}
              >
                {schoolConfig.authorityName}{' '}
                <span className="text-[10px] font-normal text-gray-400">
                  ({schoolConfig.parentGov})
                </span>
              </p>
            </div>
          </div>

          <div className="h-8 w-px bg-gray-200 hidden lg:block" />

          <div className="hidden lg:flex items-center gap-2">
            <div>
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                Kepala Sekolah &amp; Pengawas
              </p>
              <p className="font-medium text-gray-800">
                KS: <strong>{schoolConfig.headmasterName}</strong> • Pengawas:{' '}
                <strong>{schoolConfig.supervisorName}</strong>
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setActiveTab('pengaturan-sekolah')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-600 hover:text-brand-700 hover:bg-gray-50 border border-gray-200 rounded-xl transition-all cursor-pointer self-start md:self-auto shrink-0"
          title="Buka Pengaturan Sekolah"
        >
          <Settings size={13} />
          <span>Pengaturan Sekolah</span>
        </button>
      </div>

      {noticeText && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2.5 p-3.5 rounded-xl text-xs font-semibold bg-emerald-50 border border-emerald-100 text-emerald-800 shadow-xs"
        >
          <CheckCircle2 className="text-emerald-500 flex-shrink-0" size={16} />
          <span>{noticeText}</span>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Database Guru"
          value={stats.totalGuru}
          icon={Users}
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          label="Supervisi Selesai"
          value={stats.selesai}
          icon={CheckCircle2}
          color="bg-green-50 text-green-600"
        />
        <StatCard
          label="Dalam Pantauan"
          value={stats.proses}
          icon={Clock}
          color="bg-orange-50 text-orange-600"
        />
        <StatCard
          label="Terjadwal"
          value={stats.rencana}
          icon={Calendar}
          color="bg-gray-50 text-gray-400"
        />
      </div>

      <div className="bg-gradient-to-br from-slate-900 via-brand-950 to-indigo-950 rounded-2xl p-6 text-white shadow-md border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-brand-300">
              <TrendingUp size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-base uppercase tracking-wider text-white">
                  SUPERVISION IMPACT DASHBOARD
                </h3>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded text-[9px] font-bold uppercase tracking-widest">
                  Mutu Terkini
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Dashboard Mutu Supervisi: Pantauan dampak intervensi klinis terhadap pembelajaran di
                kelas.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('tindak-lanjut')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white text-slate-900 hover:bg-slate-100 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <span>Buka Dashboard Mutu Lengkap</span>
            <ChevronRight size={14} />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 pt-5">
          <div className="bg-white/5 rounded-xl p-3.5 border border-white/10">
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Jumlah Guru Disupervisi
            </p>
            <p className="text-2xl font-display font-bold text-white mt-1">
              {impactStats.totalDisupervisi}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">Sasaran supervisi</p>
          </div>

          <div className="bg-white/5 rounded-xl p-3.5 border border-white/10">
            <p className="text-[10px] uppercase font-bold text-emerald-300 tracking-wider">
              Sudah Refleksi
            </p>
            <p className="text-2xl font-display font-bold text-emerald-400 mt-1">
              {impactStats.sudahRefleksi}
            </p>
            <p className="text-[10px] text-emerald-300/80 mt-0.5">Pasca-observasi selesai</p>
          </div>

          <div className="bg-white/5 rounded-xl p-3.5 border border-white/10">
            <p className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider">
              Sudah Tindak Lanjut
            </p>
            <p className="text-2xl font-display font-bold text-indigo-400 mt-1">
              {impactStats.sudahTindakLanjut}
            </p>
            <p className="text-[10px] text-indigo-300/80 mt-0.5">Program intervensi aktif</p>
          </div>

          <div className="bg-emerald-950/40 rounded-xl p-3.5 border border-emerald-500/30">
            <p className="text-[10px] uppercase font-bold text-emerald-300 tracking-wider">
              Perubahan Praktik
            </p>
            <p className="text-2xl font-display font-bold text-emerald-300 mt-1">
              {impactStats.perubahanPraktik}
            </p>
            <p className="text-[10px] text-emerald-400 font-semibold mt-0.5">🟢 Meningkat</p>
          </div>

          <div className="bg-amber-950/40 rounded-xl p-3.5 border border-amber-500/30">
            <p className="text-[10px] uppercase font-bold text-amber-300 tracking-wider">
              Perlu Pendampingan
            </p>
            <p className="text-2xl font-display font-bold text-amber-300 mt-1">
              {impactStats.perluPendampingan}
            </p>
            <p className="text-[10px] text-amber-400 font-semibold mt-0.5">🟡 Dipantau / Coaching</p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Sparkles size={15} className="text-amber-400 flex-shrink-0" />
            <span className="text-slate-300">
              {impactStats.totalDisupervisi === 0 ? (
                <>
                  Status Analisis Mutu:{' '}
                  <span className="text-slate-400 italic">
                    Belum ada sesi supervisi yang berjalan/selesai. Peta masalah pembelajaran akan
                    terpetakan otomatis sesuai data yang terisi.
                  </span>
                </>
              ) : (
                <>
                  Peta Masalah Terbanyak:{' '}
                  <strong className="text-white font-bold underline underline-offset-2">
                    {followUps[0]?.temuan || 'Diferensiasi Pembelajaran & Keaktifan Siswa'}
                  </strong>
                </>
              )}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('tindak-lanjut')}
            className="text-brand-300 hover:text-white font-bold underline flex items-center gap-1 cursor-pointer"
          >
            <span>Lihat Peta Masalah &amp; Solusi AI</span>
            <ChevronRight size={13} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-display font-bold text-lg">Aktivitas Supervisi Klinis Terbaru</h3>
              <button
                type="button"
                onClick={() => setActiveTab('instrumen')}
                className="text-xs font-bold text-brand-600 hover:text-brand-700 underline flex items-center gap-1 cursor-pointer"
              >
                <span>KELOLA JADWAL</span>
                <ChevronRight size={14} />
              </button>
            </div>

            <div className="space-y-4">
              {supervisions.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-300">
                    <Calendar size={20} />
                  </div>
                  <p className="text-sm text-gray-400 italic">
                    Belum ada aktivitas supervisi terbaru.
                  </p>
                </div>
              ) : (
                supervisions.slice(0, 5).map((sv) => {
                  const matchedGuru = gurus.find((g) => g.id === sv.instrument.guruId);
                  const displayName = matchedGuru?.nama || sv.instrument.namaGuru || 'Unknown Guru';
                  const nameParts = displayName.split(' ');
                  const initials =
                    nameParts.length > 0
                      ? `${nameParts[0][0] || ''}${nameParts[1]?.[0] || ''}`
                      : '?';
                  const scoreVals = Object.values(sv.instrument.obsScores);
                  const avgStr =
                    scoreVals.length > 0
                      ? (
                          scoreVals.reduce((acc, v) => acc + v, 0) / scoreVals.length
                        ).toFixed(2)
                      : '-';

                  return (
                    <div
                      key={sv.id}
                      className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:bg-gray-50/80 transition-colors group"
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                          sv.status === 'Selesai'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-brand-50 text-brand-700'
                        }`}
                      >
                        {initials}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{displayName}</p>
                        <p className="text-xs text-gray-500 truncate">
                          {sv.instrument.mapel || 'Mapel Belum Diisi'} • {sv.instrument.kelas || '-'}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-xs font-bold text-brand-600">Skor: {avgStr}</p>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                            sv.status === 'Selesai'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-brand-100 text-brand-700'
                          }`}
                        >
                          {sv.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 pl-1 border-l border-gray-100">
                        {onDeleteSupervision && (
                          <button
                            type="button"
                            onClick={() =>
                              setDeleteTarget({
                                id: sv.id,
                                guruNama: displayName,
                                mapel: sv.instrument.mapel || 'Mata Pelajaran',
                              })
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                            title="Hapus Jadwal Supervisi"
                          >
                            <Trash2 size={13} className="text-rose-600" />
                            <span>Hapus</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSupervisiId?.(sv.id);
                            setActiveTab('instrumen');
                          }}
                          className="px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                          title="Buka Lembar Supervisi"
                        >
                          Buka
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-emerald-700 rounded-2xl p-6 text-white overflow-hidden relative">
            <div className="relative z-10">
              <Printer className="mb-4 opacity-50" size={40} />
              <h3 className="text-xl font-display font-bold mb-2">Laporan Hasil Supervisi</h3>
              <p className="text-sm text-emerald-100 mb-6">
                Unduh &amp; Cetak laporan supervisi klinis dalam format PDF dan Word secara instan.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('laporan')}
                className="w-full py-3 bg-white text-emerald-800 rounded-xl text-sm font-bold shadow-lg hover:bg-emerald-50 transition-colors uppercase tracking-wider cursor-pointer"
              >
                Unduh Laporan Hasil
              </button>
            </div>
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-emerald-600 rounded-full blur-3xl opacity-50" />
          </div>

          <div className="bg-brand-700 rounded-2xl p-6 text-white overflow-hidden relative">
            <div className="relative z-10">
              <BookOpen className="mb-4 opacity-50" size={40} />
              <h3 className="text-xl font-display font-bold mb-2">Kurikulum Nasional</h3>
              <p className="text-sm text-brand-200 mb-6">
                Fokus pada pembelajaran mendalam (Deep Learning) dan Berdiferensiasi.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('program')}
                className="w-full py-3 bg-white text-brand-700 rounded-xl text-sm font-bold shadow-lg hover:bg-brand-50 transition-colors cursor-pointer"
              >
                BACA PROGRAM KERJA
              </button>
            </div>
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-brand-600 rounded-full blur-3xl opacity-50" />
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h3 className="font-display font-bold text-lg mb-4">Indikator Keberhasilan</h3>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="font-medium text-gray-500">Target Guru &quot;Baik&quot; (85%)</span>
                  <span className="font-bold text-brand-600">
                    {supervisions.length > 0 ? '75%' : '0%'}
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-brand-500 transition-all duration-500 ${
                      supervisions.length > 0 ? 'w-3/4' : 'w-0'
                    }`}
                  />
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-600 italic">
                  &quot;Supervisi akademik bersifat kemitraan dan kolaboratif untuk mewujudkan
                  pembelajaran yang mendalam dan bermakna.&quot;
                </p>
              </div>
            </div>
          </div>
        </div>
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
    </div>
  );
}
