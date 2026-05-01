'use client';

import { useState, useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Shuffle, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * FlashcardsDeck — deck Quizlet-style con flip 3D.
 *
 * UX:
 *   - Una card grande visible a la vez (front: pregunta, back: respuesta)
 *   - Click en la card o tecla Space → flip animado 3D (rotateY 180°)
 *   - Botones Prev/Next + counter "X / Y"
 *   - Shuffle button reordena el deck (genera nuevo orden)
 *   - Reset button vuelve al orden original
 *   - Keyboard: ← → para navegar, Space para flip
 *
 * Implementación 3D:
 *   - Container con perspective-1000
 *   - Inner con transform-style: preserve-3d + transition-transform
 *   - Front + Back absolute, back rotado 180° con backface-visibility: hidden
 */

interface Flashcard {
  front: string;
  back: string;
}

interface Props {
  cards: Flashcard[];
}

export function FlashcardsDeck({ cards }: Props) {
  const [order, setOrder] = useState<number[]>(() =>
    Array.from({ length: cards.length }, (_, i) => i),
  );
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const total = cards.length;
  const currentCard = cards[order[index] ?? 0];

  const next = useCallback(() => {
    setFlipped(false);
    setIndex((i) => (i + 1) % total);
  }, [total]);

  const prev = useCallback(() => {
    setFlipped(false);
    setIndex((i) => (i - 1 + total) % total);
  }, [total]);

  const flip = useCallback(() => {
    setFlipped((f) => !f);
  }, []);

  const shuffle = useCallback(() => {
    setFlipped(false);
    setIndex(0);
    // Fisher-Yates
    const next = [...order];
    for (let i = next.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [next[i], next[j]] = [next[j], next[i]];
    }
    setOrder(next);
  }, [order]);

  const reset = useCallback(() => {
    setFlipped(false);
    setIndex(0);
    setOrder(Array.from({ length: total }, (_, i) => i));
  }, [total]);

  // Keyboard shortcuts: ← → para navegar, Space para flip
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Solo si el foco no está en un input/textarea
      const target = e.target as HTMLElement;
      if (
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.isContentEditable
      ) {
        return;
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        next();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prev();
      } else if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        flip();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [next, prev, flip]);

  if (total === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      {/* Counter + actions */}
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-medium text-white/85">
          <span className="font-display-pf text-2xl text-white">
            {index + 1}
          </span>
          <span className="text-white/55"> / {total}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={shuffle}
            aria-label="Mezclar flashcards"
            className="glass flex h-9 w-9 items-center justify-center rounded-xl text-white/80 transition-all hover:bg-white/[0.18] hover:text-white"
          >
            <Shuffle aria-hidden className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={reset}
            aria-label="Volver al orden original"
            className="glass flex h-9 w-9 items-center justify-center rounded-xl text-white/80 transition-all hover:bg-white/[0.18] hover:text-white"
          >
            <RotateCcw aria-hidden className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Flip card 3D */}
      <button
        type="button"
        onClick={flip}
        aria-pressed={flipped}
        aria-label={flipped ? 'Ver pregunta' : 'Ver respuesta'}
        className="group relative h-72 w-full text-left [perspective:1200px] sm:h-80"
      >
        <div
          className={cn(
            'relative h-full w-full transition-transform duration-500 ease-out [transform-style:preserve-3d]',
            flipped && '[transform:rotateY(180deg)]',
          )}
        >
          {/* Front (pregunta) */}
          <div
            className="glass-strong shadow-card-premium absolute inset-0 flex flex-col items-center justify-center gap-3 overflow-hidden rounded-3xl p-6 [backface-visibility:hidden] sm:p-8"
          >
            <span
              aria-hidden
              className="pointer-events-none absolute -right-10 -top-16 h-40 w-40 rounded-full opacity-50 blur-3xl"
              style={{ background: 'hsl(295 90% 55% / 0.6)' }}
            />
            <div className="relative flex h-full w-full flex-col items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/55">
                Pregunta
              </span>
              <p className="font-display-pf max-w-prose text-center text-xl font-semibold leading-snug text-white sm:text-2xl">
                {currentCard.front}
              </p>
              <span className="text-xs italic text-white/55">
                Tap para ver respuesta
              </span>
            </div>
          </div>

          {/* Back (respuesta) */}
          <div
            className="glass-strong shadow-card-premium absolute inset-0 flex flex-col items-center justify-center gap-3 overflow-hidden rounded-3xl p-6 [backface-visibility:hidden] [transform:rotateY(180deg)] sm:p-8"
          >
            <span
              aria-hidden
              className="pointer-events-none absolute -bottom-16 -left-10 h-40 w-40 rounded-full opacity-50 blur-3xl"
              style={{ background: 'hsl(18 100% 56% / 0.5)' }}
            />
            <div className="relative flex h-full w-full flex-col items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-primary-glow">
                Respuesta
              </span>
              <p className="max-w-prose text-center text-base leading-relaxed text-white sm:text-lg">
                {currentCard.back}
              </p>
              <span className="text-xs italic text-white/55">
                Tap para volver
              </span>
            </div>
          </div>
        </div>
      </button>

      {/* Prev / Next */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={prev}
          aria-label="Flashcard anterior"
          className="glass flex h-12 w-12 items-center justify-center rounded-2xl text-white transition-all hover:bg-white/[0.18]"
        >
          <ChevronLeft aria-hidden className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-1">
          {/* Dots indicator (max 7 visible para no saturar) */}
          {Array.from({ length: Math.min(total, 7) }).map((_, i) => {
            // Si hay más de 7, centramos la ventana en el index actual
            const offset =
              total > 7 ? Math.max(0, Math.min(index - 3, total - 7)) : 0;
            const dotIdx = i + offset;
            return (
              <span
                key={i}
                aria-hidden
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  dotIdx === index
                    ? 'bg-gradient-primary w-6'
                    : 'w-1.5 bg-white/25',
                )}
              />
            );
          })}
        </div>
        <button
          type="button"
          onClick={next}
          aria-label="Siguiente flashcard"
          className="bg-gradient-primary shadow-button-premium flex h-12 w-12 items-center justify-center rounded-2xl text-white transition-transform active:scale-[0.97]"
        >
          <ChevronRight aria-hidden className="h-5 w-5" />
        </button>
      </div>

      <p className="text-center text-xs text-white/55">
        ← → para navegar · Espacio para flip
      </p>
    </div>
  );
}
