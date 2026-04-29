'use client';

import { useRef, useState } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import Link from 'next/link';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';
import { useRecorder } from '@/lib/audio/use-recorder';
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
  const recorder = useRecorder({ bitsPerSecond: 32000, maxDurationSec: 1200 });
  const [phase, setPhase] = useState<Phase>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<FinalResult | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const usesLeft = remainingUser;
  const exhausted = usesLeft <= 0;

  // ─── Acciones ───
  const startRecording = async () => {
    setErrorMsg(null);
    setResult(null);
    setPendingFile(null);
    await recorder.start();
    if (recorder.state !== 'error') setPhase('recording');
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

    if (!audioToUse) return;

    if (audioToUse.blob.size > VERCEL_HOBBY_BODY_LIMIT_BYTES) {
      toast.error(
        `El audio quedó en ${(audioToUse.blob.size / 1024 / 1024).toFixed(1)} MB — supera 4.5 MB. Hacé una grabación más corta o bajá el bitrate.`,
      );
      return;
    }

    setPhase('transcribing');
    setErrorMsg(null);

    try {
      // 1. Transcribir + detectar contexto
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
        throw new Error(processData.message ?? 'Falló la transcripción');
      }

      // 2. Generar apunte
      setPhase('generating');
      const generateRes = await fetch('/api/generate-notes', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          transcript: processData.transcript.text,
          detected: processData.detected,
        }),
      });
      const generateData = await generateRes.json();

      if (!generateRes.ok) {
        throw new Error(generateData.message ?? 'Falló la generación del apunte');
      }

      // 3. TTS (no bloqueante — si falla, igual tenemos el apunte)
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
        detected: processData.detected,
        ttsAudioUrl,
      });
      setPhase('done');
      toast.success('¡Tu apunte está listo!');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error inesperado';
      setErrorMsg(msg);
      setPhase('error');
      toast.error(msg);
    }
  };

  const reset = () => {
    setPhase('idle');
    setResult(null);
    setErrorMsg(null);
    setPendingFile(null);
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
  return (
    <header className="mb-8 flex items-center justify-between gap-4">
      <Link href="/library" className="flex items-center gap-3 group">
        <div
          className="orb-pulse h-9 w-9 rounded-full"
          style={{ background: orbGradient, boxShadow: shadows.glowOrb }}
        />
        <div>
          <div className="text-base font-bold transition-colors group-hover:text-primary">El Chero</div>
          <div className="text-xs text-white/40 truncate max-w-[200px]">{userEmail}</div>
        </div>
      </Link>
      <div className="flex items-center gap-3">
        <Link
          href="/library"
          className="text-xs text-white/60 transition-colors hover:text-white"
        >
          Mis apuntes
        </Link>
        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs">
          <span className="text-white/60">Usos:</span>{' '}
          <span className="font-bold text-primary">{usesLeft}/{totalLimit}</span>
        </div>
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
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 py-8 text-center">
      <div>
        <h1 className="mb-3 text-4xl font-black tracking-tight md:text-5xl">
          ¿Empezamos?
        </h1>
        <p className="text-lg text-white/60">
          Grabá tu clase ahora o subí un audio que ya tengas.
        </p>
      </div>

      <div className="grid w-full max-w-md grid-cols-1 gap-4 sm:grid-cols-2">
        <ActionCard
          icon={<MicIcon />}
          title="Grabar ahora"
          subtitle="Hasta 20 min"
          onClick={onRecord}
          primary
        />
        <ActionCard
          icon={<UploadIcon />}
          title="Subir audio"
          subtitle="MP3 / M4A / WAV"
          onClick={onPickFile}
        />
      </div>

      <p className="max-w-md text-xs text-white/40">
        Idiomas soportados: español. Para grabaciones largas (&gt;18 min) usá la
        opción de subir archivo MP3 a 64 kbps.
      </p>
    </div>
  );
}

function ActionCard({
  icon,
  title,
  subtitle,
  onClick,
  primary,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group relative flex flex-col items-center justify-center gap-3 rounded-2xl border p-8 transition-all',
        primary
          ? 'border-primary/40 bg-primary/10 hover:border-primary hover:bg-primary/20'
          : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10',
      )}
    >
      <div className={cn('text-4xl', primary && 'text-primary')}>{icon}</div>
      <div>
        <div className="font-semibold">{title}</div>
        <div className="mt-1 text-xs text-white/50">{subtitle}</div>
      </div>
    </button>
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
        Hablá normal, cerca del dispositivo. Auto-stop a los 20 min.
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
              {durationSec
                ? `${Math.round(durationSec)} s`
                : '—'}
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button size="lg" onClick={onConfirm} className="px-8">
          Sí, generar apunte
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

      <p className="max-w-md text-xs text-white/40">
        Esto va a tardar 1-3 minutos. No cierres la pestaña — te avisamos cuando
        esté listo.
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
