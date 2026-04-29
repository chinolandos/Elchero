import Link from 'next/link';
import { ambientGlow } from '@/lib/design-tokens';

export const metadata = {
  title: 'Términos de Uso · El Chero',
  description: 'Las reglas para usar El Chero. Beta gratis sin garantías.',
};

const LAST_UPDATED = '29 de abril de 2026';
const RESPONSIBLE_NAME = 'Milton Landos';
const CONTACT_EMAIL = 'chinolandos@gmail.com';
const PROJECT_NAME = 'El Chero';
const DOMAIN = 'elchero.app';

export default function TerminosPage() {
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

        <h1 className="mb-3 text-4xl font-black tracking-tight md:text-5xl">
          Términos de Uso
        </h1>
        <p className="mb-12 text-sm text-white/50">
          Última actualización: {LAST_UPDATED}
        </p>

        <Section title="1. Qué es El Chero">
          <p>
            <strong>{PROJECT_NAME}</strong> es una aplicación web disponible en{' '}
            {DOMAIN} que toma audios de clases académicas y genera apuntes
            estructurados (resumen, conceptos, preguntas tipo examen,
            flashcards, audio de repaso, mapa mental) usando inteligencia
            artificial.
          </p>
          <p>
            Está hecha por <strong>{RESPONSIBLE_NAME}</strong> como proyecto
            educativo para estudiantes salvadoreños, con foco en AVANZO,
            parciales universitarios y pruebas de período del bachillerato.
          </p>
        </Section>

        <Section title="2. Aceptación de los términos">
          <p>
            Al crear una cuenta o usar Chero, aceptás estos Términos de Uso y
            nuestra{' '}
            <Link href="/privacidad" className="text-primary hover:underline">
              Política de Privacidad
            </Link>
            . Si no estás de acuerdo, no podés usar el servicio.
          </p>
          <p>
            Si sos menor de edad, requerís consentimiento de tu madre, padre o
            tutor (que vos confirmás durante el onboarding).
          </p>
        </Section>

        <Section title="3. Estado actual: BETA">
          <p>
            Chero está en <strong>fase beta abierta</strong>. Esto significa:
          </p>
          <ul className="ml-5 list-disc space-y-2">
            <li>
              <strong>50 usos totales gratis</strong> compartidos entre todos los
              usuarios de prueba.
            </li>
            <li>
              <strong>5 usos máximo por persona</strong> durante la beta.
            </li>
            <li>
              <strong>Sin garantías de disponibilidad</strong> — el servicio
              puede tener interrupciones, errores, o cambios sin aviso.
            </li>
            <li>
              <strong>Sin garantías de calidad</strong> del contenido generado
              (ver sección 5).
            </li>
            <li>
              Funcionalidades pueden ser agregadas, modificadas o removidas en
              cualquier momento.
            </li>
          </ul>
          <p>
            El lanzamiento de la versión Premium está planificado para Q3 2026
            con planes pagos. Los usuarios de beta no quedan obligados a
            suscribirse.
          </p>
        </Section>

        <Section title="4. Tus responsabilidades">
          <p>Al usar Chero, te comprometés a:</p>
          <ul className="ml-5 list-disc space-y-2">
            <li>
              <strong>Tener derechos sobre el audio que subís.</strong> Solo
              podés procesar audios de clases donde vos sos parte y donde el
              uso para apuntes personales es razonable. NO subir audios
              copyrighted, conferencias privadas sin consentimiento, ni
              grabaciones de conversaciones íntimas.
            </li>
            <li>
              <strong>No abusar del servicio.</strong> No intentar hackear,
              hacer DDoS, bypasear los límites de uso, ni usar la app para
              fines ajenos al estudio personal.
            </li>
            <li>
              <strong>No subir contenido ilegal o dañino.</strong> Audios con
              contenido de odio, violencia, abuso, o cualquier cosa que viole
              las leyes salvadoreñas.
            </li>
            <li>
              <strong>Mantener la seguridad de tu cuenta.</strong> Usás Google
              OAuth, así que la seguridad de tu cuenta de Google es tu
              responsabilidad.
            </li>
            <li>
              <strong>Ser veraz</strong> con los datos del onboarding (edad,
              tipo de estudiante, institución). Esto afecta cómo Chero genera
              tus apuntes.
            </li>
          </ul>
        </Section>

        <Section title="5. Limitación de responsabilidad — IMPORTANTE">
          <p>
            Chero usa inteligencia artificial (Whisper, Claude Sonnet) para
            generar contenido. <strong>La IA puede equivocarse.</strong>
          </p>
          <p>Específicamente:</p>
          <ul className="ml-5 list-disc space-y-2">
            <li>
              La transcripción puede tener errores (palabras mal escuchadas,
              nombres propios mal escritos, fórmulas mal interpretadas).
            </li>
            <li>
              El apunte generado puede contener errores factuales,
              interpretaciones incorrectas, o detalles imprecisos.
            </li>
            <li>
              Las preguntas tipo examen son sugerencias — NO son las preguntas
              reales del examen oficial AVANZO ni de tu universidad.
            </li>
            <li>
              El audio TTS es generado por IA y no debe reemplazar a un
              profesor real.
            </li>
          </ul>
          <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-amber-200">
            <strong>⚠️ El usuario es responsable de verificar la información.</strong>{' '}
            Chero es una herramienta de estudio que complementa, NO reemplaza,
            tus apuntes propios, los materiales del profesor y los libros de
            texto. NO nos hacemos responsables por respuestas incorrectas en
            exámenes, malas calificaciones, ni decisiones tomadas basadas en el
            contenido generado.
          </p>
        </Section>

        <Section title="6. Propiedad intelectual">
          <p>
            <strong>El contenido que vos subís</strong> (audio) es tuyo. NO
            reclamamos ningún derecho sobre tu audio ni tus transcripciones.
          </p>
          <p>
            <strong>El apunte generado por la IA</strong> a partir de tu audio
            es tuyo para usar como gustés (estudio personal, compartir con
            compañeros de clase, etc.). No reclamamos derechos sobre el
            contenido generado.
          </p>
          <p>
            <strong>El código de Chero, la marca, el logo, el diseño y la
            arquitectura técnica</strong> son propiedad de {RESPONSIBLE_NAME}.
            No están licenciados para uso público sin permiso explícito.
          </p>
        </Section>

        <Section title="7. Eliminación de cuenta">
          <p>
            Podés eliminar tu cuenta en cualquier momento desde{' '}
            <Link href="/perfil" className="text-primary hover:underline">
              /perfil
            </Link>
            . Esto borra de forma permanente tu cuenta, perfil, todos los
            apuntes, transcripciones, audios TTS y registros de uso.
          </p>
          <p>
            Si abusás del servicio o violás estos términos, nos reservamos el
            derecho de suspender o eliminar tu cuenta sin reembolso.
          </p>
        </Section>

        <Section title="8. Cambios al servicio">
          <p>
            Como beta, Chero puede:
          </p>
          <ul className="ml-5 list-disc space-y-2">
            <li>Cambiar precios cuando lance Premium en Q3 2026.</li>
            <li>
              Modificar funcionalidades (mejorar, deprecar, agregar features).
            </li>
            <li>
              Cambiar los proveedores técnicos (Whisper a otro, Claude a otro)
              si mejoran calidad/costo.
            </li>
            <li>Discontinuar el servicio si no es viable comercialmente.</li>
          </ul>
          <p>
            Si la beta cierra antes del lanzamiento de Premium, no hay
            obligación de reembolso (porque la beta es gratis).
          </p>
        </Section>

        <Section title="9. Disputas y ley aplicable">
          <p>
            Estos términos se rigen por las leyes de la <strong>República de
            El Salvador</strong>. Cualquier disputa se resolverá en los
            tribunales competentes de San Salvador.
          </p>
          <p>
            Antes de cualquier acción legal, te pedimos que nos contactes en{' '}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-primary hover:underline"
            >
              {CONTACT_EMAIL}
            </a>{' '}
            para intentar resolver el problema directamente.
          </p>
          <p>
            Para reclamos específicamente sobre tratamiento de datos personales,
            la autoridad competente es la <strong>Agencia Estatal de
            Ciberseguridad (ACE)</strong> según la Ley para la Protección de
            Datos Personales (Decreto Legislativo N.° 144).
          </p>
        </Section>

        <Section title="10. Cambios a estos términos">
          <p>
            Podemos actualizar estos términos. Si los cambios son materiales
            (precios, responsabilidades, derechos), notificaremos por email a
            usuarios activos con al menos 15 días de anticipación.
          </p>
          <p>
            La fecha de "Última actualización" arriba indica cuándo fue la
            revisión más reciente.
          </p>
        </Section>

        <Section title="11. Contacto">
          <p>
            Para cualquier pregunta sobre estos términos:
          </p>
          <p className="rounded-lg border border-white/10 bg-white/5 p-4 text-center">
            <strong>{RESPONSIBLE_NAME}</strong>
            <br />
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-primary hover:underline"
            >
              {CONTACT_EMAIL}
            </a>
          </p>
        </Section>

        <p className="mt-12 text-center text-xs text-white/30">
          © 2026 {PROJECT_NAME} · Hecho en El Salvador 🇸🇻
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
    <section className="mb-10">
      <h2 className="mb-4 text-2xl font-bold tracking-tight">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-white/75 [&_strong]:text-white">
        {children}
      </div>
    </section>
  );
}
