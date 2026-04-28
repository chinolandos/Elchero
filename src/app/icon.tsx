import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 512, height: 512 };
export const contentType = 'image/png';

/**
 * App icon dinámico — orb morado/magenta/cyan vibe Aura.
 * Usado por:
 *  - PWA Home Screen icon
 *  - Browser tab favicon (Next.js auto-genera versions chicas)
 *  - Social previews secundarios
 */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0a0a14',
        }}
      >
        <div
          style={{
            width: '88%',
            height: '88%',
            borderRadius: '50%',
            background:
              'radial-gradient(circle at 30% 30%, #c084fc 0%, transparent 50%), radial-gradient(circle at 70% 60%, #ec4899 0%, transparent 50%), radial-gradient(circle at 50% 80%, #22d3ee 0%, transparent 40%), linear-gradient(135deg, #6b21a8 0%, #1e1b4b 100%)',
            boxShadow: '0 0 60px rgba(192, 132, 252, 0.5)',
          }}
        />
      </div>
    ),
    { ...size },
  );
}
