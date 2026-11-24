import { AnimatePresence, motion } from 'motion/react';
import { Suspense, lazy, useCallback, useMemo, useState } from 'react';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import { DEFAULT_SUPERVISOR_NAME } from './constants/school';
import { useSchoolConfig } from './hooks/useSchoolConfig';
import { useSupervisionData } from './hooks/useSupervisionData';
import { createEmptyInstrument } from './services/storage';
import type {
  ActiveTab,
  Guru,
  ImportedScheduleRow,
  SupervisionInstrument,
  SupervisionSession,
} from './types/supervision';
import { generateUUID } from './utils/id';

const Dashboard = lazy(() => import('./components/dashboard/Dashboard'));
const DataGuru = lazy(() => import('./components/guru/DataGuru'));
const DokumenPerangkat = lazy(() => import('./components/documents/DokumenPerangkat'));
const ProgramSupervisi = lazy(() => import('./components/program/ProgramSupervisi'));
const InstrumenDashboard = lazy(() => import('./components/instrumen/InstrumenDashboard'));
const InstrumenSession = lazy(() => import('./components/instrumen/InstrumenSession'));
const LaporanHasil = lazy(() => import('./components/laporan/LaporanHasil'));
const TindakLanjut = lazy(() => import('./components/tindakLanjut/TindakLanjut'));
const PengaturanSekolah = lazy(() => import('./components/settings/PengaturanSekolah'));

const TAB_LABELS: Record<ActiveTab, string> = {
  dashboard: 'Dashboard',
  'data-guru': 'Data Guru',
  'dokumen-perangkat': 'Dokumen Perangkat',
  program: 'Program Supervisi',
  instrumen: 'Instrumen Supervisi',
  laporan: 'Laporan Hasil',
  'tindak-lanjut': 'Tindak Lanjut Supervisi',
  'pengaturan-sekolah': 'Pengaturan Sekolah',
};

function TabFallbackLoader() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-gray-400 space-y-3">
      <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-xs font-medium tracking-wide">Memuat modul...</p>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [selectedSupervisiId, setSelectedSupervisiId] = useState<string | null>(null);

  const { config: schoolConfig } = useSchoolConfig();
  const {
    gurus,
    setGurus,
    supervisions,
    setSupervisions,
    deleteGuru,
    upsertSupervision,
    createSessionForGuru,
    deleteSupervision,
    importSchedules,
  } = useSupervisionData();

  const activeSession = useMemo(
    () => supervisions.find((sv) => sv.id === selectedSupervisiId) || null,
    [supervisions, selectedSupervisiId],
  );

  const handleUpdateSupervision = useCallback(
    (id: string, instrument: SupervisionInstrument, status?: string) => {
      setSupervisions((prev) =>
        prev.map((sv) =>
          sv.id === id
            ? {
                ...sv,
                instrument,
                ...(status ? { status } : {}),
              }
            : sv,
        ),
      );
    },
    [setSupervisions],
  );

  const handleUpdateGuru = useCallback(
    (updatedGuru: Guru) => {
      setGurus((prev) => prev.map((g) => (g.id === updatedGuru.id ? updatedGuru : g)));
      setSupervisions((prev) =>
        prev.map((sv) =>
          sv.instrument.guruId === updatedGuru.id
            ? {
                ...sv,
                instrument: {
                  ...sv.instrument,
                  namaGuru: updatedGuru.nama,
                  nipGuru: updatedGuru.nip,
                  mapel: updatedGuru.mapel || sv.instrument.mapel,
                },
              }
            : sv,
        ),
      );
    },
    [setGurus, setSupervisions],
  );

  const handleAddSupervision = useCallback(
    (guruId: string) => {
      const existing = supervisions.find((sv) => sv.instrument.guruId === guruId);
      if (existing) {
        setSelectedSupervisiId(existing.id);
        setActiveTab('instrumen');
        return;
      }
      const created = createSessionForGuru(guruId);
      setSelectedSupervisiId(created.id);
      setActiveTab('instrumen');
    },
    [supervisions, createSessionForGuru],
  );

  const handleUpsertSupervision = useCallback(
    (session: SupervisionSession) => {
      upsertSupervision(session);
    },
    [upsertSupervision],
  );

  const handleAddGuru = useCallback(
    (guru: Guru, openImmediately = false) => {
      setGurus((prev) => {
        const exists = prev.some((g) => g.id === guru.id);
        return exists ? prev.map((g) => (g.id === guru.id ? guru : g)) : [...prev, guru];
      });

      const existingSession = supervisions.find((sv) => sv.instrument.guruId === guru.id);
      if (existingSession) {
        if (openImmediately) {
          setSelectedSupervisiId(existingSession.id);
          setActiveTab('instrumen');
        }
        return;
      }

      const created = createSessionForGuru(guru.id, guru);
      if (openImmediately) {
        setSelectedSupervisiId(created.id);
        setActiveTab('instrumen');
      }
    },
    [setGurus, supervisions, createSessionForGuru],
  );

  const handleImportGurus = useCallback(
    (rows: Omit<Guru, 'id'>[]) => {
      const newGurus: Guru[] = [];
      const newSessions: SupervisionSession[] = [];

      rows.forEach((row) => {
        const cleanNip = (row.nip || '').trim();
        const cleanName = (row.nama || '').trim().toLowerCase();
        const duplicateInExisting = gurus.some(
          (g) =>
            (cleanNip && cleanNip !== '-' && g.nip.trim() === cleanNip) ||
            (cleanName && g.nama.trim().toLowerCase() === cleanName),
        );
        const duplicateInBatch = newGurus.some(
          (g) =>
            (cleanNip && cleanNip !== '-' && g.nip.trim() === cleanNip) ||
            (cleanName && g.nama.trim().toLowerCase() === cleanName),
        );
        if (duplicateInExisting || duplicateInBatch) return;

        const guruId = generateUUID();
        const guruRecord: Guru = { ...row, id: guruId };
        newGurus.push(guruRecord);

        const instr = createEmptyInstrument(guruId, guruRecord.nama);
        instr.nipGuru = guruRecord.nip;
        instr.mapel = guruRecord.mapel;
        instr.kelas = guruRecord.kelas || '';

        newSessions.push({
          id: 'sv-' + generateUUID().substring(0, 6),
          status: 'Direncakan',
          createdAt: new Date().toISOString(),
          instrument: instr,
        });
      });

      if (newGurus.length > 0) {
        setGurus((prev) => [...prev, ...newGurus]);
      }
      if (newSessions.length > 0) {
        setSupervisions((prev) => [...newSessions, ...prev]);
      }
    },
    [gurus, setGurus, setSupervisions],
  );

  const handleImportSchedules = useCallback(
    (rows: ImportedScheduleRow[]) => {
      importSchedules(rows);
    },
    [importSchedules],
  );

  const handleDeleteGuru = useCallback(
    (guruId: string) => {
      deleteGuru(guruId);
      if (activeSession && activeSession.instrument.guruId === guruId) {
        setSelectedSupervisiId(null);
      }
    },
    [deleteGuru, activeSession],
  );

  const handleDeleteSupervision = useCallback(
    (svId: string) => {
      deleteSupervision(svId);
      if (selectedSupervisiId === svId) {
        setSelectedSupervisiId(null);
      }
    },
    [deleteSupervision, selectedSupervisiId],
  );

  const handleSetActiveTab = useCallback((tab: ActiveTab) => {
    setActiveTab(tab);
  }, []);

  return (
    <div className="min-h-screen flex bg-[#F8FAFC] text-gray-900">
      <Sidebar activeTab={activeTab} setActiveTab={handleSetActiveTab} />

      <div className="flex-1 flex flex-col min-w-0">
        <Header activeTabLabel={TAB_LABELS[activeTab]} />

        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          <Suspense fallback={<TabFallbackLoader />}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab === 'instrumen' && activeSession ? `instrumen-${activeSession.id}` : activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
              >
                {activeTab === 'dashboard' && (
                  <Dashboard
                    setActiveTab={handleSetActiveTab}
                    gurus={gurus}
                    supervisions={supervisions}
                    onDeleteSupervision={handleDeleteSupervision}
                    setSelectedSupervisiId={setSelectedSupervisiId}
                  />
                )}

                {activeTab === 'data-guru' && (
                  <DataGuru
                    gurus={gurus}
                    supervisions={supervisions}
                    onAddGuru={handleAddGuru}
                    onUpdateGuru={handleUpdateGuru}
                    onDeleteGuru={handleDeleteGuru}
                    onAddSupervision={handleAddSupervision}
                    onImportGurus={handleImportGurus}
                    setSelectedSupervisiId={setSelectedSupervisiId}
                    setActiveTab={handleSetActiveTab}
                  />
                )}

                {activeTab === 'dokumen-perangkat' && <DokumenPerangkat />}

                {activeTab === 'program' && <ProgramSupervisi gurus={gurus} />}

                {activeTab === 'instrumen' &&
                  (activeSession ? (
                    <InstrumenSession
                      session={activeSession}
                      gurus={gurus}
                      supervisions={supervisions}
                      onUpdate={handleUpdateSupervision}
                      setSupervisiId={setSelectedSupervisiId}
                      onUpdateGuru={handleUpdateGuru}
                      onAddGuru={handleAddGuru}
                      onAddSupervision={handleAddSupervision}
                      setActiveTab={handleSetActiveTab}
                    />
                  ) : (
                    <InstrumenDashboard
                      setSelectedSupervisiId={setSelectedSupervisiId}
                      setActiveTab={handleSetActiveTab}
                      gurus={gurus}
                      supervisions={supervisions}
                      onAdd={handleAddSupervision}
                      onDelete={handleDeleteSupervision}
                      onImportSchedules={handleImportSchedules}
                      onAddGuru={handleAddGuru}
                    />
                  ))}

                {activeTab === 'laporan' && (
                  <LaporanHasil
                    gurus={gurus}
                    supervisions={supervisions}
                    setActiveTab={handleSetActiveTab}
                    selectedSupervisiId={selectedSupervisiId}
                    setSelectedSupervisiId={setSelectedSupervisiId}
                    onAddSupervision={handleUpsertSupervision}
                    onAddGuru={handleAddGuru}
                  />
                )}

                {activeTab === 'tindak-lanjut' && (
                  <TindakLanjut
                    gurus={gurus}
                    supervisions={supervisions}
                    setActiveTab={handleSetActiveTab}
                    setSelectedSupervisiId={setSelectedSupervisiId}
                  />
                )}

                {activeTab === 'pengaturan-sekolah' && <PengaturanSekolah />}
              </motion.div>
            </AnimatePresence>
          </Suspense>
        </main>

        <footer className="py-5 px-8 border-t border-gray-200/80 bg-white/80 text-center no-print">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} <strong>SI PERAK</strong> — Sistem Informasi Supervisi
            Akademik Kurikulum Nasional. Dikembangkan oleh{' '}
            <strong className="text-gray-700">{DEFAULT_SUPERVISOR_NAME}</strong> (
            {schoolConfig.isDinasPendidikan
              ? 'Pengawas Dinas Pendidikan Kabupaten Bojonegoro'
              : 'Pengawas SMA Cabang Dinas Pendidikan Wilayah Bojonegoro'}
            ).
          </p>
        </footer>
      </div>
    </div>
  );
}
