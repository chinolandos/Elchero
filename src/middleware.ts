import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Middleware Next.js — 2 responsabilidades:
 *   1. CORS para todas las rutas /api/* (whitelist estricta)
 *   2. Refresh de sesión Supabase para cookies sb-*-auth-token
 *
 * NOTA: este archivo NO importa lib/env.ts porque el middleware corre en
 * Edge Runtime, donde el zod parse de env vars puede ser caro de inicializar.
 * Usamos process.env directo aquí. La validación canónica está en lib/env.ts
 * (importado por todos los API routes en Node runtime).
 */

/**
 * Origins que pueden llamar a /api/*. Cualquier otro origin es rechazado
 * en el browser por la falta de Access-Control-Allow-Origin.
 *
 * Si necesitamos abrir a más dominios (mobile app, partners), se agregan acá.
 */
const ALLOWED_ORIGINS = [
  'https://elchero.app',
  'https://www.elchero.app',
  // Vercel preview deployments — pattern check abajo
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

/**
 * ¿Permitido este origin? Acepta whitelist exacta + Vercel preview URLs
 * (chero-*.vercel.app) para PRs sin tener que actualizar la lista.
 */
function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  // Vercel preview deployments del repo Elchero
  if (/^https:\/\/elchero-[a-z0-9-]+\.vercel\.app$/.test(origin)) return true;
  return false;
}

/**
 * Headers CORS estándar. Solo se agregan si el origin está en whitelist.
 */
function applyCorsHeaders(response: NextResponse, origin: string | null) {
  if (isAllowedOrigin(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin!);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    );
    response.headers.set(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-Process-Token, X-Webhook-Signature',
    );
    // Cache de preflight 24h — reduce CORS preflights del browser
    response.headers.set('Access-Control-Max-Age', '86400');
  }
  // Vary: Origin siempre (incluso si rechazamos), para que CDN no cachee
  // mal entre origins distintos
  response.headers.set('Vary', 'Origin');
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const origin = request.headers.get('origin');
  const isApiRoute = pathname.startsWith('/api/');

  // ─── 1. CORS preflight (OPTIONS) ───
  // Browser envía OPTIONS antes de POST/PUT/DELETE cross-origin.
  // Respondemos con 204 + headers CORS sin pasar por la lógica del API.
  if (isApiRoute && request.method === 'OPTIONS') {
    const preflightResponse = new NextResponse(null, { status: 204 });
    applyCorsHeaders(preflightResponse, origin);
    return preflightResponse;
  }

  // ─── 2. Supabase session refresh ───
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  // Optimización: si el user NO tiene cookies de Supabase auth, no hay sesión
  // que refrescar — saltamos getUser() para ahorrar round-trip de red.
  const hasSupabaseCookie = request.cookies
    .getAll()
    .some((c) => c.name.startsWith('sb-') && c.name.endsWith('-auth-token'));

  if (hasSupabaseCookie) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value),
            );
            response = NextResponse.next({
              request: { headers: request.headers },
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options),
            );
          },
        },
      },
    );

    // Refresca el token automáticamente si está cerca de expirar
    await supabase.auth.getUser();
  }

  // ─── 3. Aplicar CORS headers a la respuesta de /api/* ───
  // Para requests no-OPTIONS (GET, POST, etc.), agregamos headers después
  // de procesar la sesión.
  if (isApiRoute) {
    applyCorsHeaders(response, origin);
  }

  return response;
}

/**
 * Matcher: aplicar a TODAS las rutas excepto:
 *   - Static files (_next/static, _next/image)
 *   - Favicon, robots, sitemap, etc.
 *   - Cron endpoints (autenticados con CRON_SECRET, no necesitan sesión user)
 *
 * El callback `/auth/callback` SÍ debe pasar (necesita refrescar la sesión
 * recién creada por OAuth). Las rutas API protegidas siguen pasando para
 * que el endpoint pueda leer la sesión + agregamos CORS headers.
 */
export const config = {
  matcher: [
    // Excluir static + iconos + cron
    // (mantener excluido: api/cron porque usa CRON_SECRET propio)
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest|icon|opengraph-image|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api/cron/).*)',
  ],
};
