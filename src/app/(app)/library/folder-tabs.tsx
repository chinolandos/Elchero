'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

interface Folder {
  id: string;
  name: string;
  color: string;
  emoji: string | null;
  note_count: number;
}

interface FolderTabsProps {
  selectedFolderId: string | null; // null = Inbox
  onSelect: (folderId: string | null) => void;
}

const COLOR_CLASSES: Record<string, string> = {
  violet: 'bg-violet-500/15 border-violet-500/30 text-violet-200',
  pink: 'bg-pink-500/15 border-pink-500/30 text-pink-200',
  cyan: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-200',
  amber: 'bg-amber-500/15 border-amber-500/30 text-amber-200',
  green: 'bg-green-500/15 border-green-500/30 text-green-200',
  rose: 'bg-rose-500/15 border-rose-500/30 text-rose-200',
  indigo: 'bg-indigo-500/15 border-indigo-500/30 text-indigo-200',
  sky: 'bg-sky-500/15 border-sky-500/30 text-sky-200',
};

const COLOR_SOLID_CLASSES: Record<string, string> = {
  violet: 'bg-violet-500/30 border-violet-400 text-white ring-2 ring-violet-400/40',
  pink: 'bg-pink-500/30 border-pink-400 text-white ring-2 ring-pink-400/40',
  cyan: 'bg-cyan-500/30 border-cyan-400 text-white ring-2 ring-cyan-400/40',
  amber: 'bg-amber-500/30 border-amber-400 text-white ring-2 ring-amber-400/40',
  green: 'bg-green-500/30 border-green-400 text-white ring-2 ring-green-400/40',
  rose: 'bg-rose-500/30 border-rose-400 text-white ring-2 ring-rose-400/40',
  indigo: 'bg-indigo-500/30 border-indigo-400 text-white ring-2 ring-indigo-400/40',
  sky: 'bg-sky-500/30 border-sky-400 text-white ring-2 ring-sky-400/40',
};

// Dot indicator color (HSL puro brillante) — reemplaza al emoji visible.
// Hues separados para que se distingan a primera vista entre carpetas.
const COLOR_DOT: Record<string, string> = {
  violet: 'hsl(265 95% 68%)',  // purpura
  pink: 'hsl(310 100% 68%)',   // fuchsia brillante
  cyan: 'hsl(185 100% 55%)',   // cyan turquesa
  amber: 'hsl(40 100% 60%)',   // amarillo dorado
  green: 'hsl(145 80% 52%)',   // verde esmeralda
  rose: 'hsl(355 100% 65%)',   // coral / rojo brillante
  indigo: 'hsl(230 100% 68%)', // azul indigo
  sky: 'hsl(200 100% 60%)',    // celeste
};

const COLOR_OPTIONS = [
  { value: 'violet', label: 'Violeta' },
  { value: 'pink', label: 'Rosa' },
  { value: 'cyan', label: 'Cyan' },
  { value: 'amber', label: 'Ámbar' },
  { value: 'green', label: 'Verde' },
  { value: 'rose', label: 'Rosa fuerte' },
  { value: 'indigo', label: 'Índigo' },
  { value: 'sky', label: 'Cielo' },
];

// Presets sugeridos para bachiller AVANZO
const PRESETS = [
  { name: 'AVANZO 2026', emoji: '🎯', color: 'violet' },
  { name: '1° Período', emoji: '📅', color: 'cyan' },
  { name: '2° Período', emoji: '📅', color: 'amber' },
  { name: '3° Período', emoji: '📅', color: 'green' },
  { name: '4° Período', emoji: '📅', color: 'pink' },
  { name: 'Lenguaje y Literatura', emoji: '📖', color: 'rose' },
  { name: 'Matemática', emoji: '🔢', color: 'indigo' },
  { name: 'Ciencias Naturales', emoji: '🔬', color: 'green' },
  { name: 'Estudios Sociales', emoji: '🌎', color: 'amber' },
  { name: 'Inglés', emoji: '🇬🇧', color: 'sky' },
];

export function FolderTabs({ selectedFolderId, onSelect }: FolderTabsProps) {
  const router = useRouter();
  const [folders, setFolders] = useState<Folder[] | null>(null);
  const [inboxCount, setInboxCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);

  const loadFolders = async () => {
    try {
      const res = await fetch('/api/folders');
      const data = await res.json();
      if (res.ok) {
        setFolders(data.folders);
        setInboxCount(data.inbox.count);
      }
    } catch {
      // silent fail — fallback a folders vacía
      setFolders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFolders();
  }, []);

  const handleCreated = () => {
    setShowCreate(false);
    loadFolders();
    router.refresh();
  };

  const handleEdited = () => {
    setEditingFolder(null);
    loadFolders();
    router.refresh();
  };

  const handleDeleted = (id: string) => {
    setEditingFolder(null);
    loadFolders();
    if (selectedFolderId === id) {
      onSelect(null); // si borraron la activa, volver a Inbox
    }
    router.refresh();
  };

  if (loading) {
    return (
      <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-2">
        <Spinner size="sm" />
        <span className="text-xs text-white/40">Cargando carpetas…</span>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 -mx-6 overflow-x-auto px-6 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex items-center gap-2">
          {/* Inbox */}
          <FolderPill
            label="Inbox"
            emoji="📥"
            count={inboxCount}
            color="violet"
            selected={selectedFolderId === null}
            onClick={() => onSelect(null)}
          />

          {/* Carpetas del user */}
          {folders?.map((folder) => (
            <FolderPill
              key={folder.id}
              label={folder.name}
              emoji={folder.emoji}
              count={folder.note_count}
              color={folder.color}
              selected={selectedFolderId === folder.id}
              onClick={() => onSelect(folder.id)}
              onLongPress={() => setEditingFolder(folder)}
            />
          ))}

          {/* Botón crear */}
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            aria-label="Crear nueva carpeta"
            className="flex h-10 shrink-0 items-center gap-1.5 rounded-full border border-dashed border-white/25 bg-white/[0.02] px-4 text-sm font-medium text-white/85 transition-all hover:border-white/40 hover:bg-white/5 hover:text-white"
          >
            <span aria-hidden="true">+</span>
            <span>Nueva carpeta</span>
          </button>
        </div>
      </div>

      {showCreate && (
        <FolderModal
          mode="create"
          presets={PRESETS.filter(
            (p) =>
              !folders?.some((f) => f.name.toLowerCase() === p.name.toLowerCase()),
          )}
          onClose={() => setShowCreate(false)}
          onSaved={handleCreated}
        />
      )}

      {editingFolder && (
        <FolderModal
          mode="edit"
          initial={editingFolder}
          onClose={() => setEditingFolder(null)}
          onSaved={handleEdited}
          onDeleted={() => handleDeleted(editingFolder.id)}
        />
      )}
    </>
  );
}

function FolderPill({
  label,
  emoji,
  count,
  color,
  selected,
  onClick,
  onLongPress,
}: {
  label: string;
  emoji: string | null;
  count: number;
  color: string;
  selected: boolean;
  onClick: () => void;
  onLongPress?: () => void;
}) {
  // Long press para editar (mobile-friendly): touchstart + 500ms timer
  const handleTouchStart = () => {
    if (!onLongPress) return;
    const timer = setTimeout(() => {
      onLongPress();
    }, 500);
    const cancel = () => clearTimeout(timer);
    window.addEventListener('touchend', cancel, { once: true });
    window.addEventListener('touchmove', cancel, { once: true });
  };

  // Diseño minimal: dot indicator (color de la carpeta) + label + count chip.
  // El emoji custom de la carpeta queda accesible al editar (long-press), no
  // se muestra en la pill para coherencia visual del row.
  void emoji;
  const dotColor = COLOR_DOT[color] ?? COLOR_DOT.violet;

  return (
    <button
      type="button"
      onClick={onClick}
      onTouchStart={handleTouchStart}
      onContextMenu={(e) => {
        if (onLongPress) {
          e.preventDefault();
          onLongPress();
        }
      }}
      aria-pressed={selected}
      className={cn(
        'flex h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-all',
        selected
          ? 'border-white/25 bg-white/10 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]'
          : 'border-white/10 bg-white/[0.03] text-white/70 hover:border-white/20 hover:bg-white/[0.06] hover:text-white',
      )}
    >
      <span
        aria-hidden="true"
        className="h-2.5 w-2.5 shrink-0 rounded-full"
        style={{
          background: dotColor,
          boxShadow: `0 0 8px ${dotColor}`,
        }}
      />
      <span>{label}</span>
      <span
        className={cn(
          'rounded-full px-2 py-0.5 text-[10px] font-semibold tabular-nums',
          selected ? 'bg-white/20 text-white' : 'bg-white/10 text-white/65',
        )}
      >
        {count}
      </span>
    </button>
  );
}

interface FolderModalProps {
  mode: 'create' | 'edit';
  initial?: Folder;
  presets?: typeof PRESETS;
  onClose: () => void;
  onSaved: () => void;
  onDeleted?: () => void;
}

function FolderModal({
  mode,
  initial,
  presets,
  onClose,
  onSaved,
  onDeleted,
}: FolderModalProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [color, setColor] = useState(initial?.color ?? 'violet');
  const [emoji, setEmoji] = useState(initial?.emoji ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const applyPreset = (p: (typeof PRESETS)[number]) => {
    setName(p.name);
    setColor(p.color);
    setEmoji(p.emoji);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const url =
        mode === 'create' ? '/api/folders' : `/api/folders/${initial!.id}`;
      const method = mode === 'create' ? 'POST' : 'PATCH';
      const res = await fetch(url, {
        method,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          color,
          emoji: emoji.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message ?? 'No se pudo guardar la carpeta');
      }
      toast.success(mode === 'create' ? 'Carpeta creada' : 'Carpeta actualizada');
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error');
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 5000);
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch(`/api/folders/${initial!.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Error al borrar');
      toast.success('Carpeta eliminada · apuntes movidos a Inbox');
      onDeleted?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error');
      setIsSaving(false);
      setConfirmDelete(false);
    }
  };

  // Portal a document.body para escapar el stacking context del layout
  // (`<div className="relative z-10">{children}</div>` de (app)/layout.tsx
  // estaba haciendo que la BottomTabBar z-40 quedara visualmente sobre el
  // modal en mobile, tapando los botones Cancelar/Guardar).
  if (typeof window === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="glass-strong shadow-card-premium relative max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-hidden rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Halo magenta sutil arriba para coherencia v5 */}
        <span
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-16 h-40 w-40 rounded-full opacity-50 blur-3xl"
          style={{ background: 'hsl(295 90% 55% / 0.6)' }}
        />

        {/* Contenedor scrolleable: respeta altura del viewport. Sin esto, en
            mobile con bottom-tab-bar el contenido excede el viewport y los
            botones Cancelar/Guardar quedan fuera y no se puede scrollear. */}
        <div className="relative max-h-[calc(100dvh-2rem)] overflow-y-auto p-6">
          <h3 className="font-display-pf mb-4 text-2xl font-semibold tracking-tight text-white">
            {mode === 'create' ? 'Nueva carpeta' : 'Editar carpeta'}
          </h3>

          {presets && presets.length > 0 && (
            <div className="mb-5">
              <Label className="text-white/85">Sugerencias</Label>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {presets.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => applyPreset(p)}
                    className="glass rounded-full px-3 py-1.5 text-xs text-white/85 transition-all hover:bg-white/[0.18] hover:text-white"
                  >
                    {p.emoji} {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <Label htmlFor="folder-name" className="text-white/85">
                Nombre
              </Label>
              <Input
                id="folder-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: AVANZO 2026"
                maxLength={50}
                className="mt-2"
                autoFocus
              />
            </div>

            <div>
              <Label htmlFor="folder-emoji" className="text-white/85">
                Emoji <span className="text-white/55">(opcional)</span>
              </Label>
              <Input
                id="folder-emoji"
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                placeholder="🎯"
                maxLength={4}
                className="mt-2 max-w-[100px] text-center text-xl"
              />
            </div>

            <div>
              <Label className="text-white/85">Color</Label>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setColor(c.value)}
                    aria-pressed={color === c.value}
                    aria-label={c.label}
                    className={cn(
                      'h-10 rounded-xl border-2 text-xs font-semibold transition-all',
                      color === c.value
                        ? COLOR_SOLID_CLASSES[c.value]
                        : COLOR_CLASSES[c.value] + ' opacity-60',
                    )}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between gap-3">
            {mode === 'edit' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                disabled={isSaving}
                className={cn(
                  'transition-colors',
                  confirmDelete
                    ? 'bg-red-500/20 text-red-200 hover:bg-red-500/30'
                    : 'text-white/65 hover:text-red-300',
                )}
              >
                {confirmDelete ? '¿Confirmás borrar?' : '🗑 Borrar'}
              </Button>
            )}

            <div className="ml-auto flex gap-2">
              <Button
                variant="ghost"
                onClick={onClose}
                disabled={isSaving}
                className="text-white/70 hover:bg-white/10 hover:text-white"
              >
                Cancelar
              </Button>
              <Button
                variant="premium"
                size="lg"
                onClick={handleSave}
                disabled={isSaving || !name.trim() || name.trim().length < 1}
                className="px-6"
              >
                {isSaving ? <Spinner size="sm" /> : 'Guardar'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
