import { createSupabaseAdminClient } from '@/lib/supabase/server';
import type { UsageStatus } from '@/lib/types/chero';

const MAX_TOTAL_USES = Number(process.env.MAX_TOTAL_USES ?? 50);
const MAX_USES_PER_USER = Number(process.env.MAX_USES_PER_USER ?? 5);

/**
 * Verifica si el usuario puede procesar un audio.
 * Chequea el counter global (50) y por usuario (5).
 */
export async function checkUsage(userId: string): Promise<UsageStatus> {
  const supabase = createSupabaseAdminClient();

  const [globalRes, userRes] = await Promise.all([
    supabase.from('usage_counter').select('total_uses').eq('id', 1).single(),
    supabase.from('user_usage').select('uses').eq('user_id', userId).maybeSingle(),
  ]);

  const totalUses = globalRes.data?.total_uses ?? 0;
  const userUses = userRes.data?.uses ?? 0;

  const remainingGlobal = Math.max(0, MAX_TOTAL_USES - totalUses);
  const remainingUser = Math.max(0, MAX_USES_PER_USER - userUses);

  let canProcess = true;
  let reason: UsageStatus['reason'];

  if (totalUses >= MAX_TOTAL_USES) {
    canProcess = false;
    reason = 'global_exhausted';
  } else if (userUses >= MAX_USES_PER_USER) {
    canProcess = false;
    reason = 'user_exhausted';
  }

  return {
    total_uses: totalUses,
    user_uses: userUses,
    remaining_global: remainingGlobal,
    remaining_user: remainingUser,
    can_process: canProcess,
    reason,
  };
}

/**
 * Incrementa el counter global y del usuario atómicamente.
 * Llamar DESPUÉS de procesar el audio exitosamente.
 */
export async function incrementUsage(userId: string): Promise<void> {
  const supabase = createSupabaseAdminClient();

  await Promise.all([
    supabase.rpc('increment_global_counter'),
    supabase.from('user_usage').upsert(
      { user_id: userId, uses: 1, last_use: new Date().toISOString() },
      { onConflict: 'user_id', ignoreDuplicates: false },
    ),
  ]);
}
