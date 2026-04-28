'use client';

import { useEffect } from 'react';

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
    <div className="relative min-h-screen overflow-hidden bg-[#05060f] text-white">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgba(236, 72, 153, 0.18), transparent 50%)',
        }}
      />
      <main className="relative z-10 mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-6 py-24 text-center">
        <div
          className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl text-3xl shadow-[0_0_30px_rgba(236,72,153,0.5)]"
          style={{ background: 'linear-gradient(135deg, #ec4899 0%, #f59e0b 100%)' }}
        >
          ⚠️
        </div>
        <h1 className="mb-4 text-3xl font-bold tracking-tight md:text-5xl">
          Algo se rompió
        </h1>
        <p className="mb-8 max-w-md text-base text-white/70">
          Tuvimos un problema procesando tu pedido. Intentá de nuevo en un
          momento. Si vuelve a pasar, contactanos por las redes.
        </p>
        {error.digest && (
          <code className="mb-6 rounded bg-white/5 px-3 py-1 text-xs text-white/40">
            ref: {error.digest}
          </code>
        )}
        <button
          onClick={reset}
          className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition-transform hover:scale-105"
        >
          Intentar de nuevo
        </button>
      </main>
    </div>
  );
}
