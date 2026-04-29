import Link from 'next/link';
import type { User } from '@supabase/supabase-js';
import { buttonVariants } from '@/components/ui/button';
import { ambientGlow, brandGradient, orbGradient, shadows } from '@/lib/design-tokens';
import { getUserOrNull } from '@/lib/auth/require-auth';

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

      {/* Orb central */}
      <div className="relative mb-10 flex items-center justify-center">
        <div
          className="orb-pulse h-40 w-40 rounded-full md:h-52 md:w-52"
          style={{ background: orbGradient, boxShadow: shadows.glowOrb }}
        />
        <div
          className="pointer-events-none absolute h-64 w-64 rounded-full md:h-80 md:w-80"
          style={{
            background:
              'radial-gradient(circle, rgba(147, 51, 234, 0.25) 0%, transparent 60%)',
          }}
        />
      </div>

      <div className="mb-3 text-xl font-bold tracking-tight text-white/90 md:text-2xl">
        El Chero
      </div>

      {/* Tagline principal */}
      <h1 className="mb-5 max-w-3xl text-5xl font-black leading-[1.05] tracking-tight md:text-7xl">
        Tu clase, en apuntes en{' '}
        <span
          className="bg-clip-text text-transparent"
          style={{ backgroundImage: brandGradient }}
        >
          2 minutos
        </span>
        .
      </h1>

      <p className="mb-10 max-w-xl text-lg leading-relaxed text-white/60 md:text-xl">
        Grabá o subí el audio de tu clase. Recibí apuntes en español
        salvadoreño con preguntas tipo examen, flashcards y audio para repasar.
        Hecho para <strong className="text-white/80">AVANZO</strong>, parciales
        universitarios y pruebas de período.
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
              href="#como-funciona"
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
      body: 'Whisper transcribe a texto. Claude Sonnet detecta materia, modo (AVANZO / parcial / período) y genera tu apunte completo.',
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
        <h2 className="text-4xl font-black tracking-tight md:text-5xl">
          Del audio al apunte en 3 pasos
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
      body: 'Si decís "para AVANZO", genera apunte tipo AVANZO. Si decís "parcial", lo arma como parcial universitario. Sin que configures nada.',
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
        <h2 className="text-4xl font-black tracking-tight md:text-5xl">
          Hecho para estudiantes salvadoreños
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
        <h2 className="text-4xl font-black tracking-tight md:text-5xl">
          Bachillerato y universidad
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-7">
          <div className="mb-4 flex items-center gap-3">
            <span className="text-3xl" aria-hidden="true">🎓</span>
            <h3 className="text-2xl font-bold">Bachiller</h3>
          </div>
          <p className="mb-5 text-white/80">
            Si te toca AVANZO o estás en cualquier período evaluativo, Chero
            arma apuntes con el formato MINED.
          </p>
          <ul className="space-y-2 text-sm text-white/70">
            <li>★ Las 5 áreas AVANZO: Lenguaje, Matemática, Ciencias, Sociales, Inglés</li>
            <li>★ Cualquier materia de bachillerato general</li>
            <li>★ Preguntas estilo selección múltiple del MINED</li>
            <li>★ Repaso 30s para días antes del examen</li>
          </ul>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-7">
          <div className="mb-4 flex items-center gap-3">
            <span className="text-3xl" aria-hidden="true">🎒</span>
            <h3 className="text-2xl font-bold">Universitario</h3>
          </div>
          <p className="mb-5 text-white/80">
            Para parciales y finales en ESEN, UCA, UES, UDB, UTEC, UEES, UFG y
            más. 50+ materias soportadas.
          </p>
          <ul className="space-y-2 text-sm text-white/70">
            <li>· Cuantitativas: Cálculo, Estadística, Álgebra Lineal</li>
            <li>· Negocios: Microeconomía, Macroeconomía, Finanzas, Marketing</li>
            <li>· Software: Algoritmos, Bases de Datos, Inteligencia Artificial, Sistemas Operativos</li>
            <li>· Salud, Derecho, Comunicación, Humanidades</li>
          </ul>
        </div>
      </div>
    </section>
  );
}

// ─── Pricing ───
function PricingSection() {
  const tiers = [
    {
      name: 'Free',
      price: '$0',
      period: 'cada mes',
      description: 'Para probar el producto y casos eventuales.',
      features: [
        '3 apuntes nuevos por mes',
        'Voz HD del apunte',
        'Mapa mental visual',
        'Privacidad total',
      ],
      cta: 'Empezar gratis',
      ctaHref: '/login',
      highlighted: false,
    },
    {
      name: 'Pay-per-use',
      price: '$0.99',
      period: 'por apunte',
      description: 'Cuando necesitás más que el plan free, sin compromiso.',
      features: [
        'Sin suscripción',
        'Pagás solo cuando lo necesitás',
        'Mismo producto que Premium',
        'Para semanas de exámenes',
      ],
      cta: 'Próximamente',
      ctaHref: null,
      highlighted: false,
    },
    {
      name: 'Premium',
      price: '$4.99',
      period: 'por mes',
      description: 'Lo mismo que Spotify Student. Para users power.',
      features: [
        'Apuntes ilimitados',
        'Audio TTS HD',
        'Edit transcript + regenerar',
        'Soporte prioritario',
      ],
      cta: 'Próximamente',
      ctaHref: null,
      highlighted: true,
    },
  ];

  return (
    <section id="pricing" className="mx-auto max-w-6xl px-6 py-24 md:py-28">
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

      <div className="mb-10 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-center">
        <strong className="text-amber-200">🎁 Beta abierta:</strong>{' '}
        <span className="text-amber-100/90">
          50 usos gratis limitados · Lanzamiento Premium Q3 2026
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {tiers.map((tier) => (
          <div
            key={tier.name}
            className={
              tier.highlighted
                ? 'relative rounded-2xl border-2 border-primary bg-primary/10 p-7 shadow-xl shadow-primary/20'
                : 'rounded-2xl border border-white/10 bg-white/[0.03] p-7'
            }
          >
            {tier.highlighted && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-bold text-primary-foreground">
                MÁS POPULAR
              </div>
            )}
            <div className="mb-2 text-sm font-semibold uppercase tracking-wider text-white/60">
              {tier.name}
            </div>
            <div className="mb-1 flex items-baseline gap-2">
              <span className="text-4xl font-black">{tier.price}</span>
              <span className="text-sm text-white/50">{tier.period}</span>
            </div>
            <p className="mb-5 text-sm text-white/60">{tier.description}</p>
            <ul className="mb-6 space-y-2 text-sm text-white/80">
              {tier.features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <span className="mt-0.5 text-primary" aria-hidden="true">
                    ✓
                  </span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            {tier.ctaHref ? (
              <Link
                href={tier.ctaHref}
                className={buttonVariants({
                  size: 'lg',
                  variant: tier.highlighted ? 'default' : 'outline',
                  className: 'w-full',
                })}
              >
                {tier.cta}
              </Link>
            ) : (
              <button
                type="button"
                disabled
                className="w-full cursor-not-allowed rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/40"
              >
                {tier.cta}
              </button>
            )}
          </div>
        ))}
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
      a: 'Cualquier clase con voz humana en español: AVANZO (Lenguaje y Literatura, Matemática, Ciencias Naturales, Estudios Sociales y Ciudadanía, Inglés), bachillerato general, y 50+ materias universitarias (Cálculo, Microeconomía, Programación, Anatomía, Derecho Constitucional, entre otras).',
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
        <h2 className="text-4xl font-black tracking-tight md:text-5xl">
          ¿Tenés dudas?
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
