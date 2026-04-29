import Link from 'next/link';
import { requireAuth } from '@/lib/auth/require-auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ProfileForm } from './profile-form';
import { ambientGlow, orbGradient, shadows } from '@/lib/design-tokens';
import type { UserProfile } from '@/lib/types/chero';

export const metadata = {
  title: 'Mi perfil · Chero',
  description: 'Editá tus datos personales, materias y voz preferida.',
};

export default async function PerfilPage() {
  const user = await requireAuth('/perfil');
  const supabase = await createSupabaseServerClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle<UserProfile>();

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0a14] text-white">
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: ambientGlow }}
      />
      <main className="relative z-10 mx-auto max-w-2xl px-6 py-10">
        <header className="mb-10 flex items-center justify-between gap-4">
          <Link
            href="/library"
            className="inline-flex items-center gap-2 text-sm text-white/60 transition-colors hover:text-white"
          >
            ← Mis apuntes
          </Link>
          <div className="flex items-center gap-3">
            <div
              className="orb-pulse h-7 w-7 rounded-full"
              style={{ background: orbGradient, boxShadow: shadows.glowOrb }}
            />
            <span className="text-sm font-bold">El Chero</span>
          </div>
        </header>

        <h1 className="mb-2 text-4xl font-black tracking-tight md:text-5xl">
          Mi perfil
        </h1>
        <p className="mb-10 text-white/60">
          Estos datos personalizan los apuntes que Chero genera para vos.
        </p>

        <ProfileForm
          email={user.email ?? ''}
          profile={profile ?? null}
        />
      </main>
    </div>
  );
}
