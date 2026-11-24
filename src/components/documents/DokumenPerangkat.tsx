import { FileText } from 'lucide-react';
import { useSchoolConfig } from '../../hooks/useSchoolConfig';

const DOCUMENT_CATEGORIES = [
  { name: 'Modul Ajar / RPP', status: 'Belum Ada', count: 0 },
  { name: 'Alur Tujuan Pembelajaran (ATP)', status: 'Belum Ada', count: 0 },
  { name: 'Program Tahunan & Semester', status: 'Belum Ada', count: 0 },
  { name: 'Kriteria Ketercapaian (KKTP)', status: 'Belum Ada', count: 0 },
];

export default function DokumenPerangkat() {
  const { config } = useSchoolConfig();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-display font-bold text-gray-900">Dokumen Perangkat Ajar</h2>
        <p className="text-gray-500 text-sm">
          Verifikasi dan validasi kelengkapan administrasi guru.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {DOCUMENT_CATEGORIES.map((doc) => (
          <div
            key={doc.name}
            className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4"
          >
            <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
              <FileText size={24} />
            </div>
            <div>
              <h4 className="font-bold text-sm text-gray-900">{doc.name}</h4>
              <p className="text-xs text-gray-500">{doc.count} Dokumen Terupload</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wider bg-gray-100 text-gray-400 border border-gray-200">
                {doc.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-display font-bold">Daftar Unggahan Guru</h3>
        </div>
        <div className="py-20 text-center">
          <FileText className="mx-auto text-gray-200 mb-4" size={48} />
          <p className="text-gray-400 text-sm">
            Belum ada dokumen perangkat ajar yang diunggah oleh guru.
          </p>
          <p className="text-[10px] text-gray-300 uppercase tracking-widest mt-1">
            Dokumen Tahun Ajaran {config.academicYear}
          </p>
        </div>
      </div>
    </div>
  );
}
