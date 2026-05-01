/**
 * ProfileHero — bloque server-rendered del header del perfil (v5).
 *
 * Estructura tipo Lovable hue-learn-glow:
 *   - Card glass-strong con halos magenta/ember
 *   - Orb brand + greeting Playfair + chip context
 *   - Stats grid 3 cols Duolingo-style:
 *     · Racha (🔥 flame, gradient cálido) — días consecutivos estudiando
 *     · Horas (⏰ clock) — total de minutos audio acumulados / 60
 *     · Cards (📚 layers) — total de flashcards generadas
 *
 * Cada stat con icono en círculo coloreado arriba (matching Lovable).
 *
 * Server Component — no hay estado interactivo.
 */
import { Flame, Clock, Layers } from 'lucide-react';
import { orbGradient, shadows } from '@/lib/design-tokens';
import type { UserProfile, UserType } from '@/lib/types/chero';

interface ProfileHeroProps {
  firstName: string | null;
  profile: UserProfile | null;
  stats: {
    streak: number;
    hours: number;
    cards: number;
    remainingUser: number;
    maxPerUser: number;
  };
}

const TYPE_LABEL: Record<UserType, string> = {
  bachiller: 'Bachillerato',
  universitario: 'Universidad',
};

export function ProfileHero({ firstName, profile, stats }: ProfileHeroProps) {
  const greeting = firstName ? `Hola, ${firstName}` : 'Hola, cherito';

  // Chip de contexto: "ESEN · Universidad · 2°"
  const chipParts: string[] = [];
  if (profile?.institution) chipParts.push(profile.institution);
  if (profile?.user_type) chipParts.push(TYPE_LABEL[profile.user_type]);
  if (profile?.year) chipParts.push(`${profile.year}°`);

  return (
    <section className="glass-strong relative mb-8 overflow-hidden rounded-3xl p-6 md:p-8">
      {/* Halo magenta sutil arriba (matching Lovable hero card) */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full opacity-60 blur-3xl"
        style={{
          background: 'hsl(295 90% 55% / 0.6)',
        }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-16 -left-10 h-48 w-48 rounded-full opacity-50 blur-3xl"
        style={{
          background: 'hsl(18 100% 56% / 0.5)',
        }}
      />

      <div className="relative flex flex-col items-center text-center">
        {/* Orb brand */}
        <div
          className="orb-pulse mb-4 h-20 w-20 rounded-full md:h-24 md:w-24"
          style={{ background: orbGradient, boxShadow: shadows.glowOrb }}
          aria-hidden="true"
        />

        {/* Greeting Playfair */}
        <h1 className="font-display-pf text-3xl font-semibold tracking-tight text-white md:text-4xl">
          {greeting}
        </h1>
        <p className="mt-1 text-sm italic text-white/65">tu cuate de estudio</p>

        {/* Chip context */}
        {chipParts.length > 0 && (
          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs text-white/85 backdrop-blur">
            <span aria-hidden="true">📍</span>
            <span>{chipParts.join(' · ')}</span>
          </div>
        )}

        {/* Stats grid 3 cols Duolingo-style: Racha / Horas / Cards */}
        <div className="mt-6 grid w-full grid-cols-3 gap-3">
          <StatCard
            icon={
              <Flame aria-hidden className="h-4 w-4 md:h-5 md:w-5" />
            }
            iconTint="ember"
            value={`${stats.streak}d`}
            label="Racha"
          />
          <StatCard
            icon={
              <Clock aria-hidden className="h-4 w-4 md:h-5 md:w-5" />
            }
            iconTint="violet"
            value={`${stats.hours}h`}
            label="Horas"
          />
          <StatCard
            icon={
              <Layers aria-hidden className="h-4 w-4 md:h-5 md:w-5" />
            }
            iconTint="magenta"
            value={`${stats.cards}`}
            label="Cards"
          />
        </div>
      </div>
    </section>
  );
}

type IconTint = 'ember' | 'violet' | 'magenta';

const TINT_BG: Record<IconTint, string> = {
  ember:
    'bg-gradient-to-br from-amber-400/40 to-orange-500/40 text-amber-100',
  violet:
    'bg-gradient-to-br from-violet-400/40 to-fuchsia-500/40 text-violet-100',
  magenta:
    'bg-gradient-to-br from-fuchsia-400/40 to-pink-500/40 text-fuchsia-100',
};

function StatCard({
  icon,
  iconTint,
  value,
  label,
}: {
  icon: React.ReactNode;
  iconTint: IconTint;
  value: string;
  label: string;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-white/15 bg-white/[0.06] p-3 backdrop-blur md:p-4">
      <div
        className={`grid h-8 w-8 place-items-center rounded-xl backdrop-blur md:h-10 md:w-10 ${TINT_BG[iconTint]}`}
      >
        {icon}
      </div>
      <div>
        <div className="text-2xl font-black leading-none tabular-nums text-white md:text-3xl">
          {value}
        </div>
        <div className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-white/70">
          {label}
        </div>
      </div>
    </div>
  );
}
