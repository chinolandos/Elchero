'use client';

import { useState } from 'react';
import { Check, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * SuscripcionTabs — replica el LandingPricing pero adaptado al contexto
 * "ya estás logueado, querés mejorar tu plan". Muestra los 3 tiers
 * (Free / Por mes / Premium) con tabs y card de detalle.
 *
 * Premium y Por mes están en "Próximamente" (post Q3 2026). Free es el
 * plan gratuito post-beta (10 apuntes/mes). Hoy todos los users de beta
 * tienen acceso completo, pero estos planes muestran qué viene.
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
  available: boolean;
  highlight?: string;
}

const PLANS: Record<PlanId, Plan> = {
  free: {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: 'para siempre',
    desc: 'Funciones básicas sin tarjeta.',
    features: [
      '3 apuntes por mes',
      'Audio hasta 20 min',
      'Resúmenes con IA',
      'Exportar a PDF (con marca de agua)',
    ],
    cta: 'Plan gratis post-beta',
    available: false,
  },
  monthly: {
    id: 'monthly',
    name: 'Chero+',
    price: '$4.99',
    period: '/ mes',
    desc: 'Para estudiar todos los días sin frenos.',
    features: [
      '15 apuntes por mes',
      'Audio hasta 40 min',
      'Voz TTS premium',
      'Notificaciones de racha',
      'Flashcards ilimitadas',
      'PDF sin marca de agua',
      'Comprar extras desde $0.99/apunte',
    ],
    cta: 'Próximamente',
    available: false,
  },
  premium: {
    id: 'premium',
    name: 'Sprint AVANZO',
    price: '$14.99',
    period: '/ 2 meses',
    desc: 'Para los 2 meses antes del AVANZO. Pasalo.',
    features: [
      'Hasta 35 apuntes (2 meses)',
      'Audio hasta 60 min',
      'Simulacros AVANZO (próximamente)',
      'Flashcards modo examen',
      'Prioridad de procesamiento',
      'Voz TTS premium',
    ],
    cta: 'Quiero el Sprint',
    available: false,
    highlight: 'Más popular',
  },
};

const ORDER: PlanId[] = ['free', 'monthly', 'premium'];

export function SuscripcionTabs() {
  const [active, setActive] = useState<PlanId>('premium');
  const plan = PLANS[active];

  return (
    <div>
      {/* Tab switcher */}
      <div className="glass mx-auto mb-4 grid max-w-sm grid-cols-3 gap-1 rounded-full p-1">
        {ORDER.map((k) => {
          const isActive = k === active;
          return (
            <button
              key={k}
              type="button"
              onClick={() => setActive(k)}
              aria-pressed={isActive}
              className={cn(
                'h-10 rounded-full text-[11px] font-semibold transition-smooth',
                isActive
                  ? 'bg-gradient-primary shadow-button-premium text-white'
                  : 'text-white/65 hover:text-white',
              )}
            >
              {PLANS[k].name}
            </button>
          );
        })}
      </div>

      {/* Plan card */}
      <div
        key={active}
        className="glass animate-fade-up shadow-card-premium rounded-3xl p-6"
      >
        <div className="mb-3 flex items-center gap-2">
          <span className="text-primary-glow inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider">
            <Sparkles aria-hidden className="h-3 w-3" />
            {plan.name}
          </span>
          {plan.highlight && (
            <span className="bg-gradient-primary inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold text-white">
              ⭐ {plan.highlight}
            </span>
          )}
        </div>

        <p className="mb-4 text-sm text-white/75">{plan.desc}</p>

        <div className="mb-5 flex items-baseline gap-1.5">
          <span className="font-display-pf text-5xl font-bold tracking-tight text-white">
            {plan.price}
          </span>
          <span className="text-sm text-white/65">{plan.period}</span>
        </div>

        <ul className="mb-6 space-y-3">
          {plan.features.map((f) => (
            <li key={f} className="flex items-start gap-3 text-sm">
              <span
                aria-hidden
                className="text-primary-glow mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/20"
              >
                <Check className="h-3 w-3" />
              </span>
              <span className="leading-relaxed text-white/90">{f}</span>
            </li>
          ))}
        </ul>

        {/* CTA disabled — todos están en Próximamente Q3 2026 */}
        <button
          type="button"
          disabled
          className="glass flex w-full cursor-not-allowed items-center justify-center rounded-2xl py-4 text-sm font-semibold text-white/65 opacity-70"
        >
          {plan.cta}
        </button>

        <p className="mt-3 text-center text-[11px] text-white/55">
          Hoy estás en la beta. Activamos planes pagos en Q3 2026.
        </p>
      </div>
    </div>
  );
}
