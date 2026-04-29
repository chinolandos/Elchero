import Link from 'next/link';
import { requireAuth } from '@/lib/auth/require-auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { buttonVariants } from '@/components/ui/button';
import { ambientGlow, orbGradient, shadows } from '@/lib/design-tokens';
import type { CheroMode } from '@/lib/types/chero';

export const metadata = {
  title: 'Mis apuntes · Chero',
  description: 'Todos tus apuntes generados con Chero.',
};

interface NoteRow {
  id: string;
  mode: CheroMode;
  subject: string;
  institution: string | null;
  /** Excerpt corto del resumen, no el texto completo (ahorra bandwidth). */
  summary_excerpt: string;
  created_at: string;
  audio_duration_minutes: number | null;
  audio_tts_url: string | null;
}

const MODE_EMOJI: Record<CheroMode, string> = {
  avanzo: '🎯',
  periodo: '📅',
  parciales: '📚',
  repaso: '🧠',
};

const MODE_LABEL: Record<CheroMode, string> = {
  avanzo: 'AVANZO',
  periodo: 'Período',
  parciales: 'Parciales',
  repaso: 'Repaso',
};

export default async function LibraryPage() {
  const user = await requireAuth('/library');
  const supabase = await createSupabaseServerClient();

  // Pedimos summary completo y lo cortamos en cliente. SELECT con SUBSTRING en
  // Postgres requeriría una computed column o RPC; para 50 usos esto es OK.
  // Cuando escalemos: agregar columna `summary_excerpt` generada por trigger.
  type RawNote = Omit<NoteRow, 'summary_excerpt'> & { summary: string };
  const { data: rawNotes } = await supabase
    .from('notes')
    .select(
      'id, mode, subject, institution, summary, created_at, audio_duration_minutes, audio_tts_url',
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)
    .returns<RawNote[]>();

  const list: NoteRow[] = (rawNotes ?? []).map((n) => ({
    id: n.id,
    mode: n.mode,
    subject: n.subject,
    institution: n.institution,
    summary_excerpt: firstSentence(n.summary ?? ''),
    created_at: n.created_at,
    audio_duration_minutes: n.audio_duration_minutes,
    audio_tts_url: n.audio_tts_url,
  }));

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0a14] text-white">
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: ambientGlow }}
      />

      <main className="relative z-10 mx-auto max-w-3xl px-6 py-10">
        {/* Header */}
        <header className="mb-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="orb-pulse h-9 w-9 rounded-full"
              style={{ background: orbGradient, boxShadow: shadows.glowOrb }}
            />
            <div>
              <div className="text-base font-bold">El Chero</div>
              <div className="text-xs text-white/40">{list.length} apunte{list.length === 1 ? '' : 's'}</div>
            </div>
          </div>
          <Link href="/capture" className={buttonVariants({ size: 'sm' })}>
            + Nuevo apunte
          </Link>
        </header>

        <h1 className="mb-2 text-4xl font-black tracking-tight md:text-5xl">
          Tus apuntes
        </h1>
        <p className="mb-10 text-white/60">
          Acá viven todos los apuntes que generó Chero a partir de tus audios.
        </p>

        {list.length === 0 ? <EmptyState /> : <NoteList notes={list} />}
      </main>
    </div>
  );
}

function NoteList({ notes }: { notes: NoteRow[] }) {
  return (
    <div className="grid grid-cols-1 gap-4">
      {notes.map((note) => (
        <Link
          key={note.id}
          href={`/notes/${note.id}`}
          className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition-all hover:border-primary/40 hover:bg-primary/5"
        >
          <div className="mb-3 flex items-center gap-2 text-xs">
            <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-primary">
              {MODE_EMOJI[note.mode]} {MODE_LABEL[note.mode]}
            </span>
            <span className="text-white/40">·</span>
            <span className="text-white/60">{note.subject}</span>
            {note.institution && (
              <>
                <span className="text-white/40">·</span>
                <span className="text-white/60">{note.institution}</span>
              </>
            )}
            {note.audio_tts_url && (
              <>
                <span className="text-white/40">·</span>
                <span className="text-white/40">🎧</span>
              </>
            )}
          </div>

          <p className="line-clamp-2 text-sm leading-relaxed text-white/80 transition-colors group-hover:text-white">
            {note.summary_excerpt}
          </p>

          <div className="mt-3 flex items-center justify-between text-xs text-white/40">
            <span>{formatDate(note.created_at)}</span>
            <span className="text-primary opacity-0 transition-opacity group-hover:opacity-100">
              Ver apunte →
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center">
      <div
        className="orb-pulse mx-auto mb-6 h-16 w-16 rounded-full opacity-60"
        style={{ background: orbGradient, boxShadow: shadows.glowOrb }}
      />
      <h2 className="mb-2 text-xl font-bold">Todavía no tenés apuntes</h2>
      <p className="mb-6 text-sm text-white/60">
        Subí o grabá el audio de tu clase y Chero te genera el apunte completo.
      </p>
      <Link href="/capture" className={buttonVariants({ size: 'lg', className: 'px-8' })}>
        Crear mi primer apunte
      </Link>
    </div>
  );
}

function firstSentence(text: string): string {
  const trimmed = text.trim();
  const match = trimmed.match(/^[^.!?]+[.!?]/);
  return match ? match[0] : trimmed.slice(0, 200);
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('es-SV', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
