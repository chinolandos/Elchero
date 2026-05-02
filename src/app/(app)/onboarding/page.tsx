import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth/require-auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { OnboardingFlow } from './onboarding-flow';

export const metadata = {
  title: 'Configurá tu cuenta · Chero',
  description: 'Contanos un poco sobre vos para personalizar tus apuntes.',
};

/**
 * Página /onboarding — Server Component (rediseño v5).
 *
 * - Si no hay sesión → /login
 * - Si el perfil ya está completo → /capture
 * - Si no → renderizamos el flow de 3 pasos con el diseño v5 (bg-gradient-hero
 *   + blobs animados, encima del bg dark del (app)/layout)
 *
 * El bg-gradient-hero usa `fixed inset-0` para cubrir todo el área de
 * contenido del (app)/layout (que tiene bg-[#0a0a14]). El BottomTabBar
 * (z-40) queda visible por encima de los blobs (z-auto en el stacking
 * context) flotando al pie.
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
    <>
      {/* v5 bg cover — sobrescribe el bg-[#0a0a14] del (app)/layout.
          fixed inset-0 cubre todo el viewport. Como vive dentro del z-10
          wrapper del layout, no tapa el BottomTabBar (z-40). */}
      <div
        aria-hidden
        className="bg-gradient-hero pointer-events-none fixed inset-0"
      />

      {/* 3 blobs animados — patrón v5 coherente con landing/login/legales */}
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

      {/* Contenido — relative crea un stacking context por encima de los
          blobs/bg fixed para que sea interactivo. */}
      <main className="relative mx-auto flex min-h-screen w-full max-w-lg flex-col px-6 py-10 md:py-14">
        <OnboardingFlow initialEmail={user.email ?? null} />
      </main>
    </>
  );
}
