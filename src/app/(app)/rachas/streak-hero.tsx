/**
 * StreakHero — flame gigante + número días consecutivos.
 *
 * Diseño Duolingo-inspired:
 *   - Glass-strong card con halos amber/ember (cálidos, mood "on fire")
 *   - Flame emoji 🔥 grande (5xl) con glow
 *   - Número Playfair gigante (text-7xl) en gradient warm
 *   - Etiqueta "días seguidos"
 *   - Mejor racha histórica abajo
 *
 * Server Component — no hay estado interactivo.
 */
interface Props {
  streak: number;
  longestStreak: number;
}

export function StreakHero({ streak, longestStreak }: Props) {
  return (
    <section className="glass-strong relative overflow-hidden rounded-3xl p-6 text-center sm:p-8">
      {/* Halos cálidos amber/ember para sensación "fire" */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-20 h-56 w-56 rounded-full opacity-70 blur-3xl"
        style={{ background: 'hsl(18 100% 56% / 0.7)' }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full opacity-60 blur-3xl"
        style={{ background: 'hsl(35 100% 60% / 0.6)' }}
      />

      <div className="relative flex flex-col items-center gap-3">
        {/* Flame emoji con drop-shadow ember */}
        <div
          className="text-7xl md:text-8xl"
          style={{
            filter:
              'drop-shadow(0 4px 20px rgba(255, 94, 31, 0.6)) drop-shadow(0 0 30px rgba(255, 179, 51, 0.4))',
          }}
          aria-hidden
        >
          🔥
        </div>

        {/* Número días — Playfair gigante en blanco. El emoji 🔥 ya da el
            warm tone visual; el número en gradient no contrastaba bien
            (especialmente con streak=0 chico). */}
        <div className="flex items-baseline gap-2">
          <span className="font-display-pf text-7xl font-bold leading-none tabular-nums text-white md:text-8xl">
            {streak}
          </span>
          <span className="text-base font-semibold text-white/85 md:text-lg">
            {streak === 1 ? 'día' : 'días'}
          </span>
        </div>

        <p className="text-sm text-white/85 md:text-base">
          {streak === 0
            ? 'Sin racha activa'
            : streak === 1
              ? 'Empezaste hoy ¡buenas!'
              : 'seguidos estudiando con Chero'}
        </p>

        {/* Mejor racha histórica */}
        {longestStreak > 0 && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs text-white/85">
            <span aria-hidden>🏆</span>
            <span>
              Tu mejor racha:{' '}
              <strong className="text-white">{longestStreak}</strong>{' '}
              {longestStreak === 1 ? 'día' : 'días'}
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
