'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * StepsCarousel — carrusel horizontal swipeable.
 *
 * Comportamiento:
 *   - Mobile (touch): scroll horizontal nativo via overflow-x-auto + scroll-snap.
 *     El usuario desliza el dedo y el browser hace su magia.
 *   - Desktop (mouse): drag-to-scroll con Pointer Events. Detecto e.pointerType
 *     === 'mouse' para activar el drag manual; touch sigue siendo nativo.
 *   - Trackpad: scroll horizontal natural, no necesita drag manual.
 *
 * scroll-snap-type: x mandatory hace que cuando el scroll inertia termine,
 * la card más cercana se centre. Funciona tanto con touch como con drag.
 *
 * Indicador visual: cards adyacentes peeking en los bordes (max-w 280px en
 * container 440px → 1.4 cards visibles) le dice al user "hay más a la derecha".
 */

interface Step {
  n: string;
  title: string;
  detail: string;
  tech: string;
}

interface StepsCarouselProps {
  steps: Step[];
}

export function StepsCarousel({ steps }: StepsCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Mouse drag-to-scroll. Solo se activa con pointerType === 'mouse'.
  // Touch usa el scroll nativo del browser sin que toquemos nada.
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
      // Multiplicador 1.2 da feel más "natural" — el scroll va un poco más
      // rápido que el movimiento del mouse, pero sin sentirse exagerado.
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

  return (
    <div
      ref={trackRef}
      className={
        'no-scrollbar -mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 ' +
        (isDragging ? 'cursor-grabbing select-none' : 'cursor-grab select-none')
      }
      style={{
        // Smooth scroll para que cuando el snap se ejecuta no salte abrupto.
        scrollBehavior: isDragging ? 'auto' : 'smooth',
      }}
      role="region"
      aria-label="Flujo completo de Chero — desliza para ver más pasos"
    >
      {steps.map((step) => (
        <article
          key={step.n}
          className="glass flex min-w-[280px] max-w-[280px] snap-start flex-col gap-2 rounded-2xl p-4"
        >
          <div className="flex items-center gap-3">
            <span
              aria-hidden
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-sm font-semibold text-white"
              style={{
                background:
                  'linear-gradient(135deg, hsl(295 90% 55% / 0.6), hsl(270 90% 60% / 0.6))',
              }}
            >
              {step.n}
            </span>
            <h3 className="text-sm font-semibold text-white">{step.title}</h3>
          </div>
          <p className="text-xs leading-relaxed text-white/80">{step.detail}</p>
          <p className="mt-auto text-[10px] text-white/55">⚙ {step.tech}</p>
        </article>
      ))}
    </div>
  );
}
