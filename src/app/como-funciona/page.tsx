import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { StepsCarousel } from './steps-carousel';

// Datos del flujo completo (extraídos para pasarlos al carousel client).
// Mantengo los textos exactos del original — solo cambia el contenedor visual.
const FLOW_STEPS = [
  {
    n: '1',
    title: 'Tu audio entra al servidor',
    detail:
      'El archivo viaja cifrado (HTTPS) a Vercel, donde corre el endpoint /api/process. Vercel está en Estados Unidos, costa este. NO guardamos el audio en disco — solo vive en memoria del servidor durante el request.',
    tech: 'Vercel Functions + HTTPS/TLS',
  },
  {
    n: '2',
    title: 'Validamos tu uso',
    detail:
      'El servidor verifica que tu cuenta esté autenticada y que tengas usos disponibles (5 max por persona en la beta). El contador es atómico — no se puede hacer doble-click para gastar 2 usos.',
    tech: 'Supabase RLS + RPC con FOR UPDATE',
  },
  {
    n: '3',
    title: 'Whisper transcribe a texto',
    detail:
      'El audio se manda a OpenAI Whisper (modelo gpt-4o-mini-transcribe). En 10-30 segundos te devuelve la transcripción en español. Después de esto, descartamos el audio inmediatamente.',
    tech: 'OpenAI gpt-4o-mini-transcribe',
  },
  {
    n: '4',
    title: 'Haiku detecta el contexto',
    detail:
      'Claude Haiku 4.5 lee los primeros 4000 chars de la transcripción + tu perfil (institución, año, materias) y decide: ¿es modo AVANZO? ¿parcial? ¿período? ¿qué materia?',
    tech: 'Anthropic Claude Haiku 4.5',
  },
  {
    n: '5',
    title: 'Sonnet genera el apunte',
    detail:
      'Claude Sonnet 4.6 con un Knowledge Base de 10K tokens cacheado (90% off por prompt caching) genera: resumen, conceptos con ejemplos, preguntas tipo examen, flashcards, repaso 30s, mapa mental Mermaid.',
    tech: 'Anthropic Claude Sonnet 4.6 + prompt caching',
  },
  {
    n: '6',
    title: 'TTS convierte a audio',
    detail:
      'OpenAI gpt-4o-mini-tts toma el texto del apunte y lo convierte en audio HD natural (voz Nova por default, configurable).',
    tech: 'OpenAI gpt-4o-mini-tts',
  },
  {
    n: '7',
    title: 'Te entregamos todo',
    detail:
      'El apunte queda guardado en tu cuenta. Audio TTS en bucket público (URL no listable). Mapa mental Mermaid renderizado client-side. Listo para estudiar.',
    tech: 'Supabase Postgres + Storage',
  },
];

export const metadata = {
  title: 'Cómo funciona · El Chero',
  description:
    'Explicación técnica y transparente de cómo Chero convierte tu audio en apuntes.',
};

/**
 * /como-funciona — página educativa con el mismo diseño v5 que la landing.
 *
 * Layout (Lovable hue-learn-glow):
 *   - Wrapper bg-gradient-hero + 3 blobs animados (parallax sutil)
 *   - Container max-w-[440px] mobile-first
 *   - Playfair Display en todos los headings (font-display-pf)
 *   - Glass cards blanco translúcido en steps, features, FAQ
 *   - Step numbers con gradient magenta-violet
 *   - Final CTA glass-strong con halo magenta
 *   - Footer mini legal (Privacidad/Términos/Contacto)
 */
export default function ComoFuncionaPage() {
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

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-[440px] flex-col">
        <div className="flex flex-col gap-10 px-5 pb-12 pt-10">
          {/* Volver al inicio */}
          <div>
            <Link
              href="/"
              className="text-sm text-white/70 transition-colors hover:text-white"
            >
              ← Volver al inicio
            </Link>
          </div>

          {/* Hero */}
          <section className="flex flex-col items-center gap-6 text-center">
            <div className="relative grid place-items-center">
              <span
                aria-hidden
                className="absolute h-56 w-56 rounded-full opacity-70 blur-3xl"
                style={{
                  background:
                    'radial-gradient(circle, hsl(270 90% 60% / 0.6), transparent 70%)',
                }}
              />
              <div
                aria-hidden
                className="animate-float-orb relative h-32 w-32 rounded-full"
                style={{
                  background:
                    'radial-gradient(circle at 35% 30%, hsl(270 90% 60%) 0%, hsl(295 90% 55%) 45%, hsl(18 100% 56%) 100%)',
                  boxShadow:
                    'inset 0 6px 20px hsl(0 0% 100% / 0.25), inset 0 -10px 30px hsl(0 0% 0% / 0.4), 0 30px 80px -20px hsl(295 90% 55% / 0.6)',
                }}
              />
            </div>
            <div className="flex flex-col gap-3">
              <h1 className="font-display-pf text-4xl font-semibold leading-tight tracking-tight text-white">
                ¿Cómo funciona{' '}
                <span className="text-gradient italic">Chero</span>?
              </h1>
              <p className="text-sm text-white/75">
                Transparencia total: qué pasa con tu audio, qué IAs usamos,
                cuánto cuesta hacerlo.
              </p>
            </div>
          </section>

          {/* Pipeline — carrusel horizontal swipeable (mobile + drag mouse) */}
          <Section title="El flujo completo">
            <p>
              Cuando le das al botón &quot;Generar apunte&quot;, esto es lo que
              pasa literalmente. <span className="text-white/55">Deslizá →</span>
            </p>
            <div className="mt-4">
              <StepsCarousel steps={FLOW_STEPS} />
            </div>
          </Section>

          {/* Beta */}
          <Section title="¿Por qué solo 50 usos en la beta?">
            <p>
              La beta tiene 50 usos compartidos entre todos los usuarios de
              prueba. Es un límite intencional por 3 razones:
            </p>
            <ul className="ml-5 mt-3 list-disc space-y-2">
              <li>
                <strong className="text-white">Validar producto-mercado.</strong>{' '}
                Queremos data real: ¿la gente vuelve a usarlo? ¿qué materias
                funcionan mejor? ¿el voseo SV es lo que esperaban?
              </li>
              <li>
                <strong className="text-white">
                  Cuidar el budget de la beta.
                </strong>{' '}
                Es lo que sale de un presupuesto auto-financiado de estudiante
                para validar la idea.
              </li>
              <li>
                <strong className="text-white">
                  Crear scarcity productiva.
                </strong>{' '}
                Si te toca uno de los 50 usos, es probable que lo uses para
                algo importante (un parcial real, AVANZO real). Eso nos da
                feedback más valioso que 1000 usos de gente que solo prueba por
                curiosidad.
              </li>
            </ul>
            <p className="mt-3">
              Los 50 usos se reparten en orden de llegada hasta que se agotan.
              Después abrimos Premium en Q3 2026.
            </p>
          </Section>

          {/* Audio scenarios */}
          <Section title="¿Qué pasa si el audio sale mal?">
            <p>
              Tres escenarios típicos en clases reales y cómo los manejamos:
            </p>
            <div className="mt-4 flex flex-col gap-3">
              <Scenario
                title="🎙 Estás en la fila de atrás y el profe se escucha bajo"
                solution="Whisper transcribe lo que pueda. Si la transcripción tiene mucho ruido o sale incompleta, nuestro detector de calidad te avisa antes de gastar Sonnet — podés decidir regrabar y te devolvemos el uso."
              />
              <Scenario
                title="😂 Tus compañeros están haciendo chistes"
                solution="Si las risas son intermitentes, Sonnet ignora las partes anómalas y saca los conceptos académicos limpios. Si las risas dominan toda la grabación, el detector lo marca como very_noisy y te recomienda regrabar."
              />
              <Scenario
                title="🤖 El apunte sale con errores"
                solution="Podés editar el transcript directamente y regenerar el apunte (sin gastar otro uso). O simplemente regenerar pidiéndole a Sonnet otro intento — la IA tiene aleatoriedad, a veces el segundo apunte sale mejor."
              />
            </div>
          </Section>

          {/* Confianza */}
          <Section title="¿Cuánto puedo confiar en el contenido?">
            <p>Chero usa IA, y la IA puede equivocarse. Por eso recomendamos:</p>
            <ul className="ml-5 mt-3 list-disc space-y-2">
              <li>
                <strong className="text-white">
                  Verificar fechas, nombres propios y fórmulas
                </strong>{' '}
                con tu profe o el libro de texto antes de un examen.
              </li>
              <li>
                <strong className="text-white">
                  Tratá las preguntas tipo examen como práctica
                </strong>
                , no como las preguntas reales del AVANZO o tu parcial.
              </li>
              <li>
                <strong className="text-white">
                  Las flashcards son sugerencias
                </strong>{' '}
                de qué memorizar — vos decidís si esa info es prioritaria o no.
              </li>
              <li>
                <strong className="text-white">El mapa mental</strong> es una
                visualización auto-generada — si ves que falta un concepto
                importante, regenerá o editá.
              </li>
            </ul>
            <p className="mt-3">
              Chero es una{' '}
              <strong className="text-white">herramienta de estudio</strong>, no
              un sustituto del profesor o del libro.
            </p>
          </Section>

          {/* Privacidad */}
          <Section title="Privacidad en una línea">
            <p>
              Tu audio se borra apenas se transcribe. Tu transcripción y apuntes
              quedan en tu cuenta hasta que vos los borres. Si eliminás tu
              cuenta, todo se va. Detalle completo:{' '}
              <Link
                href="/privacidad"
                className="text-gradient font-semibold hover:underline"
              >
                Política de Privacidad
              </Link>
              .
            </p>
          </Section>

          {/* Features */}
          <Section title="Hecho para estudiantes salvadoreños">
            <div className="mt-4 grid grid-cols-2 gap-3">
              {[
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
                  body: 'Si tu audio tiene mucho ruido (risas, muletillas), te avisamos antes de gastar tu uso. Te devolvemos el cupo si decidís regrabar.',
                  icon: '👂',
                },
                {
                  title: 'Privacy-first',
                  body: 'Tu audio se borra apenas se transcribe. Podés eliminar tu cuenta y todos tus apuntes desde tu perfil cuando quieras.',
                  icon: '🔒',
                },
              ].map((feat) => (
                <div
                  key={feat.title}
                  className="glass flex flex-col gap-2 rounded-2xl p-4"
                >
                  <div className="text-2xl" aria-hidden="true">
                    {feat.icon}
                  </div>
                  <h3 className="text-xs font-semibold leading-tight text-white">
                    {feat.title}
                  </h3>
                  <p className="text-[11px] leading-snug text-white/70">
                    {feat.body}
                  </p>
                </div>
              ))}
            </div>
          </Section>

          {/* ¿Es para mí? */}
          <Section title="¿Es para mí?">
            <p>
              Hecho para bachilleres salvadoreños. Primero, segundo año, AVANZO,
              exámenes de período. Todo cubierto.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-3">
              {/* AVANZO destacado */}
              <div
                className="glass-strong relative overflow-hidden rounded-2xl p-5"
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-50 blur-3xl"
                  style={{
                    background:
                      'radial-gradient(circle, hsl(295 90% 55% / 0.7), transparent 70%)',
                  }}
                />
                <div className="relative">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-2xl" aria-hidden="true">🎯</span>
                    <h3 className="font-display-pf text-xl font-semibold text-white">
                      AVANZO
                    </h3>
                  </div>
                  <p className="mb-3 text-xs text-white/85">
                    La prueba nacional MINED para 2° año. Apuntes con el
                    formato exacto: selección múltiple, 5 áreas oficiales,
                    preguntas del estilo del examen real.
                  </p>
                  <ul className="space-y-1 text-xs text-white/90">
                    <li>★ Lenguaje y Literatura</li>
                    <li>★ Matemática</li>
                    <li>★ Ciencias Naturales</li>
                    <li>★ Estudios Sociales y Ciudadanía</li>
                    <li>★ Inglés</li>
                  </ul>
                </div>
              </div>

              {/* Períodos */}
              <div className="glass rounded-2xl p-5">
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-2xl" aria-hidden="true">📅</span>
                  <h3 className="font-display-pf text-xl font-semibold text-white">
                    Exámenes de período
                  </h3>
                </div>
                <p className="mb-3 text-xs text-white/85">
                  Los 4 períodos evaluativos del año, sea cual sea tu materia.
                  Apuntes específicos a tu profe y a tu colegio.
                </p>
                <ul className="space-y-1 text-xs text-white/75">
                  <li>· Filosofía, Psicología, Economía</li>
                  <li>· Educación Artística, Educación Física</li>
                  <li>· Moral, Urbanidad y Cívica</li>
                  <li>· Informática, Contabilidad</li>
                  <li>· Cualquier materia con voz humana en español</li>
                </ul>
              </div>
            </div>
          </Section>

          {/* FAQ */}
          <Section title="Preguntas frecuentes">
            <div className="mt-4 flex flex-col gap-2">
              {[
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
              ].map((faq) => (
                <details
                  key={faq.q}
                  id="faq"
                  className="glass group overflow-hidden rounded-2xl p-4"
                >
                  <summary className="cursor-pointer list-none">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-white">{faq.q}</p>
                      <span
                        aria-hidden="true"
                        className="shrink-0 text-white/60 transition-transform group-open:rotate-180"
                      >
                        ▼
                      </span>
                    </div>
                  </summary>
                  <p className="mt-3 text-xs leading-relaxed text-white/75">
                    {faq.a}
                  </p>
                </details>
              ))}
            </div>
          </Section>

          {/* Final CTA glass-strong con halo magenta (Lovable) */}
          <section className="scroll-reveal glass-strong relative flex flex-col items-center gap-3 overflow-hidden rounded-3xl p-6 text-center">
            <span
              aria-hidden
              className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full opacity-70 blur-3xl"
              style={{
                background: 'hsl(295 90% 55% / 0.7)',
              }}
            />
            <div className="relative flex flex-col items-center gap-3">
              <h3 className="font-display-pf text-2xl font-semibold text-white">
                ¿Listo para probarlo?
              </h3>
              <p className="text-xs text-white/75">
                50 usos gratis. Sin tarjeta. Sin descargas.
              </p>
              <Link
                href="/login"
                className={buttonVariants({
                  variant: 'premium',
                  size: 'pill',
                  className: 'mt-2',
                })}
              >
                Empezar gratis
                <ArrowRight aria-hidden className="h-4 w-4" />
              </Link>
            </div>
          </section>
        </div>

        {/* Footer mini legal */}
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
      </main>
    </div>
  );
}

// ─── Helpers (locales) ───

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  // scroll-reveal: la sección hace fade-in + slide-up cuando entra al
  // viewport (CSS scroll-driven animations, sin JS). Da feel de orden:
  // las secciones aparecen una a una mientras el user scrollea.
  return (
    <section className="scroll-reveal flex flex-col gap-2">
      <h2 className="font-display-pf text-2xl font-semibold tracking-tight text-white">
        {title}
      </h2>
      <div className="space-y-3 text-sm leading-relaxed text-white/85">
        {children}
      </div>
    </section>
  );
}

function Scenario({ title, solution }: { title: string; solution: string }) {
  return (
    <div className="glass rounded-2xl p-4">
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      <p className="mt-2 text-xs leading-relaxed text-white/75">{solution}</p>
    </div>
  );
}
