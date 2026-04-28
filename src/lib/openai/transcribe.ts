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
 * Si el audio es >25MB, hace chunking automático.
 *
 * Para MVP simple: si el audio es ≤25MB, transcribe directo.
 * Si es mayor, lo cortamos en pedazos y concatenamos.
 *
 * NOTE: el chunking real requiere una librería de audio (ej: ffmpeg).
 * Para MVP, asumimos que el cliente comprime a MP3 64kbps antes (50 min ≈ 24MB).
 * Si llega un archivo >25MB, devolvemos error para forzar al cliente a chunkear.
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

  const response = await openai.audio.transcriptions.create({
    model: TRANSCRIBE_MODEL,
    file,
    language: 'es',
    response_format: 'verbose_json',
  });

  // verbose_json nos da duración exacta para calcular costo
  const text = response.text ?? '';
  const durationSeconds: number = (response as { duration?: number }).duration ?? 0;
  const durationMinutes = durationSeconds / 60;
  const costUsd = durationMinutes * 0.003;

  return {
    text,
    durationMinutes,
    chunks: 1,
    costUsd,
  };
}
