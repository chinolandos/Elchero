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
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0a0a14',
          backgroundImage:
            'radial-gradient(circle at 20% 20%, rgba(147, 51, 234, 0.4), transparent 50%), radial-gradient(circle at 80% 70%, rgba(168, 85, 247, 0.30), transparent 55%), radial-gradient(circle at 50% 100%, rgba(76, 29, 149, 0.5), transparent 60%)',
          color: 'white',
          padding: 80,
          gap: 60,
        }}
      >
        {/* Orb central */}
        <div
          style={{
            width: 280,
            height: 280,
            borderRadius: '50%',
            background:
              'radial-gradient(circle at 30% 30%, #c084fc 0%, transparent 50%), radial-gradient(circle at 70% 60%, #ec4899 0%, transparent 50%), radial-gradient(circle at 50% 80%, #22d3ee 0%, transparent 40%), linear-gradient(135deg, #6b21a8 0%, #1e1b4b 100%)',
            boxShadow:
              '0 0 100px rgba(192, 132, 252, 0.5), 0 0 60px rgba(236, 72, 153, 0.4)',
            flexShrink: 0,
          }}
        />

        {/* Texto */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            flex: 1,
          }}
        >
          <span style={{ fontSize: 42, fontWeight: 700, opacity: 0.9 }}>
            El Chero
          </span>
          <h1
            style={{
              fontSize: 78,
              fontWeight: 900,
              lineHeight: 1.05,
              margin: 0,
              letterSpacing: '-0.04em',
            }}
          >
            Apuntes con IA,
            <br />
            <span
              style={{
                backgroundImage:
                  'linear-gradient(135deg, #6b21a8 0%, #9333ea 50%, #c084fc 100%)',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              hechos a tu medida
            </span>
          </h1>
          <p style={{ fontSize: 24, color: 'rgba(255, 255, 255, 0.6)', margin: 0 }}>
            AVANZO · Parciales · Períodos · 🇸🇻
          </p>
        </div>
      </div>
    ),
    { ...size },
  );
}
