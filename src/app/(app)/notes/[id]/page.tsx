import { notFound } from 'next/navigation';
import Link from 'next/link';
import { requireAuth } from '@/lib/auth/require-auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { orbGradient, shadows } from '@/lib/design-tokens';
import type { CheroNote, CheroMode } from '@/lib/types/chero';
import { MermaidChart } from './mermaid-chart';
import { NoteActions } from './note-actions';
import { FolderPicker } from './folder-picker';
import { AudioPlayer } from '@/components/ui/audio-player';
import { FlashcardsDeck } from './flashcards-deck';
import { QuizQuestions } from './quiz-questions';

interface NotePageProps {
  params: Promise<{ id: string }>;
}

const MODE_LABEL: Record<CheroMode, string> = {
  avanzo: 'AVANZO',
  periodo: 'Período',
  parciales: 'Parciales',
  repaso: 'Repaso',
};

const MODE_EMOJI: Record<CheroMode, string> = {
  avanzo: '🎯',
  periodo: '📅',
  parciales: '📚',
  repaso: '🧠',
};

interface DbNote extends CheroNote {
  id: string;
  mode: CheroMode;
  subject: string;
  institution: string | null;
  detected_confidence: number | null;
  audio_tts_url: string | null;
  audio_duration_minutes: number | null;
  transcript: string | null;
  folder_id: string | null;
  created_at: string;
}

export async function generateMetadata({ params }: NotePageProps) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('notes')
    .select('subject, mode')
    .eq('id', id)
    .maybeSingle();
  return {
    title: data ? `${data.subject} · Chero` : 'Apunte · Chero',
  };
}

export default async function NotePage({ params }: NotePageProps) {
  const { id } = await params;
  await requireAuth(`/notes/${id}`);
  const supabase = await createSupabaseServerClient();

  // RLS asegura que solo carguemos apuntes del usuario actual
  const { data: note, error } = await supabase
    .from('notes')
    .select('*')
    .eq('id', id)
    .maybeSingle<DbNote>();

  if (error || !note) {
    notFound();
  }

  return (
    <>
      {/* v5 bg cover */}
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

      <main className="relative mx-auto w-full max-w-[440px] px-5 py-8 md:max-w-3xl md:px-8 md:py-10 lg:max-w-4xl">
        {/* Header */}
        <header className="mb-8 flex flex-wrap items-center justify-between gap-3 md:mb-10">
          <Link
            href="/library"
            className="inline-flex items-center gap-2 text-sm text-white/70 transition-colors hover:text-white"
          >
            ← Mis apuntes
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <FolderPicker
              noteId={note.id}
              currentFolderId={note.folder_id}
            />
            <NoteActions noteId={note.id} transcript={note.transcript} />
          </div>
        </header>

        {/* Title block */}
        <div className="mb-10 md:mb-12">
          <div className="mb-4 flex flex-wrap items-center gap-3 text-xs uppercase tracking-wider text-white/55">
            <span className="bg-gradient-primary shadow-button-premium rounded-full px-3 py-1 font-semibold text-white">
              {MODE_EMOJI[note.mode]} {MODE_LABEL[note.mode]}
            </span>
            <span aria-hidden>·</span>
            <span>{note.subject}</span>
            {note.institution && (
              <>
                <span aria-hidden>·</span>
                <span>{note.institution}</span>
              </>
            )}
          </div>
          <h1 className="font-display-pf text-4xl font-semibold leading-tight tracking-tight text-white md:text-5xl lg:text-6xl">
            {note.subject}
          </h1>
          <p className="mt-3 text-sm text-white/55">
            Apunte · Generado el {formatDate(note.created_at)}
            {note.audio_duration_minutes
              ? ` · ${note.audio_duration_minutes.toFixed(1)} min de audio`
              : ''}
          </p>
        </div>

        {/* Audio TTS */}
        {note.audio_tts_url && (
          <section className="mb-10">
            <div className="glass mb-3 flex items-center gap-3 rounded-2xl p-4">
              <div
                className="orb-pulse h-8 w-8 shrink-0 rounded-full"
                style={{ background: orbGradient, boxShadow: shadows.glowOrb }}
              />
              <div className="flex-1">
                <div className="text-sm font-semibold text-white">
                  Escuchá el apunte
                </div>
                <div className="text-xs text-white/65">
                  Resumen + conceptos + repaso · voz natural · arrastrá para
                  buscar
                </div>
              </div>
            </div>
            <AudioPlayer
              src={note.audio_tts_url}
              downloadName={`chero-${note.subject.toLowerCase().replace(/\s+/g, '-')}`}
            />
          </section>
        )}

        {/* Resumen ejecutivo */}
        <Section title="🎯 Resumen ejecutivo">
          <article className="glass rounded-3xl p-5 sm:p-6">
            <div className="space-y-4 text-base leading-relaxed text-white/90">
              {splitParagraphs(note.summary).map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </article>
        </Section>

        {/* Conceptos */}
        <Section title="📚 Conceptos clave">
          <div className="space-y-4">
            {note.concepts.map((c, i) => (
              <article
                key={i}
                className="glass rounded-3xl p-5 sm:p-6"
              >
                <h3 className="font-display-pf mb-2 text-xl font-semibold text-white">
                  {c.name}
                </h3>
                <p className="text-sm leading-relaxed text-white/85">
                  {c.definition}
                </p>
                {c.example && (
                  <p className="mt-3 rounded-2xl border-l-2 border-primary-glow bg-primary/10 px-4 py-3 text-sm italic text-white/85">
                    <span className="not-italic font-semibold text-primary-glow">
                      Ejemplo:
                    </span>{' '}
                    {c.example}
                  </p>
                )}
              </article>
            ))}
          </div>
        </Section>

        {/* Preguntas tipo examen — interactivo Quizlet-style */}
        <Section title="❓ Preguntas tipo examen">
          <QuizQuestions questions={note.questions} />
        </Section>

        {/* Flashcards — deck Quizlet flip */}
        <Section title="🧠 Flashcards">
          <FlashcardsDeck cards={note.flashcards} />
        </Section>

        {/* Repaso 30s */}
        <Section title="📝 Repaso de 30 segundos">
          <article className="glass-strong relative overflow-hidden rounded-3xl p-6">
            <span
              aria-hidden
              className="pointer-events-none absolute -right-10 -top-16 h-40 w-40 rounded-full opacity-40 blur-3xl"
              style={{ background: 'hsl(295 90% 55% / 0.6)' }}
            />
            <div className="relative space-y-3 text-base leading-relaxed text-white/90">
              {splitParagraphs(note.quick_review).map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </article>
        </Section>

        {/* Mermaid chart */}
        {note.mermaid_chart && (
          <Section title="🗺️ Mapa mental">
            <div className="glass rounded-3xl p-4 sm:p-6">
              <MermaidChart source={note.mermaid_chart} />
            </div>
          </Section>
        )}

        {/* Footer */}
        <footer className="mt-12 border-t border-white/10 pt-6 text-center text-xs text-white/40 md:mt-16 md:pt-8">
          Generado por Chero · IA con voseo salvadoreño
        </footer>
      </main>
    </>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10 md:mb-12">
      <h2 className="font-display-pf mb-5 text-2xl font-semibold tracking-tight text-white md:text-3xl">
        {title}
      </h2>
      {children}
    </section>
  );
}

function splitParagraphs(text: string): string[] {
  return text
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('es-SV', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
