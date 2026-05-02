import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { sendPushToMany } from '@/lib/push/send';
import { calculateStreak } from '@/lib/perfil/stats';
import { createLogger } from '@/lib/logger';

const log = createLogger('cron/streak-reminder');

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * GET /api/cron/streak-reminder
 *
 * Corre 1x por día (configurado en vercel.json).
 *
 * Lógica:
 *   1. Para cada user con push subscription activa:
 *   2. Calcular su streak actual (días consecutivos con notas)
 *   3. Si streak >= 1 AND no creó nota hoy → enviar push
 *      "Tu racha de X días está en peligro 🔥"
 *   4. Si endpoint expira (410), borrar subscription
 *
 * Auth: header Authorization: Bearer ${CRON_SECRET}
 */
export async function GET(req: NextRequest) {
  // Auth fail-closed
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get('authorization');
  if (!cronSecret) {
    log.error('CRON_SECRET not configured');
    return NextResponse.json({ error: 'cron_disabled' }, { status: 503 });
  }
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();

  // Tipo manual de la fila de push_subscriptions (database.ts aún no la
  // incluye — regenerar después de la migration con `npm run db:types`).
  interface PushSub {
    id: string;
    user_id: string;
    endpoint: string;
    p256dh: string;
    auth: string;
  }

  // Cargar todas las subscriptions activas con user_id.
  const { data: subsRaw, error: subsError } = await admin
    .from('push_subscriptions')
    .select('id, user_id, endpoint, p256dh, auth')
    .is('failed_at', null);

  if (subsError) {
    log.error('Subs query failed', { err: subsError.message });
    return NextResponse.json({ error: 'subs_query_failed' }, { status: 500 });
  }

  const subs = (subsRaw ?? []) as PushSub[];

  if (subs.length === 0) {
    return NextResponse.json({
      success: true,
      total_users: 0,
      sent: 0,
      skipped: 0,
    });
  }

  // Agrupar subs por user_id (un user puede tener múltiples devices)
  const subsByUser = new Map<string, PushSub[]>();
  for (const sub of subs) {
    const list = subsByUser.get(sub.user_id) ?? [];
    list.push(sub);
    subsByUser.set(sub.user_id, list);
  }

  let totalSent = 0;
  let totalSkipped = 0;
  let totalExpired = 0;

  // Procesar cada user
  for (const [userId, userSubs] of subsByUser) {
    // Cargar notas del user para calcular streak
    const { data: notes } = await admin
      .from('notes')
      .select('created_at')
      .eq('user_id', userId);

    const streak = calculateStreak(notes ?? []);

    // Solo enviar si tiene racha activa Y no creó nota hoy
    if (streak < 1) {
      totalSkipped += userSubs.length;
      continue;
    }

    // ¿Creó nota hoy?
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const createdToday = (notes ?? []).some((n) => {
      if (!n.created_at) return false;
      const d = new Date(n.created_at);
      d.setHours(0, 0, 0, 0);
      return d.getTime() === today.getTime();
    });

    if (createdToday) {
      totalSkipped += userSubs.length;
      continue;
    }

    // Send push a todas las subscriptions de este user
    const result = await sendPushToMany(
      userSubs.map((s) => ({
        endpoint: s.endpoint,
        p256dh: s.p256dh,
        auth: s.auth,
      })),
      {
        title: `Tu racha de ${streak} ${streak === 1 ? 'día' : 'días'} está en peligro 🔥`,
        body: '¡No la pierdas! Grabá un audio rápido y mantené el hábito.',
        url: '/capture',
        tag: 'streak-reminder',
      },
    );

    totalSent += result.sent;
    totalExpired += result.expired.length;

    // Borrar subscriptions expiradas (410 Gone)
    if (result.expired.length > 0) {
      const expiredEndpoints = result.expired.map((s) => s.endpoint);
      await admin
        .from('push_subscriptions')
        .delete()
        .in('endpoint', expiredEndpoints);
    }
  }

  log.info('Streak reminders sent', {
    total_users: subsByUser.size,
    sent: totalSent,
    skipped: totalSkipped,
    expired: totalExpired,
  });

  return NextResponse.json({
    success: true,
    total_users: subsByUser.size,
    sent: totalSent,
    skipped: totalSkipped,
    expired: totalExpired,
  });
}
