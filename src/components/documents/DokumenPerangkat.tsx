import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  FileText,
  FolderOpen,
  RefreshCw,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { useCloudStorage } from '../../contexts/CloudStorageContext';
import { useSchoolConfig } from '../../hooks/useSchoolConfig';
import { STORAGE_EVENTS, loadStoredGurus, loadStoredSupervisions } from '../../services/storage';
import type { SupervisionDocument } from '../../types/supervision';
import GoogleSignInButton from '../common/GoogleSignInButton';

interface LocalAttachmentItem {
  doc: SupervisionDocument;
  guruNama: string;
  mapel: string;
  kelas: string;
}

export default function DokumenPerangkat() {
  const { config } = useSchoolConfig();
  const {
    hasToken,
    driveFolderId,
    driveFiles,
    isBusy,
    cloudError,
    cloudNotice,
    signIn,
    refreshDriveFiles,
    requestUploadFileToDrive,
    requestDeleteDriveFile,
  } = useCloudStorage();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [localDocs, setLocalDocs] = useState<LocalAttachmentItem[]>([]);

  useEffect(() => {
    const loadDocs = () => {
      const supervisions = loadStoredSupervisions();
      const gurus = loadStoredGurus();
      const items: LocalAttachmentItem[] = [];
      supervisions.forEach((sv) => {
        const guru = gurus.find((g) => g.id === sv.instrument.guruId);
        const guruNama = guru?.nama || sv.instrument.namaGuru || '-';
        (sv.instrument.documents || []).forEach((doc) => {
          items.push({
            doc,
            guruNama,
            mapel: sv.instrument.mapel || '-',
            kelas: sv.instrument.kelas || '-',
          });
        });
      });
      setLocalDocs(items);
    };

    loadDocs();
    window.addEventListener(STORAGE_EVENTS.CLOUD_DATA_LOADED, loadDocs);
    window.addEventListener('storage', loadDocs);
    return () => {
      window.removeEventListener(STORAGE_EVENTS.CLOUD_DATA_LOADED, loadDocs);
      window.removeEventListener('storage', loadDocs);
    };
  }, []);

  const handleSelectFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    requestUploadFileToDrive(file);
  };

  const categories = [
    {
      name: 'Modul Ajar / RPP',
      count: localDocs.filter(
        (item) =>
          item.doc.stage === 'modul' ||
          item.doc.stage === 'pra' ||
          item.doc.name.toLowerCase().includes('modul'),
      ).length,
    },
    {
      name: 'Alur Tujuan Pembelajaran (ATP)',
      count: localDocs.filter((item) => item.doc.name.toLowerCase().includes('atp')).length,
    },
    {
      name: 'Program Tahunan & Semester',
      count: localDocs.filter(
        (item) =>
          item.doc.name.toLowerCase().includes('prota') ||
          item.doc.name.toLowerCase().includes('promes'),
      ).length,
    },
    {
      name: 'Berkas Google Drive',
      count: driveFiles.length,
    },
  ];

  const driveFolderUrl = `https://drive.google.com/drive/folders/${driveFolderId}`;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-gray-900">Dokumen Perangkat Ajar</h2>
          <p className="text-gray-500 text-sm">
            Verifikasi kelengkapan administrasi guru dan simpan berkas ke Folder Google Drive
            terintegrasi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <a
            href={driveFolderUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-bold"
          >
            <FolderOpen size={15} className="text-blue-600" />
            <span>Buka Folder Drive</span>
            <ExternalLink size={12} />
          </a>

          {hasToken ? (
            <>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleSelectFile}
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.json"
              />
              <button
                type="button"
                disabled={isBusy}
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer disabled:opacity-60"
              >
                <UploadCloud size={15} />
                <span>Unggah Dokumen ke Drive</span>
              </button>
            </>
          ) : (
            <GoogleSignInButton onClick={signIn} disabled={isBusy} compact />
          )}
        </div>
      </div>

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {categories.map((doc) => (
          <div
            key={doc.name}
            className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4"
          >
            <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-brand-600">
              <FileText size={24} />
            </div>
            <div>
              <h4 className="font-bold text-sm text-gray-900">{doc.name}</h4>
              <p className="text-xs text-gray-500">{doc.count} Dokumen Terupload</p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wider border ${
                  doc.count > 0
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-gray-100 text-gray-400 border-gray-200'
                }`}
              >
                {doc.count > 0 ? 'Tersedia' : 'Belum Ada'}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-wrap justify-between items-center gap-3">
          <div>
            <h3 className="font-display font-bold text-gray-900">
              Arsip Dokumen di Folder Google Drive
            </h3>
            <p className="text-xs text-gray-500">Folder ID: {driveFolderId}</p>
          </div>
          {hasToken && (
            <button
              type="button"
              onClick={refreshDriveFiles}
              disabled={isBusy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-xs font-bold text-gray-700 cursor-pointer"
            >
              <RefreshCw size={13} className={isBusy ? 'animate-spin' : ''} />
              <span>Segarkan Drive</span>
            </button>
          )}
        </div>

        {!hasToken ? (
          <div className="py-12 px-6 text-center space-y-3">
            <FolderOpen className="mx-auto text-blue-300" size={40} />
            <p className="text-sm text-gray-600 font-medium">
              Masuk dengan akun Google Anda untuk melihat dan mengunggah berkas ke Folder Google
              Drive bersama.
            </p>
            <div className="flex justify-center">
              <GoogleSignInButton onClick={signIn} disabled={isBusy} compact />
            </div>
          </div>
        ) : driveFiles.length === 0 ? (
          <div className="py-14 text-center">
            <FileText className="mx-auto text-gray-200 mb-3" size={44} />
            <p className="text-gray-400 text-sm">
              Belum ada berkas tersimpan di folder Google Drive ini.
            </p>
            <p className="text-[11px] text-gray-400 mt-1">
              Klik &quot;Unggah Dokumen ke Drive&quot; untuk menambahkan perangkat ajar.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {driveFiles.map((file) => (
              <div
                key={file.id}
                className="p-4 px-6 flex items-center justify-between gap-4 hover:bg-gray-50"
              >
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">
                    {file.modifiedTime
                      ? `Diperbarui: ${new Date(file.modifiedTime).toLocaleString('id-ID')}`
                      : 'Google Drive File'}
                    {file.size ? ` • ${Math.max(1, Math.round(Number(file.size) / 1024))} KB` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {file.webViewLink && (
                    <a
                      href={file.webViewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-bold"
                    >
                      <span>Buka</span>
                      <ExternalLink size={12} />
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => requestDeleteDriveFile(file)}
                    disabled={isBusy}
                    title="Hapus dari Drive"
                    className="p-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-display font-bold">Daftar Lampiran Sesi Supervisi</h3>
          <span className="text-xs text-gray-400 font-semibold">
            Tahun Ajaran {config.academicYear}
          </span>
        </div>
        {localDocs.length === 0 ? (
          <div className="py-14 text-center">
            <FileText className="mx-auto text-gray-200 mb-3" size={44} />
            <p className="text-gray-400 text-sm">
              Belum ada lampiran perangkat ajar pada sesi instrumen supervisi.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {localDocs.map((item) => (
              <div
                key={`${item.guruNama}-${item.doc.id}`}
                className="p-4 px-6 flex items-center justify-between gap-4 hover:bg-gray-50"
              >
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{item.doc.name}</p>
                  <p className="text-xs text-gray-500">
                    {item.guruNama} • {item.mapel} ({item.kelas}) • Tahap: {item.doc.stage}
                  </p>
                </div>
                {item.doc.url && item.doc.url !== '#' && (
                  <a
                    href={item.doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold shrink-0"
                  >
                    Unduh / Lihat
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
