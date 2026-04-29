import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { User } from '@supabase/supabase-js';

/**
 * Helper para Server Components / Server Actions / Route Handlers.
 *
 * - Si NO hay sesión → redirige a `/login?next=<currentPath>`.
 * - Si hay sesión → devuelve el `User`.
 *
 * Uso típico en una page protegida:
 *   export default async function CapturePage() {
 *     const user = await requireAuth('/capture');
 *     // ... renderizar con user.id, etc.
 *   }
 */
export async function requireAuth(currentPath?: string): Promise<User> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const params = currentPath ? `?next=${encodeURIComponent(currentPath)}` : '';
    redirect(`/login${params}`);
  }

  return user;
}

/**
 * Versión "soft" — devuelve null en vez de redirigir.
 * Útil para layouts/páginas que tienen contenido público + privado.
 */
export async function getUserOrNull(): Promise<User | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
