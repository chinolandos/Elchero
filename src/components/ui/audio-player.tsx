'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface AudioPlayerProps {
  /** URL pública del MP3. */
  src: string;
  /** Nombre sugerido para el download (sin extensión). */
  downloadName?: string;
  className?: string;
}

/**
 * Player de audio con waveform animado, drag-to-seek, descargar MP3.
 *
 * Inspiración: WhatsApp/Instagram voice notes — pill horizontal glass
 * con play + waveform reactivo + tiempo + botón descargar.
 *
 * Implementación:
 *   - wavesurfer.js v7 (dynamic import para no cargar en SSR)
 *   - Bars + responsive width
 *   - Tema custom Aura (violeta sobre dark)
 *   - Botón download dispara fetch + saveAs (no navega afuera de la app)
 */
export function AudioPlayer({ src, downloadName = 'audio', className }: AudioPlayerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wsRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  // Inicializar wavesurfer (dynamic import — no SSR)
  useEffect(() => {
    let cancelled = false;
    setReady(false);
    setError(null);

    (async () => {
      if (!containerRef.current) return;
      try {
        // Dynamic import: wavesurfer es ~80 KB, solo se carga en client
        const WaveSurferModule = await import('wavesurfer.js');
        const WaveSurfer = WaveSurferModule.default;
        if (cancelled || !containerRef.current) return;

        const ws = WaveSurfer.create({
          container: containerRef.current,
          // Paleta Aura: violet-400 progresado, violet-700 fondo
          waveColor: 'rgba(192, 132, 252, 0.35)', // primarySoft con opacity
          progressColor: 'rgba(168, 85, 247, 0.95)', // primaryHover sólido
          cursorColor: 'rgba(255, 255, 255, 0.5)',
          cursorWidth: 1,
          barWidth: 2.5,
          barGap: 2,
          barRadius: 3,
          height: 40,
          normalize: true,
          dragToSeek: true,
          interact: true,
          mediaControls: false,
        });

        ws.on('ready', () => {
          if (cancelled) return;
          setReady(true);
          setDuration(ws.getDuration());
        });

        ws.on('play', () => setPlaying(true));
        ws.on('pause', () => setPlaying(false));
        ws.on('finish', () => setPlaying(false));
        ws.on('audioprocess', (t: number) => setCurrentTime(t));
        ws.on('seeking', (t: number) => setCurrentTime(t));

        ws.on('error', (err: Error) => {
          setError(err.message ?? 'No se pudo cargar el audio');
        });

        ws.load(src);
        wsRef.current = ws;
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Error');
        }
      }
    })();

    return () => {
      cancelled = true;
      if (wsRef.current) {
        try {
          wsRef.current.destroy();
        } catch {
          // ignore
        }
        wsRef.current = null;
      }
    };
  }, [src]);

  const togglePlay = () => {
    if (!wsRef.current) return;
    wsRef.current.playPause();
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await fetch(src);
      if (!res.ok) throw new Error('No se pudo descargar');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${downloadName}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // fallback: abrir en nueva pestaña
      window.open(src, '_blank');
    } finally {
      setDownloading(false);
    }
  };

  if (error) {
    return (
      <div
        className={cn(
          'rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200',
          className,
        )}
      >
        No se pudo cargar el audio: {error}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] p-2 pr-3 backdrop-blur transition-all hover:border-primary/30',
        className,
      )}
    >
      {/* Play/pause */}
      <button
        type="button"
        onClick={togglePlay}
        disabled={!ready}
        aria-label={playing ? 'Pausar' : 'Reproducir'}
        className={cn(
          'flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-all',
          ready
            ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:bg-primary/90 active:scale-95'
            : 'bg-white/10 text-white/40',
        )}
      >
        {!ready ? (
          <span className="block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        ) : playing ? (
          <PauseIcon />
        ) : (
          <PlayIcon />
        )}
      </button>

      {/* Waveform */}
      <div className="flex-1 min-w-0">
        <div ref={containerRef} className="w-full" />
      </div>

      {/* Tiempo */}
      <div className="shrink-0 text-right font-mono text-sm tabular-nums text-white/70">
        {ready ? formatTime(currentTime) : '0:00'}
        <span className="text-white/30"> / {ready ? formatTime(duration) : '0:00'}</span>
      </div>

      {/* Descargar MP3 */}
      <button
        type="button"
        onClick={handleDownload}
        disabled={!ready || downloading}
        aria-label="Descargar audio MP3"
        title="Descargar MP3"
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all',
          ready && !downloading
            ? 'border border-white/15 bg-white/5 text-white/70 hover:border-primary/40 hover:bg-primary/10 hover:text-white'
            : 'cursor-not-allowed bg-white/5 text-white/30',
        )}
      >
        {downloading ? (
          <span className="block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        ) : (
          <DownloadIcon />
        )}
      </button>
    </div>
  );
}

function PlayIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M3 1.5v13l11-6.5L3 1.5z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <rect x="3" y="2" width="3.5" height="12" rx="1" />
      <rect x="9.5" y="2" width="3.5" height="12" rx="1" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
