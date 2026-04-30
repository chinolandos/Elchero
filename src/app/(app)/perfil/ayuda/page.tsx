import Link from 'next/link';
import {
  ArrowLeft,
  BookOpen,
  HelpCircle,
  MessageSquare,
  Bug,
  Shield,
  FileText,
} from 'lucide-react';
import { requireAuth } from '@/lib/auth/require-auth';
import { MenuListItem } from '@/components/ui/menu-list-item';

export const metadata = {
  title: 'Ayuda y soporte · Chero',
};

// requireAuth fuerza render dinámico — Next no intenta prerender estática-
// mente la página, evitando el error de pasar icon components (lucide
// React Components) desde Server → Client.
export default async function AyudaPage() {
  await requireAuth('/perfil/ayuda');
  return (
    <main className="mx-auto max-w-md px-5 pb-10 pt-6 sm:max-w-lg">
      <header className="mb-6 flex items-center gap-3">
        <Link
          href="/perfil"
          aria-label="Volver al perfil"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/70 transition-colors hover:border-white/20 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
        </Link>
        <h1 className="text-2xl font-black tracking-tight">Ayuda y soporte</h1>
      </header>
      <p className="mb-6 text-sm text-white/55">
        ¿Necesitás una mano? Acá te dejamos todo lo que podés consultar.
      </p>

      <div className="space-y-2">
        <MenuListItem
          icon={BookOpen}
          label="Cómo funciona Chero"
          href="/como-funciona"
          iconGradient="violet"
        />
        <MenuListItem
          icon={HelpCircle}
          label="Preguntas frecuentes"
          href="/#faq"
          iconGradient="magenta"
        />
        <MenuListItem
          icon={MessageSquare}
          label="Contactanos"
          href="mailto:chinolandos@gmail.com"
          iconGradient="coral"
        />
        <MenuListItem
          icon={Bug}
          label="Reportar un problema"
          href="mailto:chinolandos@gmail.com?subject=Bug%20en%20Chero"
          iconGradient="amber"
        />
        <MenuListItem
          icon={Shield}
          label="Privacidad"
          href="/privacidad"
          iconGradient="cyan"
        />
        <MenuListItem
          icon={FileText}
          label="Términos"
          href="/terminos"
          iconGradient="violet"
        />
      </div>
    </main>
  );
}
