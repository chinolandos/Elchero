'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import {
  AVANZO_SUBJECTS,
  BACHILLER_SUBJECTS,
  UNIVERSITARIO_SUBJECTS,
} from '@/lib/catalog/subjects';
import { cn } from '@/lib/utils';
import type { UserProfile } from '@/lib/types/chero';

interface Props {
  profile: UserProfile | null;
}

export function MateriasForm({ profile }: Props) {
  const router = useRouter();
  const userType = profile?.user_type;

  const [subjects, setSubjects] = useState<string[]>(profile?.subjects ?? []);
  const [isSaving, setIsSaving] = useState(false);

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
        body: JSON.stringify({ subjects }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'No se pudo guardar');
      toast.success('Materias actualizadas');
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
        <div className="mb-4 flex items-center gap-2 text-xs">
          <span
            className={cn(
              'rounded-full px-3 py-1 font-medium',
              subjects.length >= 15
                ? 'bg-amber-500/20 text-amber-300'
                : 'bg-primary/20 text-primary-glow',
            )}
          >
            {subjects.length} / 15
          </span>
          {userType === 'bachiller' && (
            <span className="text-white/55">★ AVANZO</span>
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
