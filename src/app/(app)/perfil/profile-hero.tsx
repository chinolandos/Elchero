/**
 * ProfileHero — bloque server-rendered del header del perfil (v5).
 *
 * Estructura tipo Lovable: card glass-strong con halo magenta arriba,
 * orb brand + greeting + chip context + stats grid 3 cols (mini-cards
 * glass adentro).
 *
 * Es Server Component porque solo lee datos derivados de Supabase y no
 * tiene estado interactivo.
 */
import { orbGradient, shadows } from '@/lib/design-tokens';
import type { UserProfile, UserType } from '@/lib/types/chero';

interface ProfileHeroProps {
  firstName: string | null;
  profile: UserProfile | null;
  stats: {
    notes: number;
    folders: number;
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

        {/* Stats grid 3 cols — mini glass cards */}
        <div className="mt-6 grid w-full grid-cols-3 gap-3">
          <StatCard
            value={stats.notes}
            label="Apuntes"
            sublabel="creados"
            accent
          />
          <StatCard
            value={stats.remainingUser}
            label="Usos"
            sublabel={`de ${stats.maxPerUser}`}
          />
          <StatCard
            value={stats.folders}
            label="Carpetas"
            sublabel={stats.folders === 1 ? 'creada' : 'creadas'}
          />
        </div>
      </div>
    </section>
  );
}

function StatCard({
  value,
  label,
  sublabel,
  accent = false,
}: {
  value: number;
  label: string;
  sublabel?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={
        accent
          ? 'rounded-2xl border border-white/30 bg-white/15 p-3 backdrop-blur md:p-4'
          : 'rounded-2xl border border-white/15 bg-white/5 p-3 backdrop-blur md:p-4'
      }
    >
      <div className="text-2xl font-black leading-none tabular-nums text-white md:text-3xl">
        {value}
      </div>
      <div className="mt-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/85">
        {label}
      </div>
      {sublabel && (
        <div className="text-[10px] text-white/65">{sublabel}</div>
      )}
    </div>
  );
}
