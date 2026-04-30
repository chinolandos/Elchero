'use client';

/**
 * ProfileHeroCard — card grande hero del perfil.
 *
 * Estilo: gradient saturado violeta-magenta-coral (estilo screenshot ref
 * que mandó el user). Avatar con inicial + nombre + email + plan badge.
 * Stats grid 3-up DENTRO del card (Apuntes / Usos restantes / Carpetas).
 *
 * Animation: fade-in + slide-up al cargar la pagina (motion).
 */
import { motion } from 'motion/react';
import { BookOpen, Zap, Layers } from 'lucide-react';

interface ProfileHeroCardProps {
  firstName: string | null;
  email: string;
  planLabel: string;
  stats: {
    notes: number;
    folders: number;
    remainingUser: number;
    maxPerUser: number;
  };
}

export function ProfileHeroCard({
  firstName,
  email,
  planLabel,
  stats,
}: ProfileHeroCardProps) {
  const initial = (firstName ?? email).charAt(0).toUpperCase();

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative overflow-hidden rounded-3xl border border-white/[0.08] p-5 shadow-[0_16px_48px_rgba(147,51,234,0.25)] sm:p-6"
      style={{
        backgroundImage:
          'linear-gradient(135deg, #a855f7 0%, #ec4899 50%, #f97316 100%)',
      }}
    >
      {/* Sheen overlay sutil */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.4), transparent 60%)',
        }}
      />

      {/* Avatar + nombre + plan */}
      <div className="relative flex items-center gap-4">
        <div
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-2xl font-black text-white shadow-lg ring-1 ring-white/30"
          style={{
            backgroundImage:
              'linear-gradient(135deg, #fb923c 0%, #ec4899 100%)',
          }}
          aria-hidden
        >
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="serif-display truncate text-2xl text-white">
            {firstName ?? 'Cherito'}
          </h2>
          <p className="truncate text-sm text-white/80">{email}</p>
          <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white backdrop-blur">
            ✨ {planLabel}
          </span>
        </div>
      </div>

      {/* Stats grid 3-up DENTRO del card */}
      <div className="relative mt-5 grid grid-cols-3 gap-2">
        <StatTile
          icon={BookOpen}
          value={stats.notes}
          label="Apuntes"
        />
        <StatTile
          icon={Zap}
          value={`${stats.remainingUser}/${stats.maxPerUser}`}
          label="Usos"
        />
        <StatTile
          icon={Layers}
          value={stats.folders}
          label="Carpetas"
        />
      </div>
    </motion.section>
  );
}

function StatTile({
  icon: Icon,
  value,
  label,
}: {
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
  value: number | string;
  label: string;
}) {
  return (
    <div className="flex flex-col items-start gap-1.5 rounded-2xl border border-white/15 bg-white/[0.10] p-3 backdrop-blur">
      <span
        className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/20"
        aria-hidden
      >
        <Icon className="h-4 w-4 text-white" />
      </span>
      <div>
        <div className="text-lg font-black tabular-nums leading-none text-white">
          {value}
        </div>
        <div className="text-[10px] font-medium uppercase tracking-wider text-white/75">
          {label}
        </div>
      </div>
    </div>
  );
}
