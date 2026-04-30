'use client';

import { useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

/**
 * PricingCard — tarjeta central con tabs de planes (ref Zentra Finance imagen 5).
 *
 * Estructura:
 *   - Tabs arriba (Free / Pay-per-use / Premium) con pill animado del activo
 *   - Body: precio grande + descripción + lista features con check
 *   - CTA gradient violeta-magenta
 *
 * Premium es el tab default (más popular, lo que querés vender post-launch).
 *
 * Las tabs son interactivas (state local), por eso es Client Component.
 * Server Component padre se encarga del header de la sección + banner beta.
 */

interface Tier {
  id: 'free' | 'payperuse' | 'premium';
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  ctaHref: string | null;
  badge?: string;
}

const TIERS: Tier[] = [
  {
    id: 'free',
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
  },
  {
    id: 'payperuse',
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
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '$4.99',
    period: 'por mes',
    description: 'Lo mismo que Spotify Student. Para bachilleres serios.',
    features: [
      'Apuntes ilimitados',
      'Audio TTS HD',
      'Edit transcript + regenerar',
      'Soporte prioritario',
      'Plan familia $9.99 — hasta 3 hermanos',
    ],
    cta: 'Próximamente',
    ctaHref: null,
    badge: 'Más popular',
  },
];

export function PricingCard() {
  // Premium es el default — es lo que querés vender post-launch
  const [activeId, setActiveId] = useState<Tier['id']>('premium');
  const active = TIERS.find((t) => t.id === activeId)!;

  return (
    <div className="mx-auto w-full max-w-md">
      {/* Tabs container — pill background con tabs adentro */}
      <div className="mb-6 flex rounded-full border border-white/10 bg-white/[0.04] p-1 backdrop-blur">
        {TIERS.map((tier) => {
          const isActive = tier.id === activeId;
          return (
            <button
              key={tier.id}
              type="button"
              onClick={() => setActiveId(tier.id)}
              aria-pressed={isActive}
              className={cn(
                'relative flex-1 rounded-full px-3 py-2 text-xs font-semibold transition-all sm:text-sm',
                isActive
                  ? 'bg-gradient-to-r from-primary to-primaryHover text-white shadow-[0_4px_16px_rgba(147,51,234,0.4)]'
                  : 'text-white/55 hover:text-white/80',
              )}
              style={
                isActive
                  ? {
                      backgroundImage:
                        'linear-gradient(135deg, #9333ea 0%, #ec4899 100%)',
                    }
                  : undefined
              }
            >
              {tier.name}
            </button>
          );
        })}
      </div>

      {/* Card central — el contenido cambia con el tab activo */}
      <div
        className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-7 backdrop-blur transition-all sm:p-8"
        // Glow violeta sutil en el border cuando hay un tab "vendible" (Premium)
        style={{
          boxShadow:
            activeId === 'premium'
              ? '0 12px 48px rgba(147, 51, 234, 0.2), inset 0 0 0 1px rgba(147, 51, 234, 0.15)'
              : 'none',
        }}
      >
        {/* Badge "Más popular" si aplica */}
        {active.badge && (
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">
            ⭐ {active.badge}
          </div>
        )}

        {/* Heading: nombre + tagline */}
        <h3 className="mb-1 text-2xl font-black tracking-tight text-white sm:text-3xl">
          {active.name}
        </h3>
        <p className="mb-6 text-sm text-white/55">{active.description}</p>

        {/* Precio grande */}
        <div className="mb-6 flex items-baseline gap-2">
          <span className="text-5xl font-black tabular-nums text-white sm:text-6xl">
            {active.price}
          </span>
          <span className="text-sm text-white/50">{active.period}</span>
        </div>

        {/* Features list */}
        <ul className="mb-8 space-y-3 text-sm">
          {active.features.map((f) => (
            <li key={f} className="flex items-start gap-3 text-white/80">
              <span
                aria-hidden
                className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M2.5 6.5L4.5 8.5L9.5 3.5"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span className="leading-relaxed">{f}</span>
            </li>
          ))}
        </ul>

        {/* CTA — gradient si es plan activo + comprable, opaco si "Próximamente" */}
        {active.ctaHref ? (
          <Link
            href={active.ctaHref}
            className="flex w-full items-center justify-center rounded-full px-6 py-3.5 text-sm font-bold text-white shadow-[0_8px_24px_rgba(147,51,234,0.35)] transition-transform hover:scale-[1.02]"
            style={{
              backgroundImage:
                'linear-gradient(135deg, #9333ea 0%, #c084fc 50%, #ec4899 100%)',
            }}
          >
            {active.cta}
          </Link>
        ) : (
          <button
            type="button"
            disabled
            className="flex w-full cursor-not-allowed items-center justify-center rounded-full border border-white/10 bg-white/[0.04] px-6 py-3.5 text-sm font-semibold text-white/45"
          >
            {active.cta}
          </button>
        )}

        {/* Tagline mini debajo del CTA */}
        <p className="mt-3 text-center text-xs text-white/35">
          {activeId === 'free'
            ? 'Sin tarjeta. Andá a tu Google y listo.'
            : activeId === 'premium'
              ? 'Cancelás cuando quieras. Sin permanencias.'
              : 'Pagás solo lo que usás. Sin límites mensuales.'}
        </p>
      </div>
    </div>
  );
}
