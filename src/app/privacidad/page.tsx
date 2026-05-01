import Link from 'next/link';

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

/**
 * /privacidad — Política de Privacidad (rediseño v5).
 *
 * Diseño v5 (Lovable hue-learn-glow):
 *   - Wrapper bg-gradient-hero + 3 blobs animados
 *   - Container max-w-[440px] mobile / md:max-w-3xl lg:max-w-4xl desktop
 *   - Headings Playfair Display (font-display-pf)
 *   - ProviderRow cards: glass blanco translúcido
 *   - Contact box (sección 10): glass-strong centrado
 *   - Footer mini legal coherente con landing
 *   - scroll-reveal animations en cada sección
 *
 * Contenido textual exactamente igual al original — solo cambia el styling.
 */
export default function PrivacidadPage() {
  return (
    <div className="bg-gradient-hero relative min-h-screen w-full overflow-hidden text-foreground">
      {/* 3 blobs animados — patrón v5 */}
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

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-[440px] flex-col md:max-w-3xl lg:max-w-4xl">
        <div className="flex flex-col gap-8 px-5 pb-12 pt-10 md:gap-10 md:px-8 md:pb-20 md:pt-16">
          <div>
            <Link
              href="/"
              className="text-sm text-white/70 transition-colors hover:text-white"
            >
              ← Volver al inicio
            </Link>
          </div>

          <header className="flex flex-col gap-2 md:gap-3">
            <h1 className="font-display-pf text-4xl font-semibold leading-tight tracking-tight text-white md:text-5xl lg:text-6xl">
              Política de Privacidad
            </h1>
            <p className="text-sm text-white/55 md:text-base">
              Última actualización: {LAST_UPDATED}
            </p>
          </header>

          <Section title="1. Quiénes somos">
            <p>
              <strong>{PROJECT_NAME}</strong> ({DOMAIN}) es una aplicación que
              convierte audios de clases en apuntes generados por inteligencia
              artificial, hecha para estudiantes salvadoreños de bachillerato y
              universidad.
            </p>
            <p>
              Responsable del tratamiento de datos:{' '}
              <strong>{RESPONSIBLE_NAME}</strong>. Contacto:{' '}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-gradient font-semibold hover:underline"
              >
                {CONTACT_EMAIL}
              </a>
              .
            </p>
            <p>
              Esta política cumple con la{' '}
              <strong>Ley para la Protección de Datos Personales</strong> de El
              Salvador (
              <a
                href="https://www.asamblea.gob.sv/sites/default/files/documents/decretos/7A4FBD85-7E1B-46BE-9408-6FC549E53E00.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gradient font-semibold hover:underline"
              >
                Decreto Legislativo N.° 144
              </a>
              , aprobado el 12 de noviembre de 2024 y vigente desde el 28 de
              noviembre de 2024). El órgano supervisor es la{' '}
              <strong>Agencia Estatal de Ciberseguridad (ACE)</strong>.
            </p>
          </Section>

          <Section title="2. Qué datos recolectamos">
            <p>Cuando usás Chero, procesamos los siguientes datos:</p>
            <ul className="ml-5 list-disc space-y-2">
              <li>
                <strong>Cuenta:</strong> tu email, un identificador único de
                Supabase Auth, y los metadatos básicos que Google provee al
                autenticarte (nombre y avatar URL si los tenés públicos). NO
                guardamos tu contraseña — Google maneja la autenticación.
              </li>
              <li>
                <strong>Perfil:</strong> tu edad (para validar mayoría de edad
                y cumplir Ley SV), tipo de estudiante (bachiller/universitario),
                institución, año, carrera (opcional), materias actuales, voz
                preferida del audio.
              </li>
              <li>
                <strong>Consentimiento parental</strong> (solo si sos menor de
                edad): el flag de que tu madre, padre o tutor está al tanto de
                que usás Chero.
              </li>
              <li>
                <strong>Audio:</strong> el archivo que subís o grabás. Se
                procesa en memoria del servidor durante la transcripción y se
                descarta inmediatamente — NUNCA toca disco persistente.
              </li>
              <li>
                <strong>Transcripción:</strong> el texto generado por Whisper a
                partir del audio. Se guarda asociado a tu apunte para que
                puedas regenerarlo o editarlo. Es eliminable.
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
                apuntes generaste, cuándo, cuánto tardó). No incluyen tu
                contenido personal — solo conteos.
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
                <strong>Personalizar el contenido:</strong> tu perfil
                (institución, materias, año) se le pasa a la IA para que
                detecte mejor el modo (AVANZO / parcial / período) y genere
                apuntes adaptados a tu contexto.
              </li>
              <li>
                <strong>Cumplir con la ley:</strong> validar tu edad, registrar
                el consentimiento parental si sos menor.
              </li>
              <li>
                <strong>Mejorar el servicio:</strong> métricas agregadas (sin
                identificarte) para entender qué funciona y qué no.
              </li>
            </ul>
            <p className="mt-4">
              <strong>NO usamos tus datos para:</strong> entrenar modelos de
              IA, vender publicidad, hacer perfilamiento, compartir con
              terceros más allá de los proveedores técnicos listados abajo.
            </p>
          </Section>

          <Section title="4. Con quién compartimos tus datos">
            <p>
              Compartimos datos con <strong>3 proveedores técnicos</strong>{' '}
              indispensables para el servicio. Ningún otro tercero recibe tus
              datos.
            </p>
            <div className="mt-4 flex flex-col gap-3">
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
              <strong>Vercel</strong> (Estados Unidos) aloja la aplicación pero
              NO tiene acceso a tu contenido — solo procesa los requests
              cifrados.
            </p>
            <p className="mt-3 text-xs text-white/55">
              <strong>Sobre transferencia internacional:</strong> los 3
              proveedores procesan datos en Estados Unidos. Operan bajo
              cláusulas estándar de protección de datos y políticas de
              privacidad equivalentes a las exigencias de la Ley salvadoreña.
              Al usar Chero, consentís expresamente esta transferencia
              internacional según el artículo 38 del Decreto Legislativo N.°
              144.
            </p>
          </Section>

          <Section title="5. Cuánto tiempo guardamos tus datos">
            <ul className="ml-5 list-disc space-y-2">
              <li>
                <strong>Audio original:</strong> 0 segundos en almacenamiento
                persistente. Vive solo en memoria durante la transcripción y
                se descarta cuando termina el request (~10-30 segundos).
              </li>
              <li>
                <strong>Transcripción + apunte:</strong> hasta que vos los
                borres. Si eliminás tu cuenta, se borran inmediatamente.
              </li>
              <li>
                <strong>Audio TTS generado:</strong> mientras el apunte exista.
                Se borra cuando borrás el apunte o regenerás el contenido.
              </li>
              <li>
                <strong>Logs operacionales:</strong> son temporales según la
                política de retención de nuestros proveedores de hosting
                (Vercel y Supabase) — entre 1 y 7 días según el plan
                contratado. Se purgan automáticamente después de ese período.
              </li>
            </ul>
          </Section>

          <Section title="6. Tus derechos (ARCO-POL)">
            <p>
              La Ley salvadoreña te reconoce 7 derechos sobre tus datos
              personales, conocidos como <strong>ARCO-POL</strong>:
            </p>
            <ul className="ml-5 list-disc space-y-2">
              <li>
                <strong>A — Acceso:</strong> ver qué datos tenemos sobre vos.
                Toda tu info está en{' '}
                <Link
                  href="/perfil"
                  className="text-gradient font-semibold hover:underline"
                >
                  /perfil
                </Link>
                ; cualquier dato adicional lo solicitás por email.
              </li>
              <li>
                <strong>R — Rectificación:</strong> corregir datos incorrectos
                (edad, materias, voz preferida, carrera) desde{' '}
                <Link
                  href="/perfil"
                  className="text-gradient font-semibold hover:underline"
                >
                  /perfil
                </Link>
                .
              </li>
              <li>
                <strong>C — Cancelación:</strong> retirar el consentimiento al
                tratamiento de un dato específico. Si querés que dejemos de
                usar algún dato sin eliminar la cuenta entera, escribinos a{' '}
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="text-gradient font-semibold hover:underline"
                >
                  {CONTACT_EMAIL}
                </a>
                .
              </li>
              <li>
                <strong>O — Oposición:</strong> oponerte al tratamiento de tus
                datos para finalidades específicas. Como NO usamos tus datos
                para marketing/perfilamiento/IA training, normalmente no
                aplica, pero tu derecho está garantizado.
              </li>
              <li>
                <strong>P — Portabilidad:</strong> recibir tus datos en formato
                estructurado para llevarlos a otro servicio. Cada apunte podés
                copiarlo desde{' '}
                <Link
                  href="/library"
                  className="text-gradient font-semibold hover:underline"
                >
                  /library
                </Link>
                ; exportación masiva a JSON disponible bajo solicitud por
                email.
              </li>
              <li>
                <strong>O — Olvido digital:</strong> eliminar de forma
                permanente tu cuenta y todos los datos asociados. Andá a{' '}
                <Link
                  href="/perfil"
                  className="text-gradient font-semibold hover:underline"
                >
                  /perfil
                </Link>{' '}
                → &quot;Eliminar mi cuenta&quot;. Esto borra atómicamente:
                cuenta auth, perfil, apuntes, transcripciones, audios TTS y
                registros de uso (sin posibilidad de recuperación).
              </li>
              <li>
                <strong>L — Limitación temporal:</strong> pedir que limitemos
                el uso de tus datos por un plazo determinado (ej: mientras se
                resuelve una disputa). Solicitar por email.
              </li>
            </ul>
            <p className="mt-4">
              Respondemos a solicitudes ARCO-POL en un plazo máximo de{' '}
              <strong>15 días hábiles</strong>, según lo establece el Decreto
              Legislativo N.° 144.
            </p>
          </Section>

          <Section title="7. Seguridad">
            <p>
              Implementamos las siguientes medidas técnicas y organizativas:
            </p>
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
              <li>Cookies httpOnly y SameSite para prevenir XSS y CSRF.</li>
              <li>
                Headers de seguridad: X-Frame-Options DENY,
                X-Content-Type-Options nosniff, Permissions-Policy restrictiva.
              </li>
              <li>
                Auditorías de código antes de cada release (revisión manual +
                IA).
              </li>
            </ul>
          </Section>

          <Section title="8. Menores de edad">
            <p>
              La edad mínima para usar Chero es <strong>12 años</strong>. Si
              sos menor de 18, te pedimos confirmar durante el onboarding que
              tu madre, padre o tutor sabe que vas a usar la aplicación. Este
              consentimiento se valida tanto en el frontend como en el backend
              antes de permitir generar apuntes.
            </p>
            <p>
              Padres/tutores: si descubrís que tu hijo/a menor está usando
              Chero sin tu consentimiento, escribinos a{' '}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-gradient font-semibold hover:underline"
              >
                {CONTACT_EMAIL}
              </a>{' '}
              y eliminamos la cuenta de inmediato.
            </p>
          </Section>

          <Section title="9. Cambios a esta política">
            <p>Si actualizamos esta política, vamos a:</p>
            <ul className="ml-5 list-disc space-y-2">
              <li>Cambiar la fecha de &quot;Última actualización&quot; arriba.</li>
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
            <div className="glass-strong mt-3 rounded-2xl p-5 text-center">
              <strong className="text-white">{RESPONSIBLE_NAME}</strong>
              <br />
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-gradient font-semibold hover:underline"
              >
                {CONTACT_EMAIL}
              </a>
            </div>
            <p>
              Si considerás que tus derechos no fueron atendidos correctamente,
              podés presentar una denuncia ante la{' '}
              <strong>Agencia Estatal de Ciberseguridad (ACE)</strong>,
              autoridad competente para protección de datos personales en El
              Salvador (Decreto Legislativo N.° 144, art. 50 y ss.).
            </p>
          </Section>
        </div>

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
              href={`mailto:${CONTACT_EMAIL}`}
              className="hover:text-white/70"
            >
              Contacto
            </a>
            <span aria-hidden>·</span>
            <span>© 2026 {PROJECT_NAME}</span>
          </p>
        </footer>
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
    <section className="scroll-reveal flex flex-col gap-2 md:gap-3">
      <h2 className="font-display-pf text-2xl font-semibold tracking-tight text-white md:text-3xl lg:text-4xl">
        {title}
      </h2>
      <div className="space-y-3 text-sm leading-relaxed text-white/85 md:text-base [&_strong]:text-white">
        {children}
      </div>
    </section>
  );
}

/**
 * ProviderRow — card glass con info de un proveedor técnico.
 * Header: nombre + link a su política. Grid 3 cols con propósito/datos/ubicación.
 */
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
    <div className="glass rounded-2xl p-4">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <strong className="text-white">{name}</strong>
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gradient text-xs font-semibold hover:underline"
        >
          Política de privacidad ↗
        </a>
      </div>
      <div className="grid grid-cols-1 gap-1 text-xs text-white/75 md:grid-cols-3">
        <div>
          <span className="text-white/45">Propósito: </span>
          {purpose}
        </div>
        <div>
          <span className="text-white/45">Datos: </span>
          {data}
        </div>
        <div>
          <span className="text-white/45">Ubicación: </span>
          {location}
        </div>
      </div>
    </div>
  );
}
