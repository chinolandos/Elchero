import { Suspense } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getUserOrNull } from '@/lib/auth/require-auth';
import { LoginForm } from './login-form';

export const metadata = {
  title: 'Iniciá sesión · Chero',
  description: 'Iniciá sesión en Chero con tu cuenta de Google.',
};

interface LoginPageProps {
  searchParams: Promise<{ next?: string; error?: string }>;
}

/**
 * Página /login — Server Component (rediseño v5).
 *
 * Si el user ya está autenticado, redirige a `next` (o `/capture` por default).
 *
 * Diseño v5 (Lovable hue-learn-glow):
 *   - Wrapper bg-gradient-hero + 3 blobs animados (parallax sutil)
 *   - Container max-w-[440px] mobile / md:max-w-2xl desktop
 *   - Orb 128px (radial violet→magenta→ember + box-shadows v5)
 *   - H1 Playfair "Bienvenido a Chero"
 *   - Botón Google con variant="premium" (gradient magenta→ember)
 *   - "← Volver" link top center
 *   - Footer mini legal coherente con landing y /como-funciona
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
    <div className="bg-gradient-hero relative min-h-screen w-full overflow-hidden text-foreground">
      {/* 3 blobs animados — mismo patrón que landing y como-funciona */}
      <div
        aria-hidden
        className="animate-blob pointer-events-none absolute -right-32 -top-40 h-[520px] w-[520px] rounded-full opacity-70 blur-3xl"
        style={{
          background:
            'radial-gradient(circle, hsl(295 90% 55% / 0.7), transparent 70%)',
        }}
      />
      <div
        aria-hidden
        className="animate-blob pointer-events-none absolute right-1/4 top-1/3 h-[420px] w-[420px] rounded-full opacity-60 blur-3xl"
        style={{
          animationDelay: '-6s',
          background:
            'radial-gradient(circle, hsl(18 100% 56% / 0.65), transparent 70%)',
        }}
      />
      <div
        aria-hidden
        className="animate-blob pointer-events-none absolute -bottom-40 -left-20 h-[480px] w-[480px] rounded-full opacity-60 blur-3xl"
        style={{
          animationDelay: '-12s',
          background:
            'radial-gradient(circle, hsl(270 90% 60% / 0.6), transparent 70%)',
        }}
      />

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-[440px] flex-col md:max-w-2xl lg:max-w-3xl">
        {/* "← Volver" link top center */}
        <div className="px-5 pt-8 text-center md:pt-12">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-white/70 transition-colors hover:text-white"
          >
            ← Volver
          </Link>
        </div>

        {/* Hero login */}
        <section className="flex flex-1 flex-col items-center justify-center gap-6 px-5 pb-12 text-center md:gap-8 md:px-8">
          {/* Orb sphere v5 — 128px mobile / 144px desktop */}
          <div className="relative grid place-items-center">
            <span
              aria-hidden
              className="absolute h-56 w-56 rounded-full opacity-70 blur-3xl md:h-64 md:w-64"
              style={{
                background:
                  'radial-gradient(circle, hsl(270 90% 60% / 0.6), transparent 70%)',
              }}
            />
            <div
              aria-hidden
              className="animate-float-orb relative h-32 w-32 rounded-full md:h-36 md:w-36"
              style={{
                background:
                  'radial-gradient(circle at 35% 30%, hsl(270 90% 60%) 0%, hsl(295 90% 55%) 45%, hsl(18 100% 56%) 100%)',
                boxShadow:
                  'inset 0 6px 20px hsl(0 0% 100% / 0.25), inset 0 -10px 30px hsl(0 0% 0% / 0.4), 0 30px 80px -20px hsl(295 90% 55% / 0.6)',
              }}
            />
          </div>

          <div className="flex flex-col gap-3 md:gap-4">
            <h1 className="font-display-pf text-3xl font-semibold leading-tight tracking-tight text-white md:text-4xl lg:text-5xl">
              Bienvenido a Chero
            </h1>
            <p className="text-sm text-white/75 md:text-base">
              Iniciá sesión para empezar a generar tus apuntes.
            </p>
          </div>

          {/* CTA Google — premium gradient (Lovable v5) */}
          <Suspense fallback={null}>
            <LoginForm next={next} error={error} />
          </Suspense>

          <p className="max-w-xs text-xs text-white/55 md:text-sm">
            Al continuar aceptás nuestros{' '}
            <Link
              href="/terminos"
              className="text-white/80 underline underline-offset-2 hover:text-white"
            >
              términos
            </Link>{' '}
            y{' '}
            <Link
              href="/privacidad"
              className="text-white/80 underline underline-offset-2 hover:text-white"
            >
              política de privacidad
            </Link>
            .
          </p>
        </section>

        {/* Footer mini legal — coherente con landing y como-funciona */}
        <footer
          className="px-5 pb-6 pt-2 text-center"
          aria-label="Footer legal"
        >
          <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[10px] text-white/40">
            <Link href="/privacidad" className="hover:text-white/70">
              Privacidad
            </Link>
            <span aria-hidden>·</span>
            <Link href="/terminos" className="hover:text-white/70">
              Términos
            </Link>
            <span aria-hidden>·</span>
            <a
              href="mailto:chinolandos@gmail.com"
              className="hover:text-white/70"
            >
              Contacto
            </a>
            <span aria-hidden>·</span>
            <span>© 2026 El Chero</span>
          </p>
        </footer>
      </main>
    </div>
  );
}
