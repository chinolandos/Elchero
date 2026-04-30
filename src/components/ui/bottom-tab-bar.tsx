'use client';

/**
 * BottomTabBar — nav primario en mobile. Reemplaza el drawer hamburguesa
 * por un patrón tipo iOS/Android nativo (Instagram, Spotify, TikTok).
 *
 * Solo visible en mobile (<md). En desktop el `<SidebarNav />` desktop pill
 * sigue siendo el nav primario.
 *
 * 4 tabs:
 *   - Inicio  → /library
 *   - Grabar  → /capture
 *   - Carpetas → /library#folders (anchor scroll a sección folders)
 *   - Perfil  → /perfil
 *
 * Active state: burbuja oscura sutil + label con color full + icono primario.
 * Inactive: opacity 60%.
 *
 * Floating: mb-3 mx-3, glassmorphism dark, safe-area aware iOS.
 */
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Mic, UserCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TabItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
}

const TABS: TabItem[] = [
  { href: '/library', label: 'Inicio', icon: Home },
  { href: '/capture', label: 'Grabar', icon: Mic },
  { href: '/perfil', label: 'Perfil', icon: UserCircle },
];

export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegación principal"
      // pb-[env(safe-area-inset-bottom)] respeta el notch / home indicator iOS.
      // z-40 deja espacio para modals (z-50) por encima.
      className="fixed inset-x-0 bottom-0 z-40 px-3 pb-3 pt-2 md:hidden"
      style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
    >
      <div className="mx-auto flex max-w-md items-center justify-around rounded-full border border-white/[0.08] bg-black/60 px-2 py-2 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
        {TABS.map((tab) => {
          const active = isTabActive(pathname, tab.href);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex h-14 min-w-[64px] flex-col items-center justify-center gap-0.5 rounded-full px-3 transition-all duration-200',
                active
                  ? 'bg-white/10 text-white'
                  : 'text-white/55 hover:text-white/85',
              )}
            >
              <Icon
                aria-hidden
                className={cn(
                  'transition-transform',
                  active ? 'h-[22px] w-[22px] scale-105' : 'h-5 w-5',
                )}
              />
              <span
                className={cn(
                  'text-[10px] font-semibold tracking-wide',
                  active ? 'opacity-100' : 'opacity-70',
                )}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/**
 * /library activo cuando estás en /library o /notes/[id] (notes pertenecen
 * a la sección "Inicio"). /perfil activo en /perfil. Folders es la misma
 * /library — solo se activa si tiene fragment #folders. Para evitar que
 * Carpetas e Inicio queden ambas activas en /library, sólo Inicio se marca
 * activo si el path es /library "limpio" (sin fragment, que en client-side
 * pathname no incluye el #).
 */
function isTabActive(pathname: string, href: string): boolean {
  if (href === '/library' && pathname === '/library') return true;
  if (href === '/capture' && pathname.startsWith('/capture')) return true;
  if (href === '/perfil' && pathname.startsWith('/perfil')) return true;
  // /notes/[id] cuenta como "Inicio" porque las notas viven dentro de library
  if (href === '/library' && pathname.startsWith('/notes')) return true;
  return false;
}
