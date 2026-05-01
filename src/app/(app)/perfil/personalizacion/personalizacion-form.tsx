'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import type { UserProfile } from '@/lib/types/chero';

type VoiceOption =
  | 'nova'
  | 'echo'
  | 'alloy'
  | 'onyx'
  | 'shimmer'
  | 'fable'
  | 'coral'
  | 'sage';

const VOICES: { value: VoiceOption; label: string; description: string }[] = [
  { value: 'nova', label: 'Nova', description: 'Femenina, cálida (recomendada)' },
  { value: 'coral', label: 'Coral', description: 'Femenina, expresiva' },
  { value: 'sage', label: 'Sage', description: 'Femenina, profesional' },
  { value: 'shimmer', label: 'Shimmer', description: 'Femenina, suave' },
  { value: 'echo', label: 'Echo', description: 'Masculina, profesional' },
  { value: 'onyx', label: 'Onyx', description: 'Masculina, grave' },
];

interface Props {
  profile: UserProfile | null;
}

export function PersonalizacionForm({ profile }: Props) {
  const router = useRouter();
  const userType = profile?.user_type;
  const isUniversitario = userType === 'universitario';

  const [career, setCareer] = useState(profile?.career ?? '');
  const [year, setYear] = useState<number | null>(profile?.year ?? null);
  const [preferredVoice, setPreferredVoice] = useState<VoiceOption>(
    (profile?.preferred_voice as VoiceOption) ?? 'nova',
  );
  const [isSaving, setIsSaving] = useState(false);

  // Estado para preview de voz: cuál se está cargando, cuál está sonando
  const [playingVoice, setPlayingVoice] = useState<VoiceOption | null>(null);
  const [loadingVoice, setLoadingVoice] = useState<VoiceOption | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  /**
   * Reproduce o pausa el sample de voz. Si hay otra voz sonando, la corta
   * primero. El primer click por voz puede tardar ~1-2s en generar audio
   * (después se cachea 30 días en Vercel edge).
   */
  const togglePlay = async (voice: VoiceOption) => {
    // Si ya está sonando esta voz, pausá
    if (playingVoice === voice && audioRef.current) {
      audioRef.current.pause();
      setPlayingVoice(null);
      return;
    }

    // Cortar audio anterior si había otra voz sonando
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    setLoadingVoice(voice);
    try {
      const audio = new Audio(`/api/voice-sample/${voice}`);
      audio.addEventListener('ended', () => setPlayingVoice(null));
      audio.addEventListener('pause', () => {
        // Si fue pause natural (no manual), limpiar estado
        if (audio.ended || audio.currentTime === 0) {
          setPlayingVoice(null);
        }
      });
      audioRef.current = audio;
      await audio.play();
      setPlayingVoice(voice);
    } catch (err) {
      toast.error('No se pudo reproducir el sample.');
      setPlayingVoice(null);
      console.error('Voice sample play failed', err);
    } finally {
      setLoadingVoice(null);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          career: career.trim() || null,
          year,
          preferred_voice: preferredVoice,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'No se pudo guardar');
      toast.success('Personalización actualizada');
      router.push('/perfil');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="glass rounded-3xl p-5 sm:p-6">
        <div className="space-y-5">
          {isUniversitario && (
            <div>
              <Label className="text-white/85">Carrera (opcional)</Label>
              <Input
                value={career}
                onChange={(e) => setCareer(e.target.value)}
                placeholder="Tu carrera o área de estudios"
                className="mt-2"
              />
              <p className="mt-1.5 text-xs text-white/55">
                Ej: Ingeniería de Software
              </p>
            </div>
          )}

          <div>
            <Label className="text-white/85">Año actual</Label>
            <div className="mt-2 flex gap-2">
              {(isUniversitario ? [1, 2, 3, 4, 5] : [1, 2, 3]).map((y) => (
                <button
                  key={y}
                  type="button"
                  onClick={() => setYear(y)}
                  className={cn(
                    'h-11 w-11 rounded-xl text-sm font-semibold transition-all',
                    year === y
                      ? 'bg-gradient-primary shadow-button-premium text-white'
                      : 'glass text-white/80 hover:bg-white/[0.18]',
                  )}
                >
                  {y}°
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-white/85">Voz preferida del audio TTS</Label>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {VOICES.map((v) => {
                const isPlaying = playingVoice === v.value;
                const isLoading = loadingVoice === v.value;
                return (
                  <div
                    key={v.value}
                    className={cn(
                      'flex items-center gap-2 rounded-2xl px-3 py-3 transition-all',
                      preferredVoice === v.value
                        ? 'glass-strong shadow-button-premium ring-2 ring-white/40 text-white'
                        : 'glass text-white/80 hover:bg-white/[0.18]',
                    )}
                  >
                    {/* Botón seleccionar (la card entera al hacer click) */}
                    <button
                      type="button"
                      onClick={() => setPreferredVoice(v.value)}
                      className="flex-1 text-left"
                      aria-pressed={preferredVoice === v.value}
                    >
                      <div className="text-sm font-semibold text-white">
                        {v.label}
                      </div>
                      <div className="mt-0.5 text-xs text-white/70">
                        {v.description}
                      </div>
                    </button>

                    {/* Botón play sample */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePlay(v.value);
                      }}
                      disabled={isLoading}
                      aria-label={
                        isPlaying
                          ? `Pausar muestra de ${v.label}`
                          : `Escuchar muestra de ${v.label}`
                      }
                      className={cn(
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all',
                        isPlaying
                          ? 'bg-gradient-primary shadow-button-premium text-white'
                          : 'bg-white/15 text-white hover:bg-white/25',
                        isLoading && 'cursor-wait opacity-70',
                      )}
                    >
                      {isLoading ? (
                        <Spinner size="sm" />
                      ) : isPlaying ? (
                        <Pause aria-hidden className="h-4 w-4" />
                      ) : (
                        <Play
                          aria-hidden
                          className="h-4 w-4 translate-x-[1px]"
                        />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-white/55">
              Tocá ▶ para escuchar cómo suena cada voz · La voz que elijas será
              la que use Chero al leer tus apuntes
            </p>
          </div>
        </div>
      </section>

      <Button
        variant="premium"
        size="xl"
        onClick={handleSave}
        disabled={isSaving}
        className="w-full"
      >
        {isSaving ? <Spinner size="sm" /> : 'Guardar cambios'}
      </Button>
    </div>
  );
}
