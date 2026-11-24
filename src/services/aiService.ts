import type { AiAnalysisResponse, SupervisionInstrument } from '../types/supervision';

export async function generateSupervisionAnalysis(
  stage: 'pra' | 'observasi' | 'pasca' | 'all',
  instrument: SupervisionInstrument,
  guruNama?: string,
): Promise<AiAnalysisResponse> {
  const response = await fetch('/api/ai/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      stage,
      guruNama: guruNama || instrument.namaGuru || 'Guru',
      instrument: {
        mapel: instrument.mapel,
        materi: instrument.materi,
        praFields: instrument.praFields,
        obsScores: instrument.obsScores,
        obsNotes: instrument.obsNotes,
        pascaRefleksi: instrument.pascaRefleksi,
        pascaSanggah: instrument.pascaSanggah,
        pascaRencana: instrument.pascaRencana,
      },
    }),
  });

  if (!response.ok) {
    let errorMessage = `Gagal memproses analisis AI (HTTP ${response.status}).`;
    try {
      const errorData = (await response.json()) as { error?: string };
      if (errorData.error) {
        errorMessage = errorData.error;
      }
    } catch {
      // keep fallback HTTP error
    }
    throw new Error(errorMessage);
  }

  return (await response.json()) as AiAnalysisResponse;
}
