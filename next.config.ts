import type { NextConfig } from 'next';

const securityHeaders = [
  // No permite que la página se cargue dentro de un iframe (anti-clickjacking)
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  // Evita que el navegador adivine el MIME type
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  // Política de Referrer: enviar origin en cross-origin
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  // Permissions-Policy: limitar APIs sensibles del browser
  {
    key: 'Permissions-Policy',
    value:
      'camera=(), microphone=(self), geolocation=(), payment=(), usb=()',
  },
  // HSTS: forzar HTTPS por 1 año (el TLD .app ya hace HSTS preload, este header refuerza)
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload',
  },
];

const nextConfig: NextConfig = {
  // Headers de seguridad aplicados a todas las rutas
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },

  // No incluir el header `X-Powered-By: Next.js` (mejor security)
  poweredByHeader: false,
};

export default nextConfig;
