import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase/server';
import { transcribeAudio } from '@/lib/openai/transcribe';
import { detectContext } from '@/lib/anthropic/detect';
import { tryIncrementUsage, refundUsage } from '@/lib/usage/check';
import { createLogger } from '@/lib/logger';
import type { UserProfile } from '@/lib/types/chero';

// Vercel Pro con Fluid Compute permite hasta 800s — configurado en vercel.json
export const maxDuration = 300;
export const runtime = 'nodejs';

const log = createLogger('api/process');

const ALLOWED_MIME_TYPES = new Set([
  'audio/mpeg',
  'audio/mp3',
  'audio/mp4',
  'audio/m4a',
  'audio/x-m4a',
  'audio/mpga',
  'audio/wav',
  'audio/x-wav',
  'audio/webm',
  'audio/ogg',
  'audio/opus',
]);

/**
 * Supabase Storage rechaza algunos MIME types "raros" que sí son válidos para Whisper
 * (audio/x-m4a, audio/x-wav, audio/mpga). Normalizamos al canónico para que Storage
 * los acepte. La transcripción usa el File original, no este normalizado.
 */
function normalizeStorageMime(mime: string): string {
  const m = mime.toLowerCase();
  if (m === 'audio/x-m4a' || m === 'audio/m4a') return 'audio/mp4';
  if (m === 'audio/x-wav') return 'audio/wav';
  if (m === 'audio/mpga' || m === 'audio/mp3') return 'audio/mpeg';
  if (m === 'audio/opus') return 'audio/ogg';
  return m || 'audio/mpeg';
}

const MAX_AUDIO_BYTES = 25 * 1024 * 1024; // 25 MB (límite Whisper API)

// ⚠️ NOTA sobre el body size limit en Vercel:
// - Vercel Hobby: limite de body request es ~4.5 MB
// - Vercel Pro: limite es ~10 MB (configurable hasta 100 MB con soporte)
// - Whisper acepta hasta 25 MB
//
// El día 7 al upgradear a Pro, audios hasta 10 MB pasan directo al endpoint.
// Para audios mayores: el frontend debe subir directo a Supabase Storage
// con signed upload URL (sin pasar por nuestro API) — implementación post-pitch.

/**
 * POST /api/process
 *
 * Body: FormData con campo "audio" (File)
 *
 * Flow:
 * 1. Auth check
 * 2. Validar archivo (MIME, tamaño)
 * 3. Counter check + increment ATÓMICO (try_increment_usage RPC)
 * 4. Subir audio a Supabase Storage
 * 5. Transcribir con GPT-4o Mini Transcribe
 * 6. Borrar audio del storage (privacy-by-design)
 * 7. Auto-detectar contexto con Claude Haiku
 * 8. Devolver { transcript, detected, usage }
 *
 * Si transcripción falla → refund del counter.
 */
export async function POST(req: NextRequest) {
  const startedAt = Date.now();

  try {
    // 1. Auth check
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      log.warn('Unauthorized request');
      return NextResponse.json(
        { error: 'unauthorized', message: 'Tenés que iniciar sesión.' },
        { status: 401 },
      );
    }

    // 2. Parse form data + validar archivo
    let formData: FormData;
    try {
      formData = await req.formData();
    } catch (err) {
      log.error('Failed to parse form data', { err: String(err) });
      return NextResponse.json(
        { error: 'invalid_body', message: 'No se pudo leer el archivo. Probá de nuevo.' },
        { status: 400 },
      );
    }

    const audioFile = formData.get('audio');

    if (!audioFile || !(audioFile instanceof File)) {
      return NextResponse.json(
        { error: 'missing_audio', message: 'No se recibió archivo de audio.' },
        { status: 400 },
      );
    }

    if (audioFile.size === 0) {
      return NextResponse.json(
        { error: 'empty_audio', message: 'El archivo de audio está vacío.' },
        { status: 400 },
      );
    }

    if (audioFile.size > MAX_AUDIO_BYTES) {
      return NextResponse.json(
        {
          error: 'audio_too_large',
          message: `El audio supera los 25 MB. Tu archivo tiene ${(audioFile.size / 1024 / 1024).toFixed(1)} MB. Comprimílo a MP3 64kbps (50min ≈ 24MB).`,
        },
        { status: 413 },
      );
    }

    if (audioFile.type && !ALLOWED_MIME_TYPES.has(audioFile.type.toLowerCase())) {
      log.warn('Unsupported MIME type', { type: audioFile.type, name: audioFile.name });
      return NextResponse.json(
        {
          error: 'unsupported_format',
          message: `Formato no soportado: ${audioFile.type}. Usá mp3, m4a, wav, webm u ogg.`,
        },
        { status: 415 },
      );
    }

    // 3. Counter check + increment ATÓMICO
    const usage = await tryIncrementUsage(user.id);
    if (!usage.success) {
      const message =
        usage.reason === 'global_exhausted'
          ? 'La beta de Chero llegó al límite de 50 usos totales. Volvé en Q3 2026 para el lanzamiento completo.'
          : 'Ya usaste tus 5 audios de la beta. Esperá al lanzamiento completo en Q3 2026.';

      log.info('Usage exhausted', { userId: user.id, reason: usage.reason });
      return NextResponse.json(
        { error: 'usage_exhausted', reason: usage.reason, usage, message },
        { status: 429 },
      );
    }

    log.info('Usage incremented', {
      userId: user.id,
      total_uses: usage.total_uses,
      user_uses: usage.user_uses,
    });

    // 4. Subir audio a Supabase Storage (path SIN prefijo "audios/" — el bucket ya se llama así)
    const admin = createSupabaseAdminClient();
    const safeFilename = audioFile.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
    const audioPath = `${user.id}/${Date.now()}-${safeFilename}`;

    const buffer = Buffer.from(await audioFile.arrayBuffer());
    const storageMime = normalizeStorageMime(audioFile.type);
    const { error: uploadError } = await admin.storage
      .from('audios')
      .upload(audioPath, buffer, {
        contentType: storageMime,
        upsert: false,
      });

    if (uploadError) {
      log.error('Upload failed', { err: uploadError.message, audioPath });
      // Refund counter porque ya lo incrementamos
      await refundUsage(user.id);
      return NextResponse.json(
        { error: 'upload_failed', message: 'No se pudo subir el audio. Intentá de nuevo.' },
        { status: 500 },
      );
    }

    // 5. Transcribir
    let transcript: Awaited<ReturnType<typeof transcribeAudio>>;
    try {
      transcript = await transcribeAudio(audioFile);
      log.info('Transcribed', {
        userId: user.id,
        duration_min: transcript.durationMinutes.toFixed(1),
        cost_usd: transcript.costUsd.toFixed(4),
        chars: transcript.text.length,
      });
    } catch (err) {
      log.error('Transcription failed', {
        err: err instanceof Error ? err.message : String(err),
      });
      // Borrar audio + refund
      await admin.storage.from('audios').remove([audioPath]);
      await refundUsage(user.id);
      return NextResponse.json(
        {
          error: 'transcription_failed',
          message: err instanceof Error ? err.message : 'Falló la transcripción.',
        },
        { status: 500 },
      );
    }

    // 6. Borrar audio del storage (privacy-by-design — ya tenemos la transcripción)
    const { error: deleteError } = await admin.storage.from('audios').remove([audioPath]);
    if (deleteError) {
      // No es bloqueante: el cron de cleanup limpia eventualmente. Solo loguear.
      log.warn('Audio delete failed (non-blocking)', {
        err: deleteError.message,
        audioPath,
      });
    } else {
      log.info('Audio deleted post-transcription', { audioPath });
    }

    // 7. Cargar perfil del usuario para auto-detect
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    // 8. Auto-detect contexto (Claude Haiku)
    let detected: Awaited<ReturnType<typeof detectContext>>;
    try {
      detected = await detectContext(
        transcript.text.slice(0, 2000),
        (profile as Partial<UserProfile>) ?? {},
      );
    } catch (err) {
      log.warn('Detection failed, using fallback', {
        err: err instanceof Error ? err.message : String(err),
      });
      detected = {
        mode: profile?.user_type === 'universitario' ? 'parciales' : 'periodo',
        subject: 'No detectado',
        institution: profile?.institution ?? null,
        year: profile?.year ?? null,
        topic: 'No detectado',
        confidence: 0,
      };
    }

    const elapsedMs = Date.now() - startedAt;
    log.info('Request complete', {
      userId: user.id,
      elapsedMs,
      mode: detected.mode,
      confidence: detected.confidence,
    });

    return NextResponse.json({
      success: true,
      transcript: {
        text: transcript.text,
        duration_minutes: transcript.durationMinutes,
        cost_usd: transcript.costUsd,
      },
      detected,
      usage: {
        total_uses: usage.total_uses,
        user_uses: usage.user_uses,
      },
      elapsed_ms: elapsedMs,
    });
  } catch (err) {
    log.error('Unexpected error', {
      err: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    });
    return NextResponse.json(
      {
        error: 'internal_error',
        message: 'Algo salió mal. Si vuelve a pasar, decinos.',
      },
      { status: 500 },
    );
  }
}
