'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { PremiumButton } from '@/components/ui/premium-button';
import { useAuth } from '@/lib/auth/use-auth';
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

interface AjustesClientProps {
  email: string;
  profile: UserProfile | null;
}

export function AjustesClient({ email, profile }: AjustesClientProps) {
  const router = useRouter();
  const { signOut } = useAuth();

  const [career, setCareer] = useState(profile?.career ?? '');
  const [year, setYear] = useState<number | null>(profile?.year ?? null);
  const [preferredVoice, setPreferredVoice] = useState<VoiceOption>(
    (profile?.preferred_voice as VoiceOption) ?? 'nova',
  );
  const [isSaving, setIsSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const userType = profile?.user_type;
  const yearOptions = userType === 'universitario' ? [1, 2, 3, 4, 5] : [1, 2];

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          career: career.trim() || null,
          year,
          subjects: profile?.subjects ?? [],
          preferred_voice: preferredVoice,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'No se pudo guardar');
      toast.success('Ajustes actualizados');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      setTimeout(() => setConfirmingDelete(false), 8000);
      return;
    }
    setIsDeleting(true);
    try {
      const res = await fetch('/api/profile', { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Error');
      toast.success('Tu cuenta y todos los apuntes fueron eliminados.');
      await signOut();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error');
      setIsDeleting(false);
      setConfirmingDelete(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Personalización */}
      <Section
        title="Personalización"
        subtitle="Cómo querés que Chero genere tus apuntes"
      >
        <Field label="Carrera (opcional)" helper="Ej: Ingeniería de Software">
          <Input
            value={career}
            onChange={(e) => setCareer(e.target.value)}
            placeholder="Tu carrera o área de estudios"
          />
        </Field>

        <Field label="Año actual">
          <div className="flex gap-2">
            {yearOptions.map((y) => (
              <button
                key={y}
                type="button"
                onClick={() => setYear(y)}
                className={cn(
                  'h-11 w-11 rounded-xl border text-sm font-semibold transition-all',
                  year === y
                    ? 'border-primary bg-primary/15 text-white shadow-[0_0_16px_rgba(147,51,234,0.3)]'
                    : 'border-white/10 bg-white/[0.04] text-white/80 hover:border-white/20 hover:bg-white/[0.08]',
                )}
              >
                {y}°
              </button>
            ))}
          </div>
        </Field>

        <Field
          label="Voz del audio TTS"
          helper="Cambia cómo suena la lectura de tus apuntes"
        >
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {VOICES.map((v) => (
              <button
                key={v.value}
                type="button"
                onClick={() => setPreferredVoice(v.value)}
                className={cn(
                  'rounded-2xl border px-4 py-3 text-left text-sm transition-all',
                  preferredVoice === v.value
                    ? 'border-primary bg-primary/10 text-white shadow-[0_0_16px_rgba(147,51,234,0.25)]'
                    : 'border-white/10 bg-white/[0.04] text-white/80 hover:border-white/20 hover:bg-white/[0.08]',
                )}
              >
                <div className="font-semibold">{v.label}</div>
                <div className="mt-0.5 text-xs text-white/55">{v.description}</div>
              </button>
            ))}
          </div>
        </Field>
      </Section>

      {/* Save */}
      <div className="flex items-center justify-end">
        <PremiumButton
          variant="primary"
          size="lg"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? <Spinner size="sm" /> : 'Guardar cambios'}
        </PremiumButton>
      </div>

      {/* Cuenta — read-only */}
      <Section title="Cuenta" subtitle="Datos verificados al ingresar">
        <Field label="Email">
          <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/75">
            {email}
          </div>
        </Field>
        {profile?.user_type && (
          <Field label="Tipo de estudiante">
            <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/75">
              {profile.user_type === 'bachiller' ? 'Bachillerato' : 'Universidad'}
            </div>
          </Field>
        )}
        {profile?.institution && (
          <Field label="Institución">
            <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/75">
              {profile.institution}
            </div>
          </Field>
        )}
      </Section>

      {/* Zona peligrosa */}
      <Section
        title="Zona peligrosa"
        subtitle="Cumple con tu derecho al olvido (Ley Protección Datos SV)"
        tone="danger"
      >
        <p className="mb-4 text-sm text-red-200/70">
          Esto borra tu perfil, todos los apuntes y el audio TTS de forma
          permanente. No se puede deshacer.
        </p>
        <button
          type="button"
          onClick={handleDeleteAccount}
          disabled={isDeleting}
          className={cn(
            'inline-flex h-11 items-center justify-center rounded-full px-5 text-sm font-semibold transition-all',
            confirmingDelete
              ? 'bg-red-500/20 text-red-200 hover:bg-red-500/30'
              : 'border border-red-500/30 bg-red-500/[0.06] text-red-300 hover:bg-red-500/15',
          )}
        >
          {isDeleting ? (
            <Spinner size="sm" />
          ) : confirmingDelete ? (
            '⚠️ Confirmá: borrar TODO permanentemente'
          ) : (
            'Eliminar mi cuenta'
          )}
        </button>
      </Section>
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
  tone = 'default',
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  tone?: 'default' | 'danger';
}) {
  return (
    <section
      className={
        tone === 'danger'
          ? 'rounded-3xl border border-red-500/20 bg-red-500/[0.04] p-5 sm:p-6'
          : 'rounded-3xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur sm:p-6'
      }
    >
      <h2
        className={
          tone === 'danger'
            ? 'mb-1 text-lg font-bold text-red-200'
            : 'mb-1 text-lg font-bold text-white/90'
        }
      >
        {title}
      </h2>
      {subtitle && <p className="mb-5 text-xs text-white/45">{subtitle}</p>}
      {!subtitle && <div className="mb-5" />}
      <div className="space-y-5">{children}</div>
    </section>
  );
}

function Field({
  label,
  helper,
  children,
}: {
  label: string;
  helper?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label className="text-white/80">{label}</Label>
      <div className="mt-2">{children}</div>
      {helper && <p className="mt-1.5 text-xs text-white/45">{helper}</p>}
    </div>
  );
}
