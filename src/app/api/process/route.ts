import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { transcribeAudio } from '@/lib/openai/transcribe';
import { detectContext } from '@/lib/anthropic/detect';
import { tryIncrementUsage, refundUsage } from '@/lib/usage/check';
import { issueProcessToken } from '@/lib/auth/process-token';
import { analyzeTranscriptQuality } from '@/lib/audio/quality-check';
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
 * Devuelve el "tipo base" de un MIME type, sin parámetros como `;codecs=opus`.
 * Ej: 'audio/webm;codecs=opus' → 'audio/webm'
 */
function baseMime(mime: string): string {
  return mime.toLowerCase().split(';')[0].trim();
}

const MAX_AUDIO_BYTES = 25 * 1024 * 1024; // 25 MB (límite Whisper API)

// ⚠️ NOTA sobre el body size limit en Vercel:
// - Vercel Hobby: limite de body request es ~4.5 MB
// - Vercel Pro: limite es ~10 MB (configurable hasta 100 MB con soporte)
// - Whisper acepta hasta 25 MB
//
// Para audios >4.5 MB en Hobby: el frontend debe subir directo a Supabase
// Storage con signed upload URL (sin pasar por nuestro API) — implementación
// post-pitch. Hoy el frontend usa MediaRecorder a 32kbps que mantiene los
// audios bajo 4.5 MB para hasta 18 min de grabación.

/**
 * POST /api/process
 *
 * Body: FormData con campo "audio" (File)
 *
 * Flow:
 * 1. Auth check
 * 2. Validar archivo (MIME, tamaño)
 * 3. Enforzar consentimiento parental si is_minor
 * 4. Counter check + increment ATÓMICO (try_increment_usage RPC)
 * 5. Transcribir con GPT-4o Mini Transcribe (sin pasar por Storage —
 *    privacy-by-design: el audio nunca toca disco)
 * 6. Auto-detectar contexto con Claude Haiku (transcript completo,
 *    no solo primeros 2000 chars)
 * 7. Emitir process_token firmado para que /api/generate-notes pueda validar
 * 8. Devolver { transcript, detected, usage, process_token }
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

    if (audioFile.type && !ALLOWED_MIME_TYPES.has(baseMime(audioFile.type))) {
      log.warn('Unsupported MIME type', { type: audioFile.type, name: audioFile.name });
      return NextResponse.json(
        {
          error: 'unsupported_format',
          message: `Formato no soportado: ${audioFile.type}. Usá mp3, m4a, wav, webm u ogg.`,
        },
        { status: 415 },
      );
    }

    // 2.5 Enforzar consentimiento parental si menor de edad (Ley SV)
    const { data: profileForCheck } = await supabase
      .from('profiles')
      .select('is_minor, has_guardian_consent')
      .eq('id', user.id)
      .maybeSingle();

    if (profileForCheck?.is_minor && !profileForCheck?.has_guardian_consent) {
      log.warn('Minor without guardian consent attempted to process', { userId: user.id });
      return NextResponse.json(
        {
          error: 'consent_required',
          message:
            'Para usar Chero como menor de edad necesitamos el consentimiento de tu madre, padre o tutor. Volvé al onboarding.',
        },
        { status: 403 },
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

    // 4. Transcribir directo (sin upload a Storage previo — Whisper recibe el File del FormData).
    //    Privacy-by-design: el audio NUNCA se persiste en disco. Solo vive en memoria del
    //    serverless function durante el request, y muere al final.
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
      const refund = await refundUsage(user.id);
      return NextResponse.json(
        {
          error: 'transcription_failed',
          message: err instanceof Error ? err.message : 'Falló la transcripción.',
          refund_ok: refund.ok,
        },
        { status: 500 },
      );
    }

    // 5. Cargar perfil del usuario para auto-detect
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    // 6. Auto-detect contexto (Claude Haiku) — transcript completo (el regex
    // override busca menciones explícitas de "AVANZO" / "período" / "parcial"
    // en TODO el texto, no solo en los primeros 2000 chars).
    let detected: Awaited<ReturnType<typeof detectContext>>;
    try {
      detected = await detectContext(
        transcript.text,
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

    // 7. Análisis de calidad de la transcripción (regex-based, costo $0)
    const quality = analyzeTranscriptQuality(transcript.text);
    log.info('Quality analyzed', {
      userId: user.id,
      verdict: quality.verdict,
      score: quality.score,
      signals: quality.signals,
    });

    // 8. Emitir token firmado para que /api/generate-notes valide que el
    // transcript viene de un /api/process legítimo (no inventado por el cliente).
    const processToken = issueProcessToken(user.id, transcript.text);

    return NextResponse.json({
      success: true,
      transcript: {
        text: transcript.text,
        duration_minutes: transcript.durationMinutes,
        cost_usd: transcript.costUsd,
      },
      detected,
      quality,
      usage: {
        total_uses: usage.total_uses,
        user_uses: usage.user_uses,
      },
      process_token: processToken,
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
