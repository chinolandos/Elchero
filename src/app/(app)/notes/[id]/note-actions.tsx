'use client';

import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Pencil, RefreshCw, Download, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { orbGradient, shadows } from '@/lib/design-tokens';

interface NoteActionsProps {
  noteId: string;
  transcript: string | null;
}

/**
 * Acciones del apunte: regenerar, editar transcript, borrar.
 *
 * - Regenerar: vuelve a llamar a Sonnet con el mismo transcript. NO incrementa
 *   el counter. Útil si el apunte salió mal.
 * - Editar transcript: abre panel con textarea, permite corregir lo que Whisper
 *   transcribió mal antes de regenerar (ej: nombres propios, fórmulas, fechas).
 * - Borrar: elimina permanentemente. Confirmación inline.
 */
export function NoteActions({ noteId, transcript }: NoteActionsProps) {
  const router = useRouter();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isEditingTranscript, setIsEditingTranscript] = useState(false);
  const [editedTranscript, setEditedTranscript] = useState(transcript ?? '');
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  // Latch contra doble-click rápido (header + modal pueden ambos disparar regenerate)
  const regeneratingRef = useRef(false);

  const hasTranscript = !!transcript;

  /**
   * Descarga el PDF del apunte.
   *
   * Usamos `window.location.href` en lugar de `<a download>` o fetch+blob
   * porque es lo más compatible con Safari iOS:
   *   - <a download> es ignorado en iOS y abre el PDF en preview.
   *   - fetch+blob funciona pero pierde el filename del Content-Disposition.
   *   - location.href respeta el header Content-Disposition: attachment del
   *     server y guarda con el filename correcto en todos los browsers.
   *
   * El feedback visual (botón deshabilitado 2.5s) compensa que el browser
   * no muestre spinner antes de empezar a descargar.
   */
  const handleDownloadPdf = () => {
    if (isDownloadingPdf) return;
    setIsDownloadingPdf(true);
    window.location.href = `/api/notes/${noteId}/pdf`;
    // Re-habilitar después de un tiempo razonable. El server-side render
    // tarda ~2s para apuntes promedio. Si tarda más, el usuario puede
    // re-clickear cuando vuelva el botón.
    setTimeout(() => setIsDownloadingPdf(false), 2500);
  };

  const handleDelete = async () => {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      setTimeout(() => setConfirmingDelete(false), 5000);
      return;
    }
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/notes/${noteId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'No se pudo borrar');
      toast.success('Apunte eliminado');
      router.push('/library');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al borrar');
      setIsDeleting(false);
      setConfirmingDelete(false);
    }
  };

  const handleRegenerate = async (useEdited = false) => {
    if (!hasTranscript) {
      toast.error('Este apunte no tiene transcripción guardada.');
      return;
    }
    if (regeneratingRef.current) return;
    regeneratingRef.current = true;
    setIsRegenerating(true);
    try {
      const body =
        useEdited && editedTranscript !== transcript
          ? JSON.stringify({ edited_transcript: editedTranscript })
          : '{}';

      const res = await fetch(`/api/notes/${noteId}/regenerate`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'No se pudo regenerar');
      toast.success(
        useEdited ? 'Apunte regenerado con tu transcripción' : 'Apunte regenerado',
      );
      // Cerramos el modal SOLO si el regenerate fue exitoso. Si falló, el
      // modal sigue abierto con los cambios del user para que pueda reintentar.
      setIsEditingTranscript(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al regenerar');
    } finally {
      regeneratingRef.current = false;
      setIsRegenerating(false);
    }
  };

  return (
    <>
      {/* Overlay full-screen mientras se regenera — bloquea interacción
          y le da al user feedback claro de qué está pasando. Antes la página
          se "congelaba" durante 30-60s sin indicación visual. */}
      {isRegenerating && <RegeneratingOverlay />}

      {/* Botones acción — glass pills con iconos lucide. Wrap en mobile,
          spaced en desktop. PDF destacado como acción primary, Borrar
          con tinte rojo cuando confirma. */}
      <div className="flex flex-wrap items-center gap-2">
        {hasTranscript && (
          <>
            <ActionPill
              icon={<Pencil className="h-3.5 w-3.5" />}
              label="Editar"
              onClick={() => setIsEditingTranscript(true)}
              disabled={isRegenerating || isDeleting || isDownloadingPdf}
            />
            <ActionPill
              icon={
                isRegenerating ? (
                  <Spinner size="sm" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5" />
                )
              }
              label="Regenerar"
              onClick={() => handleRegenerate(false)}
              disabled={isRegenerating || isDeleting || isDownloadingPdf}
            />
          </>
        )}
        <ActionPill
          icon={
            isDownloadingPdf ? (
              <Spinner size="sm" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )
          }
          label={isDownloadingPdf ? 'Generando…' : 'PDF'}
          onClick={handleDownloadPdf}
          disabled={isDownloadingPdf || isRegenerating || isDeleting}
          aria-label="Descargar apunte en PDF"
        />
        <ActionPill
          icon={
            isDeleting ? (
              <Spinner size="sm" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )
          }
          label={confirmingDelete ? '¿Confirmás?' : 'Borrar'}
          onClick={handleDelete}
          disabled={isDeleting || isRegenerating || isDownloadingPdf}
          variant={confirmingDelete ? 'danger' : 'default'}
        />
      </div>

      {isEditingTranscript && (
        <TranscriptEditor
          transcript={editedTranscript}
          onChange={setEditedTranscript}
          isSaving={isRegenerating}
          onCancel={() => {
            // Si el user editó algo, confirmar antes de cerrar
            const dirty = editedTranscript !== (transcript ?? '');
            if (dirty && !confirm('Tenés cambios sin guardar. ¿Salir igual?')) {
              return;
            }
            setIsEditingTranscript(false);
            setEditedTranscript(transcript ?? '');
          }}
          onSave={() => handleRegenerate(true)}
          unchanged={editedTranscript === transcript}
        />
      )}
    </>
  );
}

/**
 * ActionPill — botón glass uniforme para las acciones del header del apunte.
 * Mobile-friendly: h-9 px-3.5 text-xs con icono lucide.
 *
 * Variantes:
 *   - default: glass blanco translúcido
 *   - danger: rojo (cuando confirmingDelete = true)
 */
function ActionPill({
  icon,
  label,
  onClick,
  disabled,
  variant = 'default',
  ...rest
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'default' | 'danger';
  'aria-label'?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-xs font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50',
        variant === 'danger'
          ? 'border border-red-400/40 bg-red-500/15 text-red-100 hover:bg-red-500/25'
          : 'glass text-white/85 hover:bg-white/[0.18] hover:text-white',
      )}
      {...rest}
    >
      <span aria-hidden className="grid place-items-center">
        {icon}
      </span>
      <span>{label}</span>
    </button>
  );
}

function RegeneratingOverlay() {
  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-6 bg-[#0a0a14]/95 px-6 backdrop-blur-md">
      <div
        className="orb-pulse h-32 w-32 rounded-full"
        style={{ background: orbGradient, boxShadow: shadows.glowOrb }}
        aria-hidden
      />
      <div className="text-center">
        <h2 className="font-display-pf mb-2 text-3xl font-semibold tracking-tight text-white">
          Regenerando tu apunte
        </h2>
        <p className="text-sm text-white/85">
          Claude Sonnet está reescribiendo el contenido. Esto tarda 30-60
          segundos.
        </p>
        <p className="mt-2 text-xs text-white/55">No cierres la pestaña.</p>
      </div>
      <Spinner size="md" />
    </div>
  );
}

function TranscriptEditor({
  transcript,
  onChange,
  isSaving,
  onCancel,
  onSave,
  unchanged,
}: {
  transcript: string;
  onChange: (v: string) => void;
  isSaving: boolean;
  onCancel: () => void;
  onSave: () => void;
  unchanged: boolean;
}) {
  // Portal a body — escapa el stacking context del layout (app) que tiene
  // `relative z-10` y dejaba la BottomTabBar sobre el modal en mobile.
  if (typeof window === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md"
      onClick={onCancel}
    >
      <div
        className="glass-strong shadow-card-premium relative max-h-[calc(100dvh-2rem)] w-full max-w-2xl overflow-hidden rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Halo magenta sutil arriba (matching folder-modal v5) */}
        <span
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-16 h-40 w-40 rounded-full opacity-50 blur-3xl"
          style={{ background: 'hsl(295 90% 55% / 0.6)' }}
        />

        {/* Scrolleable: respeta viewport para que botones siempre sean
            accesibles en mobile (bottom-tab-bar tapaba el footer). */}
        <div className="relative max-h-[calc(100dvh-2rem)] overflow-y-auto p-6">
          <h3 className="font-display-pf mb-2 text-2xl font-semibold tracking-tight text-white">
            Editar transcripción
          </h3>
          <p className="mb-4 text-sm text-white/85">
            Corregí errores de Whisper (nombres propios, fórmulas, fechas).
            Cuando guardes, regeneramos el apunte con el texto corregido.{' '}
            <span className="text-white/55">No se gasta un nuevo uso.</span>
          </p>

          <textarea
            value={transcript}
            onChange={(e) => onChange(e.target.value)}
            className="min-h-[300px] w-full resize-y rounded-2xl border border-white/15 bg-black/40 p-4 text-sm leading-relaxed text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/20"
            placeholder="Tu transcripción..."
            disabled={isSaving}
          />

          <div className="mt-2 text-right text-xs text-white/55">
            {transcript.length.toLocaleString()} chars
          </div>

          <div className="mt-5 flex justify-end gap-3">
            <Button
              variant="ghost"
              onClick={onCancel}
              disabled={isSaving}
              className="text-white/70 hover:bg-white/10 hover:text-white"
            >
              Cancelar
            </Button>
            <Button
              variant="premium"
              size="lg"
              onClick={onSave}
              disabled={isSaving || unchanged || transcript.length < 20}
              className="px-6"
            >
              {isSaving ? (
                <Spinner size="sm" />
              ) : unchanged ? (
                'Sin cambios'
              ) : (
                'Guardar y regenerar'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
