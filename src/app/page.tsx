import Link from 'next/link';
import type { User } from '@supabase/supabase-js';
import { buttonVariants } from '@/components/ui/button';
import { ambientGlow, brandGradient, orbGradient, shadows } from '@/lib/design-tokens';
import { getUserOrNull } from '@/lib/auth/require-auth';
import { PricingCard } from './pricing-card';

/**
 * Landing pública de Chero — versión completa Día 7.
 *
 * Estructura:
 *   1. Hero (orb + tagline + CTAs)
 *   2. Cómo funciona (3 pasos visuales)
 *   3. Features (6 cards)
 *   4. Para quién es (Bachiller AVANZO vs Universitario)
 *   5. Pricing (3 tiers + banner beta)
 *   6. FAQ (5 preguntas)
 *   7. Footer (legales + redes + brand)
 */
export default async function HomePage() {
  const user = await getUserOrNull();

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0a14] text-white">
      {/* Ambient glow background */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: ambientGlow }}
      />

      {/*
       * Landing minimalista: Hero + Pricing + CTA + Footer.
       * El contenido educativo (Cómo funciona, Features, Para quién, FAQ)
       * vive en /como-funciona — accesible vía link "¿Cómo funciona?" en
       * el Hero y vía Footer.
       */}
      <div className="relative z-10">
        <Hero user={user} />
        <PricingSection />
        <CtaSection user={user} />
        <Footer />
      </div>
    </div>
  );
}

// ─── Hero ───
function Hero({ user }: { user: User | null }) {
  return (
    <section className="mx-auto flex min-h-[90vh] max-w-4xl flex-col items-center justify-center px-6 py-20 text-center">
      {/* Badge beta */}
      <div className="mb-10 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-white/80 backdrop-blur">
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
        Beta abierta · 50 usos gratis
      </div>

      {/*
       * Orb central — el elemento brand más prominente.
       *
       * 3 capas concéntricas (de afuera hacia adentro):
       *   1. Halo extra-large radial muy difuso (la "atmósfera")
       *   2. Glow violeta más intenso (capa media)
       *   3. Orbe sólido con gradient orgánico + shadow propia
       *
       * Tamaños:
       *   - Mobile: orbe 288px (h-72), cabe en viewport de 375px+ con margen
       *   - Desktop (md+): orbe 384px (h-96), dominante en hero
       *
       * La animación `orb-pulse` (definida en globals.css con 4s ease-in-out)
       * solo se aplica a la esfera sólida — los halos quedan estáticos para
       * no marear. El brand se refuerza con la profundidad multi-capa.
       */}
      <div className="relative mb-12 flex items-center justify-center md:mb-16">
        {/* Layer 3 — halo atmosférico extra-large */}
        <div
          aria-hidden
          className="pointer-events-none absolute h-[28rem] w-[28rem] rounded-full md:h-[36rem] md:w-[36rem]"
          style={{
            background:
              'radial-gradient(circle, rgba(147, 51, 234, 0.14) 0%, rgba(236, 72, 153, 0.06) 35%, transparent 70%)',
          }}
        />

        {/* Layer 2 — glow violeta medio */}
        <div
          aria-hidden
          className="pointer-events-none absolute h-96 w-96 rounded-full md:h-[28rem] md:w-[28rem]"
          style={{
            background:
              'radial-gradient(circle, rgba(168, 85, 247, 0.30) 0%, rgba(192, 132, 252, 0.12) 40%, transparent 70%)',
          }}
        />

        {/* Layer 1 — orbe sólido con gradient orgánico */}
        <div
          className="orb-pulse relative h-72 w-72 rounded-full md:h-96 md:w-96"
          style={{
            background: orbGradient,
            boxShadow: `${shadows.glowOrb}, 0 0 120px rgba(192, 132, 252, 0.3)`,
          }}
        />
      </div>

      <div className="mb-3 text-xl font-bold tracking-tight text-white/90 md:text-2xl">
        El Chero
      </div>

      {/* Tagline principal */}
      <h1 className="mb-5 max-w-3xl text-5xl font-black leading-[1.05] tracking-tight md:text-7xl">
        El{' '}
        <span
          className="bg-clip-text text-transparent"
          style={{ backgroundImage: brandGradient }}
        >
          cherito
        </span>{' '}
        que tu cuaderno nunca fue.
      </h1>

      <p className="mb-10 max-w-xl text-lg leading-relaxed text-white/60 md:text-xl">
        De tu clase a tus apuntes en minutos. Hecho para{' '}
        <strong className="text-white/80">AVANZO</strong>, exámenes de período
        y todo lo que tenés que estudiar en bachillerato.
      </p>

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
              href="/como-funciona"
              className={buttonVariants({
                size: 'lg',
                variant: 'ghost',
                className: 'px-8 text-white/70 hover:bg-white/5 hover:text-white',
              })}
            >
              ¿Cómo funciona?
            </Link>
          </>
        )}
      </div>

      <p className="mt-6 text-xs text-white/40">
        Sin tarjeta. Sin descargas. Andá a tu cuenta de Google y listo.
      </p>
    </section>
  );
}


// ─── Pricing ───
function PricingSection() {
  return (
    <section id="pricing" className="mx-auto max-w-6xl px-6 py-16 md:py-20">
      <div className="mb-10 text-center">
        <div className="mb-3 text-xs uppercase tracking-widest text-primary">
          Pricing
        </div>
        <h2 className="text-4xl font-black tracking-tight md:text-5xl">
          Empezá gratis
        </h2>
        <p className="mt-4 text-white/60">
          Sin tarjeta para probar. Cobramos justo lo que cuesta hacerlo bien.
        </p>
      </div>

      <PricingCard />

      <div className="mx-auto mt-10 max-w-md rounded-2xl border border-amber-500/30 bg-amber-500/[0.08] p-5 text-center">
        <strong className="text-amber-200">🎁 Beta abierta:</strong>{' '}
        <span className="text-amber-100/90">
          50 usos gratis limitados · Lanzamiento Premium Q3 2026
        </span>
        <div className="mt-2 text-xs text-amber-100/70">
          ¿Tenés varios hermanos en bachillerato? Plan familia $9.99/mes
          comparte 3 cuentas.
        </div>
      </div>
    </section>
  );
}

// ─── CTA final ───
function CtaSection({ user }: { user: User | null }) {
  return (
    <section className="mx-auto max-w-3xl px-6 py-16 md:py-20">
      <div className="rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/15 to-primary/5 p-10 text-center md:p-14">
        <h2 className="mb-4 text-3xl font-black tracking-tight md:text-5xl">
          Probalo con tu próxima clase
        </h2>
        <p className="mb-8 text-white/70 md:text-lg">
          50 usos gratis. Sin tarjeta. Menos de 5 minutos del login a tu
          primer apunte completo.
        </p>
        <Link
          href={user ? '/capture' : '/login'}
          className={buttonVariants({ size: 'lg', className: 'px-10' })}
        >
          {user ? 'Crear apunte ahora' : 'Empezar gratis'}
        </Link>
      </div>
    </section>
  );
}

// ─── Footer ───
function Footer() {
  return (
    <footer className="border-t border-white/5 px-6 py-12">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row md:items-start">
          <div>
            <div className="mb-2 text-base font-bold">El Chero</div>
            <div className="text-xs text-white/40">
              Apuntes con IA · Hecho en El Salvador 🇸🇻
            </div>
          </div>

          <nav aria-label="Footer" className="flex flex-wrap justify-center gap-6 text-sm text-white/60">
            <Link href="/como-funciona" className="hover:text-white">
              Cómo funciona
            </Link>
            <Link href="/#pricing" className="hover:text-white">
              Pricing
            </Link>
            <Link href="/#faq" className="hover:text-white">
              FAQ
            </Link>
            <Link href="/privacidad" className="hover:text-white">
              Privacidad
            </Link>
            <Link href="/terminos" className="hover:text-white">
              Términos
            </Link>
          </nav>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-white/5 pt-6 text-xs text-white/30 md:flex-row">
          <span>© 2026 El Chero · CBE 2026 ESEN</span>
          <span>
            Contacto: <a href="mailto:chinolandos@gmail.com" className="hover:text-white/60">chinolandos@gmail.com</a>
          </span>
        </div>
      </div>
    </footer>
  );
}
