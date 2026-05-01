'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, Sparkles } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * LandingPricing — sección de precios con tab switcher (rediseño Lovable).
 *
 * Estructura:
 *   - Heading "Empezá gratis" con "gratis" en text-gradient italic Fraunces
 *   - Switcher pill 3-cols (Free / Por mes / Premium) — gradient en activo
 *   - Card glass con badge, descripción, precio grande, lista features check
 *   - Banner beta debajo
 *
 * Premium es el default (es el que querés vender post-launch).
 *
 * Como tiene `useState` para el tab activo, es Client Component.
 * El padre (page.tsx) le pasa `userLoggedIn` para saber qué CTA renderizar.
 */

type PlanId = 'free' | 'monthly' | 'premium';

interface Plan {
  id: PlanId;
  name: string;
  price: string;
  period: string;
  desc: string;
  features: string[];
  cta: string;
  ctaHref: string | null; // null = "Próximamente" (disabled)
  loggedInCta?: string;
  loggedInHref?: string;
}

const PLANS: Record<PlanId, Plan> = {
  free: {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: 'para siempre',
    desc: 'Probá las funciones básicas sin tarjeta.',
    features: [
      '10 apuntes por mes',
      'Resúmenes con IA',
      'Exportar a PDF',
      'Soporte por mail',
    ],
    cta: 'Empezar gratis',
    ctaHref: '/login',
    loggedInCta: 'Ir a mis apuntes',
    loggedInHref: '/library',
  },
  monthly: {
    id: 'monthly',
    name: 'Por mes',
    price: '$1.99',
    period: '/ mes',
    desc: 'Acceso flexible cuando lo necesites.',
    features: [
      'Apuntes ilimitados',
      'Audio → texto',
      'Edit avanzado',
      'Soporte prioritario',
    ],
    cta: 'Próximamente',
    ctaHref: null,
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    price: '$4.99',
    period: '/ 3 meses',
    desc: 'Lo mejor de El Chero. Pensado para bachillerato.',
    features: [
      'Apuntes ilimitados',
      'Audio TTS HD (770 MB)',
      'Edit avanzado + reescritura',
      'Soporte prioritario',
      'Plan Familia $9.99 — hasta 5 usuarios',
    ],
    cta: 'Quiero Premium',
    ctaHref: null, // post-launch lo activamos
  },
};

const ORDER: PlanId[] = ['free', 'monthly', 'premium'];

export function LandingPricing({ userLoggedIn }: { userLoggedIn: boolean }) {
  const [active, setActive] = useState<PlanId>('premium');
  const plan = PLANS[active];

  // Resolver CTA según estado de auth + plan activo
  const ctaLabel =
    userLoggedIn && plan.loggedInCta ? plan.loggedInCta : plan.cta;
  const ctaHref =
    userLoggedIn && plan.loggedInHref ? plan.loggedInHref : plan.ctaHref;

  return (
    <section id="planes" className="px-5 py-14">
      <div className="mb-7 text-center">
        <h2 className="font-display text-4xl font-semibold tracking-tight text-white">
          Empezá <span className="text-gradient italic">gratis</span>
        </h2>
        <p className="mx-auto mt-2 max-w-xs text-sm text-white/60">
          Un equipo para vos. Cobramos por lo que vas a usar bien.
        </p>
      </div>

      {/* Plan switcher — pill background con 3 tabs */}
      <div className="glass mx-auto mb-6 grid max-w-sm grid-cols-3 gap-1 rounded-full p-1">
        {ORDER.map((k) => {
          const isActive = k === active;
          return (
            <button
              key={k}
              type="button"
              onClick={() => setActive(k)}
              aria-pressed={isActive}
              className={cn(
                'h-10 rounded-full text-xs font-semibold capitalize transition-smooth',
                isActive
                  ? 'bg-gradient-primary text-primary-foreground shadow-button-premium'
                  : 'text-white/55 hover:text-white',
              )}
            >
              {PLANS[k].name}
            </button>
          );
        })}
      </div>

      {/* Card del plan activo */}
      <div
        // key force-remount al cambiar tab → re-trigger animate-fade-up
        key={active}
        className="glass animate-fade-up shadow-card-premium mx-auto max-w-sm rounded-3xl p-6"
      >
        <div className="mb-3 flex items-center gap-2">
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider',
              'text-primary-glow',
            )}
          >
            <Sparkles aria-hidden className="h-3 w-3" /> {plan.name}
          </span>
        </div>

        <p className="mb-4 text-sm text-white/65">{plan.desc}</p>

        <div className="mb-5 flex items-baseline gap-1.5">
          <span className="font-display text-5xl font-bold tracking-tight text-white">
            {plan.price}
          </span>
          <span className="text-sm text-white/55">{plan.period}</span>
        </div>

        <ul className="mb-6 space-y-3">
          {plan.features.map((f) => (
            <li key={f} className="flex items-start gap-3 text-sm">
              <span
                aria-hidden
                className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/20 text-primary-glow"
              >
                <Check className="h-3 w-3" />
              </span>
              <span className="leading-relaxed text-white/90">{f}</span>
            </li>
          ))}
        </ul>

        {ctaHref ? (
          <Link
            href={ctaHref}
            className={buttonVariants({
              variant: 'premium',
              size: 'xl',
              className: 'w-full',
            })}
          >
            {ctaLabel}
          </Link>
        ) : (
          <button
            type="button"
            disabled
            className={buttonVariants({
              variant: 'glass',
              size: 'xl',
              className: 'w-full opacity-60',
            })}
          >
            {ctaLabel}
          </button>
        )}

        <p className="mt-3 text-center text-[11px] text-white/45">
          Cancelá cuando quieras · Sin compromiso
        </p>
      </div>
    </section>
  );
}
