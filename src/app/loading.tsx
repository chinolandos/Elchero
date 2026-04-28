import { orbGradient, shadows } from '@/lib/design-tokens';

export default function Loading() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#0a0a14]">
      <div className="flex flex-col items-center gap-4">
        <div
          className="orb-pulse h-16 w-16 rounded-full"
          style={{ background: orbGradient, boxShadow: shadows.glowOrb }}
        />
        <p className="text-sm text-white/30">Cargando…</p>
      </div>
    </div>
  );
}
