'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useAuth } from '@/lib/auth/use-auth';
import { cn } from '@/lib/utils';

/**
 * ProfileMenu — menu list estilo Lovable + Zona peligrosa + Cerrar sesión.
 *
 * Cada row tipo Lovable: icono left + label + chevron right.
 * Click navega a sub-page correspondiente.
 *
 * 3 menu rows:
 *   - Personalización → /perfil/personalizacion (carrera, año, voz)
 *   - Materias → /perfil/materias (subjects multi-select)
 *   - Cuenta → /perfil/cuenta (read-only fields)
 *
 * Inline:
 *   - Zona peligrosa: card rojo con botón "Eliminar mi cuenta" (con confirm)
 *   - Cerrar sesión: full-width glass pill al final
 */

interface MenuItem {
  href: string;
  icon: React.ComponentType;
  label: string;
  description: string;
}

const MENU: MenuItem[] = [
  {
    href: '/perfil/personalizacion',
    icon: SparkleIcon,
    label: 'Personalización',
    description: 'Carrera, año y voz preferida',
  },
  {
    href: '/perfil/materias',
    icon: BookIcon,
    label: 'Materias',
    description: 'Las que tomás este período',
  },
  {
    href: '/perfil/cuenta',
    icon: UserIcon,
    label: 'Cuenta',
    description: 'Email, tipo, institución, edad',
  },
];

export function ProfileMenu() {
  const { signOut } = useAuth();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      setTimeout(() => setConfirmingDelete(false), 8000);
      return;
    }
    setIsDeleting(true);
    try {
      const res = await fetch('/api/profile', { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Error');
      toast.success('Tu cuenta y todos los apuntes fueron eliminados.');
      await signOut();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error');
      setIsDeleting(false);
      setConfirmingDelete(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Menu list — Lovable style */}
      <nav
        aria-label="Configuración del perfil"
        className="glass overflow-hidden rounded-3xl"
      >
        <ul className="divide-y divide-white/10">
          {MENU.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-white/[0.06] sm:px-6"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/10 text-white">
                    <Icon />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-white">
                      {item.label}
                    </div>
                    <div className="truncate text-xs text-white/60">
                      {item.description}
                    </div>
                  </div>
                  <ChevronRight />
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Zona peligrosa */}
      <section className="rounded-3xl border border-red-500/30 bg-red-500/[0.08] p-5 backdrop-blur-md sm:p-6">
        <h2 className="font-display-pf mb-1 text-xl font-semibold text-red-200 sm:text-2xl">
          Zona peligrosa
        </h2>
        <p className="mb-4 text-xs text-white/65">
          Cumple con tu derecho al olvido (Ley Protección Datos SV)
        </p>
        <h3 className="mb-2 text-sm font-semibold text-red-200">
          Eliminar mi cuenta
        </h3>
        <p className="mb-4 text-xs text-red-200/70">
          Esto borra tu perfil, todos los apuntes y el audio TTS de forma
          permanente. No se puede deshacer.
        </p>
        <Button
          variant="ghost"
          onClick={handleDeleteAccount}
          disabled={isDeleting}
          className={cn(
            'w-full transition-colors',
            confirmingDelete
              ? 'bg-red-500/20 text-red-200 hover:bg-red-500/30'
              : 'border border-red-500/30 text-red-300 hover:bg-red-500/10',
          )}
        >
          {isDeleting ? (
            <Spinner size="sm" />
          ) : confirmingDelete ? (
            '⚠️ Confirmá: borrar TODO permanentemente'
          ) : (
            'Eliminar mi cuenta'
          )}
        </Button>
      </section>

      {/* Cerrar sesión — full-width glass pill */}
      <button
        type="button"
        onClick={signOut}
        className="glass flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 text-sm font-semibold text-white transition-all hover:bg-white/[0.18]"
      >
        <LogOutIcon />
        <span>Cerrar sesión</span>
      </button>
    </div>
  );
}

// ─── Icons (lucide-style inline) ───

function ChevronRight() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 shrink-0 text-white/55"
      aria-hidden="true"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M12 7v14" />
      <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function LogOutIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" x2="9" y1="12" y2="12" />
    </svg>
  );
}
