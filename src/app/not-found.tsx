import Link from 'next/link';
import { ambientGlow, brandGradient, orbGradient, shadows } from '@/lib/design-tokens';

export default function NotFound() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0a14] text-white">
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: ambientGlow }}
      />
      <main className="relative z-10 mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-6 py-24 text-center">
        <div
          className="orb-pulse mb-8 h-28 w-28 rounded-full"
          style={{ background: orbGradient, boxShadow: shadows.glowOrb }}
        />
        <h1
          className="mb-4 text-6xl font-black tracking-tight md:text-8xl bg-clip-text text-transparent"
          style={{ backgroundImage: brandGradient }}
        >
          404
        </h1>
        <p className="mb-8 max-w-md text-lg text-white/60">
          Esta página no existe. Tal vez sigamos en construcción.
        </p>
        <Link
          href="/"
          className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition-all hover:scale-105 hover:shadow-[0_8px_24px_rgba(147,51,234,0.4)]"
        >
          Volver al inicio
        </Link>
      </main>
    </div>
  );
}
