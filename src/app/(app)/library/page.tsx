import Link from 'next/link';
import { requireAuth } from '@/lib/auth/require-auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { buttonVariants } from '@/components/ui/button';
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
    <>
      {/* v5 bg cover — sobrescribe el bg-[#0a0a14] del (app)/layout.
          fixed inset-0 cubre el área de contenido. El BottomTabBar (z-40)
          queda visible por encima de los blobs. */}
      <div
        aria-hidden
        className="bg-gradient-hero pointer-events-none fixed inset-0"
      />
      <div
        aria-hidden
        className="animate-blob pointer-events-none fixed -right-32 -top-40 h-[520px] w-[520px] rounded-full opacity-70 blur-3xl"
        style={{
          background:
            'radial-gradient(circle, hsl(295 90% 55% / 0.7), transparent 70%)',
        }}
      />
      <div
        aria-hidden
        className="animate-blob pointer-events-none fixed right-1/4 top-1/3 h-[420px] w-[420px] rounded-full opacity-60 blur-3xl"
        style={{
          animationDelay: '-6s',
          background:
            'radial-gradient(circle, hsl(18 100% 56% / 0.65), transparent 70%)',
        }}
      />
      <div
        aria-hidden
        className="animate-blob pointer-events-none fixed -bottom-40 -left-20 h-[480px] w-[480px] rounded-full opacity-60 blur-3xl"
        style={{
          animationDelay: '-12s',
          background:
            'radial-gradient(circle, hsl(270 90% 60% / 0.6), transparent 70%)',
        }}
      />

      <main className="relative mx-auto max-w-[440px] px-5 py-10 md:max-w-3xl md:px-8 md:py-14 lg:max-w-4xl">
        <header className="mb-8 flex items-center justify-between md:mb-10">
          <div className="flex items-center gap-3">
            <div
              className="orb-pulse h-9 w-9 rounded-full"
              style={{ background: orbGradient, boxShadow: shadows.glowOrb }}
            />
            <div>
              <div className="text-base font-bold text-white">El Chero</div>
              <div className="text-xs text-white/55">
                {list.length} apunte{list.length === 1 ? '' : 's'}
              </div>
            </div>
          </div>
          <Link
            href="/capture"
            className={buttonVariants({
              variant: 'premium',
              size: 'sm',
            })}
          >
            + Nuevo apunte
          </Link>
        </header>

        <h1 className="font-display-pf mb-2 text-4xl font-semibold tracking-tight text-white md:text-5xl lg:text-6xl">
          Tus apuntes
        </h1>
        <p className="mb-8 text-sm text-white/75 md:mb-10 md:text-base">
          Organizados por carpetas. Tap largo en una carpeta para editarla o
          borrarla.
        </p>

        <LibraryClient initialNotes={list} />
      </main>
    </>
  );
}

function firstSentence(text: string): string {
  const trimmed = text.trim();
  const match = trimmed.match(/^[^.!?]+[.!?]/);
  return match ? match[0] : trimmed.slice(0, 200);
}
