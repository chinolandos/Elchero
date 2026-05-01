import { cn } from '@/lib/utils';
import type { DayBucket } from '@/lib/perfil/stats';

/**
 * WeeklyChart — bar chart "Esta semana" estilo Lovable hue-learn-glow.
 *
 * UX:
 *   - 7 barras verticales (L M X J V S D)
 *   - Altura proporcional a minutos / max(minutos del día más alto, goalDaily)
 *   - Día actual (today): barra con gradient warm (magenta→ember)
 *   - Resto: glass blanco translúcido
 *   - Header: total semanal / goal (formato "Xh Ym / Zh")
 *
 * Server Component (no interactividad).
 */

interface Props {
  days: DayBucket[];
  weekMinutes: number;
  goalMinutes: number;
}

export function WeeklyChart({ days, weekMinutes, goalMinutes }: Props) {
  // Para escalar las barras: usamos el máximo entre el día más alto y el
  // goal diario, así el goal queda como "100%" si nadie lo superó.
  const goalDaily = goalMinutes / 7;
  const maxMinutes = Math.max(
    ...days.map((d) => d.minutes),
    goalDaily,
    1, // evitar divide by 0
  );

  return (
    <section className="glass-strong relative overflow-hidden rounded-3xl p-5 sm:p-6">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="font-display-pf text-lg font-semibold text-white sm:text-xl">
          Esta semana
        </h2>
        <span className="text-xs text-white/85">
          <span className="font-semibold text-white">
            {formatDuration(weekMinutes)}
          </span>
          <span className="text-white/55"> / {formatDuration(goalMinutes)}</span>
        </span>
      </div>

      {/* Bar chart */}
      <div className="flex h-40 items-end justify-between gap-2 sm:h-44">
        {days.map((day, i) => {
          const heightPct = Math.min(100, (day.minutes / maxMinutes) * 100);
          // Mínimo 4% para que se vea algo aún sin actividad
          const visualHeightPct = Math.max(heightPct, 4);

          return (
            <div
              key={i}
              className="flex flex-1 flex-col items-center gap-2"
            >
              <div className="relative flex h-full w-full items-end">
                <div
                  className={cn(
                    'w-full rounded-2xl transition-all',
                    day.isToday
                      ? 'bg-gradient-primary shadow-button-premium'
                      : 'bg-white/15',
                  )}
                  style={{ height: `${visualHeightPct}%` }}
                  aria-label={`${day.label}: ${formatDuration(day.minutes)}`}
                  role="img"
                />
              </div>
              <span
                className={cn(
                  'text-[11px] font-semibold tabular-nums',
                  day.isToday ? 'text-white' : 'text-white/65',
                )}
              >
                {day.label}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/** "1h 30m" / "45m" / "0m". */
function formatDuration(minutes: number): string {
  if (minutes < 1) return '0m';
  const total = Math.round(minutes);
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}
