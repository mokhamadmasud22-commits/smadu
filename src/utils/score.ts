import type { RubricSection, ScoreStats } from '../types/supervision';

export function getScoreCategory(avg: number): string {
  if (avg >= 3.5) return 'Sangat Baik';
  if (avg >= 3) return 'Baik';
  if (avg >= 2) return 'Cukup';
  return 'Perlu Pembinaan';
}

export function calculateScoreStats(obsScores: Record<string, number> = {}): ScoreStats {
  const values = Object.values(obsScores).filter((val) => typeof val === 'number' && !Number.isNaN(val));
  if (values.length === 0) {
    return {
      avg: 0,
      category: 'N/A',
      dist: { 1: 0, 2: 0, 3: 0, 4: 0 },
    };
  }

  const sum = values.reduce((acc, val) => acc + val, 0);
  const avg = sum / values.length;
  const dist: Record<1 | 2 | 3 | 4, number> = {
    1: values.filter((v) => v === 1).length,
    2: values.filter((v) => v === 2).length,
    3: values.filter((v) => v === 3).length,
    4: values.filter((v) => v === 4).length,
  };

  return {
    avg,
    category: getScoreCategory(avg),
    dist,
  };
}

export function countRubricItems(sections: RubricSection[]): number {
  return sections.reduce((total, sec) => total + (sec.items?.length || 0), 0);
}
