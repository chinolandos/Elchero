import Link from 'next/link';
import { requireAuth } from '@/lib/auth/require-auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { UserProfile } from '@/lib/types/chero';
import { MateriasForm } from './materias-form';

export const metadata = {
  title: 'Materias actuales · Chero',
  description: 'Las materias que tomás este período.',
};

export default async function MateriasPage() {
  const user = await requireAuth('/perfil/materias');
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
            'radial-gradient(circle, hsl(295 90% 55% / 0.35), transparent 70%)',
        }}
      />
      <div
        aria-hidden
        className="animate-blob pointer-events-none fixed right-1/4 top-1/3 h-[420px] w-[420px] rounded-full opacity-60 blur-3xl"
        style={{
          animationDelay: '-6s',
          background:
            'radial-gradient(circle, hsl(18 100% 56% / 0.35), transparent 70%)',
        }}
      />
      <div
        aria-hidden
        className="animate-blob pointer-events-none fixed -bottom-40 -left-20 h-[480px] w-[480px] rounded-full opacity-60 blur-3xl"
        style={{
          animationDelay: '-12s',
          background:
            'radial-gradient(circle, hsl(270 90% 60% / 0.3), transparent 70%)',
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
            Materias
          </span>
        </header>

        <div className="mb-6 md:mb-8">
          <h1 className="font-display-pf text-3xl font-semibold tracking-tight text-white md:text-4xl">
            Materias actuales
          </h1>
          <p className="mt-2 text-sm text-white/75 md:text-base">
            Las que tomás este período. Máximo 15.
          </p>
        </div>

        <MateriasForm profile={profile} />
      </main>
    </>
  );
}
