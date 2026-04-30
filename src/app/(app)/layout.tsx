import type { ReactNode } from 'react';
import { SidebarNav } from '@/components/ui/sidebar-nav';

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
       * Wrapper del contenido autenticado:
       *   - md:pl-[76px] = offset desktop por la sidebar fija a la izquierda
       *   - bg-[#0a0a14] = fondo consistente con las pages (evita strip visual
       *     del padding-top en mobile que se vería transparente)
       *   - pt-14 md:pt-0 = en mobile, 56px de padding-top para que el contenido
       *     no quede tapado por el botón hamburguesa fixed (h-10 + top-3 = 52px).
       *     En desktop no hace falta porque el sidebar va al lateral, no encima.
       */}
      <div className="min-h-screen bg-[#0a0a14] pt-14 md:pl-[76px] md:pt-0">
        {children}
      </div>
    </>
  );
}
