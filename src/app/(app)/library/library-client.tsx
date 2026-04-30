'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { orbGradient, shadows } from '@/lib/design-tokens';
import type { CheroMode } from '@/lib/types/chero';
import { FolderTabs } from './folder-tabs';

export interface NoteRow {
  id: string;
  mode: CheroMode;
  subject: string;
  institution: string | null;
  summary_excerpt: string;
  created_at: string;
  audio_duration_minutes: number | null;
  audio_tts_url: string | null;
  folder_id: string | null;
  questions_count: number;
  flashcards_count: number;
}

const MODE_LABEL: Record<CheroMode, string> = {
  avanzo: 'AVANZO',
  periodo: 'Período',
  parciales: 'Parciales',
  repaso: 'Repaso',
};

/**
 * 5 gradients procedural de la paleta Aura. Cada subject hashea a uno
 * consistente — "Matemática" siempre tendrá el mismo gradient.
 *
 * Cada gradient combina 2-3 colores del brand (violeta, magenta, cyan,
 * indigo, pink) para mantener cohesión visual.
 */
const SUBJECT_GRADIENTS: string[] = [
  // 0 — violeta profundo + magenta (default Aura)
  'linear-gradient(135deg, #6b21a8 0%, #9333ea 45%, #ec4899 100%)',
  // 1 — cyan + violeta (ciencias / tech)
  'linear-gradient(135deg, #1e1b4b 0%, #4f46e5 50%, #22d3ee 100%)',
  // 2 — pink + orange (literatura / arts)
  'linear-gradient(135deg, #831843 0%, #ec4899 50%, #f59e0b 100%)',
  // 3 — indigo profundo + violeta vibrante
  'linear-gradient(135deg, #312e81 0%, #6366f1 50%, #c084fc 100%)',
  // 4 — magenta + violeta + cyan (orbe-like)
  'linear-gradient(135deg, #ec4899 0%, #9333ea 50%, #22d3ee 100%)',
];

/**
 * Hash determinístico (DJB2 simplificado) que mapea un subject a un índice
 * de SUBJECT_GRADIENTS. La misma materia siempre rinde el mismo color —
 * ayuda al user a reconocer apuntes a vuelo de pájaro.
 */
function hashSubject(subject: string): number {
  let hash = 5381;
  for (let i = 0; i < subject.length; i++) {
    hash = (hash * 33) ^ subject.charCodeAt(i);
  }
  return Math.abs(hash) % SUBJECT_GRADIENTS.length;
}

export function LibraryClient({ initialNotes }: { initialNotes: NoteRow[] }) {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  // Filtrar notas según folder seleccionada (null = Inbox = notas sin folder)
  const filteredNotes = useMemo(() => {
    return initialNotes.filter((n) => n.folder_id === selectedFolderId);
  }, [initialNotes, selectedFolderId]);

  return (
    <>
      <FolderTabs
        selectedFolderId={selectedFolderId}
        onSelect={setSelectedFolderId}
      />

      {filteredNotes.length === 0 ? (
        <EmptyState isInbox={selectedFolderId === null} />
      ) : (
        <NoteGrid notes={filteredNotes} />
      )}
    </>
  );
}

/**
 * Grid de cards estilo "Daily memo" (ref Taskello card design).
 *
 * Layout:
 *   - Mobile: 1 columna
 *   - Tablet (sm 640px+): 2 columnas
 *   - Desktop (lg 1024px+): 3 columnas
 *
 * Cada card tiene:
 *   - Banda superior con gradient procedural por subject + mode badge top-right
 *   - Body: subject grande + resumen 2 líneas
 *   - Footer: número secuencial grande izq + counter "X preg · Y flash" der
 *   - Corner-radius asimétrico: top-left grande, resto medio
 */
function NoteGrid({ notes }: { notes: NoteRow[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {notes.map((note, index) => {
        const gradient = SUBJECT_GRADIENTS[hashSubject(note.subject)];
        const seq = String(index + 1).padStart(2, '0'); // "01", "02", ...
        return (
          <NoteCard
            key={note.id}
            note={note}
            gradient={gradient}
            seq={seq}
          />
        );
      })}
    </div>
  );
}

function NoteCard({
  note,
  gradient,
  seq,
}: {
  note: NoteRow;
  gradient: string;
  seq: string;
}) {
  return (
    <Link
      href={`/notes/${note.id}`}
      className="group relative flex flex-col overflow-hidden rounded-tl-3xl rounded-2xl border border-white/[0.06] bg-[#0e0e1a] transition-all hover:scale-[1.02] hover:border-primary/30 hover:shadow-[0_8px_32px_rgba(147,51,234,0.18)]"
    >
      {/* Banda superior con gradient procedural */}
      <div
        className="relative h-24 w-full"
        style={{ background: gradient }}
        aria-hidden
      >
        {/* Overlay grain sutil para profundidad */}
        <div
          className="absolute inset-0 opacity-30 mix-blend-overlay"
          style={{
            backgroundImage:
              'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4), transparent 60%)',
          }}
        />

        {/* Mode badge top-right */}
        <span className="absolute right-3 top-3 rounded-full bg-black/40 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-md">
          {MODE_LABEL[note.mode]}
        </span>

        {/* Audio indicator (si tiene TTS) */}
        {note.audio_tts_url && (
          <span
            className="absolute left-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-black/40 text-xs text-white backdrop-blur-md"
            aria-label="Tiene audio"
          >
            🎧
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-5">
        <h3 className="mb-2 line-clamp-1 text-lg font-bold tracking-tight text-white">
          {note.subject}
        </h3>
        <p className="line-clamp-2 flex-1 text-sm leading-relaxed text-white/55 transition-colors group-hover:text-white/75">
          {note.summary_excerpt || 'Sin resumen disponible'}
        </p>

        {/* Footer: número secuencial grande + counter */}
        <div className="mt-5 flex items-end justify-between border-t border-white/[0.05] pt-4">
          <div>
            <div className="text-3xl font-black tabular-nums leading-none text-white">
              {seq}
            </div>
            <div className="mt-1 text-[10px] uppercase tracking-wider text-white/35">
              {formatShortDate(note.created_at)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-white/65">
              <span className="font-semibold text-white/85">
                {note.questions_count}
              </span>{' '}
              preg
            </div>
            <div className="text-xs text-white/65">
              <span className="font-semibold text-white/85">
                {note.flashcards_count}
              </span>{' '}
              flash
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

function EmptyState({ isInbox }: { isInbox: boolean }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center">
      <div
        className="orb-pulse mx-auto mb-6 h-16 w-16 rounded-full opacity-60"
        style={{ background: orbGradient, boxShadow: shadows.glowOrb }}
      />
      <h2 className="mb-2 text-xl font-bold">
        {isInbox ? 'Tu inbox está vacío' : 'Esta carpeta está vacía'}
      </h2>
      <p className="mb-6 text-sm text-white/60">
        {isInbox
          ? 'Subí o grabá el audio de tu clase y Chero te genera el apunte completo.'
          : 'Todavía no tenés apuntes en esta carpeta. Generá uno o moveuno desde otra carpeta.'}
      </p>
      <Link
        href="/capture"
        className={buttonVariants({ size: 'lg', className: 'px-8' })}
      >
        Crear apunte
      </Link>
    </div>
  );
}

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('es-SV', {
    month: 'short',
    day: 'numeric',
  });
}
