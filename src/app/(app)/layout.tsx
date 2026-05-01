import type { ReactNode } from 'react';
import { BottomTabBar } from '@/components/ui/bottom-tab-bar';
import { ambientGlow } from '@/lib/design-tokens';

/**
 * Layout group `(app)` — envuelve todas las rutas autenticadas con el bottom
 * tab bar fijo al pie. Los paréntesis en el nombre del directorio hacen que
 * Next.js trate este path como agrupador de layout SIN afectar la URL final
 * (`/library` sigue siendo `/library`, no `/(app)/library`).
 *
 * Páginas dentro de este grupo (post-auth con bottom tab):
 *   /library, /capture, /notes/[id], /perfil, /onboarding
 *
 * Páginas FUERA del grupo (públicas, sin bottom tab):
 *   /, /login, /como-funciona, /privacidad, /terminos, /auth/callback
 *
 * Padding bottom: pb-28 para que el contenido no quede tapado por el
 * BottomTabBar (que está fixed bottom-0 con safe-area-inset-bottom).
 * 28 = 112px = ~tab bar height (60-70px) + safe area iOS.
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {/*
       * Wrapper del contenido autenticado — centraliza bg + ambientGlow + text
       * para que cada page no tenga que duplicarlo.
       *
       *   - bg-[#0a0a14] = fondo Aura base (las páginas que usan v5 lo
       *     sobrescriben con bg-gradient-hero fixed)
       *   - pb-28 = padding-bottom para no quedar tapado por el BottomTabBar
       *   - relative + overflow-hidden = container del ambient glow
       *   - text-white = base color heredada por todas las pages
       */}
      <div className="relative min-h-screen overflow-hidden bg-[#0a0a14] pb-28 text-white">
        {/* Ambient glow background — radial gradients sutiles violeta/magenta */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: ambientGlow }}
          aria-hidden
        />
        {/* z-10 para que el contenido quede sobre el glow */}
        <div className="relative z-10">{children}</div>
      </div>
      <BottomTabBar />
    </>
  );
}
