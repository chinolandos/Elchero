import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth/require-auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { CaptureClient } from './capture-client';
import { ambientGlow } from '@/lib/design-tokens';

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
    <div className="relative min-h-screen overflow-hidden bg-[#0a0a14] text-white">
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: ambientGlow }}
      />
      <main className="relative z-10 mx-auto flex min-h-screen max-w-2xl flex-col px-6 py-10">
        <CaptureClient
          userEmail={user.email ?? ''}
          remainingUser={remainingUser}
          totalUserLimit={PER_USER_BETA_LIMIT}
          preferredVoice={profile?.preferred_voice ?? 'nova'}
        />
      </main>
    </div>
  );
}
