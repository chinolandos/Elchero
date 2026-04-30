import type { ReactNode } from 'react';
import { SidebarNav } from '@/components/ui/sidebar-nav';
import { ambientGlow } from '@/lib/design-tokens';

/**
 * Layout group `(app)` — envuelve todas las rutas autenticadas con el sidebar
 * de navegación. Los paréntesis en el nombre del directorio hacen que Next.js
 * trate este path como agrupador de layout SIN afectar la URL final
 * (`/library` sigue siendo `/library`, no `/(app)/library`).
 *
 * Páginas dentro de este grupo (post-auth con sidebar):
 *   /library, /capture, /notes/[id], /perfil, /onboarding
 *
 * Páginas FUERA del grupo (públicas, sin sidebar):
 *   /, /login, /como-funciona, /privacidad, /terminos, /auth/callback
 *
 * Offset:
 *   - Desktop (md+): pl-[76px] para acomodar el ancho de la sidebar fija.
 *   - Mobile: sin offset; el trigger hamburguesa es fixed top-left con
 *     backdrop-blur sutil, así que se superpone al contenido sin chocar
 *     visualmente.
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SidebarNav />
      {/*
       * Wrapper del contenido autenticado — centraliza bg + ambientGlow + text
       * para que cada page no tenga que duplicarlo.
       *
       *   - md:pl-[76px] = offset desktop por la sidebar fija a la izquierda
       *   - bg-[#0a0a14] = fondo Aura consistente
       *   - pt-14 md:pt-0 = padding-top mobile para no chocar con el hamburger
       *     fixed (h-10 + top-3 = 52px); en desktop no hace falta
       *   - relative + overflow-hidden = container del ambient glow
       *   - text-white = base color heredada por todas las pages
       */}
      <div className="relative min-h-screen overflow-hidden bg-[#0a0a14] pt-14 text-white md:pl-[76px] md:pt-0">
        {/* Ambient glow background — radial gradients sutiles violeta/magenta */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: ambientGlow }}
          aria-hidden
        />
        {/* z-10 para que el contenido quede sobre el glow */}
        <div className="relative z-10">{children}</div>
      </div>
    </>
  );
}
