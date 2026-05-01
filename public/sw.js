/**
 * Chero Service Worker — soporte offline.
 *
 * Estrategias:
 *   - Cache First para /_next/static y assets (fonts, images): nunca cambian
 *     entre deploys (Next.js los versiona con hash).
 *   - Stale-While-Revalidate para HTML pages: sirve cache instantáneo,
 *     fetcha fresh en background para próxima visita.
 *   - Network Only para /api/*: NO cachear por privacy (multi-user en
 *     mismo device → cache de user A no debe servirse a user B).
 *   - Network Only para mutations (POST/PUT/PATCH/DELETE).
 *
 * Versioning: cache names llevan VERSION. Bumpear VERSION fuerza purga
 * en activate (deploy = cache fresh).
 *
 * Logout: client envía postMessage({type: 'CLEAR_CACHE'}) al SW.
 */

const VERSION = 'v1';
const STATIC_CACHE = `chero-static-${VERSION}`;
const PAGES_CACHE = `chero-pages-${VERSION}`;

// Páginas que NUNCA cacheamos (sensibles, deben ser siempre fresh)
const NEVER_CACHE_PATHS = [
  '/api/',
  '/auth/callback',
  '/login',
];

// ─── Lifecycle ───

self.addEventListener('install', (event) => {
  // skipWaiting hace que el nuevo SW se active de inmediato (sin esperar
  // a que todas las pestañas cierren). Combinado con clients.claim() abajo
  // garantiza que después de un deploy, el nuevo SW toma control rápido.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Limpiar caches viejos que no matchean el VERSION actual
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith('chero-') && !key.endsWith(VERSION))
          .map((key) => caches.delete(key)),
      );
      // Tomar control de las pestañas existentes inmediatamente
      await self.clients.claim();
    })(),
  );
});

// ─── Fetch handler ───

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Solo GET. POST/PUT/PATCH/DELETE pasan al network siempre.
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Solo same-origin (cross-origin = OpenAI/Supabase/Vercel CDN, no cacheamos)
  if (url.origin !== self.location.origin) return;

  // Paths que nunca cacheamos
  if (NEVER_CACHE_PATHS.some((p) => url.pathname.startsWith(p))) return;

  // Cache First: assets estáticos (Next.js los hashea, son immutable)
  if (
    url.pathname.startsWith('/_next/static') ||
    /\.(woff2?|png|jpg|jpeg|webp|svg|ico|css|js)$/.test(url.pathname)
  ) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Stale While Revalidate: HTML pages (mismo dominio, accept text/html)
  // Acepta también requests sin Accept header (programmatic fetches)
  const accept = request.headers.get('accept') ?? '';
  if (accept.includes('text/html') || request.destination === 'document') {
    event.respondWith(staleWhileRevalidate(request, PAGES_CACHE));
    return;
  }
});

/**
 * Cache First: servir desde cache si existe, sino fetch + cache.
 * Para assets immutables (versionados por hash).
 */
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    // Solo cachear respuestas exitosas
    if (response.ok && response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    // Si no hay network y no hay cache, error
    return new Response('Offline — asset no disponible', { status: 503 });
  }
}

/**
 * Stale While Revalidate: devuelve cache inmediatamente (si existe) y
 * fetcha en background para actualizar para próxima vez.
 *
 * Da feel de instant load + content fresh.
 */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  // Fetch en background — actualiza cache para próxima visita
  const networkFetch = fetch(request)
    .then((response) => {
      if (response.ok && response.status === 200) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);

  // Si tenemos cache, devolver eso primero (instant)
  if (cached) return cached;

  // Sin cache → esperar al network (primera visita)
  const fresh = await networkFetch;
  if (fresh) return fresh;

  // Truly offline + sin cache → error
  return new Response('Offline — page no cacheada', {
    status: 503,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}

// ─── Logout cache clear ───

self.addEventListener('message', (event) => {
  if (event.data?.type === 'CLEAR_CACHE') {
    event.waitUntil(
      (async () => {
        // Borrar caches dinámicos (pages + cualquier futuro). No tocamos
        // STATIC_CACHE porque ahí solo viven assets públicos (fonts/etc)
        // que no son sensibles.
        await caches.delete(PAGES_CACHE);

        // Confirmar al cliente que terminó (postMessage back si hay channel)
        if (event.ports?.[0]) {
          event.ports[0].postMessage({ ok: true });
        }
      })(),
    );
  }
});

// ─── Push notifications ───

/**
 * Recibe push del server (via VAPID + web-push library).
 * El payload viene en event.data como JSON con { title, body, url, tag, icon }.
 */
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    // Si el payload no es JSON, tratar como string plain
    data = { title: 'Chero', body: event.data.text() };
  }

  const title = data.title ?? 'Chero';
  const options = {
    body: data.body ?? '',
    icon: data.icon ?? '/icon.png',
    badge: '/icon.png',
    // tag: si dos pushes con el mismo tag llegan, el nuevo reemplaza al viejo
    // (no se acumulan notificaciones duplicadas)
    tag: data.tag ?? 'chero-push',
    data: { url: data.url ?? '/' },
    // Vibration pattern (Android only): 200ms vibrate, 100ms pause, 200ms vibrate
    vibrate: [200, 100, 200],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

/**
 * Cuando el user toca la notificación, abrir o focus la app en la URL
 * que vino en data.url.
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url ?? '/';

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });

      // Si ya hay una pestaña abierta de Chero, focusearla y navegar
      for (const client of allClients) {
        if (client.url.includes(self.location.origin)) {
          await client.focus();
          if ('navigate' in client) {
            await client.navigate(targetUrl);
          }
          return;
        }
      }

      // Si no hay pestaña abierta, abrir una nueva
      await self.clients.openWindow(targetUrl);
    })(),
  );
});
