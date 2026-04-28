import { brandGradient, shadows } from '@/lib/design-tokens';

export default function Loading() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-black">
      <div className="flex flex-col items-center gap-4">
        <div
          className="flex h-12 w-12 animate-pulse items-center justify-center rounded-xl text-2xl"
          style={{ background: brandGradient, boxShadow: shadows.glowMagenta }}
        >
          🐎
        </div>
        <p className="text-sm text-white/30">Cargando…</p>
      </div>
    </div>
  );
}
