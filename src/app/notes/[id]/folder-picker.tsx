'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

interface Folder {
  id: string;
  name: string;
  color: string;
  emoji: string | null;
  note_count: number;
}

interface FolderPickerProps {
  noteId: string;
  currentFolderId: string | null;
}

const COLOR_DOT: Record<string, string> = {
  violet: 'bg-violet-400',
  pink: 'bg-pink-400',
  cyan: 'bg-cyan-400',
  amber: 'bg-amber-400',
  green: 'bg-green-400',
  rose: 'bg-rose-400',
  indigo: 'bg-indigo-400',
  sky: 'bg-sky-400',
};

/**
 * Picker de carpeta — botón pill que abre dropdown con la lista de carpetas
 * del user. Permite mover el apunte a otra carpeta o a Inbox (folder_id=null).
 */
export function FolderPicker({ noteId, currentFolderId }: FolderPickerProps) {
  const router = useRouter();
  const [folders, setFolders] = useState<Folder[] | null>(null);
  const [open, setOpen] = useState(false);
  const [moving, setMoving] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cargar lista de carpetas al abrir el dropdown (lazy load)
  useEffect(() => {
    if (!open || folders !== null) return;
    fetch('/api/folders')
      .then((r) => r.json())
      .then((data) => setFolders(data.folders ?? []))
      .catch(() => setFolders([]));
  }, [open, folders]);

  // Cerrar al click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, [open]);

  const moveTo = async (folderId: string | null) => {
    setMoving(true);
    try {
      const res = await fetch(`/api/notes/${noteId}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ folder_id: folderId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'No se pudo mover');
      const folderName =
        folderId === null
          ? 'Inbox'
          : folders?.find((f) => f.id === folderId)?.name ?? 'carpeta';
      toast.success(`Movido a ${folderName}`);
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al mover');
    } finally {
      setMoving(false);
    }
  };

  // Etiqueta del botón principal
  const currentFolder = folders?.find((f) => f.id === currentFolderId);
  const buttonLabel = currentFolder
    ? `${currentFolder.emoji ? currentFolder.emoji + ' ' : ''}${currentFolder.name}`
    : '📥 Inbox';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        disabled={moving}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex h-9 items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 text-xs text-white/80 transition-colors hover:border-white/25 hover:bg-white/10"
      >
        {moving ? <Spinner size="sm" /> : <span aria-hidden="true">📁</span>}
        <span>{buttonLabel}</span>
        <span aria-hidden="true" className="text-white/40">
          ▼
        </span>
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute right-0 top-full z-30 mt-2 w-64 overflow-hidden rounded-xl border border-white/10 bg-[#1e1e2e]/95 shadow-2xl backdrop-blur"
        >
          <div className="max-h-[60vh] overflow-y-auto p-2">
            {/* Inbox siempre primero */}
            <FolderOption
              emoji="📥"
              name="Inbox"
              colorClass="bg-white/40"
              selected={currentFolderId === null}
              onClick={() => moveTo(null)}
            />

            {folders === null && (
              <div className="flex justify-center py-3">
                <Spinner size="sm" />
              </div>
            )}

            {folders && folders.length > 0 && (
              <>
                <div className="my-1 border-t border-white/5" />
                {folders.map((folder) => (
                  <FolderOption
                    key={folder.id}
                    emoji={folder.emoji}
                    name={folder.name}
                    colorClass={COLOR_DOT[folder.color] ?? COLOR_DOT.violet}
                    selected={currentFolderId === folder.id}
                    onClick={() => moveTo(folder.id)}
                  />
                ))}
              </>
            )}

            {folders && folders.length === 0 && (
              <p className="px-3 py-2 text-xs text-white/40">
                No tenés carpetas. Andá a{' '}
                <a href="/library" className="text-primary hover:underline">
                  /library
                </a>{' '}
                para crear una.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function FolderOption({
  emoji,
  name,
  colorClass,
  selected,
  onClick,
}: {
  emoji: string | null;
  name: string;
  colorClass: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors',
        selected
          ? 'bg-primary/15 text-white'
          : 'text-white/75 hover:bg-white/5 hover:text-white',
      )}
    >
      <span
        className={cn('h-2 w-2 shrink-0 rounded-full', colorClass)}
        aria-hidden="true"
      />
      {emoji && <span aria-hidden="true">{emoji}</span>}
      <span className="flex-1">{name}</span>
      {selected && <span className="text-primary">✓</span>}
    </button>
  );
}
