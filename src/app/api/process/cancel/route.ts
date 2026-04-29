import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  createSupabaseServerClient,
  createSupabaseAdminClient,
} from '@/lib/supabase/server';
import { refundUsage } from '@/lib/usage/check';
import { verifyProcessToken } from '@/lib/auth/process-token';
import { createLogger } from '@/lib/logger';

export const runtime = 'nodejs';

const log = createLogger('api/process/cancel');

const BodySchema = z.object({
  process_token: z.string().min(20),
  transcript: z.string().min(1),
  reason: z.enum(['quality_rejected', 'user_cancelled']).optional(),
});

/**
 * POST /api/process/cancel
 *
 * Permite cancelar un procesamiento DESPUÉS de /api/process pero ANTES de
 * /api/generate-notes. Devuelve el uso al counter (refund) para que el user
 * no pierda un uso si decide no generar el apunte (por ejemplo: la calidad
 * del audio era mala y prefirió regrabar).
 *
 * Requiere el process_token firmado de /api/process — esto previene que un
 * user llame a este endpoint sin haber transcrito realmente.
 *
 * El user pierde: $0.003 de Whisper (no se reembolsa).
 * Recupera: 1 contador de uso (5/user) + 1 contador global (50 beta).
 */
export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const validated = BodySchema.safeParse(body);
  if (!validated.success) {
    return NextResponse.json(
      { error: 'invalid_body', issues: validated.error.issues },
      { status: 400 },
    );
  }

  const { process_token, transcript, reason } = validated.data;

  // Verificar token — sin esto, cualquiera podría llamar a refund desde el cliente
  const tokenCheck = verifyProcessToken(process_token, user.id, transcript);
  if (!tokenCheck.ok || !tokenCheck.tokenHash) {
    log.warn('Cancel called with invalid token', {
      userId: user.id,
      reason: tokenCheck.reason,
    });
    return NextResponse.json(
      { error: 'invalid_process_token', reason: tokenCheck.reason },
      { status: 403 },
    );
  }

  // CLAIM single-use del token. Si ya fue consumido por otro caller (genera
  // o cancel), no hacemos refund duplicado. Esto cierra el bug C2 donde un
  // user podía llamar /cancel N veces y restar del counter global N veces.
  const admin = createSupabaseAdminClient();
  const { data: claimOk, error: claimError } = await admin.rpc(
    'consume_token_atomic',
    {
      p_token_hash: tokenCheck.tokenHash,
      p_user_id: user.id,
      p_consumed_for: 'cancel',
    },
  );

  if (claimError) {
    log.error('consume_token_atomic RPC failed in cancel', {
      err: claimError.message,
    });
    return NextResponse.json(
      {
        error: 'token_claim_failed',
        message: 'Error temporal. Intentá de nuevo.',
      },
      { status: 500 },
    );
  }

  if (claimOk === false) {
    // El token ya fue consumido (por generate-notes exitoso o por un cancel previo).
    // No refund — sería duplicado. Devolvemos 409 informativo.
    log.info('Cancel called on already-consumed token', {
      userId: user.id,
      reason,
    });
    return NextResponse.json(
      {
        success: false,
        already_consumed: true,
        message:
          'Este audio ya fue procesado o cancelado antes. No corresponde refund.',
      },
      { status: 409 },
    );
  }

  // Token claim OK — primer cancel. Hacemos refund y registramos.
  const refund = await refundUsage(user.id);

  log.info('Process cancelled and refunded', {
    userId: user.id,
    refund_ok: refund.ok,
    reason: reason ?? 'unspecified',
  });

  return NextResponse.json({
    success: true,
    refunded: refund.ok,
    refund_error: refund.ok ? undefined : refund.error,
  });
}
