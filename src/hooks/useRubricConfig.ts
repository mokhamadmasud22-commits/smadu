import { useCallback, useEffect, useState } from 'react';
import {
  STORAGE_EVENTS,
  loadActiveInstrumentTitle,
  loadActiveRubricSections,
  resetActiveRubricConfig,
  saveActiveRubricConfig,
} from '../services/storage';
import type { RubricSection } from '../types/supervision';

export function useRubricConfig() {
  const [rubricSections, setRubricSections] = useState<RubricSection[]>(() =>
    loadActiveRubricSections(),
  );
  const [instrumentTitle, setInstrumentTitle] = useState<string>(() =>
    loadActiveInstrumentTitle(),
  );

  const refresh = useCallback(() => {
    setRubricSections(loadActiveRubricSections());
    setInstrumentTitle(loadActiveInstrumentTitle());
  }, []);

  useEffect(() => {
    window.addEventListener(STORAGE_EVENTS.INSTRUMENT_CONFIG_UPDATED, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(STORAGE_EVENTS.INSTRUMENT_CONFIG_UPDATED, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, [refresh]);

  const saveConfig = useCallback((sections: RubricSection[], name?: string) => {
    saveActiveRubricConfig(sections, name);
    setRubricSections(loadActiveRubricSections());
    setInstrumentTitle(loadActiveInstrumentTitle());
  }, []);

  const resetConfig = useCallback(() => {
    resetActiveRubricConfig();
    setRubricSections(loadActiveRubricSections());
    setInstrumentTitle(loadActiveInstrumentTitle());
  }, []);

  return {
    rubricSections,
    instrumentTitle,
    saveConfig,
    resetConfig,
    refresh,
  };
}
