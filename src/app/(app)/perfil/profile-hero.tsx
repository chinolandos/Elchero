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
  // Chip de contexto: "ESEN · Universidad · 2°"
  const chipParts: string[] = [];
  if (profile?.institution) chipParts.push(profile.institution);
  if (profile?.user_type) chipParts.push(TYPE_LABEL[profile.user_type]);
  if (profile?.year) chipParts.push(`${profile.year}°`);

  return (
    <section className="mb-10 flex flex-col items-center text-center">
      {/* Orbe brand */}
      <div
        className="orb-pulse mb-6 h-24 w-24 rounded-full"
        style={{ background: orbGradient, boxShadow: shadows.glowOrb }}
        aria-hidden="true"
      />

      {/* Greeting — mix sans-bold + serif italic estilo VibeMove */}
      <h1 className="text-4xl tracking-tight md:text-5xl">
        <span className="font-black">Hola, </span>
        <span className="serif-italic">{firstName ?? 'cherito'}</span>
      </h1>
      <p className="mt-2 text-sm italic text-white/55">tu cuate de estudio</p>

      {/* Chip de contexto */}
      {chipParts.length > 0 && (
        <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs text-white/70 backdrop-blur">
          <span aria-hidden="true">📍</span>
          <span>{chipParts.join(' · ')}</span>
        </div>
      )}

      {/* Stats grid — cards con gradient sutil + subtle hover scale */}
      <div className="mt-8 grid w-full grid-cols-3 gap-3">
        <StatCard
          value={stats.notes}
          label="Apuntes"
          sublabel="creados"
          variant="primary"
        />
        <StatCard
          value={stats.remainingUser}
          label="Usos"
          sublabel={`de ${stats.maxPerUser}`}
          variant="default"
        />
        <StatCard
          value={stats.folders}
          label="Carpetas"
          sublabel={stats.folders === 1 ? 'creada' : 'creadas'}
          variant="default"
        />
      </div>
    </section>
  );
}

function StatCard({
  value,
  label,
  sublabel,
  variant = 'default',
}: {
  value: number;
  label: string;
  sublabel?: string;
  variant?: 'primary' | 'default';
}) {
  return (
    <div
      className={
        variant === 'primary'
          ? 'overflow-hidden rounded-2xl border border-white/10 p-4 transition-transform hover:scale-[1.03]'
          : 'overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 transition-transform hover:scale-[1.03] hover:border-white/15'
      }
      style={
        variant === 'primary'
          ? {
              backgroundImage:
                'linear-gradient(135deg, rgba(168,85,247,0.15) 0%, rgba(236,72,153,0.10) 100%)',
            }
          : undefined
      }
    >
      <div
        className={
          'text-3xl font-black tabular-nums leading-none ' +
          (variant === 'primary' ? 'text-white' : 'text-white')
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
