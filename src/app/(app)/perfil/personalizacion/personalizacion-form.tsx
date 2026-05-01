'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
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
              {VOICES.map((v) => (
                <button
                  key={v.value}
                  type="button"
                  onClick={() => setPreferredVoice(v.value)}
                  className={cn(
                    'rounded-2xl px-4 py-3 text-left text-sm transition-all',
                    preferredVoice === v.value
                      ? 'glass-strong shadow-button-premium ring-2 ring-white/40 text-white'
                      : 'glass text-white/80 hover:bg-white/[0.18]',
                  )}
                >
                  <div className="font-semibold text-white">{v.label}</div>
                  <div className="mt-0.5 text-xs text-white/70">
                    {v.description}
                  </div>
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-white/55">
              Cambia cómo suena la lectura de tus apuntes
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
