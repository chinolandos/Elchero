'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

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

  const hasTranscript = !!transcript;

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
      toast.success(useEdited ? 'Apunte regenerado con tu transcripción' : 'Apunte regenerado');
      setIsEditingTranscript(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al regenerar');
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {hasTranscript && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditingTranscript(true)}
              disabled={isRegenerating || isDeleting}
              className="text-white/70 hover:bg-white/5 hover:text-white"
            >
              ✎ Editar transcript
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleRegenerate(false)}
              disabled={isRegenerating || isDeleting}
              className="text-white/70 hover:bg-white/5 hover:text-white"
            >
              {isRegenerating ? <Spinner size="sm" /> : '↻ Regenerar'}
            </Button>
          </>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          disabled={isDeleting || isRegenerating}
          className={cn(
            'transition-colors',
            confirmingDelete
              ? 'bg-red-500/15 text-red-300 hover:bg-red-500/25 hover:text-red-200'
              : 'text-white/60 hover:bg-white/5 hover:text-white',
          )}
        >
          {isDeleting ? (
            <Spinner size="sm" />
          ) : confirmingDelete ? (
            '¿Confirmás borrar?'
          ) : (
            '🗑 Borrar'
          )}
        </Button>
      </div>

      {isEditingTranscript && (
        <TranscriptEditor
          transcript={editedTranscript}
          onChange={setEditedTranscript}
          isSaving={isRegenerating}
          onCancel={() => {
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
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#14141f] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-2 text-xl font-bold">Editar transcripción</h3>
        <p className="mb-4 text-sm text-white/60">
          Corregí errores de Whisper (nombres propios, fórmulas, fechas). Cuando
          guardes, regeneramos el apunte con el texto corregido.{' '}
          <span className="text-white/40">No se gasta un nuevo uso.</span>
        </p>

        <textarea
          value={transcript}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-[300px] w-full resize-y rounded-lg border border-white/10 bg-black/30 p-4 text-sm leading-relaxed text-white/90 placeholder:text-white/30 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
          placeholder="Tu transcripción..."
          disabled={isSaving}
        />

        <div className="mt-2 text-right text-xs text-white/40">
          {transcript.length.toLocaleString()} chars
        </div>

        <div className="mt-5 flex justify-end gap-3">
          <Button
            variant="ghost"
            onClick={onCancel}
            disabled={isSaving}
            className="text-white/60 hover:bg-white/5 hover:text-white"
          >
            Cancelar
          </Button>
          <Button
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
  );
}
