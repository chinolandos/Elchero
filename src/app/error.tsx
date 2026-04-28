'use client';

import { useEffect } from 'react';
import { ambientGlow, orbGradient, shadows } from '@/lib/design-tokens';

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
    <div className="relative min-h-screen overflow-hidden bg-[#0a0a14] text-white">
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: ambientGlow }}
      />
      <main className="relative z-10 mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-6 py-24 text-center">
        <div
          className="orb-pulse mb-8 h-24 w-24 rounded-full"
          style={{ background: orbGradient, boxShadow: shadows.glowOrb }}
        />
        <h1 className="mb-4 text-3xl font-bold tracking-tight md:text-5xl">
          Algo se rompió
        </h1>
        <p className="mb-8 max-w-md text-base text-white/60">
          Tuvimos un problema procesando tu pedido. Intentá de nuevo en un
          momento. Si vuelve a pasar, contactanos por las redes.
        </p>
        {error.digest && (
          <code className="mb-6 rounded bg-white/5 px-3 py-1 text-xs text-white/30">
            ref: {error.digest}
          </code>
        )}
        <button
          onClick={reset}
          className="rounded-full bg-[#9333ea] px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-[#a855f7] hover:scale-105 hover:shadow-[0_8px_24px_rgba(147,51,234,0.5)]"
        >
          Intentar de nuevo
        </button>
      </main>
    </div>
  );
}
