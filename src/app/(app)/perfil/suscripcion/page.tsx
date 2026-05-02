import Link from 'next/link';
import { requireAuth } from '@/lib/auth/require-auth';
import { readUsage } from '@/lib/usage/check';
import { SuscripcionTabs } from './suscripcion-tabs';

export const metadata = {
  title: 'Suscripción · Chero',
  description: 'Mirá tu plan actual y mejoralo cuando quieras.',
};

const MAX_USES_PER_USER = Number(process.env.MAX_USES_PER_USER ?? 5);

/**
 * Página /perfil/suscripcion — vista del plan actual + upgrades disponibles.
 *
 * Estructura:
 *   1. Card "Tu plan actual" glass-strong con halo magenta — Beta gratis
 *      con counter X/5 usos restantes
 *   2. SuscripcionTabs (client) — tabs Free/Por mes/Premium con detalles
 *      de cada plan. Premium y Por mes están en "Próximamente Q3 2026".
 *   3. Banner info beta cerrando.
 *
 * Cuando el user "actualiza" plan post-Q3 2026, el current plan card mostrará
 * el plan activo con el badge correspondiente.
 */
export default async function SuscripcionPage() {
  const user = await requireAuth('/perfil/suscripcion');
  const usage = await readUsage(user.id);

  return (
    <>
      <div
        aria-hidden
        className="bg-gradient-hero pointer-events-none fixed inset-0"
      />
      <div
        aria-hidden
        className="animate-blob pointer-events-none fixed -right-32 -top-40 h-[520px] w-[520px] rounded-full opacity-70 blur-3xl"
        style={{
          background:
            'radial-gradient(circle, hsl(295 90% 55% / 0.7), transparent 70%)',
        }}
      />
      <div
        aria-hidden
        className="animate-blob pointer-events-none fixed right-1/4 top-1/3 h-[420px] w-[420px] rounded-full opacity-60 blur-3xl"
        style={{
          animationDelay: '-6s',
          background:
            'radial-gradient(circle, hsl(18 100% 56% / 0.65), transparent 70%)',
        }}
      />
      <div
        aria-hidden
        className="animate-blob pointer-events-none fixed -bottom-40 -left-20 h-[480px] w-[480px] rounded-full opacity-60 blur-3xl"
        style={{
          animationDelay: '-12s',
          background:
            'radial-gradient(circle, hsl(270 90% 60% / 0.6), transparent 70%)',
        }}
      />

      <main className="relative mx-auto w-full max-w-[440px] px-5 py-8 md:max-w-2xl md:px-8 md:py-10">
        <header className="mb-6 flex items-center justify-between gap-4 md:mb-8">
          <Link
            href="/perfil"
            className="inline-flex items-center gap-2 text-sm text-white/70 transition-colors hover:text-white"
          >
            ← Mi perfil
          </Link>
          <span className="text-xs uppercase tracking-[0.3em] text-white/55">
            Suscripción
          </span>
        </header>

        <div className="mb-6 md:mb-8">
          <h1 className="font-display-pf text-3xl font-semibold tracking-tight text-white md:text-4xl">
            Tu suscripción
          </h1>
          <p className="mt-2 text-sm text-white/75 md:text-base">
            Mirá tu plan actual y mejoralo cuando quieras.
          </p>
        </div>

        {/* Current plan card */}
        <section className="glass-strong relative mb-6 overflow-hidden rounded-3xl p-5 sm:p-6">
          <span
            aria-hidden
            className="pointer-events-none absolute -right-10 -top-16 h-40 w-40 rounded-full opacity-50 blur-3xl"
            style={{ background: 'hsl(295 90% 55% / 0.6)' }}
          />
          <div className="relative">
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-primary/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary-glow">
              <span aria-hidden>✨</span> Plan actual
            </div>
            <div className="flex items-baseline gap-2">
              <h2 className="font-display-pf text-3xl font-semibold text-white md:text-4xl">
                Beta abierta
              </h2>
              <span className="text-sm text-white/65">gratis</span>
            </div>
            <p className="mt-2 text-sm text-white/75">
              Tenés acceso completo durante la beta. 50 usos compartidos entre
              todos los usuarios; máximo {MAX_USES_PER_USER} por persona.
            </p>

            {/* Usage counter */}
            <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-white/65">
                  Usos restantes
                </div>
                <div className="font-display-pf text-2xl font-semibold text-white">
                  {usage.remaining_user} / {MAX_USES_PER_USER}
                </div>
              </div>
              <UsageBar
                value={usage.remaining_user}
                max={MAX_USES_PER_USER}
              />
            </div>
          </div>
        </section>

        {/* Upgrade tabs */}
        <SuscripcionTabs />

        {/* Info beta */}
        <p className="mt-6 text-center text-xs text-white/55">
          ⓘ Lanzamiento de Chero+ y Sprint AVANZO previsto para Q3 2026. Como user de la beta no
          quedás obligado a suscribirte cuando salga.
        </p>
      </main>
    </>
  );
}

function UsageBar({ value, max }: { value: number; max: number }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div
      className="h-2 w-24 overflow-hidden rounded-full bg-white/10"
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={`${value} de ${max} usos restantes`}
    >
      <div
        className="bg-gradient-primary h-full rounded-full transition-all"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
