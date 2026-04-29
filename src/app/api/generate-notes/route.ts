import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { generateNotes } from '@/lib/anthropic/generate';
import { verifyProcessToken } from '@/lib/auth/process-token';
import { createLogger } from '@/lib/logger';
import type { UserProfile } from '@/lib/types/chero';

export const maxDuration = 300;
export const runtime = 'nodejs';

const log = createLogger('api/generate-notes');

const RequestBodySchema = z.object({
  transcript: z.string().min(20),
  detected: z.object({
    mode: z.enum(['avanzo', 'periodo', 'parciales', 'repaso']),
    subject: z.string(),
    institution: z.string().nullable(),
    year: z.number().int().min(1).max(5).nullable(),
    topic: z.string(),
    confidence: z.number().int().min(0).max(100),
  }),
  audio_duration_minutes: z.number().nonnegative().optional(),
  // Token firmado emitido por /api/process. Bloquea uso directo del endpoint
  // sin haber pasado por transcripción real (anti-abuso).
  process_token: z.string().min(20),
});

/**
 * POST /api/generate-notes
 *
 * Body JSON:
 *   {
 *     transcript: string,
 *     detected: { mode, subject, institution, year, topic, confidence },
 *     audio_duration_minutes?: number
 *   }
 *
 * Flow:
 * 1. Auth check
 * 2. Validate body
 * 3. Cargar perfil
 * 4. Generar apunte con Claude Sonnet 4.6 (con KB cacheado)
 * 5. Guardar el apunte en Supabase tabla `notes`
 * 6. Devolver { note_id, note }
 *
 * NOTA: este endpoint NO incrementa el counter — eso ya pasó en /api/process.
 * Si el user llegó hasta acá, ya pagó el "uso" del audio.
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
      return NextResponse.json(
        { error: 'unauthorized', message: 'Tenés que iniciar sesión.' },
        { status: 401 },
      );
    }

    // 2. Parse + validate body
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: 'invalid_json', message: 'Body inválido.' },
        { status: 400 },
      );
    }

    const validated = RequestBodySchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        {
          error: 'invalid_body',
          message: 'Faltan campos requeridos.',
          issues: validated.error.issues,
        },
        { status: 400 },
      );
    }

    const { transcript, detected, audio_duration_minutes, process_token } =
      validated.data;

    // 2.5 Verificar token firmado emitido por /api/process. Esto bloquea el
    // abuso directo del endpoint con transcripts inventados (que costaría
    // tokens de Sonnet sin tocar el counter de usos).
    const tokenCheck = verifyProcessToken(process_token, user.id, transcript);
    if (!tokenCheck.ok) {
      log.warn('process_token verification failed', {
        userId: user.id,
        reason: tokenCheck.reason,
      });
      const message =
        tokenCheck.reason === 'expired'
          ? 'El token expiró (más de 15 min entre transcribir y generar). Volvé a procesar el audio.'
          : 'El token de procesamiento es inválido. Procesá el audio de nuevo.';
      return NextResponse.json(
        { error: 'invalid_process_token', reason: tokenCheck.reason, message },
        { status: 403 },
      );
    }

    // 3. Cargar perfil del usuario
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    // 4. Generar apunte con Claude Sonnet 4.6 + KB cacheado
    let result: Awaited<ReturnType<typeof generateNotes>>;
    try {
      result = await generateNotes({
        transcript,
        detected,
        profile: (profile as Partial<UserProfile>) ?? {},
      });
    } catch (err) {
      log.error('Generation failed', {
        err: err instanceof Error ? err.message : String(err),
      });
      return NextResponse.json(
        {
          error: 'generation_failed',
          message:
            err instanceof Error
              ? err.message
              : 'No se pudo generar el apunte. Probá de nuevo.',
        },
        { status: 500 },
      );
    }

    // 5. Guardar el apunte en Supabase
    const { note } = result;
    const { data: insertedNote, error: insertError } = await supabase
      .from('notes')
      .insert({
        user_id: user.id,
        mode: detected.mode,
        subject: detected.subject,
        institution: detected.institution,
        detected_confidence: detected.confidence,
        audio_duration_minutes: audio_duration_minutes ?? null,
        transcript,
        summary: note.summary,
        concepts: note.concepts,
        questions: note.questions,
        flashcards: note.flashcards,
        quick_review: note.quick_review,
        mermaid_chart: note.mermaid_chart,
      })
      .select('id')
      .single();

    if (insertError) {
      log.error('Insert failed', { err: insertError.message });
      return NextResponse.json(
        {
          error: 'persist_failed',
          message:
            'El apunte se generó pero no pudimos guardarlo. Refrescá y probá de nuevo.',
        },
        { status: 500 },
      );
    }

    const elapsedMs = Date.now() - startedAt;
    log.info('Note generated and persisted', {
      userId: user.id,
      noteId: insertedNote.id,
      mode: detected.mode,
      subject: detected.subject,
      cache_hit: result.cache_hit,
      cost_usd: result.cost_usd.toFixed(4),
      total_elapsed_ms: elapsedMs,
    });

    return NextResponse.json({
      success: true,
      note_id: insertedNote.id,
      note,
      meta: {
        cache_hit: result.cache_hit,
        cost_usd: result.cost_usd,
        input_tokens: result.input_tokens,
        output_tokens: result.output_tokens,
        elapsed_ms: result.elapsed_ms,
      },
    });
  } catch (err) {
    log.error('Unexpected error', {
      err: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    });
    return NextResponse.json(
      { error: 'internal_error', message: 'Algo salió mal.' },
      { status: 500 },
    );
  }
}
