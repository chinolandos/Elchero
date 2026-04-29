import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  createSupabaseServerClient,
  createSupabaseAdminClient,
} from '@/lib/supabase/server';
import { generateNotes } from '@/lib/anthropic/generate';
import { detectContext } from '@/lib/anthropic/detect';
import { createLogger } from '@/lib/logger';
import type { UserProfile, CheroMode } from '@/lib/types/chero';

export const maxDuration = 300;
export const runtime = 'nodejs';

const log = createLogger('api/notes/[id]/regenerate');

const RegenerateBodySchema = z.object({
  /** Si el user editó el transcript antes de regenerar, lo manda acá. */
  edited_transcript: z.string().min(20).optional(),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/notes/[id]/regenerate
 *
 * Regenera un apunte ya existente:
 *   1. Carga el apunte (RLS valida ownership)
 *   2. Re-detecta el contexto (por si el user editó el transcript) — opcional
 *   3. Llama Sonnet de nuevo con el transcript (original o editado)
 *   4. Reemplaza summary, concepts, questions, flashcards, quick_review,
 *      mermaid_chart en la fila existente
 *   5. Limpia el audio_tts_url del bucket (queda inválido — el TTS está
 *      basado en el contenido viejo)
 *
 * NO incrementa el counter — la transcripción ya pagó el uso original.
 *
 * Si el user editó el transcript, también persistimos el nuevo transcript.
 */
export async function POST(req: NextRequest, ctx: RouteContext) {
  const { id } = await ctx.params;

  // Auth
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  // Body opcional
  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    // body vacío es válido — significa "regenerá con el transcript actual"
  }
  const validated = RegenerateBodySchema.safeParse(body);
  if (!validated.success) {
    return NextResponse.json(
      { error: 'invalid_body', issues: validated.error.issues },
      { status: 400 },
    );
  }
  const { edited_transcript } = validated.data;

  // Cargar apunte (RLS valida ownership)
  const { data: note, error: noteError } = await supabase
    .from('notes')
    .select(
      'id, transcript, mode, subject, institution, detected_confidence, audio_duration_minutes, audio_tts_url',
    )
    .eq('id', id)
    .maybeSingle();
  if (noteError || !note) {
    return NextResponse.json(
      { error: 'not_found', message: 'No se encontró el apunte.' },
      { status: 404 },
    );
  }

  if (!note.transcript) {
    return NextResponse.json(
      {
        error: 'no_transcript',
        message:
          'Este apunte no tiene transcripción guardada (apuntes muy viejos). No podemos regenerar.',
      },
      { status: 400 },
    );
  }

  const transcriptToUse = edited_transcript ?? note.transcript;

  // Cargar perfil para regenerar con contexto fresco
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  // Si el transcript cambió, re-detectamos contexto. Si no, reutilizamos lo
  // que ya teníamos en la nota.
  let detected: {
    mode: CheroMode;
    subject: string;
    institution: string | null;
    year: number | null;
    topic: string;
    confidence: number;
  };
  if (edited_transcript) {
    try {
      detected = await detectContext(
        edited_transcript,
        (profile as Partial<UserProfile>) ?? {},
      );
    } catch (err) {
      log.warn('Detect failed during regenerate, reusing old context', {
        err: err instanceof Error ? err.message : String(err),
      });
      detected = {
        mode: note.mode,
        subject: note.subject ?? 'No detectado',
        institution: note.institution,
        year: (profile as { year?: number })?.year ?? null,
        topic: note.subject ?? 'No detectado',
        confidence: note.detected_confidence ?? 0,
      };
    }
  } else {
    detected = {
      mode: note.mode,
      subject: note.subject ?? 'No detectado',
      institution: note.institution,
      year: (profile as { year?: number })?.year ?? null,
      topic: note.subject ?? 'No detectado',
      confidence: note.detected_confidence ?? 0,
    };
  }

  // Generar de nuevo
  let result: Awaited<ReturnType<typeof generateNotes>>;
  try {
    result = await generateNotes({
      transcript: transcriptToUse,
      detected,
      profile: (profile as Partial<UserProfile>) ?? {},
    });
  } catch (err) {
    log.error('Regenerate failed', {
      err: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      {
        error: 'generation_failed',
        message:
          err instanceof Error ? err.message : 'No se pudo regenerar el apunte.',
      },
      { status: 500 },
    );
  }

  // Update — reemplazamos contenido pero mantenemos id, user_id, created_at
  const newNote = result.note;
  const updates: Record<string, unknown> = {
    summary: newNote.summary,
    concepts: newNote.concepts,
    questions: newNote.questions,
    flashcards: newNote.flashcards,
    quick_review: newNote.quick_review,
    mermaid_chart: newNote.mermaid_chart,
    // Si re-detectamos, persistimos los nuevos campos detectados
    mode: detected.mode,
    subject: detected.subject,
    institution: detected.institution,
    detected_confidence: detected.confidence,
    // Limpiar audio_tts_url — el viejo audio TTS ya no corresponde al contenido nuevo
    audio_tts_url: null,
  };
  if (edited_transcript) {
    updates.transcript = edited_transcript;
  }

  const { error: updateError } = await supabase
    .from('notes')
    .update(updates)
    .eq('id', id);

  if (updateError) {
    log.error('Update note failed', { err: updateError.message, id });
    return NextResponse.json(
      {
        error: 'persist_failed',
        message:
          'El apunte se generó pero no pudimos guardarlo. Refrescá y probá de nuevo.',
      },
      { status: 500 },
    );
  }

  // Cleanup del audio TTS viejo (no bloqueante)
  if (note.audio_tts_url) {
    const admin = createSupabaseAdminClient();
    const audioPath = `${user.id}/${id}.mp3`;
    const { error: removeError } = await admin.storage
      .from('tts-output')
      .remove([audioPath]);
    if (removeError) {
      log.warn('Old TTS audio remove failed (non-blocking)', {
        err: removeError.message,
      });
    }
  }

  log.info('Note regenerated', {
    userId: user.id,
    noteId: id,
    edited: !!edited_transcript,
    cache_hit: result.cache_hit,
    cost_usd: result.cost_usd.toFixed(4),
  });

  return NextResponse.json({
    success: true,
    note: newNote,
    meta: {
      cache_hit: result.cache_hit,
      cost_usd: result.cost_usd,
    },
  });
}
