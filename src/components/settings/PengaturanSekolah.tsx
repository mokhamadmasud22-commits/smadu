import {
  AlertCircle,
  Building2,
  Check,
  CheckCircle2,
  Cloud,
  DownloadCloud,
  ExternalLink,
  FolderOpen,
  HardDriveUpload,
  LogOut,
  RefreshCw,
  RotateCcw,
  Save,
  Sheet,
  ShieldCheck,
  Sliders,
  Trash2,
  UploadCloud,
  UserCheck,
} from 'lucide-react';
import { Suspense, lazy, useEffect, useState } from 'react';
import {
  JENJANG_OPTIONS,
  KOP_AUTHORITY_CABDIN,
  KOP_AUTHORITY_KAB,
} from '../../constants/school';
import { useCloudStorage } from '../../contexts/CloudStorageContext';
import { useRubricConfig } from '../../hooks/useRubricConfig';
import { useSchoolConfig } from '../../hooks/useSchoolConfig';
import { countRubricItems } from '../../utils/score';
import GoogleSignInButton from '../common/GoogleSignInButton';

const InstrumentCustomizerModal = lazy(() => import('../common/InstrumentCustomizerModal'));

export default function PengaturanSekolah() {
  const { config: initialConfig, updateAndSave } = useSchoolConfig();
  const { rubricSections, instrumentTitle, refresh: refreshRubrics } = useRubricConfig();
  const {
    user,
    hasToken,
    spreadsheetId,
    driveFolderId,
    spreadsheetTitle,
    lastSyncAt,
    driveFiles,
    isBusy,
    cloudError,
    cloudNotice,
    signIn,
    signOut,
    updateCloudTargets,
    resetCloudTargets,
    refreshDriveFiles,
    pullFromSpreadsheet,
    requestPushToSpreadsheet,
    requestUploadBackupToDrive,
    requestRestoreDriveBackup,
    requestDeleteDriveFile,
  } = useCloudStorage();

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

  const [sheetInput, setSheetInput] = useState(spreadsheetId);
  const [folderInput, setFolderInput] = useState(driveFolderId);

  useEffect(() => {
    setSchoolName(initialConfig.schoolName);
    setSchoolLevel(initialConfig.schoolLevel);
    setKopAuthority(initialConfig.kopAuthority);
    setSchoolNpsn(initialConfig.schoolNpsn);
    setSchoolAddress(initialConfig.schoolAddress);
    setAcademicYear(initialConfig.academicYear);
    setHeadmasterName(initialConfig.headmasterName);
    setHeadmasterNip(initialConfig.headmasterNip);
    setInternalSupervisorName(initialConfig.internalSupervisorName);
    setInternalSupervisorNip(initialConfig.internalSupervisorNip);
    setSupervisorName(initialConfig.supervisorName);
    setSupervisorNip(initialConfig.supervisorNip);
    setTwoStageValidation(initialConfig.twoStageValidation);
  }, [initialConfig]);

  useEffect(() => {
    setSheetInput(spreadsheetId);
    setFolderInput(driveFolderId);
  }, [spreadsheetId, driveFolderId]);

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
          Konfigurasi profil sekolah, jenjang pendidikan (TK, SD, SMP, SMA, SMK, PKPLK), serta
          penyimpanan Google Drive &amp; Spreadsheet lintas perangkat.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-emerald-50/70 to-blue-50/70 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Cloud className="text-brand-600" size={20} />
            <div>
              <h3 className="font-display font-bold text-gray-900">
                Penyimpanan Cloud (Google Spreadsheet &amp; Google Drive)
              </h3>
              <p className="text-xs text-gray-500">
                Simpan &amp; sinkronkan data ke Google Sheets dan folder Google Drive agar tetap
                sama saat dibuka dari perangkat lain.
              </p>
            </div>
          </div>

          {hasToken ? (
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                {user?.email || 'Terhubung'}
              </span>
              <button
                type="button"
                onClick={signOut}
                disabled={isBusy}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-xs font-bold text-gray-700 cursor-pointer"
              >
                <LogOut size={13} />
                <span>Keluar</span>
              </button>
            </div>
          ) : (
            <GoogleSignInButton
              onClick={signIn}
              disabled={isBusy}
              compact
              label={user ? 'Segarkan Izin Google' : 'Masuk dengan Google'}
            />
          )}
        </div>

        <div className="p-8 space-y-5">
          {cloudError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-600" />
              <p>{cloudError}</p>
            </div>
          )}

          {cloudNotice && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5">
              <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-600" />
              <p>{cloudNotice}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                  <Sheet size={12} className="text-emerald-600" />
                  <span>ID / Link Google Spreadsheet Database</span>
                </label>
                <a
                  href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:underline"
                >
                  <span>Buka Sheet</span>
                  <ExternalLink size={11} />
                </a>
              </div>
              <input
                type="text"
                value={sheetInput}
                onChange={(e) => setSheetInput(e.target.value)}
                placeholder="ID atau URL Google Spreadsheet"
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-brand-500/15"
              />
              <p className="text-[11px] text-gray-400">
                Aktif: <strong className="text-gray-600">{spreadsheetTitle}</strong>
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                  <FolderOpen size={12} className="text-blue-600" />
                  <span>ID / Link Folder Google Drive</span>
                </label>
                <a
                  href={`https://drive.google.com/drive/folders/${driveFolderId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 hover:underline"
                >
                  <span>Buka Folder</span>
                  <ExternalLink size={11} />
                </a>
              </div>
              <input
                type="text"
                value={folderInput}
                onChange={(e) => setFolderInput(e.target.value)}
                placeholder="ID atau URL Folder Google Drive"
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-brand-500/15"
              />
              <p className="text-[11px] text-gray-400">
                Digunakan untuk arsip cadangan JSON &amp; unggahan dokumen perangkat.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => updateCloudTargets(sheetInput, folderInput)}
                className="px-3.5 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-bold text-gray-700 cursor-pointer"
              >
                Terapkan ID Koneksi
              </button>
              <button
                type="button"
                onClick={resetCloudTargets}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-500 cursor-pointer"
              >
                <RotateCcw size={12} />
                <span>Reset Bawaan</span>
              </button>
            </div>

            {lastSyncAt && (
              <span className="text-[11px] text-emerald-700 font-semibold">
                Sinkron terakhir: {new Date(lastSyncAt).toLocaleString('id-ID')}
              </span>
            )}
          </div>

          <div className="pt-3 border-t border-gray-100 flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={pullFromSpreadsheet}
              disabled={isBusy || !hasToken}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-brand-200 bg-brand-50 hover:bg-brand-100 text-brand-800 text-xs font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <DownloadCloud size={15} />
              <span>Muat Data dari Spreadsheet</span>
            </button>

            <button
              type="button"
              onClick={() => requestPushToSpreadsheet(true)}
              disabled={isBusy || !hasToken}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <UploadCloud size={15} />
              <span>Simpan ke Spreadsheet &amp; Backup Drive</span>
            </button>

            <button
              type="button"
              onClick={requestUploadBackupToDrive}
              disabled={isBusy || !hasToken}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <HardDriveUpload size={15} />
              <span>Cadangkan JSON ke Drive</span>
            </button>
          </div>

          {hasToken && (
            <div className="bg-slate-50 rounded-xl border border-gray-200 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-gray-800">
                  Berkas Tersimpan di Folder Google Drive ({driveFiles.length})
                </p>
                <button
                  type="button"
                  onClick={refreshDriveFiles}
                  disabled={isBusy}
                  className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:underline cursor-pointer"
                >
                  <RefreshCw size={12} className={isBusy ? 'animate-spin' : ''} />
                  <span>Segarkan</span>
                </button>
              </div>

              {driveFiles.length === 0 ? (
                <p className="text-xs text-gray-500 italic">
                  Belum ada file di folder Drive ini atau klik &quot;Segarkan&quot; untuk memuat
                  daftar terbaru.
                </p>
              ) : (
                <div className="divide-y divide-gray-200 bg-white rounded-lg border border-gray-200 max-h-56 overflow-y-auto">
                  {driveFiles.map((file) => {
                    const isJsonBackup =
                      file.name.toLowerCase().endsWith('.json') ||
                      file.mimeType === 'application/json';
                    return (
                      <div
                        key={file.id}
                        className="p-2.5 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{file.name}</p>
                          <p className="text-[10px] text-gray-400">
                            {file.modifiedTime
                              ? new Date(file.modifiedTime).toLocaleString('id-ID')
                              : '-'}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {isJsonBackup && (
                            <button
                              type="button"
                              onClick={() => requestRestoreDriveBackup(file)}
                              disabled={isBusy}
                              className="px-2.5 py-1 rounded-md bg-brand-50 hover:bg-brand-100 text-brand-700 font-bold text-[11px] cursor-pointer"
                            >
                              Pulihkan
                            </button>
                          )}
                          {file.webViewLink && (
                            <a
                              href={file.webViewLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-[11px]"
                            >
                              Lihat
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => requestDeleteDriveFile(file)}
                            disabled={isBusy}
                            title="Hapus dari Drive"
                            className="p-1.5 rounded-md bg-rose-50 hover:bg-rose-100 text-rose-600 cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
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
