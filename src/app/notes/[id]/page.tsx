import { notFound } from 'next/navigation';
import Link from 'next/link';
import { requireAuth } from '@/lib/auth/require-auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { buttonVariants } from '@/components/ui/button';
import { ambientGlow, orbGradient, shadows } from '@/lib/design-tokens';
import type { CheroNote, CheroMode } from '@/lib/types/chero';

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
    <div className="relative min-h-screen overflow-hidden bg-[#0a0a14] text-white">
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: ambientGlow }}
      />

      <main className="relative z-10 mx-auto max-w-3xl px-6 py-10">
        {/* Header */}
        <header className="mb-10 flex items-center justify-between gap-4">
          <Link
            href="/library"
            className="inline-flex items-center gap-2 text-sm text-white/60 transition-colors hover:text-white"
          >
            ← Mis apuntes
          </Link>
          <Link
            href="/capture"
            className={buttonVariants({ size: 'sm', variant: 'ghost', className: 'text-white/70 hover:bg-white/5 hover:text-white' })}
          >
            + Nuevo apunte
          </Link>
        </header>

        {/* Title block */}
        <div className="mb-12">
          <div className="mb-4 flex items-center gap-3 text-xs uppercase tracking-wider text-white/50">
            <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-primary">
              {MODE_EMOJI[note.mode]} {MODE_LABEL[note.mode]}
            </span>
            <span>·</span>
            <span>{note.subject}</span>
            {note.institution && (
              <>
                <span>·</span>
                <span>{note.institution}</span>
              </>
            )}
          </div>
          <h1 className="text-4xl font-black leading-tight tracking-tight md:text-5xl">
            Apunte
          </h1>
          <p className="mt-3 text-sm text-white/40">
            Generado el {formatDate(note.created_at)}
            {note.audio_duration_minutes ? ` · ${note.audio_duration_minutes.toFixed(1)} min de audio` : ''}
          </p>
        </div>

        {/* Audio TTS — sticky pill arriba */}
        {note.audio_tts_url && (
          <section className="mb-10 rounded-2xl border border-primary/20 bg-primary/5 p-5">
            <div className="mb-3 flex items-center gap-3">
              <div
                className="orb-pulse h-6 w-6 rounded-full"
                style={{ background: orbGradient, boxShadow: shadows.glowOrb }}
              />
              <div className="flex-1">
                <div className="text-sm font-semibold">Escuchá el apunte</div>
                <div className="text-xs text-white/40">
                  Resumen + conceptos + repaso · voz natural
                </div>
              </div>
            </div>
            <audio controls src={note.audio_tts_url} className="w-full" />
          </section>
        )}

        {/* Resumen ejecutivo */}
        <Section title="🎯 Resumen ejecutivo">
          <div className="space-y-4 text-base leading-relaxed text-white/80">
            {splitParagraphs(note.summary).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </Section>

        {/* Conceptos */}
        <Section title="📚 Conceptos clave">
          <div className="space-y-5">
            {note.concepts.map((c, i) => (
              <div
                key={i}
                className="rounded-xl border border-white/10 bg-white/[0.03] p-5"
              >
                <h3 className="mb-2 text-lg font-bold text-white">{c.name}</h3>
                <p className="text-sm leading-relaxed text-white/75">{c.definition}</p>
                {c.example && (
                  <p className="mt-3 rounded-lg border-l-2 border-primary/40 bg-primary/5 px-4 py-2 text-sm italic text-white/70">
                    <span className="not-italic font-semibold text-primary">Ejemplo:</span>{' '}
                    {c.example}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Section>

        {/* Preguntas */}
        <Section title="❓ Preguntas tipo examen">
          <div className="space-y-6">
            {note.questions.map((q, i) => (
              <details
                key={i}
                className="group rounded-xl border border-white/10 bg-white/[0.03] p-5 transition-colors hover:border-white/20"
              >
                <summary className="cursor-pointer list-none">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary">
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      <p className="text-base font-medium text-white/90">{q.prompt}</p>
                      {q.options && (
                        <ul className="mt-3 space-y-1.5 text-sm text-white/70">
                          {q.options.map((opt, j) => (
                            <li key={j}>{opt}</li>
                          ))}
                        </ul>
                      )}
                      <span className="mt-3 inline-block text-xs text-primary group-open:hidden">
                        ▼ Ver respuesta
                      </span>
                    </div>
                  </div>
                </summary>
                <div className="mt-4 ml-10 space-y-2 border-t border-white/10 pt-4">
                  {q.correct && (
                    <div className="text-sm">
                      <span className="font-semibold text-green-400">
                        ✓ Respuesta correcta:
                      </span>{' '}
                      <span className="text-white">{q.correct}</span>
                    </div>
                  )}
                  <div className="text-sm text-white/70">
                    <span className="font-semibold text-white/90">Justificación:</span>{' '}
                    {q.justification}
                  </div>
                </div>
              </details>
            ))}
          </div>
        </Section>

        {/* Flashcards */}
        <Section title="🧠 Flashcards">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {note.flashcards.map((f, i) => (
              <details
                key={i}
                className="group rounded-xl border border-white/10 bg-white/[0.03] p-4 transition-all hover:border-white/20"
              >
                <summary className="cursor-pointer list-none">
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 text-xs font-bold text-primary">
                      {i + 1}.
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium italic text-white/90">{f.front}</p>
                      <span className="mt-2 inline-block text-xs text-white/40 group-open:hidden">
                        Tap para ver respuesta →
                      </span>
                    </div>
                  </div>
                </summary>
                <div className="mt-3 ml-5 border-t border-white/10 pt-3 text-sm text-white/80">
                  → {f.back}
                </div>
              </details>
            ))}
          </div>
        </Section>

        {/* Repaso 30s */}
        <Section title="📝 Repaso de 30 segundos">
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-6">
            <div className="space-y-3 text-base leading-relaxed text-white/85">
              {splitParagraphs(note.quick_review).map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </div>
        </Section>

        {/* Mermaid chart (como bloque por ahora, render visual en Día 6 con mermaid.js) */}
        {note.mermaid_chart && (
          <Section title="🗺️ Mapa mental">
            <div className="rounded-xl border border-white/10 bg-[#070710] p-5">
              <pre className="overflow-x-auto whitespace-pre-wrap text-xs font-mono text-white/70">
                {note.mermaid_chart}
              </pre>
              <p className="mt-3 text-xs text-white/40">
                💡 El render visual del mapa mental llega en la próxima versión.
              </p>
            </div>
          </Section>
        )}

        {/* Footer */}
        <footer className="mt-16 border-t border-white/10 pt-8 text-center text-xs text-white/30">
          Generado por Chero · IA con voseo salvadoreño
        </footer>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-12">
      <h2 className="mb-5 text-2xl font-bold tracking-tight">{title}</h2>
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
