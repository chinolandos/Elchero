'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import {
  Menu,
  X,
  Sparkles,
  Home,
  CreditCard,
  HelpCircle,
  BookOpen,
  LogIn,
  LayoutGrid,
} from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { orbGradient, shadows } from '@/lib/design-tokens';
import { cn } from '@/lib/utils';

/**
 * LandingMobileNav — header glass fixed-top para la landing pública.
 *
 * Click en hamburger abre drawer desde abajo (sheet style) con:
 *   - Logo orbe + nombre marca + close button
 *   - Tagline "Apuntes con IA, hechos a tu medida."
 *   - 5 links de navegación (Inicio, Cómo funciona, Planes, Privacidad, FAQ)
 *   - 2 CTAs (Ingresar / Empezar gratis) o (Mis apuntes / + Nuevo) según auth
 *
 * Implementación drawer:
 *   - Portal a document.body
 *   - Backdrop con tap-to-close
 *   - ESC cierra
 *   - Body scroll lock cuando abierto
 *   - Slide-in desde bottom
 */

interface LandingMobileNavProps {
  userLoggedIn: boolean;
}

interface NavLink {
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
  label: string;
  href: string;
}

const PUBLIC_LINKS: NavLink[] = [
  { icon: Home, label: 'Inicio', href: '#inicio' },
  { icon: Sparkles, label: 'Cómo funciona', href: '/como-funciona' },
  { icon: CreditCard, label: 'Planes', href: '#planes' },
  { icon: BookOpen, label: 'Privacidad', href: '/privacidad' },
  { icon: HelpCircle, label: 'FAQ', href: '/como-funciona#faq' },
];

const APP_LINKS: NavLink[] = [
  { icon: LayoutGrid, label: 'Mis apuntes', href: '/library' },
  { icon: Sparkles, label: 'Crear apunte', href: '/capture' },
  { icon: CreditCard, label: 'Planes', href: '#planes' },
  { icon: BookOpen, label: 'Privacidad', href: '/privacidad' },
  { icon: HelpCircle, label: 'FAQ', href: '/como-funciona#faq' },
];

export function LandingMobileNav({ userLoggedIn }: LandingMobileNavProps) {
  const [open, setOpen] = useState(false);
  const links = userLoggedIn ? APP_LINKS : PUBLIC_LINKS;

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      {/* Inner container max-w-md mx-auto para que en desktop el header
          quede centrado y respete el ancho de la landing. */}
      <div className="mx-auto max-w-md px-3 pt-3">
        <div className="glass flex items-center justify-between rounded-2xl px-4 py-3">
          <Link
            href="#inicio"
            className="flex items-center gap-2"
            aria-label="El Chero - inicio"
          >
            <span
              className="relative inline-block h-7 w-7 rounded-full"
              style={{ background: orbGradient, boxShadow: shadows.glowOrb }}
              aria-hidden
            />
            <span className="font-display text-lg font-semibold text-white">
              El Chero
            </span>
          </Link>

          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Abrir menú"
            aria-expanded={open}
            className="glass grid h-10 w-10 place-items-center rounded-full text-white transition-smooth active:scale-95"
          >
            <Menu aria-hidden className="h-5 w-5" />
          </button>
        </div>
      </div>

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        links={links}
        userLoggedIn={userLoggedIn}
      />
    </header>
  );
}

function Drawer({
  open,
  onClose,
  links,
  userLoggedIn,
}: {
  open: boolean;
  onClose: () => void;
  links: NavLink[];
  userLoggedIn: boolean;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
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

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[60]"
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

      {/* Panel slide-in desde bottom — wrapped en max-w-md para desktop */}
      <div
        ref={panelRef}
        className="glass shadow-card-premium absolute inset-x-0 bottom-0 mx-auto max-w-md rounded-t-[2rem] px-6 pb-8 pt-5 animate-in slide-in-from-bottom duration-300"
      >
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="#inicio"
            onClick={onClose}
            className="flex items-center gap-2"
          >
            <span
              className="h-8 w-8 rounded-full"
              style={{ background: orbGradient, boxShadow: shadows.glowOrb }}
              aria-hidden
            />
            <span className="font-display text-xl font-semibold text-white">
              El Chero
            </span>
          </Link>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar menú"
            className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white"
          >
            <X aria-hidden className="h-4 w-4" />
          </button>
        </div>

        <p className="mb-5 text-sm text-white/55">
          Apuntes con IA, hechos a tu medida.
        </p>

        <nav className="flex flex-col gap-1.5">
          {links.map(({ icon: Icon, label, href }) => (
            <Link
              key={label + href}
              href={href}
              onClick={onClose}
              className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3.5 transition-smooth hover:bg-white/[0.06]"
            >
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/15 text-primary-glow">
                <Icon aria-hidden className="h-4 w-4" />
              </span>
              <span className="font-medium text-white">{label}</span>
            </Link>
          ))}
        </nav>

        {/* CTAs según auth */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          {userLoggedIn ? (
            <>
              <Link
                href="/library"
                onClick={onClose}
                className={cn(
                  buttonVariants({
                    variant: 'glass',
                    size: 'pill',
                    className: 'w-full',
                  }),
                )}
              >
                Mis apuntes
              </Link>
              <Link
                href="/capture"
                onClick={onClose}
                className={cn(
                  buttonVariants({
                    variant: 'premium',
                    size: 'pill',
                    className: 'w-full',
                  }),
                )}
              >
                + Nuevo
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                onClick={onClose}
                className={cn(
                  buttonVariants({
                    variant: 'glass',
                    size: 'pill',
                    className: 'w-full',
                  }),
                )}
              >
                <LogIn aria-hidden className="h-4 w-4" /> Ingresar
              </Link>
              <Link
                href="/login"
                onClick={onClose}
                className={cn(
                  buttonVariants({
                    variant: 'premium',
                    size: 'pill',
                    className: 'w-full',
                  }),
                )}
              >
                Empezar gratis
              </Link>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
