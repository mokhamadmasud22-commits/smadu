import {
  Building2,
  Check,
  Save,
  ShieldCheck,
  Sliders,
  UserCheck,
} from 'lucide-react';
import { Suspense, lazy, useState } from 'react';
import {
  JENJANG_OPTIONS,
  KOP_AUTHORITY_CABDIN,
  KOP_AUTHORITY_KAB,
} from '../../constants/school';
import { useRubricConfig } from '../../hooks/useRubricConfig';
import { useSchoolConfig } from '../../hooks/useSchoolConfig';
import { countRubricItems } from '../../utils/score';

const InstrumentCustomizerModal = lazy(() => import('../common/InstrumentCustomizerModal'));

export default function PengaturanSekolah() {
  const { config: initialConfig, updateAndSave } = useSchoolConfig();
  const { rubricSections, instrumentTitle, refresh: refreshRubrics } = useRubricConfig();

  const [schoolName, setSchoolName] = useState(initialConfig.schoolName);
  const [schoolLevel, setSchoolLevel] = useState(initialConfig.schoolLevel);
  const [kopAuthority, setKopAuthority] = useState(initialConfig.kopAuthority);
  const [schoolNpsn, setSchoolNpsn] = useState(initialConfig.schoolNpsn);
  const [schoolAddress, setSchoolAddress] = useState(initialConfig.schoolAddress);
  const [academicYear, setAcademicYear] = useState(initialConfig.academicYear);
  const [headmasterName, setHeadmasterName] = useState(initialConfig.headmasterName);
  const [headmasterNip, setHeadmasterNip] = useState(initialConfig.headmasterNip);
  const [internalSupervisorName, setInternalSupervisorName] = useState(
    initialConfig.internalSupervisorName,
  );
  const [internalSupervisorNip, setInternalSupervisorNip] = useState(
    initialConfig.internalSupervisorNip,
  );
  const [supervisorName, setSupervisorName] = useState(initialConfig.supervisorName);
  const [supervisorNip, setSupervisorNip] = useState(initialConfig.supervisorNip);
  const [twoStageValidation, setTwoStageValidation] = useState(initialConfig.twoStageValidation);
  const [showCustomizerModal, setShowCustomizerModal] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const activeIndicatorCount = countRubricItems(rubricSections);

  const handleSaveSettings = () => {
    updateAndSave({
      schoolName,
      schoolLevel,
      kopAuthority,
      schoolNpsn,
      schoolAddress,
      academicYear,
      headmasterName,
      headmasterNip,
      internalSupervisorName,
      internalSupervisorNip,
      supervisorName,
      supervisorNip,
      twoStageValidation,
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h2 className="text-2xl font-display font-bold text-gray-900">Pengaturan Sekolah</h2>
        <p className="text-gray-500 text-sm">
          Konfigurasi profil sekolah, jenjang pendidikan (TK, SD, SMP, SMA, SMK, PKPLK), dan tahun
          akademik sistem secara persisten.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
          <Building2 className="text-brand-600" size={20} />
          <h3 className="font-display font-bold">Profil Satuan Pendidikan</h3>
        </div>

        <div className="p-8 space-y-6">
          <div className="bg-slate-50 p-5 rounded-2xl border border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-3">
              <div>
                <p className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                  Jenjang Satuan Pendidikan
                </p>
                <p className="text-[11px] text-gray-500">
                  Pilih jenjang sekolah yang disupervisi (Berlaku umum untuk semua jenjang):
                </p>
              </div>
              <span className="px-3 py-1 bg-brand-100 text-brand-800 text-xs font-bold rounded-lg w-fit">
                Jenjang Terpilih: {schoolLevel}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
              {JENJANG_OPTIONS.map((opt) => {
                const selected = schoolLevel === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setSchoolLevel(opt.id);
                      setKopAuthority(
                        ['TK', 'SD', 'SMP'].includes(opt.id)
                          ? KOP_AUTHORITY_KAB
                          : KOP_AUTHORITY_CABDIN,
                      );
                    }}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                      selected
                        ? 'bg-white border-brand-500 ring-2 ring-brand-500/30 shadow-md text-brand-700'
                        : 'bg-white/80 border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-white'
                    }`}
                  >
                    <span
                      className={`text-base font-black tracking-tight ${
                        selected ? 'text-brand-600' : 'text-gray-800'
                      }`}
                    >
                      {opt.id}
                    </span>
                    <span className="text-[10px] font-semibold text-gray-500 line-clamp-1">
                      {opt.label}
                    </span>
                    {selected && <span className="w-2 h-2 rounded-full bg-brand-600 mt-0.5" />}
                  </button>
                );
              })}
            </div>

            <p className="text-[11px] text-gray-400 mt-2.5 italic">
              * Aplikasi SI PERAK mendukung instrumen supervisi klinis untuk jenjang TK, SD, SMP,
              SMA, SMK, dan PKPLK (SLB).
            </p>
          </div>

          <div className="bg-slate-50 p-5 rounded-2xl border border-gray-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div>
                <p className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                  Kop Instansi Pembina Laporan
                </p>
                <p className="text-[11px] text-gray-500">
                  Pilih format instansi pembina yang tercetak di Kop Surat Laporan resmi:
                </p>
              </div>
              <span className="px-3 py-1 bg-brand-100 text-brand-800 text-[11px] font-bold rounded-lg w-fit">
                Kop Aktif:{' '}
                {kopAuthority === KOP_AUTHORITY_KAB
                  ? 'Kabupaten Bojonegoro'
                  : 'Cabang Dinas Bojonegoro'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => setKopAuthority(KOP_AUTHORITY_CABDIN)}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                  kopAuthority === KOP_AUTHORITY_CABDIN
                    ? 'bg-white border-brand-500 ring-2 ring-brand-500/20 shadow-sm text-brand-950'
                    : 'bg-white/80 border-gray-200 text-gray-600 hover:bg-white hover:border-gray-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                      PEMPROV JAWA TIMUR
                    </span>
                    {kopAuthority === KOP_AUTHORITY_CABDIN && (
                      <span className="w-3 h-3 rounded-full bg-brand-600 flex items-center justify-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-white" />
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-black uppercase text-gray-900 leading-snug">
                    {KOP_AUTHORITY_CABDIN}
                  </p>
                </div>
                <p className="text-[11px] text-gray-500 leading-tight">
                  Instansi Induk: <strong>PEMERINTAH PROVINSI JAWA TIMUR</strong> (Sesuai untuk
                  jenjang SMA, SMK, PKPLK/SLB).
                </p>
              </button>

              <button
                type="button"
                onClick={() => setKopAuthority(KOP_AUTHORITY_KAB)}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                  kopAuthority === KOP_AUTHORITY_KAB
                    ? 'bg-white border-brand-500 ring-2 ring-brand-500/20 shadow-sm text-brand-950'
                    : 'bg-white/80 border-gray-200 text-gray-600 hover:bg-white hover:border-gray-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                      PEMKAB BOJONEGORO
                    </span>
                    {kopAuthority === KOP_AUTHORITY_KAB && (
                      <span className="w-3 h-3 rounded-full bg-brand-600 flex items-center justify-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-white" />
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-black uppercase text-gray-900 leading-snug">
                    {KOP_AUTHORITY_KAB}
                  </p>
                </div>
                <p className="text-[11px] text-gray-500 leading-tight">
                  Instansi Induk: <strong>PEMERINTAH KABUPATEN BOJONEGORO</strong> (Sesuai untuk
                  jenjang TK, SD, SMP).
                </p>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Nama Sekolah / Lembaga
              </label>
              <input
                type="text"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                placeholder="Contoh: TK Pembina / SDN 1 / SMPN 1 / SMAN 1 / SMKN 1 / SLB"
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/10 text-sm font-semibold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                NPSN
              </label>
              <input
                type="text"
                value={schoolNpsn}
                onChange={(e) => setSchoolNpsn(e.target.value)}
                placeholder="Contoh: 20541234"
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/10 text-sm"
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center justify-between">
                <span>Alamat Lengkap Sekolah (Yang Disupervisi)</span>
                <span className="text-[10px] text-brand-600 font-bold bg-brand-50 px-2 py-0.5 rounded">
                  Tampil di Laporan &amp; Kop
                </span>
              </label>
              <input
                type="text"
                value={schoolAddress}
                onChange={(e) => setSchoolAddress(e.target.value)}
                placeholder="Contoh: Jl. Panglima Sudirman No. 28, Bojonegoro, Jawa Timur"
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/10 text-sm"
              />
              <p className="text-[11px] text-gray-400 italic mt-0.5">
                * Alamat ini akan dicantumkan secara otomatis pada Kop Surat resmi, lembar identitas
                dokumen laporan hasil supervisi, file PDF A4, dan dokumen Word (.doc).
              </p>
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Tahun Akademik Aktif
              </label>
              <select
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="w-full p-3 bg-brand-50 border border-brand-200 text-brand-700 font-bold rounded-xl focus:outline-none ring-2 ring-brand-500/20 text-sm"
              >
                <option value="2026/2027">2026 / 2027</option>
                <option value="2025/2026">2025 / 2026</option>
                <option value="2024/2025">2024 / 2025</option>
              </select>
              <p className="text-[10px] text-brand-600 italic mt-1">
                * Seluruh data laporan dan statistik akan merujuk pada tahun akademik ini.
              </p>
            </div>
          </div>

          <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-center">
            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-2">
              Pratinjau Kop Laporan Supervisi Resmi:
            </p>
            <div className="bg-white p-5 rounded-lg border border-gray-300 shadow-2xs max-w-lg mx-auto border-b-2 border-b-black">
              <p className="text-[11px] font-black text-gray-900 leading-tight uppercase">
                {kopAuthority === KOP_AUTHORITY_KAB
                  ? 'PEMERINTAH KABUPATEN BOJONEGORO'
                  : 'PEMERINTAH PROVINSI JAWA TIMUR'}
              </p>
              <p className="text-[10px] font-black text-gray-800 leading-tight uppercase">
                DINAS PENDIDIKAN
              </p>
              <p className="text-[10px] font-bold text-gray-800 leading-tight uppercase">
                {kopAuthority}
              </p>
              <p className="text-xs font-bold text-brand-700 mt-1 uppercase flex items-center justify-center gap-2">
                <span>{schoolName || 'NAMA SATUAN PENDIDIKAN'}</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200 font-bold">
                  {schoolLevel}
                </span>
              </p>
              <p className="text-[10px] text-gray-600 italic mt-0.5">
                {schoolAddress || 'Alamat Sekolah Belum Diatur'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UserCheck className="text-brand-600" size={20} />
            <div>
              <h3 className="font-display font-bold">Pejabat &amp; Otoritas Penandatangan</h3>
              <p className="text-xs text-gray-500">
                Format pengesahan 4 pihak: Kepala Sekolah, Guru yang Disupervisi, Supervisor, dan
                Pengawas Pembina.
              </p>
            </div>
          </div>
        </div>

        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Nama Kepala Sekolah
            </label>
            <input
              type="text"
              value={headmasterName}
              onChange={(e) => setHeadmasterName(e.target.value)}
              placeholder="Input Nama Kepala Sekolah"
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/10 text-sm font-semibold"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              NIP Kepala Sekolah
            </label>
            <input
              type="text"
              value={headmasterNip}
              onChange={(e) => setHeadmasterNip(e.target.value)}
              placeholder="Input NIP Kepala Sekolah"
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/10 text-sm font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center justify-between">
              <span>Nama Supervisor (Penilai / Waka Kurikulum)</span>
              <span className="text-[9px] text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded">
                Penilai Kelas
              </span>
            </label>
            <input
              type="text"
              value={internalSupervisorName}
              onChange={(e) => setInternalSupervisorName(e.target.value)}
              placeholder="Contoh: Waka Kurikulum / Guru Senior"
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/10 text-sm font-semibold text-gray-800"
            />
            <p className="text-[10px] text-gray-400 italic">
              Supervisor yang melakukan observasi langsung di kelas
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              NIP Supervisor
            </label>
            <input
              type="text"
              value={internalSupervisorNip}
              onChange={(e) => setInternalSupervisorNip(e.target.value)}
              placeholder="Input NIP Supervisor"
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/10 text-sm font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center justify-between">
              <span>Nama Pengawas Pembina (Otoritas Kedinasan)</span>
              <span className="text-[9px] text-amber-600 font-bold bg-amber-50 px-1.5 py-0.5 rounded">
                Resmi
              </span>
            </label>
            <input
              type="text"
              value={supervisorName}
              onChange={(e) => setSupervisorName(e.target.value)}
              placeholder="Input Nama Pengawas Pembina"
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/10 text-sm font-semibold text-gray-800"
            />
            <p className="text-[10px] text-gray-400 italic">
              Pengawas Cabang Dinas Pendidikan / Dinas Pendidikan
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              NIP Pengawas Pembina
            </label>
            <input
              type="text"
              value={supervisorNip}
              onChange={(e) => setSupervisorNip(e.target.value)}
              placeholder="Input NIP Pengawas Pembina"
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/10 text-sm font-mono"
            />
            <p className="text-[10px] text-gray-400 italic">
              NIP resmi pengawas pembina sekolah
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
          <ShieldCheck className="text-brand-600" size={20} />
          <h3 className="font-display font-bold">Validasi &amp; Verifikasi Laporan</h3>
        </div>
        <div className="p-8 space-y-6">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <p className="text-sm font-bold text-gray-900">Validasi Dokumen Dua Tahap</p>
              <p className="text-xs text-gray-500">
                Mewajibkan persetujuan kepala sekolah setelah diverifikasi supervisor.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setTwoStageValidation((prev) => !prev)}
              aria-label="Toggle Validasi Dokumen Dua Tahap"
              className={`w-12 h-6 rounded-full relative p-1 cursor-pointer transition-colors ${
                twoStageValidation ? 'bg-brand-600' : 'bg-gray-200'
              }`}
            >
              <div
                className={`w-4 h-4 bg-white rounded-full transition-all ${
                  twoStageValidation ? 'ml-auto' : 'ml-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sliders className="text-brand-600" size={20} />
            <div>
              <h3 className="font-display font-bold">
                Standar Instrumen &amp; Rubrik Supervisi
              </h3>
              <p className="text-xs text-gray-400">
                Pengaturan aspek penilaian observasi kelas yang digunakan supervisor.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowCustomizerModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-brand-500/20 cursor-pointer"
          >
            <Sliders size={14} /> Kustomisasi / Import Data
          </button>
        </div>

        <div className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                Instrumen Aktif:
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-brand-100 text-brand-700 text-xs font-bold">
                {instrumentTitle}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Saat ini memiliki <strong>{activeIndicatorCount} indikator observasi klinis</strong>.
              Anda dapat mengimpor file format Excel/CSV atau memilih kurikulum standar.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowCustomizerModal(true)}
            className="px-4 py-2.5 bg-white border border-gray-200 hover:border-brand-300 text-gray-700 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shadow-xs"
          >
            Buka Pengaturan Rubrik &amp; Import
          </button>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          type="button"
          onClick={handleSaveSettings}
          disabled={isSaved}
          className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold shadow-lg transition-all cursor-pointer ${
            isSaved
              ? 'bg-green-600 text-white'
              : 'bg-[#2563eb] text-white hover:bg-brand-700'
          }`}
        >
          {isSaved ? <Check size={18} /> : <Save size={18} />}
          <span>{isSaved ? 'BERHASIL DISIMPAN' : 'SIMPAN PERUBAHAN'}</span>
        </button>
      </div>

      <Suspense fallback={null}>
        {showCustomizerModal && (
          <InstrumentCustomizerModal
            isOpen={showCustomizerModal}
            onClose={() => setShowCustomizerModal(false)}
            onSaved={refreshRubrics}
          />
        )}
      </Suspense>
    </div>
  );
}
