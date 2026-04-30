import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createLogger } from '@/lib/logger';

export const runtime = 'nodejs';

const log = createLogger('api/folders/[id]');

const VALID_COLORS = [
  'violet',
  'pink',
  'cyan',
  'amber',
  'green',
  'rose',
  'indigo',
  'sky',
] as const;

const UpdateFolderSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  color: z.enum(VALID_COLORS).optional(),
  emoji: z.string().max(8).nullable().optional(),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/folders/[id]
 * Body: { name?, color?, emoji? }
 *
 * Actualiza una carpeta. RLS garantiza que solo el dueño pueda.
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

  const validated = UpdateFolderSchema.safeParse(body);
  if (!validated.success) {
    return NextResponse.json(
      {
        error: 'invalid_body',
        issues: validated.error.issues,
      },
      { status: 400 },
    );
  }

  const updates = { ...validated.data };
  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: 'no_changes', message: 'No mandaste cambios.' },
      { status: 400 },
    );
  }

  if (updates.name) {
    updates.name = updates.name.trim();
  }

  const { data: folder, error: updateError } = await supabase
    .from('folders')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();

  if (updateError) {
    if (updateError.code === '23505') {
      return NextResponse.json(
        {
          error: 'duplicate_name',
          message: 'Ya tenés otra carpeta con ese nombre.',
        },
        { status: 409 },
      );
    }
    log.error('Update folder failed', { err: updateError.message, id });
    return NextResponse.json(
      { error: 'update_failed', message: 'No se pudo actualizar.' },
      { status: 500 },
    );
  }

  if (!folder) {
    return NextResponse.json(
      { error: 'not_found', message: 'Carpeta no encontrada.' },
      { status: 404 },
    );
  }

  log.info('Folder updated', { userId: user.id, folderId: id });

  return NextResponse.json({ folder });
}

/**
 * DELETE /api/folders/[id]
 *
 * Borra una carpeta. ON DELETE SET NULL en notes.folder_id → las notas
 * de esa carpeta vuelven a Inbox automáticamente (no se borran).
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

  const { error: deleteError } = await supabase
    .from('folders')
    .delete()
    .eq('id', id);

  if (deleteError) {
    log.error('Delete folder failed', { err: deleteError.message, id });
    return NextResponse.json(
      { error: 'delete_failed', message: 'No se pudo borrar la carpeta.' },
      { status: 500 },
    );
  }

  log.info('Folder deleted (notes moved to Inbox)', {
    userId: user.id,
    folderId: id,
  });

  return NextResponse.json({ success: true });
}
