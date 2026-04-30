'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpenText,
  Mic,
  UserCircle,
  Menu,
  X,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/use-auth';
import { orbGradient, shadows } from '@/lib/design-tokens';
import { cn } from '@/lib/utils';

/**
 * SidebarNav — navegación primaria de la app autenticada.
 *
 * Comportamiento responsivo:
 *   - Desktop (md+): sidebar fija glassmórfica vertical anclada a la izquierda,
 *     ancho ~76px. Solo iconos en estado base, label en tooltip al hover.
 *   - Mobile (<md): trigger button hamburguesa fixed top-left que abre un
 *     drawer slide-in con backdrop. ESC + tap-outside cierran. Scroll del
 *     body se bloquea cuando el drawer está abierto. Focus trap dentro del
 *     drawer cuando está open.
 *
 * Item activo: burbuja blanca circular con icono violeta dentro (ref Aura
 * imagen 8). Resto de items: icono blanco a 60% opacidad.
 *
 * Footer del sidebar: orbe brand mini (decorativo) + botón Logout.
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
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      {/* Trigger hamburguesa — solo mobile */}
      <button
        type="button"
        onClick={() => setDrawerOpen(true)}
        aria-label="Abrir menú"
        aria-expanded={drawerOpen}
        className="fixed left-3 top-3 z-40 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-[#0a0a14]/80 text-white/80 backdrop-blur-md transition-colors hover:border-white/20 hover:text-white md:hidden"
      >
        <Menu aria-hidden className="h-5 w-5" />
      </button>

      {/* Sidebar fija — solo desktop */}
      <DesktopSidebar />

      {/* Drawer mobile */}
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}

/**
 * Sidebar fija de desktop. Ancho compacto, solo iconos, label en tooltip.
 * Position fixed a la izquierda, full height.
 */
function DesktopSidebar() {
  const pathname = usePathname();
  const { signOut } = useAuth();

  return (
    <aside
      aria-label="Navegación principal"
      className="fixed inset-y-0 left-0 z-30 hidden w-[76px] flex-col items-center justify-between border-r border-white/[0.06] bg-white/[0.03] py-5 backdrop-blur-xl md:flex"
    >
      {/* Logo orbe en el top — link a /library (home autenticada) */}
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
              {/* Burbuja blanca + icono violeta cuando activo;
                  solo icono blanco translúcido cuando inactivo. */}
              <span
                className={cn(
                  'flex h-11 w-11 items-center justify-center rounded-full transition-all',
                  active
                    ? 'bg-white text-primary shadow-[0_0_24px_rgba(192,132,252,0.4)]'
                    : 'text-white/55 group-hover:bg-white/10 group-hover:text-white',
                )}
              >
                <Icon aria-hidden className="h-5 w-5" />
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
          <LogOut aria-hidden className="h-5 w-5" />
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

/**
 * Drawer mobile — slide-in desde la izquierda con backdrop.
 *
 * Patrón de la skill modal-drawer-system:
 *   - Portal a document.body
 *   - ESC cierra
 *   - Focus trap dentro del panel cuando está abierto
 *   - Scroll lock del body
 *   - Backdrop tap cierra
 *   - role="dialog" + aria-modal="true"
 */
function MobileDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const { signOut } = useAuth();
  const panelRef = useRef<HTMLElement>(null);
  const [mounted, setMounted] = useState(false);

  // SSR-safe portal mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // ESC cierra
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Body scroll lock
  useEffect(() => {
    if (open) {
      const original = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [open]);

  // Focus trap simple — al abrir focus al primer link
  useEffect(() => {
    if (!open || !panelRef.current) return;
    const focusables = panelRef.current.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled])',
    );
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    first?.focus();

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !panelRef.current) return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
  }, [open]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 md:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Menú principal"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Cerrar menú"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      />

      {/* Panel slide-in desde la izquierda */}
      <aside
        ref={panelRef}
        className="absolute inset-y-0 left-0 flex w-[260px] flex-col border-r border-white/[0.08] bg-[#0a0a14]/95 px-5 py-6 shadow-2xl backdrop-blur-xl animate-in slide-in-from-left duration-300"
      >
        {/* Header del drawer: orbe + nombre marca + botón cerrar */}
        <div className="mb-8 flex items-center justify-between">
          <Link
            href="/library"
            onClick={onClose}
            className="flex items-center gap-3"
          >
            <span
              className="orb-pulse h-9 w-9 rounded-full"
              style={{ background: orbGradient, boxShadow: shadows.glowOrb }}
              aria-hidden
            />
            <span className="text-lg font-bold tracking-tight">El Chero</span>
          </Link>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar menú"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-white/55 transition-colors hover:bg-white/5 hover:text-white"
          >
            <X aria-hidden className="h-5 w-5" />
          </button>
        </div>

        {/* Nav items con icono + label */}
        <nav className="flex flex-1 flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all',
                  active
                    ? 'bg-white/10 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]'
                    : 'text-white/65 hover:bg-white/[0.04] hover:text-white',
                )}
              >
                <span
                  className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors',
                    active
                      ? 'bg-white text-primary'
                      : 'bg-white/[0.04] text-white/65',
                  )}
                >
                  <Icon aria-hidden className="h-[18px] w-[18px]" />
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer del drawer: logout */}
        <button
          type="button"
          onClick={() => {
            onClose();
            signOut();
          }}
          className="mt-2 flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-white/55 transition-colors hover:bg-red-500/10 hover:text-red-300"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.04]">
            <LogOut aria-hidden className="h-4 w-4" />
          </span>
          Cerrar sesión
        </button>
      </aside>
    </div>,
    document.body,
  );
}

/**
 * Determina si un path está activo. Considera "active" cuando el pathname
 * empieza con `href` (para que /notes/<id> y /notes marquen "Mis apuntes"
 * como activo via /library? — no. Cada item solo se activa si su href
 * coincide o el path empieza con su href). Special case: /library is active
 * for /notes/[id] paths since notes belong to library navigation.
 */
function isActive(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  // /notes/[id] cuenta como "Mis apuntes" activo
  if (href === '/library' && pathname.startsWith('/notes')) return true;
  // /perfil podría tener sub-routes en futuro
  if (href === '/perfil' && pathname.startsWith('/perfil/')) return true;
  return false;
}
