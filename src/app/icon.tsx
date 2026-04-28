import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 512, height: 512 };
export const contentType = 'image/png';

/**
 * App icon dinámico — usado por:
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
          background:
            'linear-gradient(135deg, #6B0FAD 0%, #FF0080 50%, #FF6B1A 100%)',
          fontSize: 320,
          borderRadius: 96,
        }}
      >
        🐎
      </div>
    ),
    { ...size },
  );
}
