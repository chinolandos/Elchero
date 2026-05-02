import { NextResponse } from 'next/server';
import {
  createSupabaseServerClient,
  createSupabaseAdminClient,
} from '@/lib/supabase/server';
import { sendPushToMany } from '@/lib/push/send';
import { createLogger } from '@/lib/logger';

const log = createLogger('api/push/test-send');

export const runtime = 'nodejs';

/**
 * POST /api/push/test-send
 *
 * Endpoint de testing — manda una push notification al user actual a TODAS
 * sus subscriptions registradas. Para probar el flujo sin esperar al cron.
 *
 * Auth: solo el user logueado puede triggerear push a sus propios devices.
 *
 * Borra subscriptions expiradas (410 Gone) automáticamente.
 */
export async function POST() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  // Cargar subs del user (RLS ya filtra por user_id).
  const { data: subsRaw } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .eq('user_id', user.id)
    .is('failed_at', null);

  const subs = subsRaw ?? [];

  if (subs.length === 0) {
    return NextResponse.json({
      error: 'no_subscriptions',
      message:
        'No tenés notificaciones activadas. Andá a /perfil/personalizacion y activá el toggle.',
    }, { status: 400 });
  }

  const result = await sendPushToMany(subs, {
    title: '🔥 Test de notificación',
    body: '¡Funcionando! Las push notifications de Chero están activas en este device.',
    url: '/rachas',
    tag: 'chero-test',
  });

  // Borrar expiradas (410 Gone)
  if (result.expired.length > 0) {
    const admin = createSupabaseAdminClient();
    const expiredEndpoints = result.expired.map((s) => s.endpoint);
    await admin
      .from('push_subscriptions')
      .delete()
      .in('endpoint', expiredEndpoints);
  }

  log.info('Test push sent', {
    userId: user.id,
    sent: result.sent,
    failed: result.failed,
    expired: result.expired.length,
  });

  return NextResponse.json({
    success: true,
    sent: result.sent,
    failed: result.failed,
    expired: result.expired.length,
    total_subs: subs.length,
  });
}
