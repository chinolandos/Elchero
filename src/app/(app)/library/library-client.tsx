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
        <NoteList notes={filteredNotes} />
      )}
    </>
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
                <span className="text-white/40" aria-label="Tiene audio">
                  🎧
                </span>
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
