'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpenText, Mic, UserCircle, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/auth/use-auth';
import { orbGradient, shadows } from '@/lib/design-tokens';
import { cn } from '@/lib/utils';

/**
 * SidebarNav — sidebar fija glassmórfica desktop ÚNICAMENTE (md+).
 *
 * En mobile el nav primario es el `<BottomTabBar />` (patrón nativo iOS/
 * Android). Por eso este componente está oculto en viewports < md.
 *
 * Item activo: burbuja blanca circular con icono violeta dentro (ref Aura
 * imagen 8). Resto: icono blanco a 60% opacidad.
 *
 * Footer del sidebar: orbe brand top + logout footer.
 */

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/library', label: 'Mis apuntes', icon: BookOpenText },
  { href: '/capture', label: 'Crear apunte', icon: Mic },
  { href: '/perfil', label: 'Mi perfil', icon: UserCircle },
];

export function SidebarNav() {
  const pathname = usePathname();
  const { signOut } = useAuth();

  return (
    <aside
      aria-label="Navegación principal"
      className="fixed inset-y-0 left-0 z-30 hidden w-[76px] flex-col items-center justify-between border-r border-white/[0.06] bg-white/[0.03] py-5 backdrop-blur-xl md:flex"
    >
      {/* Logo orbe top — link a /library (home autenticada) */}
      <Link
        href="/library"
        aria-label="El Chero - inicio"
        className="group flex h-12 w-12 items-center justify-center"
      >
        <span
          className="orb-pulse h-9 w-9 rounded-full transition-transform group-hover:scale-110"
          style={{ background: orbGradient, boxShadow: shadows.glowOrb }}
          aria-hidden
        />
      </Link>

      {/* Items principales */}
      <nav className="flex flex-col items-center gap-2">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
              className="group relative flex h-12 w-12 items-center justify-center"
            >
              <span
                className={cn(
                  'flex h-11 w-11 items-center justify-center rounded-full transition-all',
                  active
                    ? 'bg-white text-primary shadow-[0_0_24px_rgba(192,132,252,0.4)]'
                    : 'text-white/55 group-hover:bg-white/10 group-hover:text-white',
                )}
              >
                <Icon aria-hidden className="h-[18px] w-[18px]" />
              </span>

              {/* Tooltip al hover — solo desktop */}
              <span
                role="tooltip"
                className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-lg border border-white/10 bg-[#1e1e2e] px-3 py-1.5 text-xs font-medium text-white opacity-0 shadow-xl transition-opacity group-hover:opacity-100"
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Footer: logout */}
      <button
        type="button"
        onClick={signOut}
        aria-label="Cerrar sesión"
        className="group relative flex h-12 w-12 items-center justify-center"
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-full text-white/45 transition-colors group-hover:bg-red-500/15 group-hover:text-red-300">
          <LogOut aria-hidden className="h-[18px] w-[18px]" />
        </span>
        <span
          role="tooltip"
          className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-lg border border-white/10 bg-[#1e1e2e] px-3 py-1.5 text-xs font-medium text-white opacity-0 shadow-xl transition-opacity group-hover:opacity-100"
        >
          Cerrar sesión
        </span>
      </button>
    </aside>
  );
}

function isActive(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  if (href === '/library' && pathname.startsWith('/notes')) return true;
  if (href === '/perfil' && pathname.startsWith('/perfil/')) return true;
  return false;
}
