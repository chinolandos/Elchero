'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, X } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { orbGradient, shadows } from '@/lib/design-tokens';
import type { CheroMode } from '@/lib/types/chero';
import { FolderTabs } from './folder-tabs';

/**
 * Normaliza string para matching tolerante: lowercase + remover tildes.
 * "Matemática" → "matematica" para que match con query "matematica" o "MATEMÁTICA".
 * Usa Unicode combining marks range ̀-ͯ para diacríticos.
 */
function normalizeForSearch(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

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
 * 5 gradients procedural sobrios pero claramente distintos entre sí.
 * Cada uno vive en una familia de hue diferente para que ninguna materia
 * se confunda con otra a vuelo de pájaro.
 *
 * Cada gradient es MONOCROMÁTICO dentro de su familia (deep → mid → bright)
 * lo cual mantiene el feel serio. La distinción viene del HUE base, no
 * de mezclar 3 colores rainbow.
 *
 * Los 5 hues:
 *   0 — Violet/púrpura (brand primary)
 *   1 — Blue/azul royal (frío, distinto del púrpura)
 *   2 — Teal/turquesa (verde-azulado, frío y único)
 *   3 — Rose/rosa profundo (cálido, distinto del violet brand)
 *   4 — Amber/naranja brasa (cálido, ember-style)
 */
const SUBJECT_GRADIENTS: string[] = [
  // 0 — Violet pure (deep purple → bright violet)
  'linear-gradient(135deg, #3b0764 0%, #7c3aed 55%, #a855f7 100%)',
  // 1 — Blue royal (deep navy → bright blue)
  'linear-gradient(135deg, #1e3a8a 0%, #2563eb 55%, #3b82f6 100%)',
  // 2 — Teal/turquesa (deep teal → bright)
  'linear-gradient(135deg, #134e4a 0%, #0d9488 55%, #14b8a6 100%)',
  // 3 — Rose deep (deep rose → pink vibrant)
  'linear-gradient(135deg, #4c0519 0%, #be123c 55%, #e11d48 100%)',
  // 4 — Amber/ember (deep brown-orange → bright orange)
  'linear-gradient(135deg, #431407 0%, #c2410c 55%, #f97316 100%)',
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
  const [query, setQuery] = useState('');

  const normalizedQuery = useMemo(
    () => normalizeForSearch(query.trim()),
    [query],
  );

  // Filtrar notas: primero por folder, después por query (substring match
  // sobre subject + summary + institution, normalizado sin tildes/case).
  const filteredNotes = useMemo(() => {
    const byFolder = initialNotes.filter(
      (n) => n.folder_id === selectedFolderId,
    );

    if (normalizedQuery.length === 0) return byFolder;

    return byFolder.filter((n) => {
      const haystack = normalizeForSearch(
        `${n.subject} ${n.summary_excerpt} ${n.institution ?? ''}`,
      );
      return haystack.includes(normalizedQuery);
    });
  }, [initialNotes, selectedFolderId, normalizedQuery]);

  const isSearching = normalizedQuery.length > 0;

  return (
    <>
      {/* Search bar — filtra dentro del folder activo */}
      <div className="relative mb-4">
        <Search
          aria-hidden
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/55"
        />
        <Input
          type="text"
          inputMode="search"
          autoComplete="off"
          placeholder="Buscar apuntes..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9 pr-9"
          aria-label="Buscar apuntes por materia, resumen o institución"
        />
        {query.length > 0 && (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label="Limpiar búsqueda"
            className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-white/65 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X aria-hidden className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <FolderTabs
        selectedFolderId={selectedFolderId}
        onSelect={setSelectedFolderId}
      />

      {filteredNotes.length === 0 ? (
        isSearching ? (
          <SearchEmptyState query={query.trim()} />
        ) : (
          <EmptyState isInbox={selectedFolderId === null} />
        )
      ) : (
        <NoteGrid notes={filteredNotes} />
      )}
    </>
  );
}

function SearchEmptyState({ query }: { query: string }) {
  return (
    <div className="glass relative overflow-hidden rounded-3xl p-8 text-center md:p-12">
      <div className="text-4xl" aria-hidden>
        🔍
      </div>
      <h2 className="font-display-pf mt-3 text-2xl font-semibold text-white">
        Sin resultados
      </h2>
      <p className="mt-2 text-sm text-white/75">
        No encontramos apuntes con{' '}
        <span className="font-semibold text-white">&quot;{query}&quot;</span>.
        Probá con otra palabra o cambiá de carpeta.
      </p>
    </div>
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
      className="group glass relative flex flex-col overflow-hidden rounded-3xl transition-all hover:-translate-y-1 hover:bg-white/[0.16] hover:shadow-[0_18px_40px_-14px_rgba(238,49,232,0.4)]"
    >
      {/* Banda superior con gradient procedural — la identidad visual del subject */}
      <div
        className="relative h-20 w-full"
        style={{ background: gradient }}
        aria-hidden
      >
        {/* Overlay highlight para profundidad */}
        <div
          className="absolute inset-0 opacity-30 mix-blend-overlay"
          style={{
            backgroundImage:
              'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.5), transparent 60%)',
          }}
        />

        {/* Mode badge top-right (glass-strong para destacar sobre el gradient) */}
        <span className="absolute right-3 top-3 rounded-full bg-black/40 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-md">
          {MODE_LABEL[note.mode]}
        </span>

        {/* Audio indicator */}
        {note.audio_tts_url && (
          <span
            className="absolute left-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-black/40 text-xs text-white backdrop-blur-md"
            aria-label="Tiene audio"
          >
            🎧
          </span>
        )}
      </div>

      {/* Body — glass translucent v5 más compacto */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-display-pf mb-1.5 line-clamp-1 text-base font-semibold tracking-tight text-white">
          {note.subject}
        </h3>
        <p className="line-clamp-2 flex-1 text-xs leading-relaxed text-white/75 transition-colors group-hover:text-white/90">
          {note.summary_excerpt || 'Sin resumen disponible'}
        </p>

        {/* Footer: número secuencial + counter */}
        <div className="mt-3 flex items-end justify-between border-t border-white/15 pt-3">
          <div>
            <div className="font-display-pf text-2xl font-bold leading-none tabular-nums text-white">
              {seq}
            </div>
            <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/55">
              {formatShortDate(note.created_at)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[11px] text-white/75">
              <span className="font-semibold text-white">
                {note.questions_count}
              </span>{' '}
              preg
            </div>
            <div className="text-[11px] text-white/75">
              <span className="font-semibold text-white">
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
    <div className="glass relative overflow-hidden rounded-3xl p-8 text-center md:p-12">
      {/* Halo orb sutil arriba para profundidad (matching ¿Listo para probarlo? card) */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-16 h-40 w-40 rounded-full opacity-50 blur-3xl"
        style={{
          background: 'hsl(295 90% 55% / 0.6)',
        }}
      />
      <div className="relative">
        <div
          className="orb-pulse mx-auto mb-5 h-16 w-16 rounded-full opacity-80"
          style={{ background: orbGradient, boxShadow: shadows.glowOrb }}
        />
        <h2 className="font-display-pf mb-2 text-2xl font-semibold text-white md:text-3xl">
          {isInbox ? 'Tu inbox está vacío' : 'Esta carpeta está vacía'}
        </h2>
        <p className="mb-6 text-sm text-white/75">
          {isInbox
            ? 'Subí o grabá el audio de tu clase y Chero te genera el apunte completo.'
            : 'Todavía no tenés apuntes en esta carpeta. Generá uno o movelo desde otra carpeta.'}
        </p>
        <Link
          href="/capture"
          className={buttonVariants({
            variant: 'premium',
            size: 'pill',
            className: 'px-8',
          })}
        >
          Crear apunte
        </Link>
      </div>
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
