import { openai } from './client';

const WHISPER_MAX_BYTES = 25 * 1024 * 1024; // 25 MB
const TRANSCRIBE_MODEL = 'gpt-4o-mini-transcribe' as const;

export interface TranscribeResult {
  text: string;
  durationMinutes: number;
  chunks: number;
  costUsd: number;
}

/**
 * Transcribe un audio usando GPT-4o Mini Transcribe ($0.003/min).
 *
 * IMPORTANTE: este código NO hace chunking automático. Asumimos que:
 *   - El audio ya viene comprimido a MP3 64kbps por el cliente
 *     (50 min de audio ≈ 24MB → cabe en el límite de 25MB de Whisper)
 *
 * Si recibimos un archivo >25MB, devolvemos error y le pedimos al cliente
 * que lo comprima. El chunking real con ffmpeg/lamejs viene post-pitch.
 */
export async function transcribeAudio(
  audioFile: File | Blob,
  filename = 'audio.mp3',
): Promise<TranscribeResult> {
  const sizeBytes = audioFile.size;

  if (sizeBytes > WHISPER_MAX_BYTES) {
    throw new Error(
      `Audio excede 25MB (recibido: ${(sizeBytes / 1024 / 1024).toFixed(1)}MB). El cliente debe comprimir a MP3 64kbps antes de subir.`,
    );
  }

  // OpenAI SDK acepta File/Blob directamente
  const file =
    audioFile instanceof File
      ? audioFile
      : new File([audioFile], filename, { type: audioFile.type || 'audio/mpeg' });

  // gpt-4o-mini-transcribe NO soporta verbose_json — solo json o text.
  // Por eso no tenemos `duration` exacta del API.
  const response = await openai.audio.transcriptions.create({
    model: TRANSCRIBE_MODEL,
    file,
    language: 'es',
    response_format: 'json',
  });

  const text = response.text ?? '';

  // Estimación de duración por tamaño del archivo.
  // Asumimos bitrate típico ~64-128 kbps (8-16 KB/seg).
  // Promedio conservador: ~12 KB/seg → bytes / 12000 = segundos.
  const durationSeconds = Math.max(1, sizeBytes / 12_000);
  const durationMinutes = durationSeconds / 60;
  const costUsd = durationMinutes * 0.003;

  // Validar que tengamos texto (audio en silencio absoluto = text vacío)
  if (!text.trim()) {
    throw new Error(
      'No se detectó voz en el audio. Asegurate que el audio no esté en silencio.',
    );
  }

  // Validar que el audio no sea trivial (basado en duración estimada)
  if (durationSeconds < 2) {
    throw new Error(
      `Audio muy corto (estimado ${durationSeconds.toFixed(1)}s). Mínimo 2 segundos para procesar.`,
    );
  }

  return {
    text,
    durationMinutes,
    chunks: 1,
    costUsd,
  };
}
