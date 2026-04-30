import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createLogger } from '@/lib/logger';
import { NotePdf } from '@/lib/pdf/note-pdf';
import type { CheroMode, CheroNote } from '@/lib/types/chero';

export const runtime = 'nodejs';
// Generar el PDF puede tardar 2-5s para apuntes grandes (50+ flashcards).
// Default Vercel Hobby es 10s; subimos a 30s por seguridad.
export const maxDuration = 30;

const log = createLogger('api/notes/[id]/pdf');

interface RouteContext {
  params: Promise<{ id: string }>;
}

interface DbNote extends CheroNote {
  id: string;
  mode: CheroMode;
  subject: string;
  institution: string | null;
  audio_duration_minutes: number | null;
  created_at: string;
}

/**
 * Convierte el subject en filename URL-safe.
 * "Ciencias Naturales" -> "ciencias-naturales"
 * "Cálculo I" -> "calculo-i"
 */
function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .normalize('NFD')
      // Quita marcas combinantes Unicode (acentos): á -> a, ñ -> n
      .replace(/\p{Diacritic}/gu, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'apunte'
  );
}

/**
 * GET /api/notes/[id]/pdf
 *
 * Genera y descarga el PDF del apunte. RLS de Supabase garantiza que solo
 * podés descargar tus propios apuntes — un user que prueba con UUID de otro
 * recibe 404.
 *
 * Headers:
 *   Content-Type: application/pdf
 *   Content-Disposition: attachment; filename="chero-<subject>.pdf"
 *   Cache-Control: no-store (el apunte puede regenerarse, no cachear)
 */
export async function GET(_req: NextRequest, ctx: RouteContext) {
  const { id } = await ctx.params;
  const startedAt = Date.now();

  // Auth
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  // Cargar apunte (RLS valida ownership)
  const { data: note, error: noteError } = await supabase
    .from('notes')
    .select(
      'id, mode, subject, institution, audio_duration_minutes, created_at, summary, concepts, questions, flashcards, quick_review, mermaid_chart',
    )
    .eq('id', id)
    .maybeSingle<DbNote>();

  if (noteError) {
    log.error('Failed to load note for PDF', { err: noteError.message, id });
    return NextResponse.json({ error: 'load_failed' }, { status: 500 });
  }
  if (!note) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  // Generar PDF
  let buffer: Buffer;
  try {
    buffer = await renderToBuffer(
      <NotePdf
        subject={note.subject}
        mode={note.mode}
        institution={note.institution}
        createdAt={note.created_at}
        audioDurationMinutes={note.audio_duration_minutes}
        note={{
          summary: note.summary,
          concepts: note.concepts,
          questions: note.questions,
          flashcards: note.flashcards,
          quick_review: note.quick_review,
          mermaid_chart: note.mermaid_chart,
        }}
      />,
    );
  } catch (err) {
    log.error('PDF render failed', {
      err: err instanceof Error ? err.message : String(err),
      noteId: id,
    });
    return NextResponse.json(
      {
        error: 'render_failed',
        message: 'No se pudo generar el PDF. Intentá de nuevo.',
      },
      { status: 500 },
    );
  }

  const durationMs = Date.now() - startedAt;
  log.info('PDF rendered', {
    userId: user.id,
    noteId: id,
    bytes: buffer.length,
    durationMs,
  });

  const filename = `chero-${slugify(note.subject)}.pdf`;

  // Convertimos Buffer a Uint8Array para satisfacer el tipo BodyInit del
  // Response constructor (Buffer extiende Uint8Array pero TS strict no lo ve).
  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(buffer.length),
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}
