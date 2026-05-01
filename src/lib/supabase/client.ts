import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/lib/types/database';

/**
 * Supabase client para Client Components.
 * Para auth flows desde el navegador.
 *
 * Generic <Database> activo: tipos auto-derivados del schema. Da
 * autocompletion en .from('X').select() y atrapa typos en columnas.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
