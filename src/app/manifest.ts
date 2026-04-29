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
    // Paleta Aura sincronizada con design-tokens.ts y globals.css.
    // background_color: lo que se ve en la splash screen al instalar PWA.
    // theme_color: el tint del status bar / address bar (Android Chrome).
    background_color: '#0a0a14',
    theme_color: '#9333ea',
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
