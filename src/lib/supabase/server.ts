import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { env } from '@/lib/env';
import { createLogger } from '@/lib/logger';
import type { Database } from '@/lib/types/database';

const log = createLogger('supabase/server');

/**
 * Supabase client para Server Components y API Routes.
 * Lee la sesión del usuario desde cookies httpOnly.
 *
 * Generic <Database> activo: tipos auto-derivados desde el schema en
 * src/lib/types/database.ts. Regenerar con `npm run db:types` cuando
 * cambies el schema.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch (err) {
            // Server Components no pueden setear cookies — esto es esperable.
            // Pero si pasa en otro contexto, queremos saber por qué.
            log.warn('cookie setAll failed', {
              err: err instanceof Error ? err.message : String(err),
            });
          }
        },
      },
    },
  );
}

/**
 * Cliente Supabase con SECRET KEY (admin).
 * SOLO usar en API routes de servidor cuando necesitemos bypass de RLS
 * (ej: incrementar counter global, gestionar storage TTL).
 * NUNCA exponer en cliente.
 */
export function createSupabaseAdminClient() {
  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SECRET_KEY,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {
          // no-op
        },
      },
    },
  );
}
