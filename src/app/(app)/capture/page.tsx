import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth/require-auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { CaptureClient } from './capture-client';

export const metadata = {
  title: 'Capturar audio · Chero',
  description: 'Grabá o subí el audio de tu clase para generar tu apunte.',
};

const GLOBAL_BETA_LIMIT = 50;
const PER_USER_BETA_LIMIT = 5;

/**
 * Página /capture — Server Component.
 *
 * Guards:
 *   - Sin sesión → /login
 *   - Sin perfil completo → /onboarding
 *
 * Carga el counter del usuario para mostrarlo en la UI.
 */
export default async function CapturePage() {
  const user = await requireAuth('/capture');
  const supabase = await createSupabaseServerClient();

  const [{ data: profile }, { data: usage }] = await Promise.all([
    supabase
      .from('profiles')
      .select('user_type, age, institution, preferred_voice')
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('user_usage')
      .select('uses')
      .eq('user_id', user.id)
      .maybeSingle(),
  ]);

  const isProfileComplete =
    profile?.user_type &&
    typeof profile?.age === 'number' &&
    profile?.institution;

  if (!isProfileComplete) {
    redirect('/onboarding');
  }

  // Usage counter
  const userUses = usage?.uses ?? 0;
  const remainingUser = Math.max(0, PER_USER_BETA_LIMIT - userUses);

  return (
    <>
      {/* v5 bg cover — sobrescribe el bg-[#0a0a14] del (app)/layout. */}
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

      <main className="relative mx-auto flex min-h-screen w-full max-w-[440px] flex-col px-5 py-8 md:max-w-2xl md:px-8 md:py-10">
        <CaptureClient
          userEmail={user.email ?? ''}
          remainingUser={remainingUser}
          totalUserLimit={PER_USER_BETA_LIMIT}
          preferredVoice={profile?.preferred_voice ?? 'nova'}
        />
      </main>
    </>
  );
}
