'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * ConceptsCarousel — carrusel horizontal swipeable para "Conceptos clave".
 *
 * Mismo patrón que StepsCarousel de /como-funciona:
 *   - Mobile (touch): scroll horizontal nativo via overflow-x-auto + scroll-snap
 *   - Desktop (mouse): drag-to-scroll con Pointer Events
 *   - Trackpad: scroll horizontal natural sin drag manual
 *
 * Cada card glass con: nombre del concepto en Playfair, definición, y opcional
 * caja de ejemplo con border lateral magenta.
 */

interface Concept {
  name: string;
  definition: string;
  example?: string | null;
}

interface Props {
  concepts: Concept[];
}

export function ConceptsCarousel({ concepts }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Mouse drag-to-scroll. Touch usa scroll nativo del browser.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let startX = 0;
    let startScroll = 0;
    let activePointerId: number | null = null;

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      activePointerId = e.pointerId;
      startX = e.clientX;
      startScroll = track.scrollLeft;
      setIsDragging(true);
      track.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerId !== activePointerId) return;
      e.preventDefault();
      const dx = e.clientX - startX;
      track.scrollLeft = startScroll - dx * 1.2;
    };

    const onPointerUp = (e: PointerEvent) => {
      if (e.pointerId !== activePointerId) return;
      setIsDragging(false);
      activePointerId = null;
      try {
        track.releasePointerCapture(e.pointerId);
      } catch {
        // ignore — puede que ya se haya liberado
      }
    };

    track.addEventListener('pointerdown', onPointerDown);
    track.addEventListener('pointermove', onPointerMove);
    track.addEventListener('pointerup', onPointerUp);
    track.addEventListener('pointercancel', onPointerUp);

    return () => {
      track.removeEventListener('pointerdown', onPointerDown);
      track.removeEventListener('pointermove', onPointerMove);
      track.removeEventListener('pointerup', onPointerUp);
      track.removeEventListener('pointercancel', onPointerUp);
    };
  }, []);

  if (concepts.length === 0) return null;

  return (
    <div>
      <p className="mb-3 text-xs text-white/55">
        Deslizá → para navegar entre los {concepts.length} conceptos
      </p>
      <div
        ref={trackRef}
        className={
          'no-scrollbar -mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 md:-mx-8 md:px-8 ' +
          (isDragging ? 'cursor-grabbing select-none' : 'cursor-grab select-none')
        }
        style={{
          scrollBehavior: isDragging ? 'auto' : 'smooth',
        }}
        role="region"
        aria-label="Conceptos clave — desliza para ver más"
      >
        {concepts.map((c, i) => (
          <article
            key={`${c.name}-${i}`}
            className="glass flex min-w-[300px] max-w-[300px] snap-start flex-col gap-3 rounded-3xl p-5 sm:min-w-[340px] sm:max-w-[340px] md:p-6"
          >
            <div className="flex items-center gap-2">
              <span
                aria-hidden
                className="bg-gradient-primary shadow-button-premium grid h-8 w-8 shrink-0 place-items-center rounded-xl text-xs font-semibold text-white"
              >
                {i + 1}
              </span>
              <h3 className="font-display-pf flex-1 text-lg font-semibold leading-tight text-white sm:text-xl">
                {c.name}
              </h3>
            </div>
            <p className="text-sm leading-relaxed text-white/85">
              {c.definition}
            </p>
            {c.example && (
              <p className="border-primary-glow bg-primary/10 mt-auto rounded-2xl border-l-2 px-4 py-3 text-sm italic text-white/85">
                <span className="text-primary-glow not-italic font-semibold">
                  Ejemplo:
                </span>{' '}
                {c.example}
              </p>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
