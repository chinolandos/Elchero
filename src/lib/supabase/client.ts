import { createBrowserClient } from '@supabase/ssr';

/**
 * Supabase client para Client Components.
 * Para auth flows desde el navegador.
 *
 * NOTA: src/lib/types/database.ts disponible para activar generic <Database>
 * cuando hagamos el sweep de schema mismatches (ver supabase/server.ts).
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
