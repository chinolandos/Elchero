/**
 * ProfileHero — bloque server-rendered del header del perfil.
 *
 * Muestra orbe brand + greeting personalizado + chip glass con
 * institución/tipo + grid de stats (apuntes, usos restantes, carpetas).
 *
 * Es Server Component porque solo lee datos derivados de Supabase y no
 * tiene estado interactivo. Mantener fuera del client component evita
 * inflar el bundle del browser.
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
    <section className="mb-10 flex flex-col items-center text-center">
      {/* Orbe brand — mismo gradient que el resto de la app */}
      <div
        className="orb-pulse mb-5 h-24 w-24 rounded-full"
        style={{ background: orbGradient, boxShadow: shadows.glowOrb }}
        aria-hidden="true"
      />

      {/* Greeting */}
      <h1 className="text-3xl font-black tracking-tight md:text-4xl">
        {greeting}
      </h1>
      <p className="mt-1 text-sm italic text-white/55">
        tu cuate de estudio
      </p>

      {/* Chip de contexto */}
      {chipParts.length > 0 && (
        <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs text-white/70 backdrop-blur">
          <span aria-hidden="true">📍</span>
          <span>{chipParts.join(' · ')}</span>
        </div>
      )}

      {/* Stats grid */}
      <div className="mt-8 grid w-full grid-cols-3 gap-3">
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
          ? 'rounded-2xl border border-primary/30 bg-primary/[0.08] p-4'
          : 'rounded-2xl border border-white/10 bg-white/[0.03] p-4'
      }
    >
      <div
        className={
          'text-3xl font-black tabular-nums leading-none ' +
          (accent ? 'text-primary' : 'text-white')
        }
      >
        {value}
      </div>
      <div className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-white/60">
        {label}
      </div>
      {sublabel && (
        <div className="text-[10px] text-white/40">{sublabel}</div>
      )}
    </div>
  );
}
