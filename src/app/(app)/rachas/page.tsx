import { requireAuth } from '@/lib/auth/require-auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
  calculateStreak,
  calculateLongestStreak,
  calculateThisWeek,
  calculateLastNDays,
  calculateTotalMinutes,
} from '@/lib/perfil/stats';
import { StreakHero } from './streak-hero';
import { WeeklyChart } from './weekly-chart';
import { MonthlyCalendar } from './monthly-calendar';

export const metadata = {
  title: 'Rachas · Chero',
  description: 'Tu streak de estudio diario y progreso semanal.',
};

const WEEKLY_GOAL_MINUTES = 600; // 10 horas semanales (default)

/**
 * Página /rachas — vista tipo Duolingo del progreso de estudio.
 *
 * Estructura:
 *   1. StreakHero: flame gigante + número de días consecutivos + best streak
 *   2. WeeklyChart: barras L-D con minutos por día + total/goal
 *   3. MonthlyCalendar: grid 30 días con días activos resaltados
 *   4. Mensaje motivacional final
 *
 * Datos:
 *   - Source: notes table (created_at + audio_duration_minutes)
 *   - Streak: días consecutivos con al menos 1 nota (gracia de 1 día)
 *   - Weekly: minutos sumados por día de esta semana (Lun-Dom)
 *   - Monthly: últimos 30 días con flag active
 */
export default async function RachasPage() {
  const user = await requireAuth('/rachas');
  const supabase = await createSupabaseServerClient();

  const { data: notes } = await supabase
    .from('notes')
    .select('created_at, audio_duration_minutes')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const list = notes ?? [];

  const streak = calculateStreak(list);
  const longestStreak = calculateLongestStreak(list);
  const thisWeek = calculateThisWeek(list);
  const last30Days = calculateLastNDays(list, 30);
  const totalMinutes = calculateTotalMinutes(list);

  const weekMinutes = thisWeek.reduce((acc, d) => acc + d.minutes, 0);

  return (
    <>
      {/* v5 bg cover */}
      <div
        aria-hidden
        className="bg-gradient-hero pointer-events-none fixed inset-0"
      />
      <div
        aria-hidden
        className="animate-blob pointer-events-none fixed -right-32 -top-40 h-[520px] w-[520px] rounded-full opacity-70 blur-3xl"
        style={{
          background:
            'radial-gradient(circle, hsl(295 90% 55% / 0.7), transparent 70%)',
        }}
      />
      <div
        aria-hidden
        className="animate-blob pointer-events-none fixed right-1/4 top-1/3 h-[420px] w-[420px] rounded-full opacity-60 blur-3xl"
        style={{
          animationDelay: '-6s',
          background:
            'radial-gradient(circle, hsl(18 100% 56% / 0.65), transparent 70%)',
        }}
      />
      <div
        aria-hidden
        className="animate-blob pointer-events-none fixed -bottom-40 -left-20 h-[480px] w-[480px] rounded-full opacity-60 blur-3xl"
        style={{
          animationDelay: '-12s',
          background:
            'radial-gradient(circle, hsl(270 90% 60% / 0.6), transparent 70%)',
        }}
      />

      <main className="relative mx-auto w-full max-w-[440px] px-5 py-8 md:max-w-2xl md:px-8 md:py-10">
        <header className="mb-6 flex items-center justify-between gap-4 md:mb-8">
          <span className="text-xs uppercase tracking-[0.3em] text-white/55">
            Rachas
          </span>
          <span className="text-xs text-white/55">
            {Math.floor(totalMinutes / 60)}h totales
          </span>
        </header>

        <div className="space-y-6 md:space-y-8">
          <StreakHero streak={streak} longestStreak={longestStreak} />

          <WeeklyChart
            days={thisWeek}
            weekMinutes={weekMinutes}
            goalMinutes={WEEKLY_GOAL_MINUTES}
          />

          <MonthlyCalendar days={last30Days} />

          {/* Mensaje motivacional */}
          <section className="glass relative overflow-hidden rounded-3xl p-5 text-center sm:p-6">
            <span
              aria-hidden
              className="pointer-events-none absolute -right-10 -top-16 h-40 w-40 rounded-full opacity-50 blur-3xl"
              style={{ background: 'hsl(18 100% 56% / 0.6)' }}
            />
            <p className="relative text-sm leading-relaxed text-white/90">
              {streak === 0 ? (
                <>
                  <strong className="text-white">Empezá hoy.</strong> Cada
                  apunte que hagas suma a tu racha — el primer día siempre es
                  el más difícil.
                </>
              ) : streak < 7 ? (
                <>
                  <strong className="text-white">¡Vas por buen camino!</strong>{' '}
                  Llegá a 7 días seguidos para desbloquear tu primera semana
                  completa.
                </>
              ) : streak < 30 ? (
                <>
                  <strong className="text-white">
                    Ya estás haciendo hábito.
                  </strong>{' '}
                  Si seguís, llegás a 30 días y te volvés imparable.
                </>
              ) : (
                <>
                  <strong className="text-white">¡Sos una máquina!</strong>{' '}
                  {streak} días seguidos. Esto ya es disciplina pura.
                </>
              )}
            </p>
          </section>
        </div>
      </main>
    </>
  );
}
