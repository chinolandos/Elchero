import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { ambientGlow, orbGradient, shadows } from '@/lib/design-tokens';

export const metadata = {
  title: 'Cómo funciona · El Chero',
  description:
    'Explicación técnica y transparente de cómo Chero convierte tu audio en apuntes.',
};

export default function ComoFuncionaPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0a14] text-white">
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: ambientGlow }}
      />
      <main className="relative z-10 mx-auto max-w-3xl px-6 py-12 md:py-20">
        <div className="mb-10">
          <Link
            href="/"
            className="text-sm text-white/60 transition-colors hover:text-white"
          >
            ← Volver al inicio
          </Link>
        </div>

        {/* Hero */}
        <div className="mb-14 text-center">
          <div
            className="orb-pulse mx-auto mb-6 h-20 w-20 rounded-full"
            style={{ background: orbGradient, boxShadow: shadows.glowOrb }}
          />
          <h1 className="mb-4 text-4xl font-black tracking-tight md:text-5xl">
            ¿Cómo funciona Chero?
          </h1>
          <p className="text-lg text-white/60">
            Transparencia total: qué pasa con tu audio, qué IAs usamos, cuánto
            cuesta hacerlo.
          </p>
        </div>

        {/* Pipeline visual */}
        <Section title="El flujo completo">
          <p>
            Cuando le das al botón "Generar apunte", esto es lo que pasa
            literalmente:
          </p>
          <ol className="space-y-4">
            <Step
              n="1"
              title="Tu audio entra al servidor"
              detail="El archivo viaja cifrado (HTTPS) a Vercel, donde corre el endpoint /api/process. Vercel está en Estados Unidos, costa este. NO guardamos el audio en disco — solo vive en memoria del servidor durante el request."
              tech="Vercel Functions + HTTPS/TLS"
            />
            <Step
              n="2"
              title="Validamos tu uso"
              detail="El servidor verifica que tu cuenta esté autenticada y que tengas usos disponibles (5 max por persona en la beta). El contador es atómico — no se puede hacer doble-click para gastar 2 usos."
              tech="Supabase RLS + RPC con FOR UPDATE"
            />
            <Step
              n="3"
              title="Whisper transcribe a texto"
              detail="El audio se manda a OpenAI Whisper (modelo gpt-4o-mini-transcribe, $0.003/min). En 10-30 segundos te devuelve la transcripción en español. Después de esto, descartamos el audio inmediatamente."
              tech="OpenAI gpt-4o-mini-transcribe"
            />
            <Step
              n="4"
              title="Haiku detecta el contexto"
              detail="Claude Haiku 4.5 lee los primeros 4000 chars de la transcripción + tu perfil (institución, año, materias) y decide: ¿es modo AVANZO? ¿parcial? ¿período? ¿qué materia? Cuesta $0.0005."
              tech="Anthropic Claude Haiku 4.5"
            />
            <Step
              n="5"
              title="Sonnet genera el apunte"
              detail="Claude Sonnet 4.6 con un Knowledge Base de 10K tokens cacheado (90% off por prompt caching) genera: resumen, conceptos con ejemplos, preguntas tipo examen, flashcards, repaso 30s, mapa mental Mermaid. Cuesta ~$0.10."
              tech="Anthropic Claude Sonnet 4.6 + prompt caching"
            />
            <Step
              n="6"
              title="TTS convierte a audio"
              detail="OpenAI gpt-4o-mini-tts toma el texto del apunte y lo convierte en audio HD natural (voz Nova por default, configurable). Cuesta $0.06 por apunte."
              tech="OpenAI gpt-4o-mini-tts"
            />
            <Step
              n="7"
              title="Te entregamos todo"
              detail="El apunte queda guardado en tu cuenta. Audio TTS en bucket público (URL no listable). Mapa mental Mermaid renderizado client-side. Listo para estudiar."
              tech="Supabase Postgres + Storage"
            />
          </ol>
          <p className="mt-6 rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm">
            <strong className="text-primary">Tiempo total:</strong> 1-3 minutos
            según largo del audio. <strong>Costo total para nosotros:</strong>{' '}
            $0.16 por apunte.
          </p>
        </Section>

        <Section title="¿Por qué solo 50 usos en la beta?">
          <p>
            La beta tiene 50 usos compartidos entre todos los usuarios de
            prueba. Es un límite intencional por 3 razones:
          </p>
          <ul className="ml-5 list-disc space-y-2">
            <li>
              <strong>Validar producto-mercado.</strong> Queremos data real:
              ¿la gente vuelve a usarlo? ¿qué materias funcionan mejor? ¿el
              voseo SV es lo que esperaban?
            </li>
            <li>
              <strong>Cuidar el budget de la beta.</strong> 50 usos × $0.16 =
              $8 USD en IA. Es lo que sale de un presupuesto auto-financiado de
              estudiante para validar la idea.
            </li>
            <li>
              <strong>Crear scarcity productiva.</strong> Si te toca uno de los
              50 usos, es probable que lo uses para algo importante (un parcial
              real, AVANZO real). Eso nos da feedback más valioso que 1000 usos
              de gente que solo prueba por curiosidad.
            </li>
          </ul>
          <p>
            Los 50 usos se reparten en orden de llegada hasta que se agotan.
            Después abrimos Premium en Q3 2026.
          </p>
        </Section>

        <Section title="¿Qué pasa si el audio sale mal?">
          <p>
            Tres escenarios típicos en clases reales y cómo los manejamos:
          </p>
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
        </Section>

        <Section title="¿Cuánto puedo confiar en el contenido?">
          <p>
            Chero usa IA, y la IA puede equivocarse. Por eso recomendamos:
          </p>
          <ul className="ml-5 list-disc space-y-2">
            <li>
              <strong>Verificar fechas, nombres propios y fórmulas</strong> con
              tu profe o el libro de texto antes de un examen.
            </li>
            <li>
              <strong>Tratá las preguntas tipo examen como práctica</strong>,
              no como las preguntas reales del AVANZO o tu parcial.
            </li>
            <li>
              <strong>Las flashcards son sugerencias</strong> de qué memorizar —
              vos decidís si esa info es prioritaria o no.
            </li>
            <li>
              <strong>El mapa mental</strong> es una visualización auto-generada
              — si ves que falta un concepto importante, regenerá o editá.
            </li>
          </ul>
          <p>
            Chero es una <strong>herramienta de estudio</strong>, no un
            sustituto del profesor o del libro.
          </p>
        </Section>

        <Section title="Privacidad en una línea">
          <p>
            Tu audio se borra apenas se transcribe. Tu transcripción y apuntes
            quedan en tu cuenta hasta que vos los borres. Si eliminás tu cuenta,
            todo se va. Detalle completo:{' '}
            <Link href="/privacidad" className="text-primary hover:underline">
              Política de Privacidad
            </Link>
            .
          </p>
        </Section>

        <div className="mt-14 rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/15 to-primary/5 p-10 text-center">
          <h2 className="mb-4 text-3xl font-black">
            ¿Listo para probarlo?
          </h2>
          <p className="mb-6 text-white/70">
            50 usos gratis. Sin tarjeta. Sin descargas.
          </p>
          <Link
            href="/login"
            className={buttonVariants({ size: 'lg', className: 'px-8' })}
          >
            Empezar gratis
          </Link>
        </div>

        <p className="mt-12 text-center text-xs text-white/30">
          © 2026 El Chero · Hecho en El Salvador 🇸🇻
        </p>
      </main>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-12">
      <h2 className="mb-4 text-2xl font-bold tracking-tight md:text-3xl">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-white/75 [&_strong]:text-white">
        {children}
      </div>
    </section>
  );
}

function Step({
  n,
  title,
  detail,
  tech,
}: {
  n: string;
  title: string;
  detail: string;
  tech: string;
}) {
  return (
    <li className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
      <div className="mb-2 flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
          {n}
        </span>
        <h3 className="text-lg font-bold">{title}</h3>
      </div>
      <p className="mb-2 text-sm text-white/70">{detail}</p>
      <p className="text-xs text-white/40">⚙ {tech}</p>
    </li>
  );
}

function Scenario({ title, solution }: { title: string; solution: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
      <h3 className="mb-2 text-base font-semibold">{title}</h3>
      <p className="text-sm text-white/65">{solution}</p>
    </div>
  );
}
