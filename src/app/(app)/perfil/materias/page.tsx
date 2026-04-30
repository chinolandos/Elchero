import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { requireAuth } from '@/lib/auth/require-auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { MateriasClient } from './materias-client';
import type { UserProfile } from '@/lib/types/chero';

export const metadata = {
  title: 'Materias · Chero',
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
    <main className="mx-auto max-w-md px-5 pb-10 pt-6 sm:max-w-lg">
      <header className="mb-6 flex items-center gap-3">
        <Link
          href="/perfil"
          aria-label="Volver al perfil"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/70 transition-colors hover:border-white/20 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
        </Link>
        <h1 className="text-2xl font-black tracking-tight">Materias</h1>
      </header>
      <p className="mb-6 text-sm text-white/55">
        Tus materias actuales del período. Marcá las que estás cursando y
        Chero las usa para detectar mejor el contexto de tus apuntes.
      </p>

      <MateriasClient profile={profile ?? null} />
    </main>
  );
}
