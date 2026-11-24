import {
  AlertCircle,
  CheckCircle2,
  Cloud,
  DownloadCloud,
  ExternalLink,
  FolderOpen,
  HardDriveUpload,
  LogOut,
  RefreshCw,
  Sheet,
  UploadCloud,
  X,
} from 'lucide-react';
import { useCloudStorage } from '../../contexts/CloudStorageContext';
import GoogleSignInButton from './GoogleSignInButton';

export default function CloudSyncModal() {
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
    isSyncModalOpen,
    setSyncModalOpen,
    signIn,
    signOut,
    refreshDriveFiles,
    pullFromSpreadsheet,
    requestPushToSpreadsheet,
    requestUploadBackupToDrive,
  } = useCloudStorage();

  if (!isSyncModalOpen) return null;

  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
  const driveFolderUrl = `https://drive.google.com/drive/folders/${driveFolderId}`;

  return (
    <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 no-print">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-gray-200 overflow-hidden max-h-[92vh] flex flex-col">
        <div className="p-5 border-b border-gray-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center">
              <Cloud size={22} />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">
                Penyimpanan Cloud Lintas Perangkat
              </h3>
              <p className="text-xs text-gray-500">
                Sinkronisasi Google Spreadsheet &amp; Google Drive SI PERAK
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSyncModalOpen(false)}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200/60 rounded-lg cursor-pointer"
            aria-label="Tutup modal cloud"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto">
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

          <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/70 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  Status Akun Google Workspace
                </p>
                {user ? (
                  <p className="text-sm font-bold text-gray-900 mt-0.5">
                    {user.displayName || 'Pengguna Google'}{' '}
                    <span className="text-xs font-normal text-gray-500">({user.email})</span>
                  </p>
                ) : (
                  <p className="text-xs text-gray-600 mt-0.5">
                    Masuk dengan Google agar perubahan tersimpan lintas perangkat.
                  </p>
                )}
              </div>

              {hasToken ? (
                <button
                  type="button"
                  onClick={signOut}
                  disabled={isBusy}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 rounded-lg text-xs font-bold cursor-pointer"
                >
                  <LogOut size={14} />
                  <span>Keluar</span>
                </button>
              ) : (
                <GoogleSignInButton
                  onClick={signIn}
                  disabled={isBusy}
                  compact
                  label={user ? 'Segarkan Izin Google' : 'Masuk dengan Google'}
                />
              )}
            </div>

            {lastSyncAt && (
              <p className="text-[11px] text-emerald-700 font-medium">
                Terakhir disinkronkan: {new Date(lastSyncAt).toLocaleString('id-ID')}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                  <Sheet size={14} className="text-emerald-600" />
                  Google Spreadsheet
                </span>
                <a
                  href={spreadsheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:underline"
                >
                  <span>Buka</span>
                  <ExternalLink size={11} />
                </a>
              </div>
              <p className="text-[11px] font-mono text-gray-600 truncate" title={spreadsheetId}>
                ID: {spreadsheetId}
              </p>
              <p className="text-[11px] text-gray-500 truncate">{spreadsheetTitle}</p>
            </div>

            <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/50 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-900">
                  <FolderOpen size={14} className="text-blue-600" />
                  Folder Google Drive
                </span>
                <a
                  href={driveFolderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 hover:underline"
                >
                  <span>Buka</span>
                  <ExternalLink size={11} />
                </a>
              </div>
              <p className="text-[11px] font-mono text-gray-600 truncate" title={driveFolderId}>
                ID: {driveFolderId}
              </p>
              <p className="text-[11px] text-gray-500">
                {driveFiles.length} file terdeteksi di folder
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            <p className="text-xs font-bold text-gray-800">Tindakan Sinkronisasi Data</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={pullFromSpreadsheet}
                disabled={isBusy || !hasToken}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-brand-200 bg-brand-50 hover:bg-brand-100 text-brand-800 text-xs font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <DownloadCloud size={15} />
                <span>Muat dari Spreadsheet</span>
              </button>

              <button
                type="button"
                onClick={() => requestPushToSpreadsheet(true)}
                disabled={isBusy || !hasToken}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <UploadCloud size={15} />
                <span>Simpan ke Sheets &amp; Drive</span>
              </button>

              <button
                type="button"
                onClick={() => requestPushToSpreadsheet(false)}
                disabled={isBusy || !hasToken}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Sheet size={14} />
                <span>Simpan ke Spreadsheet Saja</span>
              </button>

              <button
                type="button"
                onClick={requestUploadBackupToDrive}
                disabled={isBusy || !hasToken}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <HardDriveUpload size={14} />
                <span>Backup JSON ke Drive</span>
              </button>
            </div>
          </div>

          {hasToken && (
            <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-[11px] text-gray-500">
              <span>Kelola file lengkap di Pengaturan Sekolah atau Dokumen Perangkat.</span>
              <button
                type="button"
                onClick={refreshDriveFiles}
                disabled={isBusy}
                className="inline-flex items-center gap-1 text-brand-600 font-bold hover:underline cursor-pointer"
              >
                <RefreshCw size={12} className={isBusy ? 'animate-spin' : ''} />
                <span>Segarkan Drive</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
