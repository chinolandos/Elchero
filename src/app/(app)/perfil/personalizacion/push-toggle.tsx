'use client';

import { useEffect, useState } from 'react';
import { Bell, BellOff, Send } from 'lucide-react';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

/**
 * PushNotificationToggle — control para suscribirse / desuscribirse a push.
 *
 * Estados:
 *   - unsupported: el browser no soporta Notification API o Push API
 *   - default: nunca pidió permiso, muestra "Activar notificaciones"
 *   - granted + subscribed: muestra "Activadas" + botón desactivar
 *   - granted + not-subscribed: muestra "Permiso OK pero no suscripto" + botón activar
 *   - denied: el user negó el permiso. Mensaje + link a settings
 *
 * Push reminder sirve para que el cron de "racha en peligro" pueda mandarte
 * una notif a las 8pm si te olvidaste de estudiar hoy.
 */
export function PushNotificationToggle() {
  const [supported, setSupported] = useState<boolean | null>(null);
  const [permission, setPermission] = useState<NotificationPermission | null>(
    null,
  );
  const [subscribed, setSubscribed] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);

  // Detectar soporte y estado actual al mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const isSupported =
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window;
    setSupported(isSupported);

    if (!isSupported) return;

    setPermission(Notification.permission);

    // Check si ya hay subscription activa
    navigator.serviceWorker.ready.then(async (registration) => {
      const sub = await registration.pushManager.getSubscription();
      setSubscribed(!!sub);
    });
  }, []);

  const subscribe = async () => {
    setLoading(true);
    try {
      // 1. Pedir permiso
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== 'granted') {
        toast.error(
          'Necesitamos permiso para mandarte recordatorios de tu racha.',
        );
        return;
      }

      // 2. Subscribe via Push API
      const registration = await navigator.serviceWorker.ready;
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        toast.error('Push no configurado en este servidor.');
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        // Cast a BufferSource — TS lib choking entre ArrayBufferLike vs ArrayBuffer.
        // El Uint8Array que retornamos es válido per Web Push spec.
        applicationServerKey: urlBase64ToUint8Array(
          vapidPublicKey,
        ) as unknown as BufferSource,
      });

      // 3. Mandar al backend para guardar
      const json = subscription.toJSON();
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: json.keys,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message ?? 'No se pudo guardar la subscription.');
      }

      setSubscribed(true);
      toast.success('Notificaciones activadas. Te avisamos si tu racha está en peligro.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al activar.');
    } finally {
      setLoading(false);
    }
  };

  const sendTestNotification = async () => {
    setTesting(true);
    try {
      const res = await fetch('/api/push/test-send', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message ?? 'No se pudo enviar test.');
      }
      if (data.sent > 0) {
        toast.success(`Test enviado a ${data.sent} device${data.sent === 1 ? '' : 's'}.`);
      } else {
        toast.error('No se pudo enviar a ningún device. Probá desactivar y reactivar.');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error en test.');
    } finally {
      setTesting(false);
    }
  };

  const unsubscribe = async () => {
    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.getSubscription();
      if (!sub) {
        setSubscribed(false);
        return;
      }

      const endpoint = sub.endpoint;

      // 1. Browser-side unsubscribe
      await sub.unsubscribe();

      // 2. Backend: borrar de DB
      await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ endpoint }),
      });

      setSubscribed(false);
      toast.success('Notificaciones desactivadas.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al desactivar.');
    } finally {
      setLoading(false);
    }
  };

  // Loading initial detection
  if (supported === null) {
    return null;
  }

  if (!supported) {
    return (
      <div className="glass rounded-2xl p-4 text-sm text-white/65">
        Tu browser no soporta notificaciones push.
      </div>
    );
  }

  if (permission === 'denied') {
    return (
      <div className="glass rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <BellOff aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-white/65" />
          <div className="text-sm text-white/85">
            <strong className="text-white">Permiso bloqueado.</strong>{' '}
            Habilitá notificaciones para Chero desde la configuración de tu
            browser y volvé a intentar.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-start gap-3">
        <span className="bg-gradient-primary shadow-button-premium grid h-9 w-9 shrink-0 place-items-center rounded-2xl text-white">
          <Bell aria-hidden className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-white">
            Recordatorio de racha
          </div>
          <p className="mt-1 text-xs text-white/70">
            Te avisamos a las 8pm si todavía no estudiaste hoy y tu racha está
            en peligro.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={subscribed ? unsubscribe : subscribe}
              disabled={loading}
              className={cn(
                'inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-all',
                subscribed
                  ? 'border border-white/20 bg-white/5 text-white/85 hover:bg-white/10'
                  : 'bg-gradient-primary shadow-button-premium text-white',
              )}
            >
              {loading ? (
                <Spinner size="sm" />
              ) : subscribed ? (
                'Desactivar'
              ) : (
                'Activar notificaciones'
              )}
            </button>

            {/* Botón test — solo visible si está suscripto */}
            {subscribed && (
              <button
                type="button"
                onClick={sendTestNotification}
                disabled={testing}
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold text-white/85 transition-all hover:bg-white/10"
              >
                {testing ? (
                  <Spinner size="sm" />
                ) : (
                  <>
                    <Send aria-hidden className="h-3 w-3" />
                    Probar
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Convierte la VAPID public key (base64 url) a Uint8Array para
 * pushManager.subscribe(). Required by Web Push spec.
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const rawData = atob(base64);
  const buffer = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    buffer[i] = rawData.charCodeAt(i);
  }
  return buffer;
}
