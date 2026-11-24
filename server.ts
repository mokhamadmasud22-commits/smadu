import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import type { Request, Response } from 'express';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SYSTEM_INSTRUCTION = `Anda adalah Pakar Pendidikan Senior dan Supervisor Klinis Pengawas Sekolah berpengalaman. 
Tugas Anda adalah menganalisis data observasi pembelajaran berdasarkan Kurikulum Nasional dan prinsip Deep Learning (Pembelajaran Mendalam: Mindful, Meaningful, Joyful Learning).
Analisis harus bersifat empatik, profesional, objektif, berbasis bukti, dan mendukung pengembangan kompetensi guru berkelanjutan.
Gunakan Bahasa Indonesia formal baku yang inspiratif dan berdaya guna tinggi.`;

interface AnalyzeRequestBody {
  stage?: 'pra' | 'observasi' | 'pasca' | 'all';
  guruNama?: string;
  instrument?: {
    mapel?: string;
    materi?: string;
    praFields?: {
      tujuan?: string;
      area?: string;
      strategi?: string;
      media?: string;
    };
    obsScores?: Record<string, number>;
    obsNotes?: Record<string, string>;
    pascaRefleksi?: string;
    pascaSanggah?: string;
    pascaRencana?: string;
  };
}

function buildSupervisionPrompt(
  stage: 'pra' | 'observasi' | 'pasca' | 'all',
  instrument: AnalyzeRequestBody['instrument'],
  guruNama: string,
): string {
  let prompt = `Guru: ${guruNama || 'Guru'}, Mata Pelajaran: ${instrument?.mapel || '-'}, Materi: ${instrument?.materi || '-'}.\n`;

  if (stage === 'pra' || stage === 'all') {
    prompt += `[FASE PRA-OBSERVASI]
Tujuan: ${instrument?.praFields?.tujuan || '-'}
Area Pengembangan: ${instrument?.praFields?.area || '-'}
Strategi: ${instrument?.praFields?.strategi || '-'}
Media/Sumber: ${instrument?.praFields?.media || '-'}
Analisis kesiapan guru berdasarkan data di atas sesuai Kurikulum Nasional dan Pembelajaran Mendalam (Deep Learning).\n`;
  }

  if (stage === 'observasi' || stage === 'all') {
    const scores = Object.values(instrument?.obsScores || {})
      .map((val) => Number(val))
      .filter((val) => !Number.isNaN(val));
    const sum = scores.reduce((acc, val) => acc + val, 0);
    const avg = scores.length > 0 ? (sum / scores.length).toFixed(2) : '0';

    prompt += `[FASE OBSERVASI KELAS]
Skor Rata-rata: ${avg} / 4.00
Distribusi Skor: ${JSON.stringify(instrument?.obsScores || {})}
Catatan Temuan Lapangan: ${JSON.stringify(instrument?.obsNotes || {})}
Analisislah performa guru secara komprehensif. Sebutkan kekuatan spesifik, area perbaikan, dan interpretasi terhadap mutu pembelajaran.\n`;
  }

  if (stage === 'pasca' || stage === 'all') {
    prompt += `[FASE PASCA-OBSERVASI (DIALOG DUA ARAH)]
Refleksi Guru: ${instrument?.pascaRefleksi || '-'}
Tanggapan / Sanggahan Guru: ${instrument?.pascaSanggah || 'Guru menyetujui seluruh hasil observasi'}
Rencana Pengembangan: ${instrument?.pascaRencana || '-'}
Berikan rekomendasi spesifik langkah tindak lanjut konkret (coaching/mentoring/workshop/lesson study/self development) dengan mempertimbangkan refleksi dua arah dan sanggahan guru.\n`;
  }

  return prompt;
}

async function startServer(): Promise<void> {
  const app = express();
  const port = Number(process.env.PORT) || 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json({ limit: '5mb' }));

  app.post('/api/ai/analyze', async (req: Request, res: Response) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.status(503).json({
        error:
          'GEMINI_API_KEY belum dikonfigurasi pada server. Silakan tambahkan secret GEMINI_API_KEY pada pengaturan aplikasi.',
      });
      return;
    }

    try {
      const body = (req.body || {}) as AnalyzeRequestBody;
      const stage = body.stage || 'all';
      const guruNama = body.guruNama || 'Guru';
      const instrument = body.instrument || {};

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const contents = buildSupervisionPrompt(stage, instrument, guruNama);

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              analysis: {
                type: Type.STRING,
                description: 'Analisis naratif mendalam tiap fase supervisi',
              },
              kekuatan: {
                type: Type.STRING,
                description: 'Kekuatan spesifik guru',
              },
              perbaikan: {
                type: Type.STRING,
                description: 'Area yang perlu ditingkatkan',
              },
              rekomendasi: {
                type: Type.STRING,
                description: 'Rekomendasi tindak lanjut konkret',
              },
              rtlSuggestion: {
                type: Type.OBJECT,
                properties: {
                  coaching: { type: Type.BOOLEAN },
                  mentoring: { type: Type.BOOLEAN },
                  workshop: { type: Type.BOOLEAN },
                  lessonStudy: { type: Type.BOOLEAN },
                  selfDevelopment: { type: Type.BOOLEAN },
                },
              },
              scoreInterpretation: {
                type: Type.STRING,
                description: 'Interpretasi distribusi skor dan ketercapaian rubrik',
              },
            },
            required: ['analysis', 'kekuatan', 'perbaikan', 'rekomendasi'],
          },
        },
      });

      const text = response.text || '{}';
      const parsed = JSON.parse(text);
      if (!parsed.analysis) {
        res.status(502).json({
          error: 'Model AI tidak mengembalikan ringkasan analisis yang valid.',
        });
        return;
      }

      res.json(parsed);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Gagal menghubungi layanan Gemini AI.';
      console.error('Error /api/ai/analyze:', message);
      res.status(500).json({ error: message });
    }
  });

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      const indexFile = path.join(distDir, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Build output not found. Run npm run build first.');
      }
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`SI PERAK server running on http://0.0.0.0:${port} (${isProd ? 'production' : 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start SI PERAK server:', err);
  process.exit(1);
});
