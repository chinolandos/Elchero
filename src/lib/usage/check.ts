import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { createLogger } from '@/lib/logger';
import { env } from '@/lib/env';
import type { UsageStatus } from '@/lib/types/chero';

const log = createLogger('usage/check');

// Defaults beta: 50 totales, 5 por user. Overridable via env vars.
const MAX_TOTAL_USES = env.MAX_TOTAL_USES ?? 50;
const MAX_USES_PER_USER = env.MAX_USES_PER_USER ?? 5;

/**
 * Lee el estado de uso actual SIN incrementar.
 * Útil para mostrar al usuario antes de subir un audio.
 */
export async function readUsage(userId: string): Promise<UsageStatus> {
  const supabase = createSupabaseAdminClient();

  const [globalRes, userRes] = await Promise.all([
    supabase.from('usage_counter').select('total_uses').eq('id', 1).single(),
    supabase.from('user_usage').select('uses').eq('user_id', userId).maybeSingle(),
  ]);

  const totalUses = globalRes.data?.total_uses ?? 0;
  const userUses = userRes.data?.uses ?? 0;

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
    remaining_global: Math.max(0, MAX_TOTAL_USES - totalUses),
    remaining_user: Math.max(0, MAX_USES_PER_USER - userUses),
    can_process: canProcess,
    reason,
  };
}

interface TryIncrementResult {
  success: boolean;
  total_uses: number;
  user_uses: number;
  reason?: 'global_exhausted' | 'user_exhausted';
}

/**
 * Verifica límites Y incrementa atómicamente en una sola transacción SQL.
 *
 * Usa el RPC `try_increment_usage` (ver scripts/sql/02-counter-rpcs.sql)
 * que hace `SELECT ... FOR UPDATE` para evitar race conditions cuando varios
 * usuarios procesan al mismo tiempo.
 *
 * Retorna { success, total_uses, user_uses, reason? }.
 *
 * Si success === false:
 *   - reason === 'global_exhausted' → llegamos a 50 totales
 *   - reason === 'user_exhausted'   → este user llegó a 5
 *
 * Si success === true: counters ya fueron incrementados en BD.
 */
export async function tryIncrementUsage(userId: string): Promise<TryIncrementResult> {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase.rpc('try_increment_usage', {
    p_user_id: userId,
    p_max_global: MAX_TOTAL_USES,
    p_max_user: MAX_USES_PER_USER,
  });

  if (error) {
    throw new Error(`try_increment_usage RPC failed: ${error.message}`);
  }

  // El RPC devuelve JSONB con la forma { success, total_uses, user_uses, reason? }
  return data as TryIncrementResult;
}

/**
 * Decrementa los contadores en caso de error post-incremento.
 * Si transcribimos pero algo falla después, refundimos el uso para no penalizar al user.
 *
 * Usa el RPC `refund_usage` que hace ambos decrementos atómicos y no baja de 0.
 *
 * Retorna `{ ok: boolean, error?: string }`. NO throws — los callers ya están en
 * camino de error y no queremos enmascarar el error original con un refund failure.
 */
export async function refundUsage(
  userId: string,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = createSupabaseAdminClient();

  const { error } = await supabase.rpc('refund_usage', { p_user_id: userId });
  if (error) {
    log.error('refund RPC failed (counter inflated)', {
      userId,
      err: error.message,
      hint: 'Manual fix: SELECT refund_usage(...)',
    });
    return { ok: false, error: error.message };
  }
  log.info('Usage refunded', { userId });
  return { ok: true };
}
