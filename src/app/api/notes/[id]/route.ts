import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase/server';
import { createLogger } from '@/lib/logger';

export const runtime = 'nodejs';

const log = createLogger('api/notes/[id]');

interface RouteContext {
  params: Promise<{ id: string }>;
}

// Schema para PATCH — por ahora solo soporta mover a carpeta (folder_id).
// Si en futuro queremos editar otros campos del apunte (ej: subject), agregar acá.
const PatchNoteSchema = z.object({
  // null = mover a Inbox; string UUID = mover a esa carpeta
  folder_id: z.string().uuid().nullable(),
});

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
 * PATCH /api/notes/[id]
 * Body: { folder_id: string | null }
 *
 * Mueve el apunte a otra carpeta (o a Inbox si folder_id=null).
 * RLS garantiza que solo el dueño puede mover sus notas.
 *
 * Si la carpeta destino no existe o no es del user, Supabase devuelve error
 * de FK constraint (carpeta no existe) o RLS deny (no es del user).
 */
export async function PATCH(req: NextRequest, ctx: RouteContext) {
  const { id } = await ctx.params;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const validated = PatchNoteSchema.safeParse(body);
  if (!validated.success) {
    return NextResponse.json(
      { error: 'invalid_body', issues: validated.error.issues },
      { status: 400 },
    );
  }

  const { folder_id } = validated.data;

  // Si folder_id no es null, validar que la carpeta sea del user.
  // Aunque RLS lo enforce, validamos antes para devolver error claro.
  if (folder_id) {
    const { data: folder, error: folderError } = await supabase
      .from('folders')
      .select('id')
      .eq('id', folder_id)
      .maybeSingle();

    if (folderError || !folder) {
      return NextResponse.json(
        {
          error: 'folder_not_found',
          message: 'La carpeta destino no existe o no es tuya.',
        },
        { status: 404 },
      );
    }
  }

  const { error: updateError } = await supabase
    .from('notes')
    .update({ folder_id })
    .eq('id', id);

  if (updateError) {
    log.error('Move note to folder failed', {
      err: updateError.message,
      noteId: id,
      folderId: folder_id,
    });
    return NextResponse.json(
      { error: 'update_failed', message: 'No se pudo mover el apunte.' },
      { status: 500 },
    );
  }

  log.info('Note moved', {
    userId: user.id,
    noteId: id,
    folder_id: folder_id ?? 'inbox',
  });

  return NextResponse.json({ success: true });
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
