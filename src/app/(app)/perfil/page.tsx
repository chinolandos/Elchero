import Link from 'next/link';
import { requireAuth } from '@/lib/auth/require-auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { readUsage } from '@/lib/usage/check';
import {
  calculateStreak,
  calculateThisWeek,
} from '@/lib/perfil/stats';
import { ProfileHero } from './profile-hero';
import { ProfileMenu } from './profile-menu';
import { WeeklyChart } from '../rachas/weekly-chart';
import type { UserProfile } from '@/lib/types/chero';

export const metadata = {
  title: 'Mi perfil · Chero',
  description: 'Editá tus datos personales, materias y voz preferida.',
};

const MAX_USES_PER_USER = Number(process.env.MAX_USES_PER_USER ?? 5);

/**
 * Extrae el primer nombre del email o del user_metadata.
 * "milton.landos@example.com" → "Milton"
 * Si Google OAuth devolvió un nombre completo, lo usamos.
 */
function deriveFirstName(
  email: string | null | undefined,
  fullName: string | null | undefined,
): string | null {
  if (fullName) {
    const first = fullName.trim().split(/\s+/)[0];
    if (first)
      return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
  }
  if (email) {
    const localPart = email.split('@')[0];
    const firstSegment = localPart.split(/[._-]/)[0];
    if (firstSegment) {
      return (
        firstSegment.charAt(0).toUpperCase() +
        firstSegment.slice(1).toLowerCase()
      );
    }
  }
  return null;
}

/**
 * Página /perfil — vista resumida tipo Lovable (rediseño v5).
 *
 * Estructura:
 *   1. Hero card glass-strong con orb + greeting + chip context + stats grid
 *   2. Menu list (3 botones que navegan a sub-pages):
 *      - Personalización → /perfil/personalizacion
 *      - Materias → /perfil/materias
 *      - Cuenta → /perfil/cuenta
 *   3. Zona peligrosa (eliminar cuenta) — inline con confirmación
 *   4. Cerrar sesión — full-width glass pill
 *
 * El form completo (carrera/año/voz/materias/read-only) se distribuyó en
 * las 3 sub-pages para que esta vista sea ligera y escaneable.
 */
export default async function PerfilPage() {
  const user = await requireAuth('/perfil');
  const supabase = await createSupabaseServerClient();

  const [profileRes, notesRes, usage] = await Promise.all([
    supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle<UserProfile>(),
    // Cargamos created_at + duration_minutes para:
    //   - streak (días consecutivos con al menos 1 nota)
    //   - WeeklyChart "Esta semana" (minutos por día Lun-Dom)
    //   - notes count para stat "Apuntes"
    supabase
      .from('notes')
      .select('created_at, audio_duration_minutes')
      .eq('user_id', user.id),
    readUsage(user.id),
  ]);

  const profile = profileRes.data ?? null;
  const notesList = notesRes.data ?? [];

  const firstName = deriveFirstName(
    user.email,
    (user.user_metadata?.full_name ?? user.user_metadata?.name) as
      | string
      | null
      | undefined,
  );

  // Avatar: prioridad → profile.avatar_url (custom upload) → Google avatar
  // (user_metadata.avatar_url o picture) → null (cae al orb default)
  const customAvatar =
    typeof (profile as { avatar_url?: string } | null)?.avatar_url === 'string'
      ? (profile as { avatar_url?: string }).avatar_url ?? null
      : null;
  const googleAvatar =
    (user.user_metadata?.avatar_url as string | undefined) ??
    (user.user_metadata?.picture as string | undefined) ??
    null;
  const avatarUrl = customAvatar ?? googleAvatar;

  // Stats hero: Racha (Duolingo) / Apuntes (count) / Usos (beta remaining)
  const streak = calculateStreak(notesList);

  // WeeklyChart data: minutos por día de esta semana (Lun-Dom)
  const thisWeek = calculateThisWeek(notesList);
  const weekMinutes = thisWeek.reduce((acc, d) => acc + d.minutes, 0);

  const stats = {
    streak,
    notes: notesList.length,
    remainingUser: usage.remaining_user,
    maxPerUser: MAX_USES_PER_USER,
  };

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
          <Link
            href="/library"
            className="inline-flex items-center gap-2 text-sm text-white/70 transition-colors hover:text-white"
          >
            ← Mis apuntes
          </Link>
          <span className="text-xs uppercase tracking-[0.3em] text-white/55">
            Perfil
          </span>
        </header>

        <ProfileHero
          firstName={firstName}
          profile={profile}
          stats={stats}
          avatarUrl={avatarUrl}
        />

        {/* Esta semana — WeeklyChart con minutos por día (matching Lovable).
            Goal hardcoded a 600min (10h) por ahora; configurable en el futuro. */}
        <div className="mb-8">
          <WeeklyChart
            days={thisWeek}
            weekMinutes={weekMinutes}
            goalMinutes={600}
          />
        </div>

        <ProfileMenu />
      </main>
    </>
  );
}
