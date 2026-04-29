import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth/require-auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { OnboardingFlow } from './onboarding-flow';
import { ambientGlow } from '@/lib/design-tokens';

export const metadata = {
  title: 'Configurá tu cuenta · Chero',
  description: 'Contanos un poco sobre vos para personalizar tus apuntes.',
};

/**
 * Página /onboarding — Server Component.
 *
 * - Si no hay sesión → /login
 * - Si el perfil ya está completo → /capture
 * - Si no → renderizamos el flow de 3 pasos
 *
 * Definimos "perfil completo" como: tiene user_type + age + (institution o institution_other)
 * La lista de materias es opcional al final (se puede agregar después en /perfil).
 */
export default async function OnboardingPage() {
  const user = await requireAuth('/onboarding');
  const supabase = await createSupabaseServerClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('user_type, age, institution')
    .eq('id', user.id)
    .maybeSingle();

  const isComplete =
    profile?.user_type &&
    typeof profile?.age === 'number' &&
    profile?.institution;

  if (isComplete) {
    redirect('/capture');
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0a14] text-white">
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: ambientGlow }}
      />
      <main className="relative z-10 mx-auto flex min-h-screen max-w-lg flex-col px-6 py-12">
        <OnboardingFlow
          initialEmail={user.email ?? null}
        />
      </main>
    </div>
  );
}
