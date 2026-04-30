import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { requireAuth } from '@/lib/auth/require-auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { AjustesClient } from './ajustes-client';
import type { UserProfile } from '@/lib/types/chero';

export const metadata = {
  title: 'Ajustes · Chero',
};

/**
 * /perfil/ajustes — sub-página con el form de personalización.
 *
 * Carrera, año, voz preferida, datos read-only de la cuenta. Antes vivía
 * en /perfil; ahora /perfil es solo el menu y los ajustes están aquí.
 */
export default async function AjustesPage() {
  const user = await requireAuth('/perfil/ajustes');
  const supabase = await createSupabaseServerClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle<UserProfile>();

  return (
    <main className="mx-auto max-w-md px-5 pb-10 pt-6 sm:max-w-lg">
      {/* Header con back */}
      <header className="mb-6 flex items-center gap-3">
        <Link
          href="/perfil"
          aria-label="Volver al perfil"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/70 transition-colors hover:border-white/20 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
        </Link>
        <h1 className="text-2xl font-black tracking-tight">Ajustes</h1>
      </header>

      <AjustesClient
        email={user.email ?? ''}
        profile={profile ?? null}
      />
    </main>
  );
}
