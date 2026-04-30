'use client';

/**
 * ActivityChart — gráfico de barras "Esta semana" estilo screenshot ref.
 *
 * Muestra cuántos apuntes generó el user cada día de los últimos 7 días.
 * Datos reales: array de {day: 'L', count: 3, date: ISO}.
 *
 * Visual: barras verticales en glassmorphism, día con más apuntes destacado
 * con gradient violeta-magenta-coral. Contador agregado arriba.
 */
import { motion } from 'motion/react';

interface DayData {
  day: string; // "L", "M", "X", "J", "V", "S", "D"
  count: number;
  date: string; // ISO
}

interface ActivityChartProps {
  data: DayData[];
  totalThisWeek: number;
  goalMinutes?: number;
}

export function ActivityChart({
  data,
  totalThisWeek,
  goalMinutes = 10,
}: ActivityChartProps) {
  const maxCount = Math.max(1, ...data.map((d) => d.count));
  const peakIndex = data.reduce(
    (peak, d, i) => (d.count > data[peak].count ? i : peak),
    0,
  );

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
      className="overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur"
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-bold text-white">Esta semana</h3>
        <span className="text-xs text-white/55">
          {totalThisWeek} apunte{totalThisWeek === 1 ? '' : 's'} / meta {goalMinutes}
        </span>
      </div>

      {/* Bars grid */}
      <div className="flex h-32 items-end justify-between gap-2">
        {data.map((d, i) => {
          const heightPct = Math.max(8, (d.count / maxCount) * 100);
          const isPeak = i === peakIndex && d.count > 0;
          return (
            <div
              key={d.date}
              className="flex flex-1 flex-col items-center gap-2"
            >
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${heightPct}%` }}
                transition={{
                  duration: 0.6,
                  delay: 0.3 + i * 0.05,
                  ease: 'easeOut',
                }}
                className="w-full rounded-full"
                style={{
                  background: isPeak
                    ? 'linear-gradient(180deg, #f97316 0%, #ec4899 60%, #a855f7 100%)'
                    : 'rgba(255,255,255,0.10)',
                  boxShadow: isPeak
                    ? '0 0 20px rgba(236, 72, 153, 0.4)'
                    : 'none',
                }}
                aria-label={`${d.count} apuntes el ${d.day}`}
              />
              <span
                className={
                  isPeak
                    ? 'text-[10px] font-bold text-white'
                    : 'text-[10px] text-white/40'
                }
              >
                {d.day}
              </span>
            </div>
          );
        })}
      </div>
    </motion.section>
  );
}
