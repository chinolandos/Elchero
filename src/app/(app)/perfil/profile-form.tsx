'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { useAuth } from '@/lib/auth/use-auth';
import {
  AVANZO_SUBJECTS,
  BACHILLER_SUBJECTS,
  UNIVERSITARIO_SUBJECTS,
} from '@/lib/catalog/subjects';
import { cn } from '@/lib/utils';
import type { UserProfile } from '@/lib/types/chero';

type VoiceOption = 'nova' | 'echo' | 'alloy' | 'onyx' | 'shimmer' | 'fable' | 'coral' | 'sage';

const VOICES: { value: VoiceOption; label: string; description: string }[] = [
  { value: 'nova', label: 'Nova', description: 'Femenina, cálida (recomendada)' },
  { value: 'coral', label: 'Coral', description: 'Femenina, expresiva' },
  { value: 'sage', label: 'Sage', description: 'Femenina, profesional' },
  { value: 'shimmer', label: 'Shimmer', description: 'Femenina, suave' },
  { value: 'echo', label: 'Echo', description: 'Masculina, profesional' },
  { value: 'onyx', label: 'Onyx', description: 'Masculina, grave' },
];

interface ProfileFormProps {
  email: string;
  profile: UserProfile | null;
}

export function ProfileForm({ email, profile }: ProfileFormProps) {
  const router = useRouter();
  const { signOut } = useAuth();

  const [career, setCareer] = useState(profile?.career ?? '');
  const [year, setYear] = useState<number | null>(profile?.year ?? null);
  const [subjects, setSubjects] = useState<string[]>(profile?.subjects ?? []);
  const [preferredVoice, setPreferredVoice] = useState<VoiceOption>(
    (profile?.preferred_voice as VoiceOption) ?? 'nova',
  );
  const [isSaving, setIsSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const userType = profile?.user_type;
  const allSubjects =
    userType === 'bachiller'
      ? BACHILLER_SUBJECTS
      : userType === 'universitario'
        ? UNIVERSITARIO_SUBJECTS
        : ([] as readonly string[]);
  const isAvanzo = (s: string) => (AVANZO_SUBJECTS as readonly string[]).includes(s);

  const toggleSubject = (subject: string) => {
    if (subjects.includes(subject)) {
      setSubjects(subjects.filter((s) => s !== subject));
    } else if (subjects.length < 15) {
      setSubjects([...subjects, subject]);
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
          subjects,
          preferred_voice: preferredVoice,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'No se pudo guardar');
      toast.success('Perfil actualizado');
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
      // Sign out + redirect a /
      await signOut();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error');
      setIsDeleting(false);
      setConfirmingDelete(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Editables — primero lo que el user va a tocar */}
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
            {(userType === 'universitario' ? [1, 2, 3, 4, 5] : [1, 2]).map((y) => (
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
        </Field>

        <Field
          label="Voz preferida del audio TTS"
          helper="Cambia cómo suena la lectura de tus apuntes"
        >
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
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
                <div className="mt-0.5 text-xs text-white/70">{v.description}</div>
              </button>
            ))}
          </div>
        </Field>
      </Section>

      {/* Materias */}
      {allSubjects.length > 0 && (
        <Section
          title="Materias actuales"
          subtitle="Las que tomás este período. Máximo 15."
        >
          <div className="mb-4 flex items-center gap-2 text-xs">
            <span className="rounded-full bg-primary/20 px-3 py-1 text-primary">
              {subjects.length} / 15
            </span>
            {userType === 'bachiller' && (
              <span className="text-white/40">★ AVANZO</span>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {allSubjects.map((subject) => {
              const selected = subjects.includes(subject);
              const avanzo = userType === 'bachiller' && isAvanzo(subject);
              return (
                <button
                  key={subject}
                  type="button"
                  onClick={() => toggleSubject(subject)}
                  className={cn(
                    'rounded-full px-4 py-2 text-sm font-medium transition-all',
                    selected
                      ? 'bg-gradient-primary shadow-button-premium text-white'
                      : 'glass text-white/80 hover:bg-white/[0.18]',
                  )}
                >
                  {avanzo && <span className="mr-1.5">★</span>}
                  {subject}
                </button>
              );
            })}
          </div>
        </Section>
      )}

      {/* Save button — premium full-width al final del editable */}
      <Button
        variant="premium"
        size="xl"
        onClick={handleSave}
        disabled={isSaving}
        className="w-full"
      >
        {isSaving ? <Spinner size="sm" /> : 'Guardar cambios'}
      </Button>

      {/* Datos read-only — menu list rows estilo Lovable */}
      <section className="glass overflow-hidden rounded-3xl">
        <div className="border-b border-white/10 px-5 py-4 sm:px-6">
          <h2 className="font-display-pf text-xl font-semibold text-white sm:text-2xl">
            Cuenta
          </h2>
          <p className="mt-1 text-xs text-white/65">
            Datos verificados al ingresar
          </p>
        </div>
        <ul className="divide-y divide-white/10">
          <InfoRow label="Email" value={email} />
          {profile?.user_type && (
            <InfoRow
              label="Tipo de estudiante"
              value={
                profile.user_type === 'bachiller'
                  ? 'Bachillerato'
                  : 'Universidad'
              }
            />
          )}
          {profile?.institution && (
            <InfoRow label="Institución" value={profile.institution} />
          )}
          {typeof profile?.age === 'number' && (
            <InfoRow
              label="Edad"
              value={
                <span className="inline-flex items-center gap-2">
                  <span>{profile.age} años</span>
                  {profile.is_minor && (
                    <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] text-amber-200">
                      Menor
                    </span>
                  )}
                </span>
              }
            />
          )}
        </ul>
      </section>

      {/* Zona peligrosa */}
      <Section
        title="Zona peligrosa"
        subtitle="Cumple con tu derecho al olvido (Ley Protección Datos SV)"
        tone="danger"
      >
        <div>
          <h3 className="mb-2 font-semibold text-red-200">
            Eliminar mi cuenta
          </h3>
          <p className="mb-4 text-sm text-red-200/70">
            Esto borra tu perfil, todos los apuntes y el audio TTS de forma
            permanente. No se puede deshacer.
          </p>
          <Button
            variant="ghost"
            onClick={handleDeleteAccount}
            disabled={isDeleting}
            className={cn(
              'w-full transition-colors',
              confirmingDelete
                ? 'bg-red-500/20 text-red-200 hover:bg-red-500/30'
                : 'border border-red-500/30 text-red-300 hover:bg-red-500/10',
            )}
          >
            {isDeleting ? (
              <Spinner size="sm" />
            ) : confirmingDelete ? (
              '⚠️ Confirmá: borrar TODO permanentemente'
            ) : (
              'Eliminar mi cuenta'
            )}
          </Button>
        </div>
      </Section>

      {/* Cerrar sesión — full-width glass pill (Lovable style) */}
      <button
        type="button"
        onClick={signOut}
        className="glass flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 text-sm font-semibold text-white transition-all hover:bg-white/[0.18]"
      >
        <LogOutIcon />
        <span>Cerrar sesión</span>
      </button>
    </div>
  );
}

/**
 * InfoRow — fila tipo menu list de Lovable (label izq, value der).
 * Sin chevron porque son read-only (no clickables).
 */
function InfoRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <li className="flex items-center justify-between gap-4 px-5 py-3.5 sm:px-6">
      <span className="text-sm text-white/70">{label}</span>
      <span className="text-right text-sm font-medium text-white">
        {value}
      </span>
    </li>
  );
}

function LogOutIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" x2="9" y1="12" y2="12" />
    </svg>
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
  // v5: card glass blanco translúcido. Variante "danger" mantiene el aviso
  // visual rojo de Zona peligrosa (compliance Ley Protección de Datos SV).
  return (
    <section
      className={
        tone === 'danger'
          ? 'rounded-3xl border border-red-500/30 bg-red-500/[0.08] p-5 backdrop-blur-md transition-colors hover:border-red-500/40 sm:p-6'
          : 'glass rounded-3xl p-5 sm:p-6'
      }
    >
      <h2
        className={
          tone === 'danger'
            ? 'font-display-pf mb-1 text-xl font-semibold text-red-200 sm:text-2xl'
            : 'font-display-pf mb-1 text-xl font-semibold text-white sm:text-2xl'
        }
      >
        {title}
      </h2>
      {subtitle && (
        <p className="mb-5 text-xs text-white/65">{subtitle}</p>
      )}
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
      {helper && <p className="mt-1.5 text-xs text-white/40">{helper}</p>}
    </div>
  );
}
