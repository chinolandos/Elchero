'use client';

import { useEffect } from 'react';

/**
 * ServiceWorkerRegister — registra /sw.js al montar.
 *
 * Mount en (app)/layout.tsx para que solo se registre cuando el user está
 * autenticado (las pages públicas no necesitan offline).
 *
 * El SW handlea offline cache + push notifications. Una sola registración
 * cubre ambos features.
 *
 * Si hay un nuevo SW deployado, el browser lo detecta y reemplaza al viejo
 * gracias al `self.skipWaiting()` + `self.clients.claim()` del propio sw.js.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;

    // Esperar a window.load para no competir con el initial render
    const register = () => {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((registration) => {
          if (process.env.NODE_ENV === 'development') {
            console.log('[chero][sw] registered:', registration.scope);
          }
        })
        .catch((err) => {
          console.warn('[chero][sw] registration failed:', err);
        });
    };

    if (document.readyState === 'complete') {
      register();
    } else {
      window.addEventListener('load', register, { once: true });
      return () =>
        window.removeEventListener('load', register);
    }
  }, []);

  return null;
}

/**
 * Helper para borrar el cache dinámico del SW (HTML pages cacheados).
 * Llamar esto en el flow de logout para que el próximo user que entre
 * en el mismo device no vea pages cacheadas del user anterior.
 *
 * NO borra static assets (fonts, images) porque son públicos y
 * compartibles entre users.
 */
export async function clearOfflineCache(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (!('serviceWorker' in navigator)) return;

  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration?.active) return;

  // Usar MessageChannel para esperar la confirmación del SW
  return new Promise((resolve) => {
    const channel = new MessageChannel();
    channel.port1.onmessage = (event) => {
      if (event.data?.ok) resolve();
    };
    registration.active!.postMessage(
      { type: 'CLEAR_CACHE' },
      [channel.port2],
    );
    // Timeout de seguridad — si el SW no responde en 2s, seguir igual
    setTimeout(resolve, 2000);
  });
}
