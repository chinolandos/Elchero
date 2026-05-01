'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Camera, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/spinner';
import { orbGradient, shadows } from '@/lib/design-tokens';
import { cn } from '@/lib/utils';

/**
 * AvatarUpload — file picker para foto de perfil custom.
 *
 * Flow:
 *   1. User toca el avatar (preview) → abre file picker
 *   2. Validamos client-side (tipo + tamaño)
 *   3. POST /api/profile/avatar con multipart/form-data
 *   4. Backend uploadea a Supabase Storage + actualiza profile.avatar_url
 *   5. Refresh page para mostrar nueva imagen
 *
 * Si el user ya tiene avatar custom o de Google, se muestra de preview.
 * Si no, fallback al orb brand.
 *
 * Botón "Eliminar foto" solo aparece si el avatar es custom (avatarUrl
 * pasado por prop incluye query param `?t=...` que lo distingue).
 */

interface Props {
  /** URL actual del avatar (custom uploaded o Google fallback). */
  currentAvatarUrl: string | null;
  /** true si el avatar actual es custom (no Google fallback). */
  hasCustomAvatar: boolean;
}

const MAX_BYTES = 2 * 1024 * 1024; // 2 MB
const ACCEPT = 'image/jpeg,image/png,image/webp';

export function AvatarUpload({ currentAvatarUrl, hasCustomAvatar }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  // Preview local mientras está subiendo (para feedback instant)
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validación client-side
    if (file.size > MAX_BYTES) {
      toast.error('Máximo 2 MB. Probá con una imagen más chica.');
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Solo JPG, PNG o WebP.');
      return;
    }

    // Preview instant
    const reader = new FileReader();
    reader.onload = () => setLocalPreview(reader.result as string);
    reader.readAsDataURL(file);

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/profile/avatar', {
        method: 'POST',
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Upload failed');
      toast.success('Foto actualizada');
      setLocalPreview(null);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al subir');
      setLocalPreview(null);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleRemove = async () => {
    if (!confirm('¿Eliminar tu foto de perfil?')) return;
    setRemoving(true);
    try {
      const res = await fetch('/api/profile/avatar', { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      toast.success('Foto eliminada');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al eliminar');
    } finally {
      setRemoving(false);
    }
  };

  const previewUrl = localPreview ?? currentAvatarUrl;

  return (
    <div className="flex items-center gap-4">
      {/* Avatar preview clickable — abre file picker */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading || removing}
        aria-label="Cambiar foto de perfil"
        className={cn(
          'relative h-20 w-20 shrink-0 overflow-hidden rounded-full ring-4 ring-white/20 transition-all hover:ring-white/40',
          (uploading || removing) && 'cursor-wait opacity-70',
        )}
        style={{ boxShadow: shadows.glowOrb }}
      >
        {previewUrl ? (
          <Image
            src={previewUrl}
            alt="Foto de perfil"
            width={80}
            height={80}
            className="h-full w-full object-cover"
            unoptimized
          />
        ) : (
          <div
            className="h-full w-full"
            style={{ background: orbGradient }}
            aria-hidden
          />
        )}

        {/* Hover overlay con cámara */}
        {!uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all hover:bg-black/40 hover:opacity-100">
            <Camera aria-hidden className="h-6 w-6 text-white" />
          </div>
        )}

        {/* Loading overlay */}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <Spinner size="md" />
          </div>
        )}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        onChange={handleFileChange}
        className="hidden"
        aria-hidden
      />

      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-white">
          Foto de perfil
        </div>
        <p className="mt-0.5 text-xs text-white/65">
          {hasCustomAvatar
            ? 'Custom subida.'
            : currentAvatarUrl
              ? 'Usando foto de Google.'
              : 'Sin foto.'}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading || removing}
            className="bg-gradient-primary shadow-button-premium inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
          >
            <Camera aria-hidden className="h-3 w-3" />
            {uploading ? 'Subiendo...' : 'Cambiar'}
          </button>
          {hasCustomAvatar && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={uploading || removing}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/85 transition-all hover:bg-white/10 disabled:opacity-50"
            >
              {removing ? (
                <Spinner size="sm" />
              ) : (
                <Trash2 aria-hidden className="h-3 w-3" />
              )}
              Quitar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
