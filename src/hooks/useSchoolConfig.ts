import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_SCHOOL_NAME } from '../constants/school';
import {
  STORAGE_EVENTS,
  loadSchoolConfig,
  saveSchoolConfigAndSync,
} from '../services/storage';
import type { SchoolConfig } from '../types/supervision';

export function useSchoolConfig(defaultName = DEFAULT_SCHOOL_NAME) {
  const [config, setConfig] = useState<SchoolConfig>(() => loadSchoolConfig(defaultName));

  const refresh = useCallback(() => {
    setConfig(loadSchoolConfig(defaultName));
  }, [defaultName]);

  useEffect(() => {
    window.addEventListener(STORAGE_EVENTS.SCHOOL_CONFIG_UPDATED, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(STORAGE_EVENTS.SCHOOL_CONFIG_UPDATED, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, [refresh]);

  const updateAndSave = useCallback(
    (next: Parameters<typeof saveSchoolConfigAndSync>[0]) => {
      saveSchoolConfigAndSync(next);
      setConfig(loadSchoolConfig(defaultName));
    },
    [defaultName],
  );

  return { config, refresh, updateAndSave };
}
