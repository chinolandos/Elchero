import webpush from 'web-push';
import { createLogger } from '@/lib/logger';

const log = createLogger('push/send');

/**
 * VAPID config — leído de env vars.
 *
 * NEXT_PUBLIC_VAPID_PUBLIC_KEY: usado en cliente para subscribe()
 * VAPID_PRIVATE_KEY: server-only, firma los push outgoing
 * VAPID_SUBJECT: mailto:contact@elchero.app — required by spec
 *
 * Generar las keys una vez con:
 *   npx web-push generate-vapid-keys
 */
let configured = false;

function ensureConfigured() {
  if (configured) return;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? 'mailto:chinolandos@gmail.com';

  if (!publicKey || !privateKey) {
    throw new Error(
      'Missing VAPID env vars. Run `npx web-push generate-vapid-keys` y agregalas a .env.local + Vercel.',
    );
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
}

export interface PushPayload {
  title: string;
  body: string;
  /** URL a abrir cuando el user toca la notif. Default: /rachas */
  url?: string;
  /** Tag para agrupar notifs (mismo tag reemplaza la anterior). */
  tag?: string;
  /** Icono custom. Default: el orb de Chero. */
  icon?: string;
}

export interface PushSubscription {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface SendResult {
  success: boolean;
  /** true si el endpoint expiró (410) — borrar de DB. */
  expired: boolean;
  error?: string;
}

/**
 * Envía un push a UNA subscription. Retorna un SendResult — NO throws.
 * El caller debe iterar sobre las subscriptions del user y manejar el resultado.
 *
 * Si expired=true, el caller debe borrar la subscription de la DB.
 */
export async function sendPushTo(
  subscription: PushSubscription,
  payload: PushPayload,
): Promise<SendResult> {
  ensureConfigured();

  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      },
      JSON.stringify({
        title: payload.title,
        body: payload.body,
        url: payload.url ?? '/rachas',
        tag: payload.tag,
        icon: payload.icon ?? '/icon.png',
      }),
      { TTL: 60 * 60 * 24 }, // 24h TTL — si el browser está offline más, se descarta
    );

    return { success: true, expired: false };
  } catch (err) {
    // 410 Gone = subscription expirada (user borró el browser cache, o desinstaló PWA)
    const errObj = err as { statusCode?: number; body?: string; message?: string };
    if (errObj?.statusCode === 410 || errObj?.statusCode === 404) {
      log.warn('Push subscription expired', {
        endpoint: subscription.endpoint.slice(0, 60),
        statusCode: errObj.statusCode,
      });
      return { success: false, expired: true };
    }

    log.error('Push send failed', {
      endpoint: subscription.endpoint.slice(0, 60),
      statusCode: errObj?.statusCode,
      message: errObj?.message,
    });
    return {
      success: false,
      expired: false,
      error: errObj?.message ?? 'unknown',
    };
  }
}

/**
 * Helper para enviar a múltiples subscriptions en paralelo.
 */
export async function sendPushToMany(
  subscriptions: PushSubscription[],
  payload: PushPayload,
): Promise<{
  sent: number;
  failed: number;
  expired: PushSubscription[];
}> {
  const results = await Promise.all(
    subscriptions.map(async (sub) => ({ sub, result: await sendPushTo(sub, payload) })),
  );

  const expired = results
    .filter((r) => r.result.expired)
    .map((r) => r.sub);
  const sent = results.filter((r) => r.result.success).length;
  const failed = results.filter(
    (r) => !r.result.success && !r.result.expired,
  ).length;

  return { sent, failed, expired };
}
