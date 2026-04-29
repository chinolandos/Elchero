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
 *   - El audio ya viene comprimido a MP3/WebM/M4A por el cliente
 *   - Para 50 min de audio @96kbps ≈ 36MB → tendríamos que chunkear
 *   - Para nuestro caso (max 9 min @64kbps = 4.3MB) cabe holgado
 *
 * Si recibimos un archivo >25MB, devolvemos error. El chunking real con
 * ffmpeg viene post-pitch.
 */
export async function transcribeAudio(
  audioFile: File | Blob,
): Promise<TranscribeResult> {
  const sizeBytes = audioFile.size;

  if (sizeBytes > WHISPER_MAX_BYTES) {
    throw new Error(
      `Audio excede 25MB (recibido: ${(sizeBytes / 1024 / 1024).toFixed(1)}MB). El cliente debe comprimir a MP3 64kbps antes de subir.`,
    );
  }

  // OpenAI SDK acepta File/Blob directamente. Si es Blob (sin nombre), envolvemos
  // en File con nombre genérico — el nombre solo afecta logging del SDK.
  const file =
    audioFile instanceof File
      ? audioFile
      : new File([audioFile], 'audio.mp3', { type: audioFile.type || 'audio/mpeg' });

  // gpt-4o-mini-transcribe NO soporta verbose_json — solo json o text.
  // Por eso no tenemos `duration` exacta del API.
  const response = await openai.audio.transcriptions.create({
    model: TRANSCRIBE_MODEL,
    file,
    language: 'es',
    response_format: 'json',
  });

  const text = response.text ?? '';

  // Estimación de duración por tamaño del archivo. NO es exacta — gpt-4o-mini-
  // transcribe no devuelve duration en json (solo en verbose_json que no soporta).
  // Asumimos bitrate típico ~96 kbps mp3/m4a (12 KB/seg) → bytes / 12000.
  //   - Audio a 64 kbps: estimación ~33% LARGA de más
  //   - Audio a 128 kbps: estimación ~25% CORTA de menos
  // El error solo afecta `audio_duration_minutes` mostrado al user; no rompe lógica.
  // Para precisión real: parsear el header del audio container post-MVP.
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
