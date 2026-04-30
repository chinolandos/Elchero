'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { GraduationCap, Target, Award, BookOpen, ChevronRight } from 'lucide-react';
import { PremiumButton } from '@/components/ui/premium-button';
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
 * 3 gradients procedural estilo lovable hue-learn-glow. Cada subject hashea
 * a uno consistente — "Matemática" siempre el mismo color.
 */
const SUBJECT_GRADIENTS: string[] = [
  // 0 — violeta-magenta vibrante (estilo "Parciales" del lovable)
  'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
  // 1 — coral-rosa (estilo "SAT")
  'linear-gradient(135deg, #ec4899 0%, #f97316 100%)',
  // 2 — naranja vibrante (estilo "Prueba Avanzo")
  'linear-gradient(135deg, #f97316 0%, #fb923c 100%)',
];

/** Iconos lucide por modo del apunte. */
const MODE_ICONS: Record<CheroMode, React.ComponentType<{ className?: string }>> = {
  avanzo: Award,
  periodo: BookOpen,
  parciales: GraduationCap,
  repaso: Target,
};

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
 * Lista de cards estilo lovable hue-learn-glow (Parciales / SAT / Avanzo).
 *
 * Layout:
 *   - Cada card es un Link full-width con gradient saturado
 *   - Icono circular gradient brillante a la izquierda
 *   - Texto: title bold + UPPERCASE label + descripción
 *   - Chevron right para affordance de navegación
 *   - Press: scale 0.98
 *
 * En desktop ancho amplio se mantiene single column hasta sm, luego
 * 2 cols a partir de md para aprovechar espacio.
 */
function NoteGrid({ notes }: { notes: NoteRow[] }) {
  return (
    <div className="flex flex-col gap-2">
      {notes.map((note) => {
        const gradient = SUBJECT_GRADIENTS[hashSubject(note.subject)];
        return <NoteCard key={note.id} note={note} gradient={gradient} />;
      })}
    </div>
  );
}

function NoteCard({
  note,
  gradient,
}: {
  note: NoteRow;
  gradient: string;
}) {
  const ModeIcon = MODE_ICONS[note.mode];
  return (
    <Link
      href={`/notes/${note.id}`}
      className="group flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4 backdrop-blur transition-all duration-200 hover:border-white/15 hover:bg-white/[0.07] active:scale-[0.98]"
    >
      {/* Icono circular gradient — único elemento con color saturado */}
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-[0_4px_12px_rgba(147,51,234,0.25)]"
        style={{ background: gradient }}
        aria-hidden
      >
        <ModeIcon className="h-5 w-5 text-white" />
      </span>

      {/* Body texto */}
      <div className="flex-1 overflow-hidden">
        <h3 className="line-clamp-1 text-sm font-bold tracking-tight text-white">
          {note.subject}
        </h3>
        <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/55">
          {MODE_LABEL[note.mode]}
          {note.audio_tts_url && <span className="ml-1.5">· 🎧</span>}
        </div>
      </div>

      {/* Chevron right */}
      <ChevronRight
        className="h-4 w-4 shrink-0 text-white/40 transition-transform group-hover:translate-x-0.5"
        aria-hidden
      />
    </Link>
  );
}

function EmptyState({ isInbox }: { isInbox: boolean }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-10 text-center backdrop-blur">
      <div
        className="orb-pulse mx-auto mb-6 h-16 w-16 rounded-full opacity-60"
        style={{ background: orbGradient, boxShadow: shadows.glowOrb }}
        aria-hidden
      />
      <h2 className="mb-2 text-2xl tracking-tight">
        <span className="font-black">Tu inbox está </span>
        <span className="serif-italic">vacío</span>
      </h2>
      <p className="mb-6 text-sm text-white/60">
        {isInbox
          ? 'Subí o grabá el audio de tu clase y Chero te genera el apunte completo.'
          : 'Todavía no tenés apuntes en esta carpeta. Generá uno o moveuno desde otra carpeta.'}
      </p>
      <PremiumButton variant="gradient" size="lg" asChild>
        <Link href="/capture">Crear apunte</Link>
      </PremiumButton>
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
