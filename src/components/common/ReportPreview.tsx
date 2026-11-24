import type { RefObject } from 'react';
import { DEFAULT_SUPERVISOR_NAME } from '../../constants/school';
import { useSchoolConfig } from '../../hooks/useSchoolConfig';
import type { Guru, RubricSection, SupervisionInstrument } from '../../types/supervision';
import { calculateScoreStats } from '../../utils/score';

interface ReportPreviewProps {
  guru?: Guru | null;
  instrument: SupervisionInstrument;
  rubricSections?: RubricSection[];
  instrumentTitle?: string;
  innerRef?: RefObject<HTMLDivElement | null>;
  className?: string;
}

export default function ReportPreview({
  guru,
  instrument,
  rubricSections = [],
  instrumentTitle,
  innerRef,
  className = '',
}: ReportPreviewProps) {
  const { config } = useSchoolConfig('SATUAN PENDIDIKAN');

  const schoolName = config.schoolName || instrument.namaSekolah || 'SATUAN PENDIDIKAN';
  const schoolAddress = config.schoolAddress || instrument.alamatSekolah || '';
  const internalSup =
    config.internalSupervisorName ||
    instrument.namaSupervisor ||
    'Waka Kurikulum / Guru Senior';
  const internalSupNip =
    config.internalSupervisorNip || instrument.nipSupervisor || '19780512 200501 1 009';
  const supervisorName =
    config.supervisorName || instrument.namaPengawas || DEFAULT_SUPERVISOR_NAME;
  const supervisorNip = config.supervisorNip || instrument.nipPengawas || '19740825 199802 2 004';
  const headmasterName = config.headmasterName || instrument.namaKepala || 'Kepala Sekolah';
  const headmasterNip = config.headmasterNip || instrument.nipKepala || '-';
  const academicYear = config.academicYear.replace('/', ' / ');
  const { kopAuthority, isDinasPendidikan } = config;

  const { avg, category } = calculateScoreStats(instrument.obsScores || {});
  const selectedRtlEntries = Object.entries(instrument.rtl || {}).filter(([, val]) => Boolean(val));

  return (
    <div
      id="laporan-supervisi-print-area"
      data-pdf-content="true"
      ref={innerRef}
      className={`bg-white text-black leading-relaxed font-sans ${className}`}
    >
      <div className="text-center mb-6 border-b-2 border-black pb-4">
        <h1 className="font-display font-bold text-lg md:text-xl uppercase leading-tight tracking-wide">
          {isDinasPendidikan ? 'PEMERINTAH KABUPATEN BOJONEGORO' : 'PEMERINTAH PROVINSI JAWA TIMUR'}
        </h1>
        <h1 className="font-display font-bold text-lg md:text-xl uppercase leading-tight tracking-wide">
          DINAS PENDIDIKAN
        </h1>
        <h1 className="font-display font-bold text-base md:text-lg uppercase leading-tight tracking-wide text-gray-800">
          {kopAuthority}
        </h1>
        <h2 className="font-display font-bold text-base md:text-lg uppercase leading-tight text-gray-900 mt-1">
          {schoolName.toUpperCase()}
        </h2>
        {schoolAddress && (
          <p className="text-[11px] font-normal text-gray-700 mt-0.5">{schoolAddress}</p>
        )}
        <p className="text-[10px] mt-0.5 font-medium italic text-gray-600">
          Sistem Penjaminan Mutu & Supervisi Klinis Pembelajaran Kurikulum Nasional
        </p>
      </div>

      <div className="text-center mb-6">
        <h3 className="font-bold text-base md:text-lg uppercase underline tracking-wide">
          LAPORAN HASIL & ANALISIS SUPERVISI KLINIS AKADEMIK
        </h3>
        <p className="text-xs md:text-sm font-bold mt-1">TAHUN PELAJARAN {academicYear}</p>
        <p className="text-[11px] text-gray-600 italic">
          ({instrumentTitle || 'Berbasis Pembelajaran Mendalam & Kurikulum Nasional'})
        </p>
      </div>

      <div className="mb-6">
        <table className="w-full text-xs border-collapse">
          <tbody>
            <tr className="bg-blue-50/40">
              <td className="w-48 py-1.5 font-semibold text-gray-700 pl-2">Satuan Pendidikan</td>
              <td className="py-1.5 pr-2">
                : <span className="font-bold text-gray-900">{schoolName}</span>
              </td>
            </tr>
            <tr className="bg-blue-50/40 border-b border-gray-200">
              <td className="py-1.5 font-semibold text-gray-700 pl-2">Alamat Sekolah</td>
              <td className="py-1.5 pr-2">
                : <span className="font-medium text-gray-800">{schoolAddress}</span>
              </td>
            </tr>
            <tr>
              <td className="w-48 py-1 font-semibold text-gray-700 pl-2">Nama Guru Lengkap</td>
              <td className="py-1 pr-2">
                : <span className="font-bold text-gray-900">{guru?.nama || instrument.namaGuru || '-'}</span>
              </td>
            </tr>
            <tr>
              <td className="py-1 font-semibold text-gray-700 pl-2">NIP / Status Kepegawaian</td>
              <td className="py-1 pr-2">
                : {instrument.nipGuru || guru?.nip || '-'} ({guru?.status || 'ASN'})
              </td>
            </tr>
            <tr>
              <td className="py-1 font-semibold text-gray-700 pl-2">Pangkat / Golongan</td>
              <td className="py-1 pr-2">: {guru?.pangkat || '-'}</td>
            </tr>
            <tr>
              <td className="py-1 font-semibold text-gray-700 pl-2">Mata Pelajaran</td>
              <td className="py-1 pr-2">
                : <span className="font-medium">{instrument.mapel || guru?.mapel || '-'}</span>
              </td>
            </tr>
            <tr>
              <td className="py-1 font-semibold text-gray-700 pl-2">Kelas / Fase</td>
              <td className="py-1 pr-2">: {instrument.kelas || '-'}</td>
            </tr>
            <tr>
              <td className="py-1 font-semibold text-gray-700 pl-2">Materi Pokok</td>
              <td className="py-1 pr-2">: {instrument.materi || '-'}</td>
            </tr>
            <tr className="bg-gray-50 border-t border-gray-200">
              <td className="py-1 font-bold text-gray-800 pl-2" colSpan={2}>
                Jadwal Pelaksanaan Tahapan:
              </td>
            </tr>
            <tr>
              <td className="py-1 pl-4 text-gray-600">1. Tahap Pra-Observasi</td>
              <td className="py-1">: {instrument.tglPra || '-'}</td>
            </tr>
            <tr>
              <td className="py-1 pl-4 text-gray-600">2. Tahap Observasi Kelas</td>
              <td className="py-1">: {instrument.tglObs || '-'}</td>
            </tr>
            <tr>
              <td className="py-1 pl-4 text-gray-600">3. Tahap Pasca-Observasi</td>
              <td className="py-1">: {instrument.tglPasca || '-'}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="space-y-6 text-xs md:text-sm">
        <section>
          <h4 className="font-bold border-b border-black pb-1 mb-2 uppercase text-xs tracking-wider flex items-center justify-between">
            <span>I. TAHAP PRA-OBSERVASI (PERSIAPAN & KESEPAKATAN)</span>
            <span className="text-[10px] font-normal text-gray-500 lowercase">
              Status Modul: {instrument.documents.some((d) => d.stage === 'modul') ? 'Terlampir' : 'Tersedia'}
            </span>
          </h4>
          <div className="space-y-2 pl-2 md:pl-4 text-xs">
            <div>
              <span className="font-bold text-gray-700">Tujuan Pembelajaran:</span>
              <p className="text-gray-900 mt-0.5">{instrument.praFields?.tujuan || '-'}</p>
            </div>
            <div>
              <span className="font-bold text-gray-700">
                Area Pengembangan yang Hendak Dicapai:
              </span>
              <p className="text-gray-900 mt-0.5">{instrument.praFields?.area || '-'}</p>
            </div>
            <div>
              <span className="font-bold text-gray-700">Strategi yang Dipersiapkan:</span>
              <p className="text-gray-900 mt-0.5">{instrument.praFields?.strategi || '-'}</p>
            </div>
            {instrument.praAI && (
              <div className="mt-2 p-2.5 bg-gray-50 border border-gray-200 rounded italic text-xs text-gray-800">
                <span className="font-bold not-italic text-gray-700">
                  Catatan Analisis Pra-Observasi:{' '}
                </span>
                {instrument.praAI}
              </div>
            )}
          </div>
        </section>

        <section>
          <h4 className="font-bold border-b border-black pb-1 mb-2 uppercase text-xs tracking-wider flex items-center justify-between">
            <span>
              II. TAHAP OBSERVASI KELAS & SKOR RUBRIK ({instrumentTitle || 'KURIKULUM NASIONAL'})
            </span>
            <span className="text-xs font-bold text-emerald-800">
              Skor: {avg.toFixed(2)} / 4.00 ({category})
            </span>
          </h4>

          {rubricSections.length > 0 ? (
            <table className="w-full border-collapse text-xs mb-3">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-black p-1.5 text-center w-10">No</th>
                  <th className="border border-black p-1.5 text-left">
                    Indikator Pengamatan Pembelajaran
                  </th>
                  <th className="border border-black p-1.5 text-center w-16">Skor</th>
                </tr>
              </thead>
              <tbody>
                {rubricSections.flatMap((section, sIdx) =>
                  section.items.map((item, iIdx) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="border border-black p-1.5 text-center font-medium">
                        {sIdx + 1}.{iIdx + 1}
                      </td>
                      <td className="border border-black p-1.5">
                        <p className="font-bold text-gray-900">{item.label}</p>
                        <p className="text-[10px] text-gray-600 italic leading-snug">{item.desc}</p>
                      </td>
                      <td className="border border-black p-1.5 text-center font-bold text-sm">
                        {instrument.obsScores?.[item.id] || '-'}
                      </td>
                    </tr>
                  )),
                )}
              </tbody>
            </table>
          ) : (
            <div className="p-3 bg-gray-50 border border-gray-200 text-xs text-center italic text-gray-500 mb-3">
              Rubrik instrumen sedang dimuat atau belum ada indikator yang dinilai.
            </div>
          )}

          {instrument.analysisScore && (
            <div className="mt-2 p-2.5 bg-blue-50 border border-blue-200 rounded italic text-xs text-blue-950">
              <span className="font-bold not-italic text-blue-900">
                Interpretasi & Distribusi Skor:{' '}
              </span>
              {instrument.analysisScore}
            </div>
          )}

          {instrument.obsAI && (
            <div className="mt-2 p-2.5 bg-gray-50 border border-gray-200 rounded italic text-xs text-gray-800">
              <span className="font-bold not-italic text-gray-700">
                Analisis Observasi Pedagogik:{' '}
              </span>
              {instrument.obsAI}
            </div>
          )}
        </section>

        <section>
          <h4 className="font-bold border-b border-black pb-1 mb-2 uppercase text-xs tracking-wider">
            III. HASIL REFLEKSI & TINDAK LANJUT PASCA-OBSERVASI (DIALOG DUA ARAH)
          </h4>
          <div className="space-y-2.5 pl-2 md:pl-4 text-xs">
            <div>
              <span className="font-bold text-gray-700">1. Refleksi Guru Terhadap Pembelajaran:</span>
              <p className="text-gray-900 mt-0.5">{instrument.pascaRefleksi || '-'}</p>
            </div>
            <div className="p-2.5 bg-amber-50/60 border border-amber-200 rounded-md">
              <span className="font-bold text-amber-900 flex items-center gap-1.5">
                <span>2. Tanggapan / Hak Sanggah Guru (Refleksi Dua Arah):</span>
              </span>
              <p className="text-gray-900 mt-0.5 whitespace-pre-wrap">
                {instrument.pascaSanggah?.trim()
                  ? instrument.pascaSanggah
                  : 'Guru menyetujui seluruh catatan observasi dan tidak mengajukan sanggahan.'}
              </p>
            </div>
            <div>
              <span className="font-bold text-gray-700">3. Rencana Pengembangan Diri Guru:</span>
              <p className="text-gray-900 mt-0.5">{instrument.pascaRencana || '-'}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="font-bold text-gray-700">
                4. Program Tindak Lanjut (RTL) Disepakati:
              </span>
              {selectedRtlEntries.length > 0 ? (
                selectedRtlEntries.map(([key]) => (
                  <span
                    key={key}
                    className="text-[10px] font-bold px-2 py-0.5 bg-gray-100 text-gray-800 rounded border border-gray-300"
                  >
                    {key.toUpperCase()}
                  </span>
                ))
              ) : (
                <span className="text-gray-500 italic text-[11px]">
                  Belum ada program RTL yang dipilih
                </span>
              )}
            </div>
            {instrument.pascaAI && (
              <div className="mt-2 p-2.5 bg-gray-50 border border-gray-200 rounded italic text-xs text-gray-800">
                <span className="font-bold not-italic text-gray-700">
                  Analisis Pasca-Observasi:{' '}
                </span>
                {instrument.pascaAI}
              </div>
            )}
          </div>
        </section>

        <section>
          <h4 className="font-bold border-b border-black pb-1 mb-2 uppercase text-xs tracking-wider">
            IV. CATATAN KLINIS & REKOMENDASI SUPERVISOR
          </h4>
          <table className="w-full border-collapse text-xs">
            <tbody>
              <tr>
                <td className="w-36 font-bold p-2 border border-black bg-gray-50 align-top">
                  Kekuatan Guru
                </td>
                <td className="p-2 border border-black text-gray-900">
                  {instrument.kekuatan || '-'}
                </td>
              </tr>
              <tr>
                <td className="w-36 font-bold p-2 border border-black bg-gray-50 align-top">
                  Area Perbaikan
                </td>
                <td className="p-2 border border-black text-gray-900">
                  {instrument.perbaikan || '-'}
                </td>
              </tr>
              <tr>
                <td className="w-36 font-bold p-2 border border-black bg-gray-50 align-top">
                  Rekomendasi Spesifik
                </td>
                <td className="p-2 border border-black text-gray-900">
                  {instrument.rekomendasi || '-'}
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        {instrument.photos && instrument.photos.length > 0 && (
          <section className="avoid-break page-break-before">
            <h4 className="font-bold border-b border-black pb-1 mb-3 uppercase text-xs tracking-wider">
              V. LAMPIRAN DOKUMENTASI KEGIATAN
            </h4>
            <div className="grid grid-cols-2 gap-4">
              {instrument.photos.map((photo, idx) => (
                <div key={photo.id || idx} className="border border-gray-300 p-1 rounded bg-white">
                  <img
                    src={photo.url}
                    alt={photo.caption || `Dokumentasi Supervisi ${idx + 1}`}
                    className="w-full h-auto max-h-48 object-cover rounded"
                    referrerPolicy="no-referrer"
                  />
                  {photo.caption && (
                    <p className="text-[10px] text-gray-600 text-center italic mt-1">
                      {photo.caption}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="mt-12 pt-4 avoid-break border-t border-gray-200">
          <p className="text-center font-bold text-xs uppercase tracking-wider mb-6 text-gray-700">
            LEMBAR PENGESAHAN HASIL SUPERVISI AKADEMIK
          </p>

          <div className="grid grid-cols-2 gap-8 text-center text-xs md:text-sm">
            <div className="space-y-16">
              <p className="font-medium text-gray-700">Guru yang Disupervisi,</p>
              <div>
                <p className="font-bold underline text-gray-900">
                  {guru?.nama || instrument.namaGuru || '-'}
                </p>
                <p className="text-gray-600">NIP. {instrument.nipGuru || guru?.nip || '-'}</p>
              </div>
            </div>

            <div className="space-y-16">
              <p className="font-medium text-gray-700">Supervisor / Penilai Kelas,</p>
              <div>
                <p className="font-bold underline text-gray-900">{internalSup}</p>
                <p className="text-gray-600">NIP. {internalSupNip}</p>
              </div>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-8 text-center text-xs md:text-sm">
            <div className="space-y-16">
              <div>
                <p className="font-medium text-gray-700">Mengetahui,</p>
                <p className="font-medium text-gray-700">Kepala Sekolah</p>
              </div>
              <div>
                <p className="font-bold underline text-gray-900">{headmasterName}</p>
                <p className="text-gray-600">NIP. {headmasterNip}</p>
              </div>
            </div>

            <div className="space-y-16">
              <div>
                <p className="font-medium text-gray-700">Mengesahkan,</p>
                <p className="font-medium text-gray-700">Pengawas Pembina</p>
              </div>
              <div>
                <p className="font-bold underline text-gray-900">{supervisorName}</p>
                <p className="text-gray-600">NIP. {supervisorNip}</p>
                <p className="text-[10px] text-gray-500 font-medium">
                  {isDinasPendidikan
                    ? 'Pengawas Dinas Pendidikan Kab. Bojonegoro'
                    : 'Pengawas SMA Cabdindik Wilayah Bojonegoro'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-3 border-t border-gray-300 flex flex-col sm:flex-row justify-between items-center text-[10px] text-gray-500 print:text-[8pt] avoid-break">
          <span>SI PERAK • Instrumen Supervisi Klinis Berbasis Kurikulum Nasional</span>
          <span className="font-semibold text-gray-700">
            Hak Cipta © {DEFAULT_SUPERVISOR_NAME} (Pengawas SMA Cabang Dinas Pendidikan Wilayah
            Bojonegoro)
          </span>
        </div>
      </div>
    </div>
  );
}
