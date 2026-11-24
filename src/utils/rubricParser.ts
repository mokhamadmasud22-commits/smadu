import type { RubricSection } from '../types/supervision';
import { countRubricItems } from './score';

export interface ParsedInstrumentResult {
  success: boolean;
  sections?: RubricSection[];
  name?: string;
  count: number;
  error?: string;
}

interface RawFlatIndicator {
  id?: string;
  category?: string;
  kategori?: string;
  section?: string;
  label?: string;
  indikator?: string;
  desc?: string;
  deskripsi?: string;
  keterangan?: string;
}

function parseCsvLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function groupFlatIndicators(items: RawFlatIndicator[]): RubricSection[] {
  const grouped: Record<string, Array<{ id: string; label: string; desc: string }>> = {};

  items.forEach((item, index) => {
    const category = item.category || item.kategori || item.section || 'UMUM';
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push({
      id: item.id || `item_${index + 1}`,
      label: item.label || item.indikator || `Indikator ${index + 1}`,
      desc: item.desc || item.deskripsi || item.keterangan || '-',
    });
  });

  return Object.entries(grouped).map(([title, secItems], idx) => ({
    id: `sec_${idx + 1}`,
    title,
    items: secItems,
  }));
}

function normalizeSections(sections: Partial<RubricSection>[]): RubricSection[] {
  return sections
    .map((sec, sIdx) => ({
      id: sec.id || `sec_${sIdx + 1}`,
      title: sec.title || `Bagian ${sIdx + 1}`,
      items: (sec.items || []).map((item, iIdx) => ({
        id: item.id || `itm_${sIdx + 1}_${iIdx + 1}`,
        label: item.label || `Indikator ${iIdx + 1}`,
        desc: item.desc || '-',
      })),
    }))
    .filter((sec) => sec.items.length > 0);
}

export function parseImportedInstrument(
  rawText: string,
  format: 'csv' | 'json',
): ParsedInstrumentResult {
  const trimmed = rawText.trim();
  if (!trimmed) {
    return { success: false, count: 0, error: 'File atau data kosong.' };
  }

  if (format === 'json') {
    try {
      const parsed = JSON.parse(trimmed);
      let rawSections: Partial<RubricSection>[] = [];
      const instrumentName: string =
        parsed.instrumentName || parsed.name || 'Instrumen Hasil Import';

      if (Array.isArray(parsed)) {
        if (parsed.length > 0 && parsed[0].items) {
          rawSections = parsed;
        } else if (parsed.length > 0 && (parsed[0].label || parsed[0].indikator)) {
          rawSections = groupFlatIndicators(parsed);
        }
      } else if (parsed.sections && Array.isArray(parsed.sections)) {
        rawSections = parsed.sections;
      } else {
        return {
          success: false,
          count: 0,
          error:
            'Format struktur JSON tidak sesuai. Harus berupa array sections atau objek dengan properti "sections".',
        };
      }

      const sections = normalizeSections(rawSections);
      const count = countRubricItems(sections);
      if (count === 0) {
        return {
          success: false,
          count: 0,
          error: 'Tidak ditemukan indikator valid dalam data JSON yang diimpor.',
        };
      }

      return { success: true, sections, name: instrumentName, count };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sintaks tidak valid';
      return { success: false, count: 0, error: `Gagal membaca JSON: ${msg}` };
    }
  }

  try {
    const lines = trimmed.split(/\r?\n/).filter((line) => line.trim().length > 0);
    if (lines.length < 2) {
      return {
        success: false,
        count: 0,
        error: 'File CSV harus memiliki minimal 1 baris header dan 1 baris data.',
      };
    }

    const headerLine = lines[0];
    const delimiter = headerLine.includes(';') && !headerLine.includes(',') ? ';' : ',';
    const rows = lines.map((line) => parseCsvLine(line, delimiter));
    const headers = rows[0].map((col) => col.toLowerCase().trim());

    let categoryCol = headers.findIndex(
      (h) => h.includes('kategori') || h.includes('aspek') || h.includes('tahap') || h.includes('section'),
    );
    let labelCol = headers.findIndex(
      (h) => h.includes('indikator') || h.includes('fokus') || h.includes('nama') || h.includes('label'),
    );
    let descCol = headers.findIndex(
      (h) =>
        h.includes('deskripsi') ||
        h.includes('uraian') ||
        h.includes('keterangan') ||
        h.includes('desc'),
    );

    if (categoryCol === -1) categoryCol = 0;
    if (labelCol === -1) labelCol = 1;
    if (descCol === -1) descCol = 2;

    const flatRows: RawFlatIndicator[] = [];
    for (let i = 1; i < rows.length; i++) {
      const cols = rows[i];
      if (cols.length <= 1 && !cols[0]) continue;
      const category = (cols[categoryCol] || 'UMUM').trim();
      const label = (cols[labelCol] || '').trim();
      const desc = (cols[descCol] || '').trim();
      if (label) {
        flatRows.push({ category, label, desc });
      }
    }

    if (flatRows.length === 0) {
      return {
        success: false,
        count: 0,
        error: 'Tidak ditemukan baris indikator yang valid pada file CSV.',
      };
    }

    const sections = normalizeSections(groupFlatIndicators(flatRows));
    const count = countRubricItems(sections);
    return {
      success: true,
      sections,
      name: `Instrumen CSV (${count} Indikator)`,
      count,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Format baris tidak valid';
    return { success: false, count: 0, error: `Gagal membaca CSV: ${msg}` };
  }
}
