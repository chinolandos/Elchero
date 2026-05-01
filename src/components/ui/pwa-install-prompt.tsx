'use client';

import { useEffect, useState } from 'react';
import { X, Download, Share } from 'lucide-react';

/**
 * PwaInstallPrompt — banner flotante para instalar la app como PWA.
 *
 * Comportamiento:
 *   1. Detecta plataforma:
 *      - Standalone mode (ya instalada) → nunca muestra
 *      - iOS Safari → muestra instrucciones ("Tocá [share] → Agregar a inicio")
 *      - Chrome/Edge/Samsung → captura beforeinstallprompt + botón "Instalar"
 *      - Otros (Firefox, Safari macOS) → no muestra nada
 *
 *   2. Anti-anoyance:
 *      - Espera 30s desde mount antes de aparecer
 *      - Si user dismissed antes, cooldown 7 días (localStorage)
 *      - Si user instala, no vuelve a aparecer (display-mode: standalone)
 *
 * Posición: fixed bottom, encima del BottomTabBar (z-50 > tab bar z-40).
 */

const DISMISS_KEY = 'chero-pwa-dismissed-at';
const COOLDOWN_DAYS = 7;
const SHOW_AFTER_MS = 30_000; // 30 segundos

// Tipo del evento — TS no lo declara por default
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PwaInstallPrompt() {
  const [installEvent, setInstallEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [show, setShow] = useState(false);

  // Detectar plataforma + standalone al mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Detección iOS Safari (no Chrome iOS, no Firefox iOS, no in-app browsers)
    const ua = navigator.userAgent;
    const iOS = /iPad|iPhone|iPod/.test(ua) && !/CriOS|FxiOS|FBAN|Instagram/.test(ua);
    setIsIos(iOS);

    // ¿Ya está instalada?
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      // iOS legacy Safari API
      (window.navigator as { standalone?: boolean }).standalone === true;
    setIsStandalone(standalone);

    if (standalone) return; // No mostrar nada

    // Listener Chrome/Edge/Samsung — guardamos el evento para disparar luego
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  // Mostrar banner después de SHOW_AFTER_MS si:
  //   - No standalone
  //   - Browser soporta install (event capturado) O es iOS Safari
  //   - No hay cooldown activo
  useEffect(() => {
    if (isStandalone) return;
    if (!installEvent && !isIos) return;

    // Cooldown check
    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt) {
      const ms = Date.now() - parseInt(dismissedAt, 10);
      const days = ms / (1000 * 60 * 60 * 24);
      if (days < COOLDOWN_DAYS) return;
    }

    const t = setTimeout(() => setShow(true), SHOW_AFTER_MS);
    return () => clearTimeout(t);
  }, [installEvent, isIos, isStandalone]);

  const handleInstall = async () => {
    if (!installEvent) return;
    try {
      await installEvent.prompt();
      const choice = await installEvent.userChoice;
      if (choice.outcome === 'accepted') {
        // User aceptó — el browser inicia el install. El event ya se consumió.
        setInstallEvent(null);
        setShow(false);
      } else {
        // Dismissed → cooldown
        localStorage.setItem(DISMISS_KEY, String(Date.now()));
        setShow(false);
      }
    } catch {
      setShow(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setShow(false);
  };

  if (!show || isStandalone) return null;

  return (
    <div
      role="dialog"
      aria-label="Instalar Chero"
      // bottom-24 = arriba del BottomTabBar (z-40, ~80px de alto + safe area)
      className="fixed inset-x-0 bottom-24 z-50 mx-auto max-w-md px-4 animate-in slide-in-from-bottom-4 duration-300"
    >
      <div className="glass-strong shadow-card-premium relative overflow-hidden rounded-3xl p-4">
        {/* Halo magenta sutil */}
        <span
          aria-hidden
          className="pointer-events-none absolute -right-8 -top-12 h-32 w-32 rounded-full opacity-50 blur-3xl"
          style={{ background: 'hsl(295 90% 55% / 0.6)' }}
        />

        <div className="relative flex items-start gap-3">
          {/* Icon */}
          <span className="bg-gradient-primary shadow-button-premium grid h-10 w-10 shrink-0 place-items-center rounded-2xl text-white">
            <Download aria-hidden className="h-5 w-5" />
          </span>

          {/* Content */}
          <div className="min-w-0 flex-1">
            <h3 className="font-display-pf text-base font-semibold text-white">
              Instalá Chero
            </h3>
            {isIos ? (
              <p className="mt-1 text-xs leading-relaxed text-white/80">
                Tocá{' '}
                <span className="inline-flex items-center gap-0.5">
                  <Share aria-hidden className="h-3 w-3" />
                </span>{' '}
                en Safari y elegí <strong>&quot;Agregar a inicio&quot;</strong>{' '}
                para tener la app sin abrir el browser.
              </p>
            ) : (
              <p className="mt-1 text-xs leading-relaxed text-white/80">
                Sumala a tu pantalla de inicio para abrir más rápido y usarla
                sin distracciones.
              </p>
            )}

            {/* Actions */}
            {!isIos && installEvent && (
              <button
                type="button"
                onClick={handleInstall}
                className="bg-gradient-primary shadow-button-premium mt-3 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold text-white"
              >
                Instalar ahora
              </button>
            )}
          </div>

          {/* Close */}
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Cerrar"
            className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-white/65 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X aria-hidden className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
