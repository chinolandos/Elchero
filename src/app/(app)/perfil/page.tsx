import Link from 'next/link';
import { requireAuth } from '@/lib/auth/require-auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { readUsage } from '@/lib/usage/check';
import { ProfileForm } from './profile-form';
import { ProfileHero } from './profile-hero';
import { ambientGlow } from '@/lib/design-tokens';
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

export default async function PerfilPage() {
  const user = await requireAuth('/perfil');
  const supabase = await createSupabaseServerClient();

  // Cargamos en paralelo: profile + counts + usage
  const [profileRes, notesCountRes, foldersCountRes, usage] = await Promise.all([
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

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0a14] text-white">
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: ambientGlow }}
      />
      <main className="relative z-10 mx-auto max-w-2xl px-6 py-10">
        <header className="mb-8 flex items-center justify-between gap-4">
          <Link
            href="/library"
            className="inline-flex items-center gap-2 text-sm text-white/60 transition-colors hover:text-white"
          >
            ← Mis apuntes
          </Link>
          <span className="text-xs uppercase tracking-wider text-white/40">
            Perfil
          </span>
        </header>

        <ProfileHero firstName={firstName} profile={profile} stats={stats} />

        <ProfileForm email={user.email ?? ''} profile={profile} />
      </main>
    </div>
  );
}
