import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getUserOrNull } from '@/lib/auth/require-auth';
import { LoginForm } from './login-form';
import { ambientGlow, orbGradient, shadows } from '@/lib/design-tokens';

export const metadata = {
  title: 'Iniciá sesión · Chero',
  description: 'Iniciá sesión en Chero con tu cuenta de Google.',
};

interface LoginPageProps {
  searchParams: Promise<{ next?: string; error?: string }>;
}

/**
 * Página /login — Server Component.
 * Si el user ya está autenticado, redirige a `next` (o `/capture` por default).
 */
export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const next = params.next ?? '/capture';
  const error = params.error;

  const user = await getUserOrNull();
  if (user) {
    redirect(next);
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0a14] text-white">
      {/* Ambient glow background */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: ambientGlow }}
      />

      <main className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 py-12 text-center">
        {/* Orb pequeño */}
        <div className="relative mb-10 flex items-center justify-center">
          <div
            className="orb-pulse h-24 w-24 rounded-full"
            style={{
              background: orbGradient,
              boxShadow: shadows.glowOrb,
            }}
          />
          <div
            className="pointer-events-none absolute h-40 w-40 rounded-full"
            style={{
              background:
                'radial-gradient(circle, rgba(147, 51, 234, 0.25) 0%, transparent 60%)',
            }}
          />
        </div>

        <h1 className="mb-3 text-3xl font-black tracking-tight md:text-4xl">
          Bienvenido a Chero
        </h1>
        <p className="mb-10 text-base text-white/60">
          Iniciá sesión para empezar a generar tus apuntes.
        </p>

        <Suspense fallback={null}>
          <LoginForm next={next} error={error} />
        </Suspense>

        <p className="mt-10 text-xs text-white/30">
          Al continuar aceptás nuestros{' '}
          <a href="/terminos" className="underline underline-offset-2 hover:text-white/50">
            términos
          </a>{' '}
          y{' '}
          <a href="/privacidad" className="underline underline-offset-2 hover:text-white/50">
            política de privacidad
          </a>
          .
        </p>
      </main>
    </div>
  );
}
