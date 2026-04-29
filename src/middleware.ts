import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Middleware Next.js — refresca la sesión de Supabase en cada request.
 * Sin esto, los access tokens expiran y los usuarios pierden sesión.
 *
 * NOTA: este archivo NO importa lib/env.ts porque el middleware corre en
 * Edge Runtime, donde el zod parse de env vars puede ser caro de inicializar.
 * Usamos process.env directo aquí. La validación canónica está en lib/env.ts
 * (importado por todos los API routes en Node runtime).
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  // Optimización A-B: si el user NO tiene cookies de Supabase auth, no
  // hay sesión que refrescar — saltamos getUser() para ahorrar el round-trip
  // de la red en cada hit anónimo (landing pública, /login pre-auth, etc.)
  const hasSupabaseCookie = request.cookies
    .getAll()
    .some((c) => c.name.startsWith('sb-') && c.name.endsWith('-auth-token'));

  if (!hasSupabaseCookie) {
    return response;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request: { headers: request.headers } });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Refresca el token automáticamente si está cerca de expirar
  await supabase.auth.getUser();

  return response;
}

/**
 * Matcher: aplicar a TODAS las rutas excepto:
 *   - Static files (_next/static, _next/image)
 *   - Favicon, robots, sitemap, etc.
 *   - Cron endpoints (autenticados con CRON_SECRET, no necesitan sesión user)
 *
 * Fix A-B (audit Días 1-4):
 *   Antes el matcher pasaba por TODAS las páginas incluyendo `/` (landing pública)
 *   y `/login` (sign-in anónimo), donde getUser() es overhead innecesario.
 *   El callback `/auth/callback` SÍ debe pasar (necesita refrescar la sesión
 *   recién creada por OAuth). Las rutas API protegidas siguen pasando para
 *   que el endpoint pueda leer la sesión.
 */
export const config = {
  matcher: [
    // Excluir static + iconos + cron
    // (mantener excluido: api/cron porque usa CRON_SECRET propio)
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest|icon|opengraph-image|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api/cron/).*)',
  ],
};
