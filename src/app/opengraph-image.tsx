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
          background: '#05060f',
          backgroundImage:
            'radial-gradient(circle at 25% 25%, rgba(99, 102, 241, 0.4), transparent 50%), radial-gradient(circle at 75% 75%, rgba(236, 72, 153, 0.3), transparent 50%)',
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
              background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 60,
              boxShadow: '0 0 60px rgba(99, 102, 241, 0.5)',
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
                'linear-gradient(135deg, #6366f1 0%, #ec4899 50%, #f59e0b 100%)',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            hechos a tu medida
          </span>
        </h1>

        {/* Subtitle */}
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
