'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import Link from 'next/link';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';
import { useRecorder } from '@/lib/audio/use-recorder';
import type { QualityReport } from '@/lib/audio/quality-check';
import { orbGradient, shadows } from '@/lib/design-tokens';
import { cn } from '@/lib/utils';
import type { CheroNote, DetectedContext } from '@/lib/types/chero';

const VERCEL_HOBBY_BODY_LIMIT_BYTES = 4.5 * 1024 * 1024;
const HARD_LIMIT_BYTES = 25 * 1024 * 1024;

type Phase =
  | 'idle'
  | 'recording'
  | 'reviewing'
  | 'transcribing'
  | 'quality_warning'
  | 'generating'
  | 'tts'
  | 'done'
  | 'error';

interface CaptureClientProps {
  userEmail: string;
  remainingUser: number;
  totalUserLimit: number;
  preferredVoice: string;
}

interface FinalResult {
  noteId?: string;
  note: CheroNote;
  detected: DetectedContext;
  ttsAudioUrl?: string;
}

export function CaptureClient({
  userEmail,
  remainingUser,
  totalUserLimit,
  preferredVoice,
}: CaptureClientProps) {
  const recorder = useRecorder({ bitsPerSecond: 64000, maxDurationSec: 540 });
  const [phase, setPhase] = useState<Phase>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<FinalResult | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Latch para prevenir doble submit por doble-click rápido en "Sí, generar apunte"
  const submittingRef = useRef(false);
  // Datos del /api/process que persisten mientras el user decide en quality_warning
  interface PendingProcessData {
    transcript: { text: string; duration_minutes: number };
    detected: DetectedContext;
    process_token: string;
    quality: QualityReport;
  }
  const [pendingProcess, setPendingProcess] = useState<PendingProcessData | null>(null);

  // Si el user intenta salir / refrescar / cerrar pestaña durante quality_warning,
  // hacemos best-effort cancel + refund. sendBeacon garantiza el envío incluso
  // durante unload (XHR/fetch suelen morir antes de mandar).
  useEffect(() => {
    if (phase !== 'quality_warning' || !pendingProcess) return;

    const handler = (e: BeforeUnloadEvent) => {
      const payload = JSON.stringify({
        process_token: pendingProcess.process_token,
        transcript: pendingProcess.transcript.text,
        reason: 'user_cancelled',
      });
      try {
        const blob = new Blob([payload], { type: 'application/json' });
        navigator.sendBeacon('/api/process/cancel', blob);
      } catch {
        // best-effort, no podemos retry
      }
      // Aviso al user para que confirme que quiere salir
      e.preventDefault();
      e.returnValue = 'Si salís ahora, te devolvemos el uso pero perdés la transcripción.';
    };

    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [phase, pendingProcess]);

  const usesLeft = remainingUser;
  const exhausted = usesLeft <= 0;

  // ─── Acciones ───
  const startRecording = async () => {
    setErrorMsg(null);
    setResult(null);
    setPendingFile(null);
    // recorder.start() retorna boolean — si fue exitoso (mic OK, codec OK,
    // permission OK), avanzamos a 'recording'. Si falló, recorder.state
    // ya quedó en 'error' y el ErrorBanner se renderiza solo. NO leer
    // recorder.state después del await — race condition (closure stale).
    const ok = await recorder.start();
    if (ok) setPhase('recording');
  };

  const stopRecording = () => {
    recorder.stop();
    setPhase('reviewing');
  };

  const cancelRecording = () => {
    recorder.cancel();
    setPhase('idle');
  };

  const handleFilePick = (file: File | null) => {
    setErrorMsg(null);
    setResult(null);
    if (!file) return;

    if (file.size > HARD_LIMIT_BYTES) {
      toast.error(
        `El audio supera 25 MB (tu archivo: ${(file.size / 1024 / 1024).toFixed(1)} MB). Comprimílo.`,
      );
      return;
    }

    if (file.size > VERCEL_HOBBY_BODY_LIMIT_BYTES) {
      toast.error(
        `El audio supera 4.5 MB (límite del servidor). Tu archivo: ${(file.size / 1024 / 1024).toFixed(1)} MB. Grabá directo en la app o comprimílo a 64 kbps.`,
      );
      return;
    }

    setPendingFile(file);
    setPhase('reviewing');
  };

  const submitForProcessing = async () => {
    // Latch contra doble-click. Si ya estamos enviando, ignorar.
    if (submittingRef.current) return;
    submittingRef.current = true;

    const audioToUse: { blob: Blob; filename: string; mime: string } | null = pendingFile
      ? {
          blob: pendingFile,
          filename: pendingFile.name,
          mime: pendingFile.type || 'audio/mpeg',
        }
      : recorder.result
        ? {
            blob: recorder.result.blob,
            filename: `grabacion-${Date.now()}.${extFromMime(recorder.result.mimeType)}`,
            mime: recorder.result.mimeType,
          }
        : null;

    if (!audioToUse) {
      submittingRef.current = false;
      return;
    }

    if (audioToUse.blob.size > VERCEL_HOBBY_BODY_LIMIT_BYTES) {
      toast.error(
        `El audio quedó en ${(audioToUse.blob.size / 1024 / 1024).toFixed(1)} MB — supera 4.5 MB. Hacé una grabación más corta o bajá el bitrate.`,
      );
      submittingRef.current = false;
      return;
    }

    setPhase('transcribing');
    setErrorMsg(null);

    try {
      // 1. Transcribir + detectar contexto + análisis de calidad
      const formData = new FormData();
      const file = new File([audioToUse.blob], audioToUse.filename, {
        type: audioToUse.mime,
      });
      formData.append('audio', file);

      const processRes = await fetch('/api/process', {
        method: 'POST',
        body: formData,
      });
      const processData = await processRes.json();

      if (!processRes.ok) {
        // Si refund_ok === false, el server falló refundeando el counter.
        // El user perdió 1 uso por un fallo nuestro — avisarle.
        const baseMsg = processData.message ?? 'Falló la transcripción';
        const refundMsg =
          processData.refund_ok === false
            ? ` · Te debemos un uso de tu beta — contactanos por las redes para resolverlo.`
            : '';
        throw new Error(baseMsg + refundMsg);
      }

      const pending: PendingProcessData = {
        transcript: processData.transcript,
        detected: processData.detected,
        process_token: processData.process_token,
        quality: processData.quality,
      };
      setPendingProcess(pending);

      // 2. Si la calidad es mala, pausamos en quality_warning para que el user decida
      if (
        processData.quality.verdict === 'noisy' ||
        processData.quality.verdict === 'very_noisy'
      ) {
        setPhase('quality_warning');
        submittingRef.current = false;
        return; // el user decide manualmente — el flow continúa en continueGeneration()
      }

      // 3. Calidad OK → continuamos directo
      await continueGeneration(pending);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error inesperado';
      setErrorMsg(msg);
      setPhase('error');
      toast.error(msg);
    } finally {
      submittingRef.current = false;
    }
  };

  /**
   * Segunda mitad del flow — generate + tts. Se llama:
   *   - automáticamente si quality === 'clean'
   *   - manualmente desde QualityWarningScreen si el user decide "Generar igual"
   */
  const continueGeneration = async (pending: PendingProcessData) => {
    setPhase('generating');
    setErrorMsg(null);

    try {
      const generateRes = await fetch('/api/generate-notes', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          transcript: pending.transcript.text,
          detected: pending.detected,
          audio_duration_minutes: pending.transcript.duration_minutes,
          process_token: pending.process_token,
        }),
      });
      const generateData = await generateRes.json();

      if (!generateRes.ok) {
        const baseMsg = generateData.message ?? 'Falló la generación del apunte';
        const refundMsg =
          generateData.refund_ok === false
            ? ` · Te debemos un uso — contactanos.`
            : '';
        throw new Error(baseMsg + refundMsg);
      }

      // TTS (no bloqueante — si falla, igual tenemos el apunte)
      setPhase('tts');
      let ttsAudioUrl: string | undefined;
      try {
        const ttsRes = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            note_id: generateData.note_id,
            voice: preferredVoice,
          }),
        });
        if (ttsRes.ok) {
          const ttsData = await ttsRes.json();
          ttsAudioUrl = ttsData.url;
        }
      } catch (err) {
        console.warn('TTS failed (non-blocking)', err);
      }

      setResult({
        noteId: generateData.note_id,
        note: generateData.note,
        detected: pending.detected,
        ttsAudioUrl,
      });
      setPhase('done');
      setPendingProcess(null);
      toast.success('¡Tu apunte está listo!');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error inesperado';
      setErrorMsg(msg);
      setPhase('error');
      toast.error(msg);
    }
  };

  const reset = () => {
    submittingRef.current = false;
    setPhase('idle');
    setResult(null);
    setErrorMsg(null);
    setPendingFile(null);
    setPendingProcess(null);
    recorder.cancel();
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const isProcessing =
    phase === 'transcribing' || phase === 'generating' || phase === 'tts';

  // ─── Render ───
  return (
    <div className="flex flex-1 flex-col">
      <Header userEmail={userEmail} usesLeft={usesLeft} totalLimit={totalUserLimit} />

      {/* Estados */}
      {exhausted && phase === 'idle' && <ExhaustedBanner />}
      {recorder.errorMessage && (
        <ErrorBanner message={recorder.errorMessage} />
      )}

      {phase === 'idle' && !exhausted && (
        <IdleScreen
          onRecord={startRecording}
          onPickFile={() => fileInputRef.current?.click()}
        />
      )}

      {phase === 'recording' && (
        <RecordingScreen
          elapsedSec={recorder.elapsedSec}
          onStop={stopRecording}
          onCancel={cancelRecording}
        />
      )}

      {phase === 'reviewing' && (
        <ReviewScreen
          file={pendingFile}
          recorderResult={recorder.result}
          onConfirm={submitForProcessing}
          onCancel={reset}
        />
      )}

      {phase === 'quality_warning' && pendingProcess && (
        <QualityWarningScreen
          quality={pendingProcess.quality}
          transcriptPreview={pendingProcess.transcript.text}
          onContinue={() => continueGeneration(pendingProcess)}
          onCancel={async () => {
            // Refund del counter — el user no llegó a generar apunte
            try {
              await fetch('/api/process/cancel', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({
                  process_token: pendingProcess.process_token,
                  transcript: pendingProcess.transcript.text,
                  reason: 'quality_rejected',
                }),
              });
              toast.success('Te devolvimos el uso. Probá grabar de nuevo.');
            } catch {
              // No bloqueante — el reset igual procede
            }
            reset();
          }}
        />
      )}

      {isProcessing && <ProcessingScreen phase={phase} />}

      {phase === 'done' && result && (
        <DoneScreen result={result} onReset={reset} />
      )}

      {phase === 'error' && errorMsg && (
        <ErrorScreen message={errorMsg} onRetry={reset} />
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={(e) => handleFilePick(e.target.files?.[0] ?? null)}
      />
    </div>
  );
}

// ─── Sub-componentes de pantalla ───

function Header({
  userEmail,
  usesLeft,
  totalLimit,
}: {
  userEmail: string;
  usesLeft: number;
  totalLimit: number;
}) {
  // v5: header simplificado — el BottomTabBar ya maneja la navegación
  // (Inicio/Grabar/Perfil) así que no duplicamos esos links acá.
  return (
    <header className="mb-6 flex items-center justify-between gap-4">
      <Link href="/library" className="group flex items-center gap-3">
        <div
          className="orb-pulse h-9 w-9 rounded-full"
          style={{ background: orbGradient, boxShadow: shadows.glowOrb }}
        />
        <div className="min-w-0">
          <div className="text-sm font-bold text-white">El Chero</div>
          <div className="max-w-[180px] truncate text-xs text-white/55">
            {userEmail}
          </div>
        </div>
      </Link>
      <div className="glass rounded-full px-3 py-1.5 text-xs">
        <span className="text-white/70">Usos:</span>{' '}
        <span className="font-bold text-primary-glow">
          {usesLeft}/{totalLimit}
        </span>
      </div>
    </header>
  );
}

function ExhaustedBanner() {
  return (
    <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 text-center">
      <div className="mb-2 text-2xl font-bold text-amber-200">
        Llegaste al límite de la beta
      </div>
      <p className="text-amber-100/80">
        Ya usaste tus 5 audios gratis. Esperá al lanzamiento completo en Q3 2026.
      </p>
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
      {message}
    </div>
  );
}

function IdleScreen({
  onRecord,
  onPickFile,
}: {
  onRecord: () => void;
  onPickFile: () => void;
}) {
  // v5: matching el Lovable "ready to record" state.
  // Eyebrow + h1 Playfair con "clase" en gradient + mic button gigante con
  // gradient violet→magenta→ember + glass info card + "Subir audio" abajo.
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 py-6 text-center">
      <div className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.3em] text-white/55">
          El Chero está listo
        </p>
        <h1 className="font-display-pf text-4xl font-semibold leading-tight tracking-tight text-white md:text-5xl">
          Grabar <span className="text-gradient italic">clase</span>
        </h1>
      </div>

      {/* Big mic button — gradient violet→magenta→ember matching el orb del hero */}
      <button
        type="button"
        onClick={onRecord}
        aria-label="Grabar clase ahora"
        className="group relative grid h-44 w-44 place-items-center rounded-full transition-transform active:scale-[0.97]"
      >
        {/* Halo violet difuso detrás (animate-pulse-glow) */}
        <span
          aria-hidden
          className="animate-pulse-glow absolute h-56 w-56 rounded-full opacity-70 blur-2xl"
          style={{
            background:
              'radial-gradient(circle, hsl(270 90% 60% / 0.6), transparent 70%)',
          }}
        />
        {/* Sphere sólido con gradient + box-shadows premium */}
        <span
          aria-hidden
          className="relative grid h-40 w-40 place-items-center rounded-full transition-transform group-hover:scale-105"
          style={{
            background:
              'radial-gradient(circle at 35% 30%, hsl(270 90% 60%) 0%, hsl(295 90% 55%) 45%, hsl(18 100% 56%) 100%)',
            boxShadow:
              'inset 0 6px 20px hsl(0 0% 100% / 0.25), inset 0 -10px 30px hsl(0 0% 0% / 0.4), 0 30px 80px -20px hsl(295 90% 55% / 0.6)',
          }}
        >
          <MicIcon size={56} />
        </span>
      </button>

      {/* Glass info card con sparkle */}
      <div className="glass flex w-full max-w-md items-start gap-3 rounded-2xl p-4 text-left">
        <span aria-hidden className="mt-0.5 shrink-0 text-lg text-primary-glow">
          ✨
        </span>
        <p className="text-xs leading-relaxed text-white/85">
          Al detener, El Chero generará la transcripción y flashcards. Vas a
          poder editarlas y regenerarlas antes de guardarlas en una carpeta.
        </p>
      </div>

      {/* Subir audio — opción secundaria, glass pill */}
      <div className="flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={onPickFile}
          className={cn(
            buttonVariants({ variant: 'glass', size: 'pill' }),
            'gap-2',
          )}
        >
          <UploadIcon />
          <span>Subir audio</span>
          <span className="text-[10px] text-white/55">MP3 / M4A / WAV</span>
        </button>
        <p className="max-w-xs text-[11px] text-white/55">
          Para grabaciones &gt;9 min usá MP3 comprimido (≤4.5 MB).
        </p>
      </div>
    </div>
  );
}

function RecordingScreen({
  elapsedSec,
  onStop,
  onCancel,
}: {
  elapsedSec: number;
  onStop: () => void;
  onCancel: () => void;
}) {
  const minutes = Math.floor(elapsedSec / 60);
  const seconds = elapsedSec % 60;
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 py-8 text-center">
      {/* Pulso visual de grabación */}
      <div className="relative flex items-center justify-center">
        <div className="absolute h-40 w-40 animate-ping rounded-full bg-red-500/20" />
        <div className="relative flex h-32 w-32 items-center justify-center rounded-full bg-red-500/90 shadow-lg shadow-red-500/40">
          <MicIcon size={48} />
        </div>
      </div>

      <div>
        <div className="mb-2 text-sm uppercase tracking-widest text-red-400">
          ● Grabando
        </div>
        <div className="font-mono text-5xl font-bold tabular-nums">
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          size="lg"
          onClick={onStop}
          className="px-8 bg-white text-black hover:bg-white/90"
        >
          Detener grabación
        </Button>
        <Button
          size="lg"
          variant="ghost"
          onClick={onCancel}
          className="text-white/60 hover:bg-white/5 hover:text-white"
        >
          Cancelar
        </Button>
      </div>

      <p className="text-xs text-white/40">
        Hablá normal, cerca del dispositivo. Auto-stop a los 9 min.
      </p>
    </div>
  );
}

function ReviewScreen({
  file,
  recorderResult,
  onConfirm,
  onCancel,
}: {
  file: File | null;
  recorderResult: ReturnType<typeof useRecorder>['result'];
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const sizeBytes = file?.size ?? recorderResult?.sizeBytes ?? 0;
  const sizeMb = (sizeBytes / 1024 / 1024).toFixed(2);
  const filename = file?.name ?? 'grabación nueva';
  const durationSec = recorderResult?.durationSeconds;
  const [hasClicked, setHasClicked] = useState(false);

  // Genera URL temporal para reproducir el audio antes de procesarlo.
  // Se libera al desmontar para no tener leaks.
  const previewUrl = useMemo(() => {
    const blob = file ?? recorderResult?.blob;
    if (!blob) return null;
    return URL.createObjectURL(blob);
  }, [file, recorderResult]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleClick = () => {
    if (hasClicked) return;
    setHasClicked(true);
    onConfirm();
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 py-8 text-center">
      <h2 className="text-3xl font-bold">¿Procesamos este audio?</h2>

      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="mb-4 truncate text-base font-semibold">{filename}</div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-white/40">Tamaño</div>
            <div className="font-semibold">{sizeMb} MB</div>
          </div>
          <div>
            <div className="text-white/40">Duración</div>
            <div className="font-semibold">
              {durationSec ? `${Math.round(durationSec)} s` : '—'}
            </div>
          </div>
        </div>

        {previewUrl && (
          <div className="mt-5">
            <div className="mb-2 text-xs uppercase tracking-wider text-white/40">
              Escuchá antes de procesar
            </div>
            <audio
              controls
              src={previewUrl}
              className="w-full"
              preload="metadata"
            />
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Button
          size="lg"
          onClick={handleClick}
          disabled={hasClicked}
          className="px-8"
        >
          {hasClicked ? <Spinner size="sm" /> : 'Sí, generar apunte'}
        </Button>
        <Button
          size="lg"
          variant="ghost"
          onClick={onCancel}
          disabled={hasClicked}
          className="text-white/60 hover:bg-white/5 hover:text-white"
        >
          Cancelar
        </Button>
      </div>

      <p className="max-w-md text-xs text-white/40">
        Esto va a tardar 1-3 minutos. No cierres la pestaña — te avisamos cuando
        esté listo.
      </p>
    </div>
  );
}

function QualityWarningScreen({
  quality,
  transcriptPreview,
  onContinue,
  onCancel,
}: {
  quality: QualityReport;
  transcriptPreview: string;
  onContinue: () => void;
  onCancel: () => void;
}) {
  const isVeryNoisy = quality.verdict === 'very_noisy';
  const accentColor = isVeryNoisy ? 'red' : 'amber';

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 py-8 text-center">
      <div
        className={cn(
          'flex h-20 w-20 items-center justify-center rounded-full text-3xl',
          isVeryNoisy
            ? 'bg-red-500/20 text-red-300'
            : 'bg-amber-500/20 text-amber-300',
        )}
      >
        {isVeryNoisy ? '⚠️' : '👂'}
      </div>

      <div>
        <h2 className="mb-2 text-2xl font-bold">
          {isVeryNoisy ? 'El audio tiene mucho ruido' : 'El audio tiene algo de ruido'}
        </h2>
        <p className="max-w-md text-white/70">{quality.message}</p>
      </div>

      {/* Indicadores detectados */}
      <div className="flex flex-wrap justify-center gap-2">
        {quality.signals.map((signal) => (
          <span
            key={signal}
            className={cn(
              'rounded-full border px-3 py-1 text-xs',
              isVeryNoisy
                ? 'border-red-500/40 bg-red-500/10 text-red-200'
                : 'border-amber-500/40 bg-amber-500/10 text-amber-200',
            )}
          >
            {signal}
          </span>
        ))}
      </div>

      {/* Score visual */}
      <div className="w-full max-w-md">
        <div className="mb-1 flex items-center justify-between text-xs text-white/40">
          <span>Calidad de audio</span>
          <span className="font-mono">{quality.score}/100</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              quality.score >= 70 && 'bg-green-500',
              quality.score >= 40 && quality.score < 70 && 'bg-amber-500',
              quality.score < 40 && 'bg-red-500',
            )}
            style={{ width: `${quality.score}%` }}
          />
        </div>
      </div>

      <details className="w-full max-w-md text-left">
        <summary className="cursor-pointer text-sm text-white/50 transition-colors hover:text-white/80">
          Ver primeras palabras de la transcripción
        </summary>
        <p className="mt-3 max-h-32 overflow-y-auto rounded-lg border border-white/10 bg-white/[0.03] p-3 text-xs leading-relaxed text-white/60">
          {transcriptPreview.slice(0, 500)}
          {transcriptPreview.length > 500 ? '…' : ''}
        </p>
      </details>

      <div className="flex flex-col gap-3 sm:flex-row">
        {/* Cuando very_noisy, el botón dominante es "Empezar de nuevo".
            Cuando solo noisy, el dominante es "Generar igual" (es bastante
            probable que el LLM saque buen apunte). */}
        {isVeryNoisy ? (
          <>
            <Button
              size="lg"
              onClick={onCancel}
              className="px-8"
            >
              Empezar de nuevo (te devolvemos el uso)
            </Button>
            <Button
              size="lg"
              variant="ghost"
              onClick={onContinue}
              className="text-white/60 hover:bg-white/5 hover:text-white"
            >
              Generar igual (gasta 1 uso)
            </Button>
          </>
        ) : (
          <>
            <Button size="lg" onClick={onContinue} className="px-8">
              Generar igual
            </Button>
            <Button
              size="lg"
              variant="ghost"
              onClick={onCancel}
              className="text-white/70 hover:bg-white/5 hover:text-white"
            >
              Empezar de nuevo
            </Button>
          </>
        )}
      </div>

      <p className="max-w-md text-xs text-white/40">
        💡 Si empezás de nuevo te devolvemos el uso. Si generás igual, se
        confirma el uso aunque el apunte salga con huecos.
      </p>
    </div>
  );
}

function ProcessingScreen({
  phase,
}: {
  phase: 'transcribing' | 'generating' | 'tts';
}) {
  const steps = [
    {
      key: 'transcribing',
      label: 'Transcribiendo audio',
      sub: 'Pasando voz a texto con Whisper',
    },
    {
      key: 'generating',
      label: 'Generando apunte',
      sub: 'Resumen, conceptos, preguntas y flashcards',
    },
    {
      key: 'tts',
      label: 'Generando audio del apunte',
      sub: 'Voz natural para repasar',
    },
  ] as const;

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 py-8 text-center">
      <div
        className="orb-pulse h-32 w-32 rounded-full"
        style={{ background: orbGradient, boxShadow: shadows.glowOrb }}
      />

      <h2 className="text-2xl font-bold">Trabajando en tu apunte...</h2>

      <div className="w-full max-w-md space-y-3">
        {steps.map((step) => {
          const stepIdx = steps.findIndex((s) => s.key === step.key);
          const currentIdx = steps.findIndex((s) => s.key === phase);
          const status: 'done' | 'active' | 'pending' =
            stepIdx < currentIdx ? 'done' : stepIdx === currentIdx ? 'active' : 'pending';
          return (
            <div
              key={step.key}
              className={cn(
                'flex items-center gap-3 rounded-xl border p-4 text-left transition-colors',
                status === 'done' && 'border-green-500/30 bg-green-500/5 text-white/80',
                status === 'active' && 'border-primary/40 bg-primary/10',
                status === 'pending' && 'border-white/5 bg-white/3 text-white/40',
              )}
            >
              <div className="flex h-6 w-6 items-center justify-center">
                {status === 'done' ? (
                  <CheckIcon />
                ) : status === 'active' ? (
                  <Spinner size="sm" />
                ) : (
                  <div className="h-2 w-2 rounded-full bg-white/20" />
                )}
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold">{step.label}</div>
                <div className="text-xs text-white/40">{step.sub}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DoneScreen({
  result,
  onReset,
}: {
  result: FinalResult;
  onReset: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 py-8 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-500/20 text-green-400">
        <CheckIcon size={40} />
      </div>

      <div>
        <h2 className="mb-2 text-3xl font-black">¡Tu apunte está listo!</h2>
        <p className="text-white/60">
          {result.detected.subject} · {result.detected.topic}
        </p>
      </div>

      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-5 text-left">
        <div className="mb-3 text-sm font-semibold text-white/80">Vista previa</div>
        <div className="line-clamp-4 text-sm text-white/60">
          {result.note.summary}
        </div>
        <div className="mt-3 flex gap-3 text-xs text-white/40">
          <span>{result.note.concepts.length} conceptos</span>
          <span>·</span>
          <span>{result.note.questions.length} preguntas</span>
          <span>·</span>
          <span>{result.note.flashcards.length} flashcards</span>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        {result.noteId && (
          <Link
            href={`/notes/${result.noteId}`}
            className={buttonVariants({ size: 'lg', className: 'px-8' })}
          >
            Ver apunte completo
          </Link>
        )}
        <Button
          size="lg"
          variant="ghost"
          onClick={onReset}
          className="text-white/70 hover:bg-white/5 hover:text-white"
        >
          Procesar otro audio
        </Button>
      </div>

      {result.ttsAudioUrl && (
        <div className="w-full max-w-md">
          <div className="mb-2 text-xs uppercase tracking-wider text-white/40">
            Audio del apunte
          </div>
          <audio controls src={result.ttsAudioUrl} className="w-full" />
        </div>
      )}
    </div>
  );
}

function ErrorScreen({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 py-8 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-500/20 text-red-400 text-3xl">
        ⚠
      </div>
      <div>
        <h2 className="mb-2 text-2xl font-bold">No se pudo procesar el audio</h2>
        <p className="max-w-md text-white/60">{message}</p>
      </div>
      <Button size="lg" onClick={onRetry} className="px-8">
        Intentar de nuevo
      </Button>
    </div>
  );
}

// ─── Iconos inline ───
function MicIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 1a4 4 0 0 0-4 4v6a4 4 0 0 0 8 0V5a4 4 0 0 0-4-4z" />
      <path d="M19 10a1 1 0 1 0-2 0 5 5 0 0 1-10 0 1 1 0 1 0-2 0 7 7 0 0 0 6 6.92V21a1 1 0 1 0 2 0v-4.08A7 7 0 0 0 19 10z" />
    </svg>
  );
}

function UploadIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function CheckIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function extFromMime(mime: string): string {
  if (mime.includes('webm')) return 'webm';
  if (mime.includes('mp4') || mime.includes('m4a')) return 'm4a';
  if (mime.includes('ogg')) return 'ogg';
  if (mime.includes('mpeg') || mime.includes('mp3')) return 'mp3';
  if (mime.includes('wav')) return 'wav';
  return 'webm';
}
