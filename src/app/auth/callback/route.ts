import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createLogger } from '@/lib/logger';

const log = createLogger('auth/callback');

/**
 * Callback OAuth de Google.
 * Supabase redirige aquí después que el user autoriza con Google.
 * Intercambiamos el `code` por una sesión y redirigimos al destino.
 *
 * URL configurada en Google Cloud Console:
 *   https://elchero.app/auth/callback
 *   http://localhost:3000/auth/callback
 *
 * Nota: el destino default es `/` (landing) hasta que `/onboarding` exista (día 5).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get('code');
  // Default a `/` mientras /onboarding no exista (día 5)
  const next = searchParams.get('next') ?? '/';
  const error = searchParams.get('error');

  if (error) {
    log.warn('OAuth provider returned error', { error });
    return NextResponse.redirect(
      `${origin}/?error=${encodeURIComponent(error)}`,
    );
  }

  if (!code) {
    log.warn('Missing code in callback');
    return NextResponse.redirect(`${origin}/?error=missing_code`);
  }

  const supabase = await createSupabaseServerClient();
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    log.error('Code exchange failed', {
      err: exchangeError.message,
      status: exchangeError.status,
    });
    return NextResponse.redirect(
      `${origin}/?error=${encodeURIComponent(exchangeError.message)}`,
    );
  }

  log.info('Auth callback success', { next });

  // Forwarded host check (Vercel detrás de proxy)
  const forwardedHost = request.headers.get('x-forwarded-host');
  const isLocal = process.env.NODE_ENV === 'development';

  if (isLocal) {
    return NextResponse.redirect(`${origin}${next}`);
  }
  if (forwardedHost) {
    return NextResponse.redirect(`https://${forwardedHost}${next}`);
  }
  return NextResponse.redirect(`${origin}${next}`);
}
