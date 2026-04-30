import Link from 'next/link';
import { ArrowLeft, Sparkles, Check } from 'lucide-react';
import { requireAuth } from '@/lib/auth/require-auth';
import { readUsage } from '@/lib/usage/check';
import { PremiumButton } from '@/components/ui/premium-button';

export const metadata = {
  title: 'Suscripciones · Chero',
};

const MAX_USES_PER_USER = Number(process.env.MAX_USES_PER_USER ?? 5);

export default async function SuscripcionPage() {
  const user = await requireAuth('/perfil/suscripcion');
  const usage = await readUsage(user.id);

  const remaining = usage.remaining_user;
  const used = usage.user_uses;

  return (
    <main className="mx-auto max-w-md px-5 pb-10 pt-6 sm:max-w-lg">
      <header className="mb-6 flex items-center gap-3">
        <Link
          href="/perfil"
          aria-label="Volver al perfil"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/70 transition-colors hover:border-white/20 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
        </Link>
        <h1 className="text-2xl font-black tracking-tight">Suscripciones</h1>
      </header>

      {/* Plan actual */}
      <section
        className="relative overflow-hidden rounded-3xl border border-white/[0.10] p-5 shadow-[0_16px_48px_rgba(147,51,234,0.20)] sm:p-6"
        style={{
          backgroundImage:
            'linear-gradient(135deg, #a855f7 0%, #ec4899 50%, #f97316 100%)',
        }}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.4), transparent 60%)',
          }}
        />
        <div className="relative">
          <div className="mb-2 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-white" aria-hidden />
            <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
              Beta
            </span>
          </div>
          <h2 className="serif-display mb-1 text-3xl text-white">
            Plan Beta
          </h2>
          <p className="mb-4 text-sm text-white/85">
            Tenés acceso completo durante el periodo beta. Sin costo.
          </p>

          {/* Progress bar de usos */}
          <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur">
            <div className="mb-2 flex items-center justify-between text-xs text-white">
              <span className="font-semibold">Apuntes este mes</span>
              <span className="font-bold tabular-nums">
                {used} / {MAX_USES_PER_USER}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full bg-white transition-all"
                style={{
                  width: `${Math.min(100, (used / MAX_USES_PER_USER) * 100)}%`,
                }}
              />
            </div>
            <div className="mt-2 text-[11px] text-white/80">
              Te quedan <strong className="text-white">{remaining}</strong>{' '}
              apunte{remaining === 1 ? '' : 's'} antes del lanzamiento Premium.
            </div>
          </div>
        </div>
      </section>

      {/* Próximos planes — Q3 2026 */}
      <section className="mt-6 space-y-3">
        <div className="text-center">
          <span className="text-xs uppercase tracking-widest text-primary">
            Próximamente
          </span>
          <h3 className="mt-2 text-2xl tracking-tight">
            <span className="font-black">Lanzamiento </span>
            <span className="serif-italic">Q3 2026</span>
          </h3>
        </div>

        <PlanRow
          name="Pay-per-use"
          price="$0.99"
          period="por apunte"
          features={[
            'Sin suscripción mensual',
            'Mismo producto que Premium',
            'Para semanas de exámenes',
          ]}
        />
        <PlanRow
          name="Premium"
          price="$4.99"
          period="por mes"
          highlighted
          features={[
            'Apuntes ilimitados',
            'Audio TTS HD',
            'Edit transcript + regenerar',
            'Plan familia $9.99 — hasta 3 hermanos',
          ]}
        />
      </section>

      {/* CTA — ver landing pricing */}
      <div className="mt-8 flex justify-center">
        <PremiumButton variant="ghost" size="md" asChild>
          <Link href="/#pricing">Ver detalle de planes</Link>
        </PremiumButton>
      </div>
    </main>
  );
}

function PlanRow({
  name,
  price,
  period,
  features,
  highlighted = false,
}: {
  name: string;
  price: string;
  period: string;
  features: string[];
  highlighted?: boolean;
}) {
  return (
    <div
      className={
        highlighted
          ? 'rounded-3xl border border-primary/30 bg-primary/[0.06] p-5 shadow-[0_8px_24px_rgba(147,51,234,0.15)] backdrop-blur'
          : 'rounded-3xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur'
      }
    >
      <div className="mb-1 flex items-center gap-2">
        <h4 className="text-base font-bold text-white">{name}</h4>
        {highlighted && (
          <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
            Más popular
          </span>
        )}
      </div>
      <div className="mb-3 flex items-baseline gap-1">
        <span className="text-2xl font-black tabular-nums text-white">
          {price}
        </span>
        <span className="text-xs text-white/50">{period}</span>
      </div>
      <ul className="space-y-1.5">
        {features.map((f) => (
          <li
            key={f}
            className="flex items-start gap-2 text-xs text-white/75"
          >
            <span
              aria-hidden
              className="mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary"
            >
              <Check className="h-2.5 w-2.5" />
            </span>
            <span>{f}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
