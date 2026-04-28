import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://elchero.app';
  const lastModified = new Date();

  // Sitemap básico para MVP: solo la landing pública.
  // Día 7 agregamos /privacidad, /terminos, /como-funciona, /pricing
  return [
    {
      url: baseUrl,
      lastModified,
      changeFrequency: 'weekly',
      priority: 1,
    },
  ];
}
