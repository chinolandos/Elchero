import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  createSupabaseServerClient,
  createSupabaseAdminClient,
} from '@/lib/supabase/server';
import { generateNotes } from '@/lib/anthropic/generate';
import { verifyProcessToken } from '@/lib/auth/process-token';
import { refundUsage } from '@/lib/usage/check';
import { createLogger } from '@/lib/logger';
import type { UserProfile } from '@/lib/types/chero';
import type { Database, Json } from '@/lib/types/database';

type NoteInsert = Database['public']['Tables']['notes']['Insert'];

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
    if (!tokenCheck.ok || !tokenCheck.tokenHash) {
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

    const tokenHash = tokenCheck.tokenHash;

    // 3. CLAIM ATÓMICO del token (single-use). Lo hacemos ANTES de gastar
    //    Sonnet para prevenir replay attacks que cuesten plata.
    //    Si claim falla (token ya consumido), bail out inmediato — no se
    //    gastó nada de Sonnet.
    //    Si Sonnet/insert fallan DESPUÉS → liberamos el token (rollback)
    //    para que el user pueda reintentar.
    const admin = createSupabaseAdminClient();
    const { data: claimOk, error: claimError } = await admin.rpc(
      'consume_token_atomic',
      {
        p_token_hash: tokenHash,
        p_user_id: user.id,
        p_consumed_for: 'generate_notes',
      },
    );

    if (claimError) {
      log.error('consume_token_atomic RPC failed', { err: claimError.message });
      return NextResponse.json(
        {
          error: 'token_claim_failed',
          message: 'Error de seguridad. Intentá de nuevo en un momento.',
        },
        { status: 500 },
      );
    }

    if (claimOk === false) {
      log.warn('Token replay attempt blocked', {
        userId: user.id,
        tokenHash: tokenHash.slice(0, 16),
      });
      return NextResponse.json(
        {
          error: 'token_already_consumed',
          message:
            'Este audio ya generó un apunte. Si querés otro, procesá un audio nuevo.',
        },
        { status: 409 },
      );
    }

    // Helper: si algo falla después del claim, liberamos el token para que
    // el user pueda reintentar (no perder uso por error nuestro).
    const releaseToken = async () => {
      try {
        await admin.from('consumed_process_tokens').delete().eq('token_hash', tokenHash);
      } catch (err) {
        log.warn('release token failed (non-blocking)', {
          err: err instanceof Error ? err.message : String(err),
        });
      }
    };

    // 4. Cargar perfil del usuario
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    // 5. Generar apunte con Claude Sonnet 4.6 + KB cacheado.
    //    Si falla → liberamos token + refund del counter.
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
      await releaseToken();
      const refund = await refundUsage(user.id);
      return NextResponse.json(
        {
          error: 'generation_failed',
          message:
            err instanceof Error
              ? err.message
              : 'No se pudo generar el apunte. Probá de nuevo.',
          refund_ok: refund.ok,
        },
        { status: 500 },
      );
    }

    // 6. Guardar el apunte en Supabase. Si falla → liberamos token + refund.
    const { note } = result;
    // Tipado explícito: @supabase/ssr no siempre propaga el Database generic
    // al .insert(), así que declaramos la shape con NoteInsert para que TS
    // valide cada campo contra el schema generado.
    const newNote: NoteInsert = {
      user_id: user.id,
      mode: detected.mode,
      subject: detected.subject,
      institution: detected.institution,
      detected_confidence: detected.confidence,
      audio_duration_minutes: audio_duration_minutes ?? null,
      transcript,
      summary: note.summary,
      // Cast a Json: NoteConcept/Question/Flashcard son shapes específicas
      // pero Supabase los persiste como jsonb (Json union loose). El cast
      // unknown→Json es el patrón estándar para shapes conocidas.
      concepts: note.concepts as unknown as Json,
      questions: note.questions as unknown as Json,
      flashcards: note.flashcards as unknown as Json,
      quick_review: note.quick_review,
      mermaid_chart: note.mermaid_chart,
    };
    const { data: insertedNote, error: insertError } = await supabase
      .from('notes')
      .insert(newNote)
      .select('id')
      .single();

    if (insertError) {
      log.error('Insert failed', { err: insertError.message });
      await releaseToken();
      const refund = await refundUsage(user.id);
      return NextResponse.json(
        {
          error: 'persist_failed',
          message:
            'El apunte se generó pero no pudimos guardarlo. Refrescá y probá de nuevo.',
          refund_ok: refund.ok,
        },
        { status: 500 },
      );
    }

    // Token ya está consumido (claim al inicio del flow). No hace falta
    // marcarlo de nuevo. Si llegamos acá, todo OK end-to-end.

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
