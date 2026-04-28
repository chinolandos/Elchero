import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Middleware Next.js — refresca la sesión de Supabase en cada request.
 * Sin esto, los access tokens expiran y los usuarios pierden sesión.
 *
 * También protege rutas de /api que requieren auth (excepto callback público).
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

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
 * - Static files (_next/static, _next/image)
 * - Favicon, robots, sitemap, etc.
 * - Cron endpoints (autenticados con CRON_SECRET, no necesitan sesión user)
 */
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api/cron/).*)',
  ],
};
