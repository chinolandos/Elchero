import type { MetadataRoute } from 'next';

/**
 * Web App Manifest — para soporte PWA (Add to Home Screen).
 * Día 7: agregar service worker + offline support con Serwist.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'El Chero — apuntes con IA',
    short_name: 'El Chero',
    description:
      'Apuntes con IA en español salvadoreño para AVANZO, parciales y períodos.',
    start_url: '/',
    display: 'standalone',
    background_color: '#05060f',
    theme_color: '#6366f1',
    orientation: 'portrait',
    lang: 'es-SV',
    icons: [
      {
        src: '/icon.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
