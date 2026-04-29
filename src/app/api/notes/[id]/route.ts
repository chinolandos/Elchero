import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase/server';
import { createLogger } from '@/lib/logger';

export const runtime = 'nodejs';

const log = createLogger('api/notes/[id]');

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/notes/[id]
 *
 * Devuelve el apunte completo. RLS garantiza que solo lo veas si es tuyo.
 * (Por ahora solo lo usamos para regenerate; la página /notes/[id] carga
 *  directamente vía SSR con createSupabaseServerClient.)
 */
export async function GET(_req: NextRequest, ctx: RouteContext) {
  const { id } = await ctx.params;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: 'unauthorized' },
      { status: 401 },
    );
  }

  const { data: note, error: noteError } = await supabase
    .from('notes')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (noteError) {
    log.error('Failed to load note', { err: noteError.message, id });
    return NextResponse.json({ error: 'load_failed' }, { status: 500 });
  }
  if (!note) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  return NextResponse.json({ note });
}

/**
 * DELETE /api/notes/[id]
 *
 * Elimina un apunte y, si tenía audio TTS, también el archivo del bucket
 * `tts-output`. RLS en `notes` ya garantiza que solo el dueño puede borrar.
 *
 * El uso del counter NO se devuelve — el user ya consumió el procesamiento.
 * Borrar el apunte es una acción cosmética (privacidad / limpieza).
 */
export async function DELETE(_req: NextRequest, ctx: RouteContext) {
  const { id } = await ctx.params;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  // Cargar nota para saber si tiene audio_tts_url y poder limpiarlo
  const { data: note, error: loadError } = await supabase
    .from('notes')
    .select('id, audio_tts_url')
    .eq('id', id)
    .maybeSingle();

  if (loadError) {
    log.error('Load note failed', { err: loadError.message, id });
    return NextResponse.json({ error: 'load_failed' }, { status: 500 });
  }
  if (!note) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  // Borrar la nota (RLS bloquea si no es del user)
  const { error: deleteError } = await supabase
    .from('notes')
    .delete()
    .eq('id', id);

  if (deleteError) {
    log.error('Delete failed', { err: deleteError.message, id });
    return NextResponse.json(
      {
        error: 'delete_failed',
        message: 'No se pudo eliminar el apunte. Intentá de nuevo.',
      },
      { status: 500 },
    );
  }

  // Cleanup del audio TTS en Storage (no bloqueante).
  // Path en bucket público: `${user.id}/${note_id}.mp3`
  if (note.audio_tts_url) {
    const admin = createSupabaseAdminClient();
    const audioPath = `${user.id}/${id}.mp3`;
    const { error: removeError } = await admin.storage
      .from('tts-output')
      .remove([audioPath]);
    if (removeError) {
      log.warn('TTS audio remove failed (non-blocking)', {
        err: removeError.message,
        audioPath,
      });
    }
  }

  log.info('Note deleted', { userId: user.id, noteId: id });

  return NextResponse.json({ success: true });
}
