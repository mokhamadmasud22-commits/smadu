import type { User } from 'firebase/auth';
import { AlertTriangle, CheckCircle2, ShieldAlert, X } from 'lucide-react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  DEFAULT_DRIVE_FOLDER_ID,
  DEFAULT_SPREADSHEET_ID,
} from '../constants/school';
import {
  clearInMemoryAccessToken,
  getInMemoryAccessToken,
  initGoogleWorkspaceAuth,
  signInWithGoogleWorkspace,
  signOutGoogleWorkspace,
} from '../services/googleAuth';
import {
  applyCloudSnapshotToLocalStorage,
  collectLocalSnapshotForCloud,
  getStoredDriveFolderId,
  getStoredSpreadsheetId,
  setStoredDriveFolderId,
  setStoredSpreadsheetId,
} from '../services/storage';
import {
  WorkspaceAuthError,
  deleteDriveFile,
  downloadDriveJsonBackup,
  listDriveFolderFiles,
  loadCloudSnapshotFromSpreadsheet,
  saveCloudSnapshotToSpreadsheet,
  uploadBackupJsonToDrive,
  uploadFileToDriveFolder,
} from '../services/workspaceStorage';
import type { DriveFileItem } from '../types/supervision';

interface PendingConfirmation {
  title: string;
  description: string;
  details: string[];
  confirmLabel: string;
  tone: 'primary' | 'danger' | 'emerald';
  onConfirm: () => Promise<void>;
}

interface CloudStorageContextValue {
  user: User | null;
  hasToken: boolean;
  spreadsheetId: string;
  driveFolderId: string;
  spreadsheetTitle: string;
  lastSyncAt: string | null;
  driveFiles: DriveFileItem[];
  isBusy: boolean;
  cloudError: string | null;
  cloudNotice: string | null;
  isSyncModalOpen: boolean;
  setSyncModalOpen: (open: boolean) => void;
  clearMessages: () => void;
  signIn: () => Promise<boolean>;
  signOut: () => Promise<void>;
  updateCloudTargets: (spreadsheetId: string, driveFolderId: string) => void;
  resetCloudTargets: () => void;
  refreshDriveFiles: () => Promise<void>;
  pullFromSpreadsheet: () => Promise<void>;
  requestPushToSpreadsheet: (includeDriveBackup?: boolean) => void;
  requestUploadBackupToDrive: () => void;
  requestUploadFileToDrive: (file: File) => void;
  requestRestoreDriveBackup: (file: DriveFileItem) => void;
  requestDeleteDriveFile: (file: DriveFileItem) => void;
}

const CloudStorageContext = createContext<CloudStorageContextValue | null>(null);

export function CloudStorageProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(() => getInMemoryAccessToken());
  const [spreadsheetId, setSpreadsheetIdState] = useState<string>(() => getStoredSpreadsheetId());
  const [driveFolderId, setDriveFolderIdState] = useState<string>(() => getStoredDriveFolderId());
  const [spreadsheetTitle, setSpreadsheetTitle] = useState<string>('Spreadsheet SI PERAK');
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [driveFiles, setDriveFiles] = useState<DriveFileItem[]>([]);
  const [isBusy, setIsBusy] = useState(false);
  const [cloudError, setCloudError] = useState<string | null>(null);
  const [cloudNotice, setCloudNotice] = useState<string | null>(null);
  const [isSyncModalOpen, setSyncModalOpen] = useState(false);
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirmation | null>(null);

  useEffect(() => {
    const unsubscribe = initGoogleWorkspaceAuth((nextUser, nextToken) => {
      setUser(nextUser);
      setAccessToken(nextToken);
      if (!nextUser) {
        setDriveFiles([]);
      }
    });
    return unsubscribe;
  }, []);

  const clearMessages = useCallback(() => {
    setCloudError(null);
    setCloudNotice(null);
  }, []);

  const handleApiError = useCallback((err: unknown) => {
    if (err instanceof WorkspaceAuthError) {
      if (err.status === 401) {
        clearInMemoryAccessToken();
        setAccessToken(null);
      }
      setCloudError(err.message);
      return;
    }
    const msg = err instanceof Error ? err.message : 'Terjadi kesalahan koneksi Google Workspace.';
    setCloudError(msg);
  }, []);

  const signIn = useCallback(async (): Promise<boolean> => {
    setIsBusy(true);
    clearMessages();
    try {
      const res = await signInWithGoogleWorkspace();
      setUser(res.user);
      setAccessToken(res.accessToken);
      setCloudNotice(`Terhubung sebagai ${res.user.email || res.user.displayName || 'Pengguna Google'}.`);
      try {
        const files = await listDriveFolderFiles(res.accessToken, driveFolderId);
        setDriveFiles(files);
      } catch {
        // Ignore initial listing error; user can retry inside panel
      }
      return true;
    } catch (err) {
      handleApiError(err);
      return false;
    } finally {
      setIsBusy(false);
    }
  }, [clearMessages, driveFolderId, handleApiError]);

  const signOut = useCallback(async () => {
    setIsBusy(true);
    clearMessages();
    try {
      await signOutGoogleWorkspace();
      setUser(null);
      setAccessToken(null);
      setDriveFiles([]);
      setCloudNotice('Sesi Google telah diputuskan.');
    } catch (err) {
      handleApiError(err);
    } finally {
      setIsBusy(false);
    }
  }, [clearMessages, handleApiError]);

  const updateCloudTargets = useCallback(
    (nextSpreadsheet: string, nextFolder: string) => {
      setStoredSpreadsheetId(nextSpreadsheet);
      setStoredDriveFolderId(nextFolder);
      setSpreadsheetIdState(getStoredSpreadsheetId());
      setDriveFolderIdState(getStoredDriveFolderId());
      setCloudNotice('ID Spreadsheet & Folder Google Drive berhasil diperbarui.');
      setCloudError(null);
    },
    [],
  );

  const resetCloudTargets = useCallback(() => {
    setStoredSpreadsheetId(DEFAULT_SPREADSHEET_ID);
    setStoredDriveFolderId(DEFAULT_DRIVE_FOLDER_ID);
    setSpreadsheetIdState(DEFAULT_SPREADSHEET_ID);
    setDriveFolderIdState(DEFAULT_DRIVE_FOLDER_ID);
    setCloudNotice('Koneksi dikembalikan ke ID Spreadsheet & Folder Drive bawaan.');
    setCloudError(null);
  }, []);

  const requireToken = useCallback((): string | null => {
    const token = accessToken || getInMemoryAccessToken();
    if (!token) {
      setCloudError(
        'Silakan klik "Masuk dengan Google" terlebih dahulu untuk mendapatkan izin akses Google Sheets & Drive.',
      );
      return null;
    }
    return token;
  }, [accessToken]);

  const refreshDriveFiles = useCallback(async () => {
    const token = requireToken();
    if (!token) return;
    setIsBusy(true);
    clearMessages();
    try {
      const files = await listDriveFolderFiles(token, driveFolderId);
      setDriveFiles(files);
    } catch (err) {
      handleApiError(err);
    } finally {
      setIsBusy(false);
    }
  }, [clearMessages, driveFolderId, handleApiError, requireToken]);

  const pullFromSpreadsheet = useCallback(async () => {
    const token = requireToken();
    if (!token) return;
    setIsBusy(true);
    clearMessages();
    try {
      const res = await loadCloudSnapshotFromSpreadsheet(token, spreadsheetId);
      setSpreadsheetTitle(res.info.title);

      if (res.isEmptySheet) {
        setCloudNotice(
          `Spreadsheet "${res.info.title}" masih kosong. Simpan data dari perangkat ini untuk menginisialisasi database cloud.`,
        );
        return;
      }

      const localSnap = collectLocalSnapshotForCloud();
      const hasLocalRecords =
        localSnap.gurus.length > 0 ||
        localSnap.supervisions.length > 0 ||
        localSnap.followUps.length > 0;

      if (hasLocalRecords) {
        setPendingConfirm({
          title: 'Terapkan Data dari Google Spreadsheet?',
          description: `Spreadsheet "${res.info.title}" memiliki ${res.snapshot.gurus.length} data guru, ${res.snapshot.supervisions.length} sesi supervisi, dan ${res.snapshot.followUps.length} catatan tindak lanjut.`,
          details: [
            `Sumber: Google Spreadsheet (${spreadsheetId})`,
            `Data lokal saat ini (${localSnap.gurus.length} guru, ${localSnap.supervisions.length} sesi) akan diselaraskan dengan isi Spreadsheet.`,
            'Perubahan hanya memengaruhi tampilan lokal browser ini; isi Google Spreadsheet tidak diubah.',
          ],
          confirmLabel: 'Ya, Muat Data Cloud',
          tone: 'primary',
          onConfirm: async () => {
            applyCloudSnapshotToLocalStorage(res.snapshot);
            setLastSyncAt(new Date().toISOString());
            setCloudNotice(
              `Data berhasil dimuat dari "${res.info.title}" (${res.snapshot.gurus.length} guru, ${res.snapshot.supervisions.length} sesi).`,
            );
          },
        });
      } else {
        applyCloudSnapshotToLocalStorage(res.snapshot);
        setLastSyncAt(new Date().toISOString());
        setCloudNotice(
          `Data berhasil dimuat dari "${res.info.title}" (${res.snapshot.gurus.length} guru, ${res.snapshot.supervisions.length} sesi).`,
        );
      }
    } catch (err) {
      handleApiError(err);
    } finally {
      setIsBusy(false);
    }
  }, [clearMessages, handleApiError, requireToken, spreadsheetId]);

  const requestPushToSpreadsheet = useCallback(
    (includeDriveBackup = false) => {
      const token = requireToken();
      if (!token) return;
      const snapshot = collectLocalSnapshotForCloud();

      setPendingConfirm({
        title: includeDriveBackup
          ? 'Simpan ke Spreadsheet & Cadangkan ke Drive?'
          : 'Simpan Data ke Google Spreadsheet?',
        description:
          'Operasi ini akan memperbarui tab database SI PERAK pada Google Spreadsheet yang ditautkan agar dapat diakses dari perangkat lain.',
        details: [
          `Target Spreadsheet ID: ${spreadsheetId}`,
          `Data disinkronkan: ${snapshot.gurus.length} guru, ${snapshot.supervisions.length} sesi supervisi, ${snapshot.followUps.length} tindak lanjut, serta profil sekolah & rubrik.`,
          includeDriveBackup
            ? `Cadangan JSON juga akan diunggah ke Folder Drive ID: ${driveFolderId}.`
            : 'Tab Config, DataGuru, Supervisi, DokumentasiFoto, dan TindakLanjut akan diperbarui.',
        ],
        confirmLabel: 'Konfirmasi & Simpan ke Cloud',
        tone: 'emerald',
        onConfirm: async () => {
          const activeToken = requireToken();
          if (!activeToken) return;
          const res = await saveCloudSnapshotToSpreadsheet(activeToken, spreadsheetId, snapshot);
          setSpreadsheetTitle(res.info.title);
          if (includeDriveBackup) {
            await uploadBackupJsonToDrive(activeToken, driveFolderId, snapshot);
            const files = await listDriveFolderFiles(activeToken, driveFolderId);
            setDriveFiles(files);
          }
          setLastSyncAt(res.syncedAt);
          setCloudNotice(
            includeDriveBackup
              ? `Data berhasil disimpan ke Spreadsheet "${res.info.title}" dan dicadangkan ke Google Drive.`
              : `Data berhasil disimpan ke Spreadsheet "${res.info.title}".`,
          );
        },
      });
    },
    [driveFolderId, requireToken, spreadsheetId],
  );

  const requestUploadBackupToDrive = useCallback(() => {
    const token = requireToken();
    if (!token) return;
    const snapshot = collectLocalSnapshotForCloud();

    setPendingConfirm({
      title: 'Unggah File Cadangan JSON ke Google Drive?',
      description:
        'Sistem akan membuat satu file arsip JSON lengkap berisi seluruh data sekolah, guru, sesi supervisi, foto dokumentasi, dan tindak lanjut ke Google Drive.',
      details: [
        `Folder Tujuan Google Drive ID: ${driveFolderId}`,
        `Isi arsip: ${snapshot.gurus.length} guru, ${snapshot.supervisions.length} sesi supervisi, ${snapshot.followUps.length} tindak lanjut.`,
      ],
      confirmLabel: 'Unggah Cadangan ke Drive',
      tone: 'primary',
      onConfirm: async () => {
        const activeToken = requireToken();
        if (!activeToken) return;
        const uploaded = await uploadBackupJsonToDrive(activeToken, driveFolderId, snapshot);
        const files = await listDriveFolderFiles(activeToken, driveFolderId);
        setDriveFiles(files);
        setLastSyncAt(new Date().toISOString());
        setCloudNotice(`File cadangan "${uploaded.name}" berhasil disimpan ke Google Drive.`);
      },
    });
  }, [driveFolderId, requireToken]);

  const requestUploadFileToDrive = useCallback(
    (file: File) => {
      const token = requireToken();
      if (!token) return;
      const sizeKb = Math.max(1, Math.round(file.size / 1024));

      setPendingConfirm({
        title: 'Unggah Dokumen ke Folder Google Drive?',
        description: `Anda akan mengunggah dokumen "${file.name}" ke folder penyimpanan Google Drive bersama SI PERAK.`,
        details: [
          `Nama File: ${file.name} (${sizeKb} KB)`,
          `Tipe: ${file.type || 'Dokumen'}`,
          `Folder Tujuan Google Drive ID: ${driveFolderId}`,
        ],
        confirmLabel: 'Konfirmasi & Unggah',
        tone: 'primary',
        onConfirm: async () => {
          const activeToken = requireToken();
          if (!activeToken) return;
          const uploaded = await uploadFileToDriveFolder(
            activeToken,
            driveFolderId,
            file,
            file.name,
            file.type || 'application/octet-stream',
          );
          const files = await listDriveFolderFiles(activeToken, driveFolderId);
          setDriveFiles(files);
          setCloudNotice(`Dokumen "${uploaded.name}" berhasil diunggah ke Google Drive.`);
        },
      });
    },
    [driveFolderId, requireToken],
  );

  const requestRestoreDriveBackup = useCallback(
    (file: DriveFileItem) => {
      const token = requireToken();
      if (!token) return;

      setPendingConfirm({
        title: 'Pulihkan Data dari File Cadangan Drive?',
        description: `Data di perangkat ini akan diganti dengan isi file cadangan "${file.name}".`,
        details: [
          `File Sumber: ${file.name}`,
          'Pastikan ini adalah file cadangan SI PERAK JSON yang benar.',
        ],
        confirmLabel: 'Pulihkan Sekarang',
        tone: 'primary',
        onConfirm: async () => {
          const activeToken = requireToken();
          if (!activeToken) return;
          const data = await downloadDriveJsonBackup(activeToken, file.id);
          applyCloudSnapshotToLocalStorage(data);
          setLastSyncAt(new Date().toISOString());
          setCloudNotice(`Data berhasil dipulihkan dari file "${file.name}".`);
        },
      });
    },
    [requireToken],
  );

  const requestDeleteDriveFile = useCallback(
    (file: DriveFileItem) => {
      const token = requireToken();
      if (!token) return;

      setPendingConfirm({
        title: 'Hapus File dari Google Drive?',
        description: `File "${file.name}" akan dihapus dari Google Drive Anda.`,
        details: [
          `ID File: ${file.id}`,
          'Tindakan ini menghapus file dari folder Google Drive tujuan.',
        ],
        confirmLabel: 'Ya, Hapus File',
        tone: 'danger',
        onConfirm: async () => {
          const activeToken = requireToken();
          if (!activeToken) return;
          await deleteDriveFile(activeToken, file.id);
          const files = await listDriveFolderFiles(activeToken, driveFolderId);
          setDriveFiles(files);
          setCloudNotice(`File "${file.name}" telah dihapus dari Google Drive.`);
        },
      });
    },
    [driveFolderId, requireToken],
  );

  const executeConfirmedAction = useCallback(async () => {
    if (!pendingConfirm) return;
    const action = pendingConfirm.onConfirm;
    setPendingConfirm(null);
    setIsBusy(true);
    clearMessages();
    try {
      await action();
    } catch (err) {
      handleApiError(err);
    } finally {
      setIsBusy(false);
    }
  }, [clearMessages, handleApiError, pendingConfirm]);

  const value = useMemo<CloudStorageContextValue>(
    () => ({
      user,
      hasToken: Boolean(accessToken),
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
      clearMessages,
      signIn,
      signOut,
      updateCloudTargets,
      resetCloudTargets,
      refreshDriveFiles,
      pullFromSpreadsheet,
      requestPushToSpreadsheet,
      requestUploadBackupToDrive,
      requestUploadFileToDrive,
      requestRestoreDriveBackup,
      requestDeleteDriveFile,
    }),
    [
      accessToken,
      clearMessages,
      cloudError,
      cloudNotice,
      driveFiles,
      driveFolderId,
      isBusy,
      isSyncModalOpen,
      lastSyncAt,
      pullFromSpreadsheet,
      refreshDriveFiles,
      requestDeleteDriveFile,
      requestPushToSpreadsheet,
      requestRestoreDriveBackup,
      requestUploadBackupToDrive,
      requestUploadFileToDrive,
      resetCloudTargets,
      signIn,
      signOut,
      spreadsheetId,
      spreadsheetTitle,
      updateCloudTargets,
      user,
    ],
  );

  return (
    <CloudStorageContext.Provider value={value}>
      {children}

      {pendingConfirm && (
        <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    pendingConfirm.tone === 'danger'
                      ? 'bg-rose-100 text-rose-600'
                      : pendingConfirm.tone === 'emerald'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-brand-100 text-brand-700'
                  }`}
                >
                  {pendingConfirm.tone === 'danger' ? (
                    <ShieldAlert size={20} />
                  ) : pendingConfirm.tone === 'emerald' ? (
                    <CheckCircle2 size={20} />
                  ) : (
                    <AlertTriangle size={20} />
                  )}
                </div>
                <h3 className="text-base font-bold text-gray-900">{pendingConfirm.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setPendingConfirm(null)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg cursor-pointer"
                aria-label="Tutup konfirmasi"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">{pendingConfirm.description}</p>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5">
              {pendingConfirm.details.map((line) => (
                <p key={line} className="text-[11px] text-slate-700 leading-snug">
                  • {line}
                </p>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setPendingConfirm(null)}
                className="px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-bold text-gray-700 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={executeConfirmedAction}
                className={`px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm cursor-pointer ${
                  pendingConfirm.tone === 'danger'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : pendingConfirm.tone === 'emerald'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-brand-600 hover:bg-brand-700'
                }`}
              >
                {pendingConfirm.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </CloudStorageContext.Provider>
  );
}

export function useCloudStorage(): CloudStorageContextValue {
  const ctx = useContext(CloudStorageContext);
  if (!ctx) {
    throw new Error('useCloudStorage must be used inside CloudStorageProvider');
  }
  return ctx;
}
