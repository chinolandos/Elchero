import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createLogger } from '@/lib/logger';

export const runtime = 'nodejs';

const log = createLogger('api/folders');

// Colores válidos (alineados con paleta Aura). El frontend muestra estos
// como opciones; el backend valida.
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

const CreateFolderSchema = z.object({
  name: z.string().min(1).max(50),
  color: z.enum(VALID_COLORS).optional(),
  emoji: z.string().max(8).optional().nullable(),
});

interface FolderRow {
  id: string;
  user_id: string;
  name: string;
  color: string;
  emoji: string | null;
  created_at: string;
  updated_at: string;
}

interface FolderWithCount extends FolderRow {
  note_count: number;
}

/**
 * GET /api/folders
 *
 * Lista las carpetas del user con conteo de notas en cada una.
 * Incluye un "pseudo-folder" especial Inbox (folder_id = null) con su count.
 */
export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  // Carpetas del user
  const { data: folders, error: foldersError } = await supabase
    .from('folders')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .returns<FolderRow[]>();

  if (foldersError) {
    log.error('Failed to load folders', { err: foldersError.message });
    return NextResponse.json({ error: 'load_failed' }, { status: 500 });
  }

  // Conteo de notas por carpeta (incluye Inbox = folder_id null)
  // Hacemos 2 queries paralelas: notas con folder + notas sin folder
  const [{ data: notesWithFolder }, { count: inboxCount }] = await Promise.all([
    supabase
      .from('notes')
      .select('folder_id')
      .eq('user_id', user.id)
      .not('folder_id', 'is', null),
    supabase
      .from('notes')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .is('folder_id', null),
  ]);

  // Conteo por folder_id en JS (Postgres tiene aggregation pero esto es 1 query menos)
  const countByFolder = new Map<string, number>();
  for (const n of notesWithFolder ?? []) {
    if (n.folder_id) {
      countByFolder.set(n.folder_id, (countByFolder.get(n.folder_id) ?? 0) + 1);
    }
  }

  const foldersWithCount: FolderWithCount[] = (folders ?? []).map((f) => ({
    ...f,
    note_count: countByFolder.get(f.id) ?? 0,
  }));

  return NextResponse.json({
    folders: foldersWithCount,
    inbox: {
      count: inboxCount ?? 0,
    },
  });
}

/**
 * POST /api/folders
 * Body: { name, color?, emoji? }
 *
 * Crea una carpeta nueva. El UNIQUE INDEX (user_id, lower(name)) previene
 * duplicados case-insensitive.
 */
export async function POST(req: NextRequest) {
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

  const validated = CreateFolderSchema.safeParse(body);
  if (!validated.success) {
    return NextResponse.json(
      {
        error: 'invalid_body',
        message: validated.error.issues
          .map((i) => `${i.path.join('.')}: ${i.message}`)
          .join('; '),
      },
      { status: 400 },
    );
  }

  const { name, color, emoji } = validated.data;

  const { data: folder, error: insertError } = await supabase
    .from('folders')
    .insert({
      user_id: user.id,
      name: name.trim(),
      color: color ?? 'violet',
      emoji: emoji ?? null,
    })
    .select('*')
    .single<FolderRow>();

  if (insertError) {
    // Postgres unique violation = ya existe una carpeta con ese nombre
    if (insertError.code === '23505') {
      return NextResponse.json(
        {
          error: 'duplicate_name',
          message: `Ya tenés una carpeta llamada "${name}". Usá otro nombre.`,
        },
        { status: 409 },
      );
    }
    log.error('Insert folder failed', { err: insertError.message });
    return NextResponse.json(
      { error: 'insert_failed', message: 'No se pudo crear la carpeta.' },
      { status: 500 },
    );
  }

  log.info('Folder created', {
    userId: user.id,
    folderId: folder.id,
    name: folder.name,
  });

  return NextResponse.json({ folder });
}
