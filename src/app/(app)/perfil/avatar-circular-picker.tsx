'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Camera } from 'lucide-react';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/spinner';
import { orbGradient, shadows } from '@/lib/design-tokens';

/**
 * AvatarCircularPicker — avatar clickeable que abre file picker directo.
 *
 * Usado en /perfil (ProfileHero) para que el user pueda cambiar su foto en
 * 1 tap sin navegar a /perfil/personalizacion. La logica de upload (validacion,
 * moderacion, refresh) replica lo de AvatarUpload pero con UI minimal de solo
 * avatar redondo + badge camara.
 */

interface Props {
  currentAvatarUrl: string | null;
  firstName: string | null;
}

const MAX_BYTES = 2 * 1024 * 1024; // 2 MB
const ACCEPT = 'image/jpeg,image/png,image/webp';

export function AvatarCircularPicker({ currentAvatarUrl, firstName }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_BYTES) {
      toast.error('Máximo 2 MB. Probá con una imagen más chica.');
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Solo JPG, PNG o WebP.');
      return;
    }

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

  const previewUrl = localPreview ?? currentAvatarUrl;

  return (
    <>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        aria-label="Cambiar foto de perfil"
        className="group relative mb-4 h-20 w-20 shrink-0 md:h-24 md:w-24"
      >
        {previewUrl ? (
          <div
            className="relative h-full w-full overflow-hidden rounded-full ring-4 ring-white/20 transition-all group-hover:ring-white/40"
            style={{ boxShadow: shadows.glowOrb }}
          >
            <Image
              src={previewUrl}
              alt={firstName ?? 'Avatar'}
              width={96}
              height={96}
              className="h-full w-full object-cover"
              unoptimized
            />
          </div>
        ) : (
          <div
            className="orb-pulse h-full w-full rounded-full ring-4 ring-white/0 transition-all group-hover:ring-white/30"
            style={{ background: orbGradient, boxShadow: shadows.glowOrb }}
            aria-hidden="true"
          />
        )}

        {!uploading && (
          <span
            aria-hidden="true"
            className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 opacity-0 transition-all group-hover:bg-black/45 group-hover:opacity-100"
          >
            <Camera className="h-6 w-6 text-white" />
          </span>
        )}

        {uploading && (
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/55">
            <Spinner size="md" />
          </span>
        )}

        {!uploading && (
          <span
            aria-hidden="true"
            className="absolute bottom-0 right-0 grid h-7 w-7 place-items-center rounded-full bg-white text-black shadow-lg ring-2 ring-white/30"
          >
            <Camera className="h-3.5 w-3.5" />
          </span>
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
    </>
  );
}
