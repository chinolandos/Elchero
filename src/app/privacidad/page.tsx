import Link from 'next/link';
import { ambientGlow } from '@/lib/design-tokens';

export const metadata = {
  title: 'Política de Privacidad · El Chero',
  description:
    'Cómo recolectamos, usamos y protegemos tus datos. Cumplimiento de la Ley de Protección de Datos Personales de El Salvador.',
};

const LAST_UPDATED = '29 de abril de 2026';
const RESPONSIBLE_NAME = 'Milton Landos';
const CONTACT_EMAIL = 'chinolandos@gmail.com';
const PROJECT_NAME = 'El Chero';
const DOMAIN = 'elchero.app';

export default function PrivacidadPage() {
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
          Política de Privacidad
        </h1>
        <p className="mb-12 text-sm text-white/50">
          Última actualización: {LAST_UPDATED}
        </p>

        <Section title="1. Quiénes somos">
          <p>
            <strong>{PROJECT_NAME}</strong> ({DOMAIN}) es una aplicación que
            convierte audios de clases en apuntes generados por inteligencia
            artificial, hecha para estudiantes salvadoreños de bachillerato y
            universidad.
          </p>
          <p>
            Responsable del tratamiento de datos: <strong>{RESPONSIBLE_NAME}</strong>.
            Contacto:{' '}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-primary underline-offset-4 hover:underline"
            >
              {CONTACT_EMAIL}
            </a>.
          </p>
          <p>
            Esta política cumple con la <strong>Ley de Protección de Datos
            Personales de El Salvador</strong> (Decreto Legislativo No. 91,
            vigente desde noviembre de 2024).
          </p>
        </Section>

        <Section title="2. Qué datos recolectamos">
          <p>Cuando usás Chero, procesamos los siguientes datos:</p>
          <ul className="ml-5 list-disc space-y-2">
            <li>
              <strong>Cuenta:</strong> tu email (vía Google OAuth) y un
              identificador único asignado por Supabase Auth. NO guardamos tu
              contraseña — Google maneja la autenticación.
            </li>
            <li>
              <strong>Perfil:</strong> tu edad (para validar mayoría de edad y
              cumplir Ley SV), tipo de estudiante (bachiller/universitario),
              institución, año, carrera (opcional), materias actuales, voz
              preferida del audio.
            </li>
            <li>
              <strong>Consentimiento parental</strong> (solo si sos menor de
              edad): el flag de que tu madre, padre o tutor está al tanto de que
              usás Chero.
            </li>
            <li>
              <strong>Audio:</strong> el archivo que subís o grabás. Se procesa
              en memoria del servidor durante la transcripción y se descarta
              inmediatamente — NUNCA toca disco persistente.
            </li>
            <li>
              <strong>Transcripción:</strong> el texto generado por Whisper a
              partir del audio. Se guarda asociado a tu apunte para que puedas
              regenerarlo o editarlo. Es eliminable.
            </li>
            <li>
              <strong>Apunte generado:</strong> resumen, conceptos, preguntas,
              flashcards y demás contenido generado por IA. Se guarda en tu
              cuenta hasta que lo borres.
            </li>
            <li>
              <strong>Audio TTS:</strong> el audio sintetizado del apunte. Se
              guarda en almacenamiento seguro asociado a tu apunte.
            </li>
            <li>
              <strong>Cookies técnicas:</strong> sesión de autenticación de
              Supabase Auth. NO usamos cookies de tracking ni publicidad.
            </li>
            <li>
              <strong>Logs operacionales:</strong> métricas de uso (cuántos
              apuntes generaste, cuándo, cuánto tardó). No incluyen tu contenido
              personal — solo conteos.
            </li>
          </ul>
        </Section>

        <Section title="3. Cómo usamos tus datos">
          <ul className="ml-5 list-disc space-y-2">
            <li>
              <strong>Generar tu apunte:</strong> el audio pasa por Whisper
              (transcripción) y Claude Sonnet (generación). Estas son
              integraciones técnicas necesarias para que la app funcione.
            </li>
            <li>
              <strong>Personalizar el contenido:</strong> tu perfil (institución,
              materias, año) se le pasa a la IA para que detecte mejor el modo
              (AVANZO / parcial / período) y genere apuntes adaptados a tu
              contexto.
            </li>
            <li>
              <strong>Cumplir con la ley:</strong> validar tu edad, registrar el
              consentimiento parental si sos menor.
            </li>
            <li>
              <strong>Mejorar el servicio:</strong> métricas agregadas (sin
              identificarte) para entender qué funciona y qué no.
            </li>
          </ul>
          <p className="mt-4">
            <strong>NO usamos tus datos para:</strong> entrenar modelos de IA,
            vender publicidad, hacer perfilamiento, compartir con terceros más
            allá de los proveedores técnicos listados abajo.
          </p>
        </Section>

        <Section title="4. Con quién compartimos tus datos">
          <p>
            Compartimos datos con <strong>3 proveedores técnicos</strong>{' '}
            indispensables para el servicio. Ningún otro tercero recibe tus
            datos.
          </p>
          <div className="space-y-4">
            <ProviderRow
              name="Supabase (Postgres + Auth + Storage)"
              purpose="Base de datos, autenticación, almacenamiento de audios TTS"
              data="Tu cuenta, perfil, apuntes, transcripciones, audios generados"
              location="Estados Unidos"
              link="https://supabase.com/privacy"
            />
            <ProviderRow
              name="OpenAI (Whisper + TTS)"
              purpose="Transcripción de tu audio y generación del audio TTS"
              data="El audio se envía a OpenAI para transcribir. Por política de OpenAI, los inputs del API NO se usan para entrenar modelos."
              location="Estados Unidos"
              link="https://openai.com/policies/privacy-policy"
            />
            <ProviderRow
              name="Anthropic (Claude Sonnet + Haiku)"
              purpose="Detectar contexto académico y generar el apunte"
              data="La transcripción del audio + tu perfil se envían a Claude. Por política de Anthropic, los inputs del API NO se usan para entrenar modelos."
              location="Estados Unidos"
              link="https://www.anthropic.com/legal/privacy"
            />
          </div>
          <p className="mt-4">
            <strong>Vercel</strong> (Estados Unidos) aloja la aplicación pero NO
            tiene acceso a tu contenido — solo procesa los requests cifrados.
          </p>
        </Section>

        <Section title="5. Cuánto tiempo guardamos tus datos">
          <ul className="ml-5 list-disc space-y-2">
            <li>
              <strong>Audio original:</strong> 0 segundos en almacenamiento
              persistente. Vive solo en memoria durante la transcripción y se
              descarta cuando termina el request (~10-30 segundos).
            </li>
            <li>
              <strong>Transcripción + apunte:</strong> hasta que vos los borres.
              Si eliminás tu cuenta, se borran inmediatamente.
            </li>
            <li>
              <strong>Audio TTS generado:</strong> mientras el apunte exista. Se
              borra cuando borrás el apunte o regenerás el contenido.
            </li>
            <li>
              <strong>Logs operacionales:</strong> 90 días en Vercel y Supabase
              (estándar industry). Después se purgan.
            </li>
          </ul>
        </Section>

        <Section title="6. Tus derechos">
          <p>Como titular de tus datos personales, tenés derecho a:</p>
          <ul className="ml-5 list-disc space-y-2">
            <li>
              <strong>Acceder</strong> a los datos que tenemos sobre vos. En tu
              perfil podés ver toda la información asociada a tu cuenta.
            </li>
            <li>
              <strong>Rectificar</strong> tus datos (cambiar edad, materias,
              voz preferida, etc.) desde la página{' '}
              <Link href="/perfil" className="text-primary hover:underline">
                /perfil
              </Link>.
            </li>
            <li>
              <strong>Eliminar</strong> tu cuenta y todos los datos asociados
              ("derecho al olvido"). Andá a{' '}
              <Link href="/perfil" className="text-primary hover:underline">
                /perfil
              </Link>{' '}
              → Eliminar mi cuenta. Esto borra de forma permanente: cuenta de
              Supabase Auth, perfil, todos los apuntes, transcripciones, audios
              TTS y registros de uso.
            </li>
            <li>
              <strong>Portar</strong> tus apuntes — en cada apunte podés copiar
              el texto y los conceptos. Soporte de exportación a JSON viene
              próximamente.
            </li>
            <li>
              <strong>Oponerte</strong> al tratamiento. Si no querés que
              procesemos un dato específico, escribinos a{' '}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-primary hover:underline"
              >
                {CONTACT_EMAIL}
              </a>.
            </li>
          </ul>
          <p className="mt-4">
            Respondemos solicitudes en un plazo máximo de{' '}
            <strong>15 días hábiles</strong>.
          </p>
        </Section>

        <Section title="7. Seguridad">
          <p>Implementamos las siguientes medidas técnicas y organizativas:</p>
          <ul className="ml-5 list-disc space-y-2">
            <li>HTTPS/TLS obligatorio en todas las conexiones.</li>
            <li>HSTS preload activado (TLD .app fuerza HTTPS por defecto).</li>
            <li>
              Row Level Security (RLS) en Postgres — un usuario nunca puede
              acceder a datos de otro usuario.
            </li>
            <li>
              Tokens firmados HMAC para flujos críticos (anti-replay attacks).
            </li>
            <li>
              Cookies httpOnly y SameSite para prevenir XSS y CSRF.
            </li>
            <li>
              Headers de seguridad: X-Frame-Options DENY, X-Content-Type-Options
              nosniff, Permissions-Policy restrictiva.
            </li>
            <li>
              Auditorías de código antes de cada release (revisión manual + IA).
            </li>
          </ul>
        </Section>

        <Section title="8. Menores de edad">
          <p>
            La edad mínima para usar Chero es <strong>12 años</strong>. Si sos
            menor de 18, te pedimos confirmar durante el onboarding que tu
            madre, padre o tutor sabe que vas a usar la aplicación. Este
            consentimiento se valida tanto en el frontend como en el backend
            antes de permitir generar apuntes.
          </p>
          <p>
            Padres/tutores: si descubrís que tu hijo/a menor está usando Chero
            sin tu consentimiento, escribinos a{' '}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-primary hover:underline"
            >
              {CONTACT_EMAIL}
            </a>{' '}
            y eliminamos la cuenta de inmediato.
          </p>
        </Section>

        <Section title="9. Cambios a esta política">
          <p>
            Si actualizamos esta política, vamos a:
          </p>
          <ul className="ml-5 list-disc space-y-2">
            <li>Cambiar la fecha de "Última actualización" arriba.</li>
            <li>
              Notificar por email a usuarios activos si los cambios son
              materiales (ej: nuevos proveedores, cambio en cuánto tiempo
              guardamos datos).
            </li>
            <li>
              Mantener la versión anterior accesible si la pedís por email.
            </li>
          </ul>
        </Section>

        <Section title="10. Contacto y reclamos">
          <p>
            Si tenés cualquier pregunta sobre esta política, sobre cómo
            manejamos tus datos, o querés ejercer alguno de tus derechos,
            escribinos a:
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
          <p>
            Si considerás que tus derechos no fueron atendidos correctamente,
            podés presentar una denuncia ante la <strong>Defensoría del
            Consumidor</strong> de El Salvador, autoridad competente para
            protección de datos personales.
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

function ProviderRow({
  name,
  purpose,
  data,
  location,
  link,
}: {
  name: string;
  purpose: string;
  data: string;
  location: string;
  link: string;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <strong className="text-white">{name}</strong>
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary hover:underline"
        >
          Política de privacidad ↗
        </a>
      </div>
      <div className="grid grid-cols-1 gap-1 text-xs text-white/60 sm:grid-cols-3">
        <div>
          <span className="text-white/40">Propósito: </span>
          {purpose}
        </div>
        <div>
          <span className="text-white/40">Datos: </span>
          {data}
        </div>
        <div>
          <span className="text-white/40">Ubicación: </span>
          {location}
        </div>
      </div>
    </div>
  );
}
