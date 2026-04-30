import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { orbGradient, shadows } from '@/lib/design-tokens';

export default function NoteNotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 py-12 text-center">
      <div
        className="orb-pulse mb-8 h-20 w-20 rounded-full opacity-50"
        style={{ background: orbGradient, boxShadow: shadows.glowOrb }}
      />
      <h1 className="mb-3 text-3xl font-black">Apunte no encontrado</h1>
      <p className="mb-8 text-white/60">
        Este apunte no existe, fue borrado, o no es tuyo.
      </p>
      <Link href="/capture" className={buttonVariants({ size: 'lg' })}>
        Generar un nuevo apunte
      </Link>
    </main>
  );
}
