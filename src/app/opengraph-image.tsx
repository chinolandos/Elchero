import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'El Chero — apuntes con IA, hechos a tu medida';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#000000',
          backgroundImage:
            'radial-gradient(circle at 20% 50%, rgba(255, 107, 26, 0.35), transparent 45%), radial-gradient(circle at 80% 30%, rgba(255, 0, 128, 0.4), transparent 45%), radial-gradient(circle at 50% 80%, rgba(107, 15, 173, 0.5), transparent 50%)',
          color: 'white',
          padding: 80,
        }}
      >
        {/* Logo + brand */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 24,
            marginBottom: 40,
          }}
        >
          <div
            style={{
              width: 100,
              height: 100,
              borderRadius: 24,
              background:
                'linear-gradient(135deg, #6B0FAD 0%, #FF0080 50%, #FF6B1A 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 60,
              boxShadow: '0 0 80px rgba(255, 0, 128, 0.6)',
            }}
          >
            🐎
          </div>
          <span style={{ fontSize: 64, fontWeight: 800 }}>El Chero</span>
        </div>

        {/* Tagline */}
        <h1
          style={{
            fontSize: 80,
            fontWeight: 900,
            lineHeight: 1.05,
            textAlign: 'center',
            marginBottom: 32,
            letterSpacing: '-0.04em',
          }}
        >
          Apuntes con IA,
          <br />
          <span
            style={{
              backgroundImage:
                'linear-gradient(135deg, #6B0FAD 0%, #FF0080 50%, #FF6B1A 100%)',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            hechos a tu medida
          </span>
        </h1>

        <p
          style={{
            fontSize: 28,
            color: 'rgba(255, 255, 255, 0.6)',
            textAlign: 'center',
            maxWidth: 900,
          }}
        >
          Para AVANZO, parciales y períodos · Hecho en El Salvador 🇸🇻
        </p>
      </div>
    ),
    { ...size },
  );
}
