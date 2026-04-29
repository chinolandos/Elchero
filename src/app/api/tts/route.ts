import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  createSupabaseServerClient,
  createSupabaseAdminClient,
} from '@/lib/supabase/server';
import { generateTts, buildTtsText } from '@/lib/openai/tts';
import { createLogger } from '@/lib/logger';

export const maxDuration = 60;
export const runtime = 'nodejs';

const log = createLogger('api/tts');

const RequestBodySchema = z.object({
  note_id: z.string().uuid(),
  voice: z
    .enum(['nova', 'echo', 'alloy', 'onyx', 'shimmer', 'fable', 'coral', 'sage'])
    .optional(),
  include_concepts: z.boolean().optional(),
  include_examples: z.boolean().optional(),
});

/**
 * POST /api/tts
 *
 * Body JSON: { note_id, voice?, include_concepts?, include_examples? }
 *
 * Flow:
 * 1. Auth check
 * 2. Cargar el apunte (RLS valida que sea del user)
 * 3. Si ya tiene audio_tts_url, devolverlo (cache)
 * 4. Construir texto a sintetizar
 * 5. Llamar OpenAI TTS
 * 6. Subir MP3 a bucket público `tts-output`
 * 7. Update notes.audio_tts_url
 * 8. Devolver URL pública
 */
export async function POST(req: NextRequest) {
  const startedAt = Date.now();

  try {
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

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: 'invalid_json' },
        { status: 400 },
      );
    }

    const validated = RequestBodySchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: 'invalid_body', issues: validated.error.issues },
        { status: 400 },
      );
    }

    const { note_id, voice, include_concepts, include_examples } = validated.data;

    // Cargar apunte (RLS asegura que sea del user)
    const { data: note, error: noteError } = await supabase
      .from('notes')
      .select('id, summary, concepts, quick_review, audio_tts_url')
      .eq('id', note_id)
      .maybeSingle();

    if (noteError || !note) {
      return NextResponse.json(
        { error: 'note_not_found', message: 'No se encontró el apunte.' },
        { status: 404 },
      );
    }

    // Si ya tiene audio generado, devolverlo (cache permanente — es público)
    if (note.audio_tts_url) {
      log.info('TTS cache hit', { noteId: note_id });
      return NextResponse.json({
        success: true,
        url: note.audio_tts_url,
        cached: true,
      });
    }

    // Construir texto a sintetizar
    const text = buildTtsText({
      summary: note.summary,
      concepts: (note.concepts ?? []) as Array<{
        name: string;
        definition: string;
        example?: string;
      }>,
      quick_review: note.quick_review,
      include_concepts: include_concepts ?? true,
      include_examples: include_examples ?? false,
    });

    // Generar audio
    const tts = await generateTts({ text, voice });

    // Subir a Supabase Storage bucket público `tts-output`
    const admin = createSupabaseAdminClient();
    const audioPath = `${user.id}/${note_id}.mp3`;
    const { error: uploadError } = await admin.storage
      .from('tts-output')
      .upload(audioPath, tts.audio, {
        contentType: 'audio/mpeg',
        upsert: true,
      });

    if (uploadError) {
      log.error('Upload TTS failed', { err: uploadError.message });
      return NextResponse.json(
        { error: 'upload_failed', message: 'No se pudo guardar el audio.' },
        { status: 500 },
      );
    }

    // URL pública
    const { data: publicUrlData } = admin.storage
      .from('tts-output')
      .getPublicUrl(audioPath);
    const publicUrl = publicUrlData.publicUrl;

    // Update note con la URL
    const { error: updateError } = await supabase
      .from('notes')
      .update({ audio_tts_url: publicUrl })
      .eq('id', note_id);

    if (updateError) {
      log.warn('Update note audio_tts_url failed', { err: updateError.message });
      // No bloqueante — el audio existe, podemos devolver la URL igual
    }

    const elapsedMs = Date.now() - startedAt;
    log.info('TTS generated', {
      userId: user.id,
      noteId: note_id,
      chars: tts.charsUsed,
      cost_usd: tts.costUsd.toFixed(4),
      duration_est: tts.durationEstimateSeconds.toFixed(1),
      elapsed_ms: elapsedMs,
    });

    return NextResponse.json({
      success: true,
      url: publicUrl,
      cached: false,
      meta: {
        chars_used: tts.charsUsed,
        duration_est_seconds: tts.durationEstimateSeconds,
        cost_usd: tts.costUsd,
        elapsed_ms: elapsedMs,
      },
    });
  } catch (err) {
    log.error('Unexpected error', {
      err: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: 'internal_error', message: 'Algo salió mal.' },
      { status: 500 },
    );
  }
}
