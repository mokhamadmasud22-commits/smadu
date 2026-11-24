import { Award, Bell, ChevronRight, Cloud, CloudOff, Search, ShieldCheck, X } from 'lucide-react';
import { useState } from 'react';
import { DEFAULT_SUPERVISOR_NAME, DEFAULT_SUPERVISOR_NIP } from '../../constants/school';
import { useCloudStorage } from '../../contexts/CloudStorageContext';
import { useSchoolConfig } from '../../hooks/useSchoolConfig';

interface HeaderProps {
  activeTabLabel: string;
}

export default function Header({ activeTabLabel }: HeaderProps) {
  const [showCopyrightModal, setShowCopyrightModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { config } = useSchoolConfig();
  const { hasToken, user, setSyncModalOpen } = useCloudStorage();

  return (
    <>
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-10 no-print">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>Sistem</span>
          <ChevronRight size={14} />
          <span className="font-medium text-gray-900">{activeTabLabel}</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden xl:flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-200/80 rounded-full text-xs font-semibold text-amber-900">
            <Award size={14} className="text-amber-600" />
            <span>
              Hak Cipta: <strong>{DEFAULT_SUPERVISOR_NAME}</strong>
            </span>
          </div>

          <button
            type="button"
            onClick={() => setSyncModalOpen(true)}
            title="Sinkronisasi Google Drive & Google Spreadsheet"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-colors cursor-pointer ${
              hasToken
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                : 'bg-brand-50 border-brand-200 text-brand-700 hover:bg-brand-100'
            }`}
          >
            {hasToken ? <Cloud size={15} className="text-emerald-600" /> : <CloudOff size={15} />}
            <span className="hidden sm:inline">
              {hasToken
                ? user?.email
                  ? `Cloud: ${user.email.split('@')[0]}`
                  : 'Cloud Tersambung'
                : 'Simpan Cloud (Drive & Sheets)'}
            </span>
          </button>

          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={16}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari guru atau dokumen..."
              className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all w-48 lg:w-56"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowCopyrightModal(true)}
            title="Informasi Hak Cipta & Pengembang Sistem"
            className="p-2 text-gray-500 hover:text-brand-600 hover:bg-gray-100 rounded-lg transition-colors relative cursor-pointer"
          >
            <Bell size={20} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-600 border-2 border-white rounded-full" />
          </button>
        </div>
      </header>

      {showCopyrightModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center">
                  <Award size={24} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    Pernyataan Hak Cipta & Orisinalitas
                  </h3>
                  <p className="text-xs text-gray-500">
                    Sistem Informasi Supervisi Akademik (SI PERAK)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCopyrightModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-gray-600">
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-700 bg-white px-2 py-0.5 rounded shadow-xs">
                  Penulis & Pemegang Hak Cipta
                </span>
                <p className="text-base font-bold text-gray-900">{DEFAULT_SUPERVISOR_NAME}</p>
                <p className="text-xs text-gray-700 font-medium">
                  {config.isDinasPendidikan
                    ? 'Pengawas Dinas Pendidikan Kabupaten Bojonegoro'
                    : 'Pengawas SMA Cabang Dinas Pendidikan Wilayah Bojonegoro (Bojonegoro - Tuban)'}
                </p>
                <p className="text-[11px] text-gray-500">NIP. {DEFAULT_SUPERVISOR_NIP}</p>
              </div>

              <div className="space-y-2 bg-gray-50 p-3.5 rounded-xl border border-gray-200/80">
                <h4 className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-brand-600" />
                  <span>Perlindungan Karya Intelektual</span>
                </h4>
                <p className="leading-relaxed">
                  Seluruh arsitektur instrumen klinis (pra-observasi, lembar observasi pedagogik,
                  dan pasca-observasi) serta alur pembinaan tindak lanjut dalam sistem ini merupakan
                  karya yang dirancang oleh <strong>{DEFAULT_SUPERVISOR_NAME}</strong> untuk
                  standarisasi mutu pendidikan di lingkungan{' '}
                  {config.isDinasPendidikan
                    ? 'Dinas Pendidikan Kabupaten Bojonegoro'
                    : 'Cabang Dinas Pendidikan Wilayah Bojonegoro'}
                  .
                </p>
                <p className="text-[11px] text-gray-500 italic">
                  Dilarang menyalin, mengubah nama kepemilikan, atau memperbanyak sistem ini tanpa
                  izin resmi dari pemegang hak cipta.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowCopyrightModal(false)}
                className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md shadow-brand-500/20"
              >
                Saya Mengerti
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
