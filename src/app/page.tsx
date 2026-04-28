import { ambientGlow, brandGradient, shadows } from '@/lib/design-tokens';

/**
 * Landing pública de Chero — placeholder durante el build (días 1-6).
 * Día 7 esto se reemplaza por la landing completa con hero, features, pricing, etc.
 */
export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white">
      {/* Ambient glow background — naranja + magenta + morado */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: ambientGlow }}
      />

      <main className="relative z-10 mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 py-24 text-center">
        {/* Badge */}
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-white/80 backdrop-blur">
          <span className="relative flex h-2 w-2">
            <span
              className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
              style={{ background: '#FF6B1A' }}
            />
            <span
              className="relative inline-flex h-2 w-2 rounded-full"
              style={{ background: '#FF6B1A' }}
            />
          </span>
          Beta · Lanzamiento próximo
        </div>

        {/* Logo + Brand */}
        <div className="mb-6 flex items-center gap-3">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl"
            style={{ background: brandGradient, boxShadow: shadows.glowMagenta }}
          >
            🐎
          </div>
          <span className="text-2xl font-extrabold tracking-tight">El Chero</span>
        </div>

        {/* Tagline gigante */}
        <h1 className="mb-6 max-w-2xl text-5xl font-black leading-[1.05] tracking-tight md:text-7xl">
          Apuntes con IA,{' '}
          <span
            className="bg-clip-text text-transparent"
            style={{ backgroundImage: brandGradient }}
          >
            hechos a tu medida
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mb-12 max-w-xl text-lg leading-relaxed text-white/60 md:text-xl">
          Subí o grabá el audio de tu clase y recibí apuntes en español
          salvadoreño con preguntas tipo examen, flashcards y audio para repasar.
          Hecho para AVANZO, parciales universitarios y pruebas de período.
        </p>

        {/* Status pill */}
        <div className="rounded-2xl border border-white/8 bg-white/5 px-6 py-4 text-sm backdrop-blur">
          <div className="font-semibold text-white">🚧 En construcción</div>
          <div className="mt-1 text-white/50">
            Estamos puliendo cada detalle. Volvé pronto, o seguinos en redes
            para ser de los primeros en probarlo.
          </div>
        </div>

        {/* Mini-footer */}
        <footer className="mt-16 text-xs text-white/30">
          Hecho con 🐎 en El Salvador · CBE 2026 ESEN
        </footer>
      </main>
    </div>
  );
}
