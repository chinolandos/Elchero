'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/spinner';
import { PremiumButton } from '@/components/ui/premium-button';
import {
  AVANZO_SUBJECTS,
  BACHILLER_SUBJECTS,
  UNIVERSITARIO_SUBJECTS,
} from '@/lib/catalog/subjects';
import { cn } from '@/lib/utils';
import type { UserProfile } from '@/lib/types/chero';

interface MateriasClientProps {
  profile: UserProfile | null;
}

export function MateriasClient({ profile }: MateriasClientProps) {
  const router = useRouter();
  const [subjects, setSubjects] = useState<string[]>(profile?.subjects ?? []);
  const [isSaving, setIsSaving] = useState(false);

  const userType = profile?.user_type;
  const allSubjects =
    userType === 'bachiller'
      ? BACHILLER_SUBJECTS
      : userType === 'universitario'
        ? UNIVERSITARIO_SUBJECTS
        : ([] as readonly string[]);
  const isAvanzo = (s: string) =>
    (AVANZO_SUBJECTS as readonly string[]).includes(s);

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
          career: profile?.career ?? null,
          year: profile?.year ?? null,
          subjects,
          preferred_voice: profile?.preferred_voice ?? 'nova',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'No se pudo guardar');
      toast.success('Materias actualizadas');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setIsSaving(false);
    }
  };

  if (allSubjects.length === 0) {
    return (
      <div className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-6 text-center text-sm text-white/55">
        No tenés tipo de estudiante configurado. Volvé al onboarding o contactanos.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-bold text-primary">
            {subjects.length} / 15
          </span>
          {userType === 'bachiller' && (
            <span className="text-xs text-white/45">★ AVANZO</span>
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
                  'rounded-full border px-4 py-2 text-sm transition-all active:scale-[0.97]',
                  selected
                    ? 'border-primary bg-primary text-primary-foreground shadow-[0_0_16px_rgba(147,51,234,0.35)]'
                    : 'border-white/10 bg-white/[0.04] text-white/80 hover:border-white/20 hover:bg-white/[0.08]',
                )}
              >
                {avanzo && <span className="mr-1.5">★</span>}
                {subject}
              </button>
            );
          })}
        </div>
      </div>

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
    </div>
  );
}
