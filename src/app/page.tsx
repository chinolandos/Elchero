import Link from 'next/link';
import type { User } from '@supabase/supabase-js';
import { ArrowRight, Sparkles } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { orbGradient, shadows } from '@/lib/design-tokens';
import { getUserOrNull } from '@/lib/auth/require-auth';
import { LandingMobileNav } from './landing-mobile-nav';
import { LandingPricing } from './pricing-card';

/**
 * Landing pública de Chero — rediseño v4 (2026-04-30) basado en Lovable
 * "Chero Redesign". Mobile-first, max-w-md centrado, fondo radial morado.
 *
 * Estructura:
 *   1. LandingMobileNav (header glass fixed con hamburger drawer)
 *   2. Hero: orbe gigante con float + glow pulse + tagline Fraunces italic
 *   3. LandingPricing: tab switcher Free/Por mes/Premium + card glass
 *   4. FinalCTA: card glass con halo orb arriba "Probalo con tu próxima clase"
 *   5. Footer: orbe mini + links + crédito El Salvador
 *
 * Wrapper outer:
 *   - Full-width con bg-gradient-bg-radial fixed (el spot violeta queda
 *     siempre arriba sin parallax al scrollear)
 *   - max-w-md mx-auto en el contenido para look mobile-first incluso en
 *     desktop (la app es 100% mobile en uso real, así que la landing
 *     refuerza esa experiencia visual)
 */
export default async function HomePage() {
  const user = await getUserOrNull();
  const userLoggedIn = !!user;

  return (
    <div className="bg-gradient-bg-radial relative min-h-screen overflow-x-hidden bg-fixed text-white">
      <LandingMobileNav userLoggedIn={userLoggedIn} />

      <main className="relative mx-auto max-w-md">
        <Hero user={user} />
        <LandingPricing userLoggedIn={userLoggedIn} />
        <FinalCTA user={user} />
        <Footer />
      </main>
    </div>
  );
}

// ─── Hero ───
function Hero({ user }: { user: User | null }) {
  return (
    <section
      id="inicio"
      className="relative overflow-hidden px-6 pb-10 pt-28 text-center"
    >
      {/* Orbe — multi-capa CSS (no PNG dep)
          Capa 1 (atrás): gradient radial difuso con animate-pulse-glow
          Capa 2 (sólido): orbGradient (el mismo que usa la app) flotando
          drop-shadow violeta intensa para reforzar profundidad. */}
      <div className="animate-fade-up relative mx-auto mb-8 h-[280px] w-[280px]">
        {/* Halo difuso animado */}
        <div
          aria-hidden
          className="bg-gradient-orb-aura animate-pulse-glow absolute inset-0 blur-2xl"
        />
        {/* Orbe sólido animado */}
        <div
          aria-hidden
          className="animate-float-orb relative h-full w-full rounded-full"
          style={{
            background: orbGradient,
            boxShadow: `${shadows.glowOrb}, 0 20px 60px rgba(217, 122, 255, 0.5)`,
          }}
        />
      </div>

      <div className="animate-fade-up" style={{ animationDelay: '0.15s' }}>
        {/* Badge beta */}
        <span className="glass mb-5 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium text-white/70">
          <Sparkles aria-hidden className="text-primary-glow h-3.5 w-3.5" />
          Beta abierta · 10 usos gratis
        </span>

        {/* Eyebrow */}
        <p className="mb-3 text-sm uppercase tracking-[0.3em] text-white/55">
          El Chero
        </p>

        {/* Tagline principal */}
        <h1 className="font-display text-[2.6rem] font-semibold leading-[1.05] tracking-tight text-white">
          El <span className="text-gradient italic">cherito</span>
          <br />
          que tu cuaderno
          <br />
          nunca fue.
        </h1>

        {/* Subtitle */}
        <p className="mx-auto mt-5 max-w-xs text-[15px] leading-relaxed text-white/60">
          De la clase a tus apuntes en minutos. Hecho para{' '}
          <span className="font-medium text-white">avanzo</span>, comunes de
          período, y todo lo que tenés que estudiar en bachillerato.
        </p>

        {/* CTAs — distintos según auth */}
        <div className="mx-auto mt-8 flex max-w-xs flex-col gap-3">
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
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/capture"
                className={buttonVariants({
                  variant: 'glass',
                  size: 'pill',
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
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/como-funciona"
                className={buttonVariants({
                  variant: 'glass',
                  size: 'pill',
                  className: 'w-full',
                })}
              >
                ¿Cómo funciona?
              </Link>
            </>
          )}
        </div>

        <p className="mt-4 text-xs text-white/40">
          Sin tarjeta. Andá a tu Google y listo.
        </p>
      </div>
    </section>
  );
}

// ─── Final CTA ───
function FinalCTA({ user }: { user: User | null }) {
  const ctaHref = user ? '/capture' : '/login';
  const ctaLabel = user ? 'Crear apunte ahora' : 'Empezá gratis';

  return (
    <section className="px-5 py-12">
      <div className="glass shadow-card-premium relative overflow-hidden rounded-3xl px-6 py-10 text-center">
        {/* Halo orbe arriba */}
        <div
          aria-hidden
          className="bg-gradient-orb-aura absolute -top-20 left-1/2 h-64 w-64 -translate-x-1/2 opacity-60 blur-3xl"
        />
        <div className="relative">
          <h3 className="font-display text-3xl font-semibold tracking-tight text-white">
            Probalo con tu
            <br />
            <span className="text-gradient italic">próxima clase</span>
          </h3>
          <p className="mx-auto mt-3 max-w-xs text-sm text-white/65">
            10 usos gratis. Sin tarjeta. 5 minutos del input al primer apunte
            completo.
          </p>
          <Link
            href={ctaHref}
            className={buttonVariants({
              variant: 'premium',
              size: 'xl',
              className: 'mt-6 w-full max-w-xs',
            })}
          >
            {ctaLabel}
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ───
function Footer() {
  return (
    <footer className="px-6 pb-10 pt-6 text-center">
      <div className="mb-4 flex items-center justify-center gap-2">
        <span
          className="h-6 w-6 rounded-full"
          style={{ background: orbGradient, boxShadow: shadows.glowOrb }}
          aria-hidden
        />
        <span className="font-display text-lg font-semibold text-white">
          El Chero
        </span>
      </div>
      <nav
        aria-label="Footer"
        className="mb-4 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-white/55"
      >
        <Link href="/terminos" className="hover:text-white">
          Términos
        </Link>
        <Link href="/privacidad" className="hover:text-white">
          Privacidad
        </Link>
        <Link href="/como-funciona#faq" className="hover:text-white">
          FAQ
        </Link>
        <Link href="/como-funciona" className="hover:text-white">
          Cómo funciona
        </Link>
        <a
          href="mailto:chinolandos@gmail.com"
          className="hover:text-white"
        >
          Contacto
        </a>
      </nav>
      <p className="text-[11px] text-white/30">
        © 2026 El Chero · Hecho en El Salvador 🇸🇻
      </p>
    </footer>
  );
}
