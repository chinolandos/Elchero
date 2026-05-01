'use client';

import { useEffect } from 'react';
import { orbGradient, shadows } from '@/lib/design-tokens';
import { buttonVariants } from '@/components/ui/button';

/**
 * Global error boundary — rediseño v5.
 *
 * Texto y lógica idénticos. Solo cambia diseño:
 *   - bg-gradient-hero + 3 blobs (matching v5)
 *   - H1 Playfair Display
 *   - Botón premium gradient magenta-ember
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[chero][global-error]', error);
  }, [error]);

  return (
    <div className="bg-gradient-hero relative min-h-screen w-full overflow-hidden text-foreground">
      {/* 3 blobs animados */}
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

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-[440px] flex-col items-center justify-center px-5 py-12 text-center md:max-w-2xl md:px-8">
        <div
          className="orb-pulse mb-8 h-24 w-24 rounded-full"
          style={{ background: orbGradient, boxShadow: shadows.glowOrb }}
          aria-hidden
        />
        <h1 className="font-display-pf mb-4 text-3xl font-semibold tracking-tight text-white md:text-5xl">
          Algo se rompió
        </h1>
        <p className="mb-8 max-w-md text-base text-white/75">
          Tuvimos un problema procesando tu pedido. Intentá de nuevo en un
          momento. Si vuelve a pasar, contactanos por las redes.
        </p>
        {error.digest && (
          <code className="glass mb-6 rounded-2xl px-3 py-1 text-xs text-white/55">
            ref: {error.digest}
          </code>
        )}
        <button
          onClick={reset}
          className={buttonVariants({
            variant: 'premium',
            size: 'xl',
          })}
        >
          Intentar de nuevo
        </button>
      </main>
    </div>
  );
}
