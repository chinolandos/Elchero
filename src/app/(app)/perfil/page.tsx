import Link from 'next/link';
import { Bell, Sparkles, Settings, HelpCircle, BookText } from 'lucide-react';
import { requireAuth } from '@/lib/auth/require-auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { readUsage } from '@/lib/usage/check';
import { MenuListItem } from '@/components/ui/menu-list-item';
import { ProfileHeroCard } from './profile-hero-card';
import { ActivityChart } from './activity-chart';
import { LogoutMenuItem } from './logout-menu-item';
import type { UserProfile } from '@/lib/types/chero';

export const metadata = {
  title: 'Mi perfil · Chero',
  description: 'Tu cuenta, materias, ajustes y suscripción.',
};

const MAX_USES_PER_USER = Number(process.env.MAX_USES_PER_USER ?? 5);

const DAY_LABELS = ['D', 'L', 'M', 'X', 'J', 'V', 'S']; // Domingo=0 hasta Sábado=6

function deriveFirstName(
  email: string | null | undefined,
  fullName: string | null | undefined,
): string | null {
  if (fullName) {
    const first = fullName.trim().split(/\s+/)[0];
    if (first) return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
  }
  if (email) {
    const localPart = email.split('@')[0];
    const firstSegment = localPart.split(/[._-]/)[0];
    if (firstSegment) {
      return (
        firstSegment.charAt(0).toUpperCase() + firstSegment.slice(1).toLowerCase()
      );
    }
  }
  return null;
}

/**
 * Calcula los apuntes creados en cada uno de los últimos 7 días.
 * Devuelve array ordenado del día más antiguo al más reciente, con
 * el día de la semana ("L", "M", "X"...) como label.
 */
function buildWeeklyActivity(notesCreatedAt: string[]): {
  data: { day: string; count: number; date: string }[];
  total: number;
} {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days: { day: string; count: number; date: string }[] = [];

  // Conjunto de todos los timestamps a fecha (solo día, sin hora)
  const noteDays = notesCreatedAt.map((iso) => {
    const d = new Date(iso);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  });

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dayLabel = DAY_LABELS[d.getDay()];
    const dayMs = d.getTime();
    const count = noteDays.filter((nd) => nd === dayMs).length;
    days.push({
      day: dayLabel,
      count,
      date: d.toISOString(),
    });
  }

  return { data: days, total: days.reduce((s, d) => s + d.count, 0) };
}

export default async function PerfilPage() {
  const user = await requireAuth('/perfil');
  const supabase = await createSupabaseServerClient();

  // Cutoff = hace 7 días (inclusive)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [profileRes, notesCountRes, foldersCountRes, weeklyNotesRes, usage] =
    await Promise.all([
      supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle<UserProfile>(),
      supabase
        .from('notes')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id),
      supabase
        .from('folders')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id),
      supabase
        .from('notes')
        .select('created_at')
        .eq('user_id', user.id)
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: true }),
      readUsage(user.id),
    ]);

  const profile = profileRes.data ?? null;
  const firstName = deriveFirstName(
    user.email,
    (user.user_metadata?.full_name ?? user.user_metadata?.name) as
      | string
      | null
      | undefined,
  );

  const stats = {
    notes: notesCountRes.count ?? 0,
    folders: foldersCountRes.count ?? 0,
    remainingUser: usage.remaining_user,
    maxPerUser: MAX_USES_PER_USER,
  };

  const weeklyNotes =
    (weeklyNotesRes.data ?? []).map(
      (n) => (n as { created_at: string }).created_at,
    ) ?? [];
  const activity = buildWeeklyActivity(weeklyNotes);

  // Plan label dinámico — beta hasta que se lance Premium en Q3 2026
  const planLabel = 'Beta · 50 usos gratis';

  return (
    <main className="mx-auto max-w-md px-5 pb-10 pt-6 sm:max-w-lg">
      {/* Header simple */}
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-black tracking-tight">Perfil</h1>
        <Link
          href="/perfil/ajustes"
          aria-label="Ajustes"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/70 transition-colors hover:border-white/20 hover:text-white"
        >
          <Settings className="h-4 w-4" aria-hidden />
        </Link>
      </header>

      {/* Hero card con avatar + stats */}
      <ProfileHeroCard
        firstName={firstName}
        email={user.email ?? ''}
        planLabel={planLabel}
        stats={stats}
      />

      {/* Activity chart "Esta semana" */}
      <div className="mt-4">
        <ActivityChart data={activity.data} totalThisWeek={activity.total} />
      </div>

      {/* Menu list — cada item lleva a sub-página */}
      <div className="mt-4 space-y-2">
        <MenuListItem
          icon={Sparkles}
          label="Suscripciones"
          href="/perfil/suscripcion"
          iconGradient="violet"
          badge="Beta"
        />
        <MenuListItem
          icon={BookText}
          label="Materias"
          href="/perfil/materias"
          iconGradient="magenta"
        />
        <MenuListItem
          icon={Settings}
          label="Ajustes"
          href="/perfil/ajustes"
          iconGradient="coral"
        />
        <MenuListItem
          icon={HelpCircle}
          label="Ayuda y soporte"
          href="/perfil/ayuda"
          iconGradient="cyan"
        />
      </div>

      {/* Cerrar sesión — destructive item separado */}
      <div className="mt-6">
        <LogoutMenuItem />
      </div>

      {/* Espacio inferior extra para el bottom tab bar */}
      <div className="h-8" aria-hidden />

      {/* Notificaciones eliminadas — Chero no tiene notifs todavía */}
      <input type="hidden" data-profile-page-marker={profile ? 'loaded' : 'empty'} />
    </main>
  );
}
