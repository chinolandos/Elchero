import Link from 'next/link';
import type { ReactNode } from 'react';
import { requireAuth } from '@/lib/auth/require-auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { UserProfile } from '@/lib/types/chero';

export const metadata = {
  title: 'Cuenta · Chero',
  description: 'Tus datos verificados al ingresar.',
};

export default async function CuentaPage() {
  const user = await requireAuth('/perfil/cuenta');
  const supabase = await createSupabaseServerClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle<UserProfile>();

  return (
    <>
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
            href="/perfil"
            className="inline-flex items-center gap-2 text-sm text-white/70 transition-colors hover:text-white"
          >
            ← Mi perfil
          </Link>
          <span className="text-xs uppercase tracking-[0.3em] text-white/55">
            Cuenta
          </span>
        </header>

        <div className="mb-6 md:mb-8">
          <h1 className="font-display-pf text-3xl font-semibold tracking-tight text-white md:text-4xl">
            Cuenta
          </h1>
          <p className="mt-2 text-sm text-white/75 md:text-base">
            Datos verificados al ingresar.
          </p>
        </div>

        <section className="glass overflow-hidden rounded-3xl">
          <ul className="divide-y divide-white/10">
            <InfoRow label="Email" value={user.email ?? '—'} />
            {profile?.user_type && (
              <InfoRow
                label="Tipo de estudiante"
                value={
                  profile.user_type === 'bachiller'
                    ? 'Bachillerato'
                    : 'Universidad'
                }
              />
            )}
            {profile?.institution && (
              <InfoRow label="Institución" value={profile.institution} />
            )}
            {typeof profile?.age === 'number' && (
              <InfoRow
                label="Edad"
                value={
                  <span className="inline-flex items-center gap-2">
                    <span>{profile.age} años</span>
                    {profile.is_minor && (
                      <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] text-amber-200">
                        Menor
                      </span>
                    )}
                  </span>
                }
              />
            )}
          </ul>
        </section>
      </main>
    </>
  );
}

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <li className="flex items-center justify-between gap-4 px-5 py-4 sm:px-6">
      <span className="text-sm text-white/70">{label}</span>
      <span className="text-right text-sm font-medium text-white">
        {value}
      </span>
    </li>
  );
}
