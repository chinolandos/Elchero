import Link from 'next/link';
import { orbGradient, shadows } from '@/lib/design-tokens';
import { buttonVariants } from '@/components/ui/button';

/**
 * 404 Not Found — rediseño v5.
 * Texto idéntico, solo cambia diseño.
 */
export default function NotFound() {
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
          className="orb-pulse mb-8 h-28 w-28 rounded-full"
          style={{ background: orbGradient, boxShadow: shadows.glowOrb }}
          aria-hidden
        />
        <h1 className="font-display-pf text-gradient mb-4 text-7xl font-bold tracking-tight md:text-8xl">
          404
        </h1>
        <p className="mb-8 max-w-md text-lg text-white/75">
          Esta página no existe. Tal vez sigamos en construcción.
        </p>
        <Link
          href="/"
          className={buttonVariants({
            variant: 'premium',
            size: 'xl',
          })}
        >
          Volver al inicio
        </Link>
      </main>
    </div>
  );
}
