export default function Loading() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#05060f]">
      <div className="flex flex-col items-center gap-4">
        <div
          className="h-12 w-12 animate-pulse rounded-xl text-2xl shadow-[0_0_30px_rgba(99,102,241,0.5)]"
          style={{
            background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          🐎
        </div>
        <p className="text-sm text-white/40">Cargando…</p>
      </div>
    </div>
  );
}
