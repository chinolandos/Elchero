import Link from 'next/link';
import type { User } from '@supabase/supabase-js';
import { ArrowRight, ChevronDown, Sparkles } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { getUserOrNull } from '@/lib/auth/require-auth';
import { LandingPricing } from './pricing-card';

/**
 * Landing pública de Chero — rediseño v5 (2026-05-01) basado en el Lovable
 * "hue-learn-glow". Mobile-first, max-w-[440px] centrado, fondo radial multi-
 * capa magenta + ember + plum sobre night, con 3 blobs animados de parallax.
 *
 * Estructura (sin header, sin FinalCTA, footer mínimo legal):
 *   1. Hero — orb sphere 192px (violet→magenta→ember radial) con halo violet
 *      blur-3xl. Badge glass beta. Eyebrow "EL CHERO". H1 Playfair principal
 *      "De la clase a tus apuntes en minutos." con subtítulo italic gradient
 *      "El cherito que tu cuaderno nunca fue."
 *   2. Pricing — tabs Free/Por mes/Premium con CTA premium magenta→ember.
 *   3. FooterMini — 1 línea legal: Privacidad · Términos · Contacto · © año.
 *
 * Tokens visuales (en globals.css):
 *   - .bg-gradient-hero: 4 capas radial+linear (magenta + ember + plum + night)
 *   - .glass: blanco translúcido blur 28px
 *   - .text-gradient: warm 4-stop amber→ember→magenta→violet
 *   - .animate-blob: 18s scale+translate parallax
 *   - --font-playfair: serif para "El cherito" italic
 */
export default async function HomePage() {
  const user = await getUserOrNull();
  const userLoggedIn = !!user;

  return (
    <div className="bg-gradient-hero relative min-h-screen w-full overflow-hidden text-foreground">
      {/* 3 blobs animados — parallax sutil con delays staggered */}
      <div
        aria-hidden
        className="animate-blob pointer-events-none absolute -right-32 -top-40 h-[520px] w-[520px] rounded-full opacity-70 blur-3xl"
        style={{
          background:
            'radial-gradient(circle, hsl(295 90% 55% / 0.7), transparent 70%)',
        }}
      />
      <div
        aria-hidden
        className="animate-blob pointer-events-none absolute right-1/4 top-1/3 h-[420px] w-[420px] rounded-full opacity-60 blur-3xl"
        style={{
          animationDelay: '-6s',
          background:
            'radial-gradient(circle, hsl(18 100% 56% / 0.65), transparent 70%)',
        }}
      />
      <div
        aria-hidden
        className="animate-blob pointer-events-none absolute -bottom-40 -left-20 h-[480px] w-[480px] rounded-full opacity-60 blur-3xl"
        style={{
          animationDelay: '-12s',
          background:
            'radial-gradient(circle, hsl(270 90% 60% / 0.6), transparent 70%)',
        }}
      />

      {/* Contenido — mobile 440px, desktop expande progresivamente sin perder
          el feel intimate del Lovable. md:max-w-2xl (672px) lg:max-w-3xl (768px). */}
      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-[440px] flex-col md:max-w-2xl lg:max-w-3xl">
        <div className="flex flex-col gap-10 px-5 pb-12 pt-10 md:gap-14 md:px-8 md:pb-20 md:pt-16">
          <Hero user={user} />
          <LandingPricing userLoggedIn={userLoggedIn} />
        </div>
        <FooterMini />
      </main>
    </div>
  );
}

// ─── Hero ───
function Hero({ user }: { user: User | null }) {
  return (
    <section
      id="inicio"
      className="flex flex-col items-center gap-6 text-center"
    >
      {/* Orb sphere 192px mobile / 224px desktop. Gradient radial violet→
          magenta→ember con 3 box-shadows (highlight blanco arriba + sombra
          interna abajo + glow magenta exterior). Halo violet blur-3xl detrás. */}
      <div className="relative grid place-items-center">
        <span
          aria-hidden
          className="absolute h-72 w-72 rounded-full opacity-80 blur-3xl md:h-80 md:w-80"
          style={{
            background:
              'radial-gradient(circle, hsl(270 90% 60% / 0.6), transparent 70%)',
          }}
        />
        <div
          aria-hidden
          className="animate-float-orb relative h-48 w-48 rounded-full md:h-56 md:w-56"
          style={{
            background:
              'radial-gradient(circle at 35% 30%, hsl(270 90% 60%) 0%, hsl(295 90% 55%) 45%, hsl(18 100% 56%) 100%)',
            boxShadow:
              'inset 0 6px 20px hsl(0 0% 100% / 0.25), inset 0 -10px 30px hsl(0 0% 0% / 0.4), 0 30px 80px -20px hsl(295 90% 55% / 0.6)',
          }}
        />
      </div>

      {/* Badge beta */}
      <span className="glass inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-medium uppercase tracking-widest text-foreground">
        <Sparkles aria-hidden className="h-3 w-3 text-primary-glow" />
        Beta abierta · 10 usos gratis
      </span>

      {/* Tagline — texto reordenado v5: principal corto + subtitle italic gradient.
          En desktop (md+): h1 más grande (5xl), subtitle wider (md), padding visual
          mayor, eyebrow text más grande. */}
      <div className="flex flex-col gap-3 md:gap-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/55 md:text-xs">
          El Chero
        </p>
        <h1 className="font-display-pf text-4xl font-semibold leading-tight tracking-tight text-foreground md:text-5xl lg:text-6xl">
          De la clase a tus
          <br />
          apuntes en minutos.
        </h1>
        {/* Subtítulo en 2 niveles para legibilidad mobile:
            - Primera frase: italic Playfair, white/95, con SOLO la palabra
              "cherito" en text-gradient warm (matching Lovable exacto).
            - Segunda frase: weight normal, white/70 para jerarquía visual. */}
        <p className="mx-auto max-w-[320px] text-sm text-white/95 md:max-w-md md:text-base">
          <em className="font-display-pf font-semibold italic">
            El{' '}
            <span className="text-gradient">cherito</span>{' '}
            que tu cuaderno nunca fue.
          </em>{' '}
          <span className="font-normal text-white/70">
            Hecho para{' '}
            <strong className="font-semibold text-white">avanzo</strong>,
            comunes de período y universidades.
          </span>
        </p>
      </div>

      {/* CTAs — auth-aware. Mobile: full-width column. Desktop: max-w-md
          centrado para no estirarse demasiado. */}
      <div className="flex w-full max-w-md flex-col gap-3">
        {user ? (
          <>
            <Link
              href="/library"
              className={buttonVariants({
                variant: 'premium',
                size: 'xl',
                className: 'w-full',
              })}
            >
              Mis apuntes
              <ArrowRight aria-hidden className="h-4 w-4" />
            </Link>
            <Link
              href="/capture"
              className={buttonVariants({
                variant: 'glass',
                size: 'xl',
                className: 'w-full',
              })}
            >
              + Nuevo apunte
            </Link>
          </>
        ) : (
          <>
            <Link
              href="/login"
              className={buttonVariants({
                variant: 'premium',
                size: 'xl',
                className: 'w-full',
              })}
            >
              Empezá gratis
              <ArrowRight aria-hidden className="h-4 w-4" />
            </Link>
            <Link
              href="/como-funciona"
              className={buttonVariants({
                variant: 'glass',
                size: 'xl',
                className: 'w-full',
              })}
            >
              ¿Cómo funciona El Chero?
              <ChevronDown aria-hidden className="h-4 w-4" />
            </Link>
          </>
        )}
      </div>
    </section>
  );
}

// ─── Footer mínimo (Decreto SV 144) ───
function FooterMini() {
  return (
    <footer
      className="px-5 pb-6 pt-2 text-center"
      aria-label="Footer legal"
    >
      <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[10px] text-white/40">
        <Link href="/privacidad" className="hover:text-white/70">
          Privacidad
        </Link>
        <span aria-hidden>·</span>
        <Link href="/terminos" className="hover:text-white/70">
          Términos
        </Link>
        <span aria-hidden>·</span>
        <a
          href="mailto:chinolandos@gmail.com"
          className="hover:text-white/70"
        >
          Contacto
        </a>
        <span aria-hidden>·</span>
        <span>© 2026 El Chero</span>
      </p>
    </footer>
  );
}
