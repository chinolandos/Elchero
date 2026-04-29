import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { ambientGlow, brandGradient, orbGradient, shadows } from '@/lib/design-tokens';
import { getUserOrNull } from '@/lib/auth/require-auth';

/**
 * Landing pública de Chero — placeholder durante el build (días 1-6).
 * Día 7 esto se reemplaza por la landing completa con hero, features, pricing, etc.
 *
 * Aesthetic v2: dark con orb central morado + glow ambient sutil.
 */
export default async function HomePage() {
  const user = await getUserOrNull();

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0a14] text-white">
      {/* Ambient glow background — violeta + indigo profundo */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: ambientGlow }}
      />

      <main className="relative z-10 mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 py-24 text-center">
        {/* Badge */}
        <div className="mb-12 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-white/80 backdrop-blur">
          <span className="relative flex h-2 w-2">
            <span
              className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
              style={{ background: '#c084fc' }}
            />
            <span
              className="relative inline-flex h-2 w-2 rounded-full"
              style={{ background: '#c084fc' }}
            />
          </span>
          Beta · Lanzamiento próximo
        </div>

        {/* ORB central — el hero visual */}
        <div className="relative mb-12 flex items-center justify-center">
          <div
            className="orb-pulse h-48 w-48 rounded-full md:h-56 md:w-56"
            style={{
              background: orbGradient,
              boxShadow: shadows.glowOrb,
            }}
          />
          {/* Halo difuso alrededor */}
          <div
            className="pointer-events-none absolute h-72 w-72 rounded-full md:h-96 md:w-96"
            style={{
              background:
                'radial-gradient(circle, rgba(147, 51, 234, 0.25) 0%, transparent 60%)',
            }}
          />
        </div>

        {/* Brand */}
        <div className="mb-4 text-2xl font-bold tracking-tight text-white/90">
          El Chero
        </div>

        {/* Tagline gigante */}
        <h1 className="mb-6 max-w-2xl text-5xl font-black leading-[1.05] tracking-tight md:text-7xl">
          Apuntes con IA,{' '}
          <span
            className="bg-clip-text text-transparent"
            style={{ backgroundImage: brandGradient }}
          >
            hechos a tu medida
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mb-12 max-w-xl text-lg leading-relaxed text-white/60 md:text-xl">
          Subí o grabá el audio de tu clase y recibí apuntes en español
          salvadoreño con preguntas tipo examen, flashcards y audio para repasar.
          Hecho para AVANZO, parciales universitarios y pruebas de período.
        </p>

        {/* CTAs */}
        <div className="flex flex-col items-center gap-3 sm:flex-row">
          {user ? (
            <>
              <Link
                href="/library"
                className={buttonVariants({ size: 'lg', className: 'px-8' })}
              >
                Mis apuntes
              </Link>
              <Link
                href="/capture"
                className={buttonVariants({
                  size: 'lg',
                  variant: 'ghost',
                  className: 'px-8 text-white/70 hover:bg-white/5 hover:text-white',
                })}
              >
                + Nuevo apunte
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className={buttonVariants({ size: 'lg', className: 'px-8' })}
              >
                Empezar gratis
              </Link>
              <Link
                href="/login"
                className={buttonVariants({
                  size: 'lg',
                  variant: 'ghost',
                  className: 'px-8 text-white/70 hover:bg-white/5 hover:text-white',
                })}
              >
                Ya tengo cuenta
              </Link>
            </>
          )}
        </div>

        <div className="mt-6 text-xs text-white/40">
          Beta · 50 usos gratis para CBE 2026
        </div>

        {/* Mini-footer */}
        <footer className="mt-16 text-xs text-white/30">
          Hecho con 🐎 en El Salvador · CBE 2026 ESEN
        </footer>
      </main>
    </div>
  );
}
