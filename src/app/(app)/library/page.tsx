import Link from 'next/link';
import { requireAuth } from '@/lib/auth/require-auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { PremiumButton } from '@/components/ui/premium-button';
import { orbGradient, shadows } from '@/lib/design-tokens';
import type { CheroMode } from '@/lib/types/chero';
import { LibraryClient, type NoteRow } from './library-client';

export const metadata = {
  title: 'Mis apuntes · Chero',
  description: 'Todos tus apuntes generados con Chero, organizados por carpetas.',
};

export default async function LibraryPage() {
  const user = await requireAuth('/library');
  const supabase = await createSupabaseServerClient();

  type RawNote = {
    id: string;
    mode: CheroMode;
    subject: string;
    institution: string | null;
    summary: string;
    created_at: string;
    audio_duration_minutes: number | null;
    audio_tts_url: string | null;
    folder_id: string | null;
    questions: unknown[] | null;
    flashcards: unknown[] | null;
  };

  const { data: rawNotes } = await supabase
    .from('notes')
    .select(
      'id, mode, subject, institution, summary, created_at, audio_duration_minutes, audio_tts_url, folder_id, questions, flashcards',
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100)
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
    folder_id: n.folder_id,
    questions_count: Array.isArray(n.questions) ? n.questions.length : 0,
    flashcards_count: Array.isArray(n.flashcards) ? n.flashcards.length : 0,
  }));

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <header className="mb-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="orb-pulse h-9 w-9 rounded-full"
            style={{ background: orbGradient, boxShadow: shadows.glowOrb }}
            aria-hidden
          />
          <div>
            <div className="text-base font-bold">El Chero</div>
            <div className="text-xs text-white/40">
              {list.length} apunte{list.length === 1 ? '' : 's'}
            </div>
          </div>
        </div>
        <PremiumButton variant="gradient" size="sm" asChild>
          <Link href="/capture">+ Nuevo</Link>
        </PremiumButton>
      </header>

      {/* Headline serif italic estilo VibeMove */}
      <h1 className="mb-2 text-4xl tracking-tight md:text-5xl">
        <span className="font-black">Tus </span>
        <span className="serif-italic">apuntes</span>
      </h1>
      <p className="mb-10 text-white/55">
        Organizados por carpetas. Tap largo en una carpeta para editarla o
        borrarla.
      </p>

      <LibraryClient initialNotes={list} />
    </main>
  );
}

function firstSentence(text: string): string {
  const trimmed = text.trim();
  const match = trimmed.match(/^[^.!?]+[.!?]/);
  return match ? match[0] : trimmed.slice(0, 200);
}
