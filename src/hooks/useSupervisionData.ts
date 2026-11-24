import { useCallback, useEffect, useState } from 'react';
import { getSmartRecommendation } from '../constants/followUp';
import {
  STORAGE_EVENTS,
  createEmptyInstrument,
  loadStoredFollowUps,
  loadStoredGurus,
  loadStoredSupervisions,
  runInitialStorageMigrations,
  saveStoredFollowUps,
} from '../services/storage';
import type {
  FollowUpItem,
  Guru,
  ImportedScheduleRow,
  SupervisionSession,
} from '../types/supervision';
import { generateUUID } from '../utils/id';

export function useSupervisionData() {
  const [gurus, setGurus] = useState<Guru[]>(() => loadStoredGurus());
  const [supervisions, setSupervisions] = useState<SupervisionSession[]>(() =>
    loadStoredSupervisions(),
  );
  const [followUps, setFollowUps] = useState<FollowUpItem[]>(() => loadStoredFollowUps());

  useEffect(() => {
    const migrated = runInitialStorageMigrations();
    if (migrated) {
      setSupervisions(migrated);
    }
    setFollowUps(loadStoredFollowUps());
  }, []);

  useEffect(() => {
    localStorage.setItem('gurus', JSON.stringify(gurus));
  }, [gurus]);

  useEffect(() => {
    localStorage.setItem('supervisions', JSON.stringify(supervisions));
  }, [supervisions]);

  useEffect(() => {
    const syncSchoolIntoSupervisions = () => {
      setSupervisions(loadStoredSupervisions());
    };
    const syncFollowUps = () => {
      setFollowUps(loadStoredFollowUps());
    };

    window.addEventListener(STORAGE_EVENTS.SCHOOL_CONFIG_UPDATED, syncSchoolIntoSupervisions);
    window.addEventListener(STORAGE_EVENTS.FOLLOW_UPS_UPDATED, syncFollowUps);
    return () => {
      window.removeEventListener(STORAGE_EVENTS.SCHOOL_CONFIG_UPDATED, syncSchoolIntoSupervisions);
      window.removeEventListener(STORAGE_EVENTS.FOLLOW_UPS_UPDATED, syncFollowUps);
    };
  }, []);

  const addGuru = useCallback((guru: Guru) => {
    setGurus((prev) => {
      const exists = prev.some((g) => g.id === guru.id || g.nama === guru.nama);
      return exists ? prev : [...prev, guru];
    });
  }, []);

  const importGurus = useCallback((rows: Omit<Guru, 'id'>[]) => {
    const added: Guru[] = rows.map((row) => ({ ...row, id: generateUUID() }));
    setGurus((prev) => [...prev, ...added]);
  }, []);

  const deleteGuru = useCallback((guruId: string) => {
    setGurus((prev) => prev.filter((g) => g.id !== guruId));
    setSupervisions((prev) => prev.filter((sv) => sv.instrument.guruId !== guruId));
  }, []);

  const upsertSupervision = useCallback((session: SupervisionSession) => {
    setSupervisions((prev) => {
      const idx = prev.findIndex((s) => s.id === session.id);
      if (idx >= 0) {
        return prev.map((s) => (s.id === session.id ? session : s));
      }
      return [session, ...prev];
    });
  }, []);

  const createSessionForGuru = useCallback(
    (guruId: string, guruOverride?: Guru): SupervisionSession => {
      const guru = guruOverride || gurus.find((g) => g.id === guruId);
      const instr = createEmptyInstrument(guruId, guru?.nama || '');
      if (guru) {
        instr.nipGuru = guru.nip;
        instr.mapel = guru.mapel;
      }
      const session: SupervisionSession = {
        id: 'sv-' + generateUUID().substring(0, 6),
        status: 'Direncakan',
        createdAt: new Date().toISOString(),
        instrument: instr,
      };
      setSupervisions((prev) => [session, ...prev]);
      return session;
    },
    [gurus],
  );

  const deleteSupervision = useCallback((id: string) => {
    setSupervisions((prev) => prev.filter((sv) => sv.id !== id));
  }, []);

  const importSchedules = useCallback(
    (rows: ImportedScheduleRow[]) => {
      const createdGurus: Guru[] = [];
      const createdSessions: SupervisionSession[] = [];
      const defaultLevel = localStorage.getItem('school_level') || 'SMA';

      rows.forEach((row) => {
        const allKnown = [...gurus, ...createdGurus];
        let matchedGuru = allKnown.find(
          (g) => g.nama.toLowerCase() === row.namaGuru.toLowerCase(),
        );
        if (!matchedGuru) {
          matchedGuru = {
            id: generateUUID(),
            nama: row.namaGuru,
            nip: row.nipGuru || '-',
            pangkat: '-',
            mapel: row.mapel,
            jenjang: defaultLevel,
            status: 'ASN',
          };
          createdGurus.push(matchedGuru);
        }

        const instr = createEmptyInstrument(matchedGuru.id, matchedGuru.nama);
        instr.nipGuru = row.nipGuru || matchedGuru.nip || '-';
        instr.mapel = row.mapel || matchedGuru.mapel || '-';
        instr.kelas = row.kelas || '-';
        instr.materi = row.materi || '-';
        instr.tglPra = row.tglPra || '';
        instr.tglObs = row.tglObs || '';
        instr.tglPasca = row.tglPasca || '';

        createdSessions.push({
          id: 'sv-' + generateUUID().substring(0, 6),
          status: row.status || 'Direncakan',
          createdAt: new Date().toISOString(),
          instrument: instr,
        });
      });

      if (createdGurus.length > 0) {
        setGurus((prev) => [...prev, ...createdGurus]);
      }
      if (createdSessions.length > 0) {
        setSupervisions((prev) => [...createdSessions, ...prev]);
      }
    },
    [gurus],
  );

  // Sync completed supervisions into follow-ups automatically without duplicating entries
  useEffect(() => {
    const newItems: FollowUpItem[] = [];
    supervisions.forEach((sv) => {
      if (sv.status !== 'Selesai' && sv.status !== 'Tindak Lanjut' && !sv.instrument.perbaikan) {
        return;
      }
      const matchedGuru = gurus.find((g) => g.id === sv.instrument.guruId);
      const guruNama = matchedGuru?.nama || 'Guru Terdaftar';
      const exists = followUps.some(
        (f) => f.guruNama.toLowerCase() === guruNama.toLowerCase() || f.id === `tl-sv-${sv.id}`,
      );
      if (!exists && sv.instrument.perbaikan) {
        const finding = sv.instrument.perbaikan.slice(0, 45);
        newItems.push({
          id: `tl-sv-${sv.id}`,
          guruNama,
          guruNip: sv.instrument.nipGuru || matchedGuru?.nip || '',
          mapel: sv.instrument.mapel || matchedGuru?.mapel || '',
          kelas: sv.instrument.kelas || '',
          temuan: finding,
          intervensi: sv.instrument.rekomendasi
            ? sv.instrument.rekomendasi.slice(0, 45)
            : 'Pendampingan Klinis',
          status: sv.status === 'Selesai' ? 'Terealisasi' : 'Dipantau',
          dampak: sv.status === 'Selesai' ? 'Meningkat' : 'Dipantau',
          smartRekomendasi: getSmartRecommendation(finding),
          sudahRefleksi: Boolean(sv.instrument.pascaRefleksi),
          sudahTindakLanjut: sv.status === 'Selesai' || sv.status === 'Tindak Lanjut',
          perubahanPraktik: sv.status === 'Selesai',
          perluPendampingan: sv.status !== 'Selesai',
          tglSupervisi: sv.instrument.tglObs || new Date().toISOString().split('T')[0],
          catatan: sv.instrument.kekuatan || 'Catatan hasil supervisi klinis.',
        });
      }
    });

    if (newItems.length > 0) {
      const merged = [...followUps, ...newItems];
      setFollowUps(merged);
      saveStoredFollowUps(merged);
    }
  }, [supervisions, gurus, followUps]);

  const updateFollowUps = useCallback((items: FollowUpItem[]) => {
    setFollowUps(items);
    saveStoredFollowUps(items);
  }, []);

  return {
    gurus,
    setGurus,
    supervisions,
    setSupervisions,
    followUps,
    updateFollowUps,
    addGuru,
    importGurus,
    deleteGuru,
    upsertSupervision,
    createSessionForGuru,
    deleteSupervision,
    importSchedules,
  };
}
