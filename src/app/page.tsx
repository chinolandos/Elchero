import Link from 'next/link';
import type { User } from '@supabase/supabase-js';
import { buttonVariants } from '@/components/ui/button';
import { PremiumButton } from '@/components/ui/premium-button';
import { AuroraBg } from '@/components/ui/aurora-bg';
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
      {/* Aurora background — full intensity en landing (primer impresión) */}
      <AuroraBg intensity="full" />

      {/* Ambient glow legacy — capa extra de profundidad por encima del aurora */}
      <div
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{ background: ambientGlow }}
        aria-hidden
      />

      <div className="relative z-10">
        <Hero user={user} />
        <HowItWorksSection />
        <FeaturesSection />
        <ForWhoSection />
        <PricingSection />
        <FaqSection />
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

      {/* Tagline principal — mix sans-bold + serif-italic estilo VibeMove */}
      <h1 className="mb-5 max-w-3xl text-5xl leading-[1.05] tracking-tight md:text-7xl">
        <span className="font-black">El </span>
        <span
          className="serif-italic bg-clip-text text-transparent"
          style={{ backgroundImage: brandGradient }}
        >
          cherito
        </span>
        <span className="font-black"> que tu cuaderno nunca fue.</span>
      </h1>

      <p className="mb-10 max-w-xl text-lg leading-relaxed text-white/65 md:text-xl">
        De tu clase a tus apuntes en minutos. Hecho para{' '}
        <strong className="text-white/85">AVANZO</strong>, exámenes de período
        y todo lo que tenés que estudiar en bachillerato.
      </p>

      <div className="flex flex-col items-center gap-3 sm:flex-row">
        {user ? (
          <>
            <PremiumButton variant="primary" size="lg" asChild>
              <Link href="/library">Mis apuntes</Link>
            </PremiumButton>
            <PremiumButton variant="ghost" size="lg" asChild>
              <Link href="/capture">+ Nuevo apunte</Link>
            </PremiumButton>
          </>
        ) : (
          <>
            <PremiumButton variant="primary" size="lg" asChild>
              <Link href="/login">Empezar gratis</Link>
            </PremiumButton>
            <PremiumButton variant="ghost" size="lg" asChild>
              <Link href="#como-funciona">¿Cómo funciona?</Link>
            </PremiumButton>
          </>
        )}
      </div>

      <p className="mt-6 text-xs text-white/40">
        Sin tarjeta. Sin descargas. Andá a tu cuenta de Google y listo.
      </p>
    </section>
  );
}

// ─── ¿Cómo funciona? ───
function HowItWorksSection() {
  const steps = [
    {
      n: '1',
      title: 'Grabás o subís',
      body: 'Grabás hasta 9 minutos directo desde la app, o subís un audio que ya tenés (MP3, M4A, WAV, hasta 4.5 MB).',
      icon: '🎙',
    },
    {
      n: '2',
      title: 'Procesamos con IA',
      body: 'Whisper transcribe a texto. Claude Sonnet detecta materia, modo (AVANZO o examen de período) y genera tu apunte completo.',
      icon: '⚡',
    },
    {
      n: '3',
      title: 'Recibís tu apunte',
      body: 'Resumen, conceptos clave con ejemplos, preguntas tipo examen, flashcards, repaso de 30s y audio para escuchar yendo a clase.',
      icon: '📝',
    },
  ];

  return (
    <section
      id="como-funciona"
      className="mx-auto max-w-5xl px-6 py-24 md:py-32"
    >
      <div className="mb-14 text-center">
        <div className="mb-3 text-xs uppercase tracking-widest text-primary">
          Cómo funciona
        </div>
        <h2 className="text-4xl tracking-tight md:text-5xl">
          <span className="font-black">Del audio al </span>
          <span className="serif-italic">apunte</span>
          <span className="font-black"> en 3 pasos</span>
        </h2>
        <p className="mt-4 text-white/60">Total: 1-2 minutos.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {steps.map((step) => (
          <div
            key={step.n}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-7 transition-colors hover:border-primary/30 hover:bg-primary/5"
          >
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-base font-bold text-primary">
                {step.n}
              </span>
              <span className="text-3xl" aria-hidden="true">
                {step.icon}
              </span>
            </div>
            <h3 className="mb-2 text-xl font-bold">{step.title}</h3>
            <p className="text-sm leading-relaxed text-white/60">{step.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Features ───
function FeaturesSection() {
  const features = [
    {
      title: 'Voseo salvadoreño nativo',
      body: 'No es español neutro genérico. "Tenés", "podés", "ojo con esto". Los apuntes se sienten como te explica un cherito de confianza.',
      icon: '🇸🇻',
    },
    {
      title: 'Detecta tu modo',
      body: 'Si decís "para AVANZO", arma apunte estilo AVANZO. Si decís "examen de período", lo adapta al período. Sin que configures nada.',
      icon: '🎯',
    },
    {
      title: 'Audio HD para repasar',
      body: 'Cada apunte viene con audio TTS natural. Escuchalo yendo a clase, antes del examen, en el bus. Repaso sin pantalla.',
      icon: '🎧',
    },
    {
      title: 'Mapa mental visual',
      body: 'Diagrama auto-generado con los conceptos relacionados. Se entiende de un vistazo lo que tardás 1 hora leyendo.',
      icon: '🗺️',
    },
    {
      title: 'Detector de calidad',
      body: 'Si tu audio tiene mucho ruido (risas de compañeros, muletillas), te avisamos antes de gastar tu uso. Te devolvemos el cupo si decidís regrabar.',
      icon: '👂',
    },
    {
      title: 'Privacy-first',
      body: 'Tu audio se borra apenas se transcribe — nunca toca disco. Podés eliminar tu cuenta y todos tus apuntes desde tu perfil cuando quieras.',
      icon: '🔒',
    },
  ];

  return (
    <section className="mx-auto max-w-6xl px-6 py-24 md:py-28">
      <div className="mb-14 text-center">
        <div className="mb-3 text-xs uppercase tracking-widest text-primary">
          Features
        </div>
        <h2 className="text-4xl tracking-tight md:text-5xl">
          <span className="font-black">Hecho para estudiantes </span>
          <span className="serif-italic">salvadoreños</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feat) => (
          <div
            key={feat.title}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-all hover:border-primary/30 hover:bg-white/[0.05]"
          >
            <div className="mb-3 text-3xl" aria-hidden="true">
              {feat.icon}
            </div>
            <h3 className="mb-2 text-lg font-bold">{feat.title}</h3>
            <p className="text-sm leading-relaxed text-white/60">{feat.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── ¿Para quién es? ───
function ForWhoSection() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-24 md:py-28">
      <div className="mb-14 text-center">
        <div className="mb-3 text-xs uppercase tracking-widest text-primary">
          ¿Es para mí?
        </div>
        <h2 className="text-4xl tracking-tight md:text-5xl">
          <span className="font-black">Hecho para </span>
          <span className="serif-italic">bachilleres</span>
        </h2>
        <p className="mt-4 text-white/60">
          Primero, segundo año, AVANZO, exámenes de período. Todo cubierto.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-primary/40 bg-primary/10 p-7 ring-1 ring-primary/20">
          <div className="mb-4 flex items-center gap-3">
            <span className="text-3xl" aria-hidden="true">🎯</span>
            <h3 className="text-2xl font-bold">AVANZO</h3>
          </div>
          <p className="mb-5 text-white/80">
            La prueba nacional MINED para 2° año. Chero arma apuntes con el
            formato exacto: selección múltiple, 5 áreas oficiales, preguntas
            del estilo del examen real.
          </p>
          <ul className="space-y-2 text-sm text-white/85">
            <li>★ Lenguaje y Literatura</li>
            <li>★ Matemática</li>
            <li>★ Ciencias Naturales</li>
            <li>★ Estudios Sociales y Ciudadanía</li>
            <li>★ Inglés</li>
          </ul>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-7">
          <div className="mb-4 flex items-center gap-3">
            <span className="text-3xl" aria-hidden="true">📅</span>
            <h3 className="text-2xl font-bold">Exámenes de período</h3>
          </div>
          <p className="mb-5 text-white/80">
            Los 4 períodos evaluativos del año, sea cual sea tu materia.
            Apuntes específicos a tu profe y a tu colegio.
          </p>
          <ul className="space-y-2 text-sm text-white/70">
            <li>· Filosofía, Psicología, Economía</li>
            <li>· Educación Artística, Educación Física</li>
            <li>· Moral, Urbanidad y Cívica</li>
            <li>· Informática, Contabilidad</li>
            <li>· Cualquier materia con voz humana en español</li>
          </ul>
        </div>
      </div>
    </section>
  );
}

// ─── Pricing ───
function PricingSection() {
  return (
    <section id="pricing" className="mx-auto max-w-6xl px-6 py-24 md:py-28">
      <div className="mb-10 text-center">
        <div className="mb-3 text-xs uppercase tracking-widest text-primary">
          Pricing
        </div>
        <h2 className="text-4xl tracking-tight md:text-5xl">
          <span className="font-black">Empezá </span>
          <span className="serif-italic">gratis</span>
        </h2>
        <p className="mt-4 text-white/60">
          Sin tarjeta para probar. Cobramos justo lo que cuesta hacerlo bien.
        </p>
      </div>

      {/* Card central con tabs (ref Zentra Finance imagen 5).
          Single card, Premium destacado por default — el plan que querés
          vender post-launch. */}
      <PricingCard />

      {/* Banner beta — informativo, debajo del card */}
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

// ─── FAQ ───
function FaqSection() {
  const faqs = [
    {
      q: '¿Cuánto cuesta cada apunte hoy?',
      a: 'En la beta es gratis: 50 usos compartidos entre todos los users de prueba. Cuando lancemos Premium en Q3 2026, son 3 apuntes/mes free, $0.99 por extra, o $4.99/mes ilimitado.',
    },
    {
      q: '¿Qué tan privado es mi audio?',
      a: 'Tu audio NUNCA toca disco — solo vive en memoria mientras se transcribe (~30 segundos). Después se descarta. El texto transcrito se guarda con tu apunte para que puedas regenerarlo, pero podés borrarlo cuando quieras desde tu perfil. Cumplimos la Ley de Protección de Datos Personales SV.',
    },
    {
      q: '¿Funciona si soy menor de edad?',
      a: 'Sí, desde los 12 años. Si sos menor, te pedimos confirmar que tu madre, padre o tutor sabe que estás usando Chero. Es requisito de la Ley SV.',
    },
    {
      q: '¿Para qué materias sirve?',
      a: 'Las 5 áreas oficiales de AVANZO (Lenguaje y Literatura, Matemática, Ciencias Naturales, Estudios Sociales y Ciudadanía, Inglés) y todas las materias del bachillerato general (Filosofía, Psicología, Economía, Contabilidad, Informática, Educación Artística, Moral y Cívica, entre otras). Si tu profe lo explica con voz humana en español, Chero lo procesa.',
    },
    {
      q: '¿Y si el audio sale mal?',
      a: 'Tenemos un detector de calidad: si la transcripción tiene mucho ruido (risas, muletillas), te avisamos antes de gastar tu uso. Si decidís regrabar, te devolvemos el cupo. Si el apunte salió raro, podés regenerarlo o editar el transcript sin gastar otro uso.',
    },
  ];

  return (
    <section id="faq" className="mx-auto max-w-3xl px-6 py-24 md:py-28">
      <div className="mb-10 text-center">
        <div className="mb-3 text-xs uppercase tracking-widest text-primary">
          Preguntas frecuentes
        </div>
        <h2 className="text-4xl tracking-tight md:text-5xl">
          <span className="font-black">¿Tenés </span>
          <span className="serif-italic">dudas?</span>
        </h2>
      </div>

      <div className="space-y-3">
        {faqs.map((faq) => (
          <details
            key={faq.q}
            className="group rounded-xl border border-white/10 bg-white/[0.03] p-5 transition-colors hover:border-white/20"
          >
            <summary className="cursor-pointer list-none">
              <div className="flex items-start justify-between gap-4">
                <h3 className="text-base font-semibold text-white/90">
                  {faq.q}
                </h3>
                <span
                  aria-hidden="true"
                  className="mt-0.5 text-white/40 transition-transform group-open:rotate-180"
                >
                  ▼
                </span>
              </div>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-white/65">{faq.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

// ─── CTA final ───
function CtaSection({ user }: { user: User | null }) {
  return (
    <section className="mx-auto max-w-3xl px-6 py-24 md:py-28">
      <div className="rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/15 to-primary/5 p-10 text-center md:p-14">
        <h2 className="mb-4 text-3xl tracking-tight md:text-5xl">
          <span className="font-black">Probalo con tu </span>
          <span className="serif-italic">próxima</span>
          <span className="font-black"> clase</span>
        </h2>
        <p className="mb-8 text-white/70 md:text-lg">
          50 usos gratis. Sin tarjeta. Menos de 5 minutos del login a tu
          primer apunte completo.
        </p>
        <PremiumButton variant="gradient" size="lg" asChild>
          <Link href={user ? '/capture' : '/login'}>
            {user ? 'Crear apunte ahora' : 'Empezar gratis'}
          </Link>
        </PremiumButton>
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
