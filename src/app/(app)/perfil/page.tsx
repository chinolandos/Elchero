import Link from 'next/link';
import { requireAuth } from '@/lib/auth/require-auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { readUsage } from '@/lib/usage/check';
import { ProfileHero } from './profile-hero';
import { ProfileMenu } from './profile-menu';
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

        <ProfileHero firstName={firstName} profile={profile} stats={stats} />

        <ProfileMenu />
      </main>
    </>
  );
}
