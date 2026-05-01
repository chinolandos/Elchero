'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpenText, Mic, Flame, UserCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * BottomTabBar — navegación primaria fija al fondo (mobile + desktop).
 *
 * Reemplaza la SidebarNav lateral (v4). Patrón inspirado en apps mobile
 * nativas: glass-strong pill flotante con tabs adentro, tab activo con
 * gradient warm matching el premium button.
 *
 * 3 tabs:
 *   - Inicio → /library (también activo en /notes/[id])
 *   - Grabar → /capture
 *   - Perfil → /perfil (incluye logout adentro)
 *
 * Comportamiento:
 *   - Position fixed bottom-0 con safe-area-inset-bottom para iOS
 *     (notch / home indicator).
 *   - max-w-md mx-auto para mantener feel mobile-first incluso en desktop.
 *   - z-40: arriba de overlays normales pero abajo de modales (z-50+).
 */

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
  /** Prefijos de rutas que también cuentan como activo. */
  matchPrefixes?: string[];
}

const TABS: NavItem[] = [
  {
    href: '/library',
    label: 'Inicio',
    icon: BookOpenText,
    matchPrefixes: ['/notes'],
  },
  { href: '/capture', label: 'Grabar', icon: Mic },
  { href: '/rachas', label: 'Rachas', icon: Flame },
  { href: '/perfil', label: 'Perfil', icon: UserCircle },
];

export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-40 px-4 pt-2"
      // Safe area para iOS (notch / home indicator). Si no hay safe area,
      // default a 1rem (16px) de padding inferior.
      style={{
        paddingBottom: 'max(env(safe-area-inset-bottom), 1rem)',
      }}
    >
      <div className="glass-strong mx-auto flex max-w-md items-center justify-around gap-1 rounded-3xl p-2">
        {TABS.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              aria-label={item.label}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-1 rounded-2xl py-2.5 transition-all',
                active
                  ? 'bg-gradient-primary shadow-button-premium text-white'
                  : 'text-white/70 hover:bg-white/5 hover:text-white',
              )}
            >
              <Icon aria-hidden className="h-5 w-5" />
              <span className="text-[11px] font-semibold">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/**
 * Determina si un tab está activo. Reglas:
 *   - Match exacto por path
 *   - matchPrefixes adicionales (ej: /library es activo en /notes/[id])
 *   - Sub-rutas de /perfil (futuro)
 */
function isActive(pathname: string, item: NavItem): boolean {
  if (pathname === item.href) return true;
  if (item.matchPrefixes?.some((p) => pathname.startsWith(p))) return true;
  if (item.href === '/perfil' && pathname.startsWith('/perfil/')) return true;
  return false;
}
