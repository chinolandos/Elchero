import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#05060f] text-white">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.18), transparent 50%)',
        }}
      />
      <main className="relative z-10 mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-6 py-24 text-center">
        <div
          className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl text-3xl shadow-[0_0_30px_rgba(99,102,241,0.5)]"
          style={{ background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)' }}
        >
          🐎
        </div>
        <h1 className="mb-4 text-6xl font-black tracking-tight md:text-8xl">404</h1>
        <p className="mb-8 max-w-md text-lg text-white/70">
          Esta página no existe. Tal vez sigamos en construcción.
        </p>
        <Link
          href="/"
          className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition-transform hover:scale-105"
        >
          Volver al inicio
        </Link>
      </main>
    </div>
  );
}
