import { cn } from '@/lib/utils';
import type { CalendarDay } from '@/lib/perfil/stats';

/**
 * MonthlyCalendar — grid de últimos 30 días estilo Duolingo / GitHub.
 *
 * UX:
 *   - 30 cells en grid (7 cols mobile / 10 cols desktop según ancho)
 *   - Día activo: bg-gradient-primary + emoji 🔥 (sin fila clara, intensidad
 *     dada por el gradient warm magenta-ember)
 *   - Día inactivo: glass blanco translúcido
 *   - Día actual (today): ring blanco brillante para destacar
 *   - Tooltip aria-label con fecha + cantidad de notas
 */

interface Props {
  days: CalendarDay[];
}

export function MonthlyCalendar({ days }: Props) {
  const activeCount = days.filter((d) => d.isActive).length;
  const totalDays = days.length;
  const pctActive = Math.round((activeCount / totalDays) * 100);

  return (
    <section className="glass relative overflow-hidden rounded-3xl p-5 sm:p-6">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="font-display-pf text-lg font-semibold text-white sm:text-xl">
          Últimos 30 días
        </h2>
        <span className="text-xs text-white/85">
          <span className="font-semibold text-white">{activeCount}</span>
          <span className="text-white/55"> / {totalDays} días activos</span>
        </span>
      </div>

      {/* Grid — mobile 10 cols (3 filas), desktop 15 cols (2 filas) usando
          arbitrary value porque Tailwind v4 default no tiene grid-cols-15. */}
      <div className="grid grid-cols-10 gap-1.5 sm:grid-cols-[repeat(15,minmax(0,1fr))] sm:gap-2">
        {days.map((day, i) => (
          <div
            key={i}
            aria-label={formatDayLabel(day)}
            className={cn(
              'aspect-square rounded-lg transition-all',
              day.isActive
                ? 'bg-gradient-primary shadow-button-premium'
                : 'bg-white/[0.06]',
              day.isToday &&
                'ring-2 ring-white ring-offset-1 ring-offset-transparent',
            )}
          />
        ))}
      </div>

      {/* Footer mini con leyenda + porcentaje */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-white/65">
            <span className="bg-gradient-primary h-3 w-3 rounded-md" />
            Activo
          </span>
          <span className="flex items-center gap-1.5 text-white/65">
            <span className="h-3 w-3 rounded-md bg-white/[0.06]" />
            Sin actividad
          </span>
        </div>
        <span className="text-white/55">
          <strong className="text-primary-glow">{pctActive}%</strong>{' '}
          consistencia
        </span>
      </div>
    </section>
  );
}

function formatDayLabel(day: CalendarDay): string {
  const formatted = day.date.toLocaleDateString('es-SV', {
    day: 'numeric',
    month: 'short',
  });
  if (day.isToday) {
    return `${formatted} (hoy) — ${day.notesCount} apunte${day.notesCount === 1 ? '' : 's'}`;
  }
  return `${formatted} — ${day.notesCount} apunte${day.notesCount === 1 ? '' : 's'}`;
}
