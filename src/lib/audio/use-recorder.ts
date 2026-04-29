'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type RecorderState = 'idle' | 'requesting' | 'recording' | 'paused' | 'stopped' | 'error';

export interface RecorderResult {
  blob: Blob;
  durationSeconds: number;
  sizeBytes: number;
  mimeType: string;
}

interface UseRecorderOptions {
  /** Bitrate del audio en bits por segundo. Default 32000 (32 kbps mono speech). */
  bitsPerSecond?: number;
  /** Hard limit en segundos. Si lo pasa, paramos automáticamente. */
  maxDurationSec?: number;
}

/**
 * Hook para grabación de audio en navegador con MediaRecorder.
 *
 * Funciona en:
 *   - Chrome/Edge/Firefox: webm con opus codec
 *   - Safari iOS 14.5+ / macOS: mp4 con aac codec
 *   - Safari iOS <14.5: NO soportado, devuelve error explícito
 *
 * Bitrate por defecto 32 kbps mono (ideal para voz):
 *   - 1 min ≈ 240 KB
 *   - 10 min ≈ 2.4 MB
 *   - 18 min ≈ 4.3 MB (cabe en Vercel Hobby 4.5MB)
 */
export function useRecorder(options: UseRecorderOptions = {}) {
  const { bitsPerSecond = 32000, maxDurationSec = 1200 } = options; // 20 min max

  const [state, setState] = useState<RecorderState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [result, setResult] = useState<RecorderResult | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef<number>(0);
  const tickerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoStopRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Selecciona el mejor MIME que soporte el navegador. */
  const pickMimeType = useCallback((): string | null => {
    if (typeof MediaRecorder === 'undefined') return null;
    const candidates = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4;codecs=mp4a.40.2',
      'audio/mp4',
      'audio/ogg;codecs=opus',
    ];
    for (const c of candidates) {
      if (MediaRecorder.isTypeSupported(c)) return c;
    }
    return null;
  }, []);

  const cleanup = useCallback(() => {
    if (tickerRef.current) clearInterval(tickerRef.current);
    if (autoStopRef.current) clearTimeout(autoStopRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    mediaRecorderRef.current = null;
    chunksRef.current = [];
  }, []);

  useEffect(() => cleanup, [cleanup]);

  const start = useCallback(async () => {
    setErrorMessage(null);
    setResult(null);
    setElapsedSec(0);
    setState('requesting');

    if (typeof MediaRecorder === 'undefined') {
      setErrorMessage(
        'Tu navegador no soporta grabación de audio. Probá Chrome, Safari (iOS 14.5+) o Firefox.',
      );
      setState('error');
      return;
    }

    const mimeType = pickMimeType();
    if (!mimeType) {
      setErrorMessage(
        'Tu navegador no soporta los formatos de audio necesarios. Subí un archivo en su lugar.',
      );
      setState('error');
      return;
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
    } catch (err) {
      const e = err as DOMException;
      if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
        setErrorMessage(
          'Para grabar necesitamos acceso al micrófono. Habilitá el permiso y volvé a intentar.',
        );
      } else if (e.name === 'NotFoundError' || e.name === 'DevicesNotFoundError') {
        setErrorMessage('No se detectó micrófono en este dispositivo.');
      } else {
        setErrorMessage(`No se pudo acceder al micrófono: ${e.message ?? 'error desconocido'}`);
      }
      setState('error');
      return;
    }

    streamRef.current = stream;
    chunksRef.current = [];

    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: bitsPerSecond,
      });
    } catch (err) {
      setErrorMessage(
        `No se pudo iniciar la grabación: ${err instanceof Error ? err.message : 'error'}`,
      );
      cleanup();
      setState('error');
      return;
    }

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      const durationSeconds = Math.max(1, (Date.now() - startedAtRef.current) / 1000);
      setResult({
        blob,
        durationSeconds,
        sizeBytes: blob.size,
        mimeType,
      });
      setState('stopped');
      cleanup();
    };

    recorder.onerror = (event) => {
      const err = (event as unknown as { error?: { message?: string } }).error;
      setErrorMessage(`Error durante la grabación: ${err?.message ?? 'desconocido'}`);
      setState('error');
      cleanup();
    };

    mediaRecorderRef.current = recorder;
    recorder.start(1000); // chunk cada 1 segundo
    startedAtRef.current = Date.now();
    setState('recording');

    tickerRef.current = setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - startedAtRef.current) / 1000));
    }, 250);

    autoStopRef.current = setTimeout(() => {
      stop();
    }, maxDurationSec * 1000);
  }, [bitsPerSecond, cleanup, maxDurationSec, pickMimeType]);

  const stop = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop();
    }
  }, []);

  const cancel = useCallback(() => {
    cleanup();
    setState('idle');
    setElapsedSec(0);
    setResult(null);
    setErrorMessage(null);
  }, [cleanup]);

  return {
    state,
    errorMessage,
    elapsedSec,
    result,
    start,
    stop,
    cancel,
  };
}
