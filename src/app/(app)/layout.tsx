import type { ReactNode } from 'react';
import { SidebarNav } from '@/components/ui/sidebar-nav';
import { BottomTabBar } from '@/components/ui/bottom-tab-bar';
import { AuroraBg } from '@/components/ui/aurora-bg';

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
      {/* SidebarNav: en mobile sólo el hamburger (puede coexistir con bottom
          tab bar si el user prefiere drawer); en desktop la sidebar fija pill. */}
      <SidebarNav />

      {/*
       * Wrapper del contenido autenticado.
       *   - md:pl-[76px] = offset desktop por la sidebar fija a la izquierda
       *   - pb-28 md:pb-0 = espacio inferior en mobile para el bottom tab bar
       *     flotante (h-14 + mb-3 + safe-area ≈ 92-110px)
       *   - relative + overflow-hidden = container del aurora background
       */}
      <div className="relative min-h-screen overflow-hidden bg-[#0a0a14] pb-28 text-white md:pb-0 md:pl-[76px]">
        {/* Aurora background — blobs blur animados estilo lovable.
            Intensidad media en pages auth; el landing usa "full". */}
        <AuroraBg intensity="medium" />

        {/* z-10 para que el contenido quede sobre el aurora */}
        <div className="relative z-10">{children}</div>
      </div>

      {/* Bottom tab bar mobile — nav primario nativo iOS/Android style */}
      <BottomTabBar />
    </>
  );
}
