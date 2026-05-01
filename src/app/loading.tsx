import { orbGradient, shadows } from '@/lib/design-tokens';

/**
 * Global loading state — rediseño v5.
 * bg-gradient-hero matching el resto del sitio.
 */
export default function Loading() {
  return (
    <div className="bg-gradient-hero relative flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div
          className="orb-pulse h-16 w-16 rounded-full"
          style={{ background: orbGradient, boxShadow: shadows.glowOrb }}
          aria-hidden
        />
        <p className="text-sm text-white/55">Cargando…</p>
      </div>
    </div>
  );
}
