'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import {
  AVANZO_SUBJECTS,
  BACHILLER_SUBJECTS,
  UNIVERSITARIO_SUBJECTS,
} from '@/lib/catalog/subjects';
import { cn } from '@/lib/utils';
import type { UserProfile } from '@/lib/types/chero';

/**
 * MateriasForm — multi-select con search bar + chips persistentes (mismo
 * patrón que el SubjectsCombobox del onboarding). Permite agregar materias
 * custom cuando el catálogo no las trae.
 *
 * UX:
 *   - Header: contador X/15 + leyenda ★ AVANZO
 *   - Chips seleccionadas wrap arriba con × para quitar
 *   - Input "Buscar materia..." con icono lupa
 *   - Lista filtrada (substring case-insens) — solo NO seleccionadas
 *   - "+ Agregar materia 'X'" CTA cuando query >= 2 chars y sin match exacto
 *   - Cap 15: input deshabilitado + lista oculta + msg amber
 *
 * Las materias custom se guardan como strings tal cual el user las escribe.
 * NO llevan ★ AVANZO porque esa lista es fija oficial del MINED.
 */

interface Props {
  profile: UserProfile | null;
}

export function MateriasForm({ profile }: Props) {
  const router = useRouter();
  const userType = profile?.user_type;
  const isBachiller = userType === 'bachiller';

  const [subjects, setSubjects] = useState<string[]>(profile?.subjects ?? []);
  const [query, setQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const allSubjects = useMemo<readonly string[]>(
    () =>
      isBachiller
        ? BACHILLER_SUBJECTS
        : userType === 'universitario'
          ? UNIVERSITARIO_SUBJECTS
          : ([] as readonly string[]),
    [isBachiller, userType],
  );

  const isAvanzo = (s: string) =>
    (AVANZO_SUBJECTS as readonly string[]).includes(s);

  const atLimit = subjects.length >= 15;

  // Lista del dropdown: solo no-seleccionadas + filtro substring
  const normalized = query.trim().toLowerCase();
  const matches = useMemo(() => {
    const available = allSubjects.filter((s) => !subjects.includes(s));
    if (normalized.length === 0) return available;
    return available.filter((s) => s.toLowerCase().includes(normalized));
  }, [allSubjects, subjects, normalized]);

  // ¿El query coincide EXACT con algo del catálogo o de las seleccionadas?
  // Si sí, no mostramos "+ Agregar" — usar el botón existente o ya está agregada.
  const hasExactMatch = useMemo(() => {
    if (normalized.length === 0) return false;
    const inCatalog = allSubjects.some((s) => s.toLowerCase() === normalized);
    const inSelected = subjects.some((s) => s.toLowerCase() === normalized);
    return inCatalog || inSelected;
  }, [allSubjects, subjects, normalized]);

  const showAddOption =
    !atLimit && normalized.length >= 2 && !hasExactMatch;

  const addSubject = (subject: string) => {
    if (subjects.includes(subject) || atLimit) return;
    setSubjects([...subjects, subject]);
    setQuery('');
  };

  const removeSubject = (subject: string) => {
    setSubjects(subjects.filter((s) => s !== subject));
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
        {/* Header: contador + leyenda */}
        <div className="mb-4 flex items-center gap-2 text-xs">
          <span
            className={cn(
              'rounded-full px-3 py-1 font-medium',
              atLimit
                ? 'bg-amber-500/20 text-amber-300'
                : 'bg-primary/20 text-primary-glow',
            )}
          >
            {subjects.length} / 15
          </span>
          {isBachiller && <span className="text-white/55">★ AVANZO</span>}
        </div>

        {/* Chips seleccionadas — siempre visibles */}
        {subjects.length > 0 && (
          <div
            className="mb-4 flex flex-wrap gap-2"
            role="group"
            aria-label="Materias seleccionadas"
          >
            {subjects.map((subject) => {
              const avanzo = isBachiller && isAvanzo(subject);
              return (
                <span
                  key={subject}
                  className="bg-gradient-primary shadow-button-premium inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-white"
                >
                  {avanzo && <span aria-hidden="true">★</span>}
                  {subject}
                  <button
                    type="button"
                    onClick={() => removeSubject(subject)}
                    aria-label={`Quitar ${subject}`}
                    className="ml-0.5 rounded-full p-0.5 text-white/80 transition-colors hover:bg-white/15 hover:text-white"
                  >
                    <X aria-hidden className="h-3 w-3" />
                  </button>
                </span>
              );
            })}
          </div>
        )}

        {/* Search input */}
        <div className="relative">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/55"
          />
          <Input
            type="text"
            inputMode="search"
            autoComplete="off"
            placeholder="Buscar materia..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={atLimit}
            className="pl-9 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Buscar materia"
          />
        </div>

        {/* Lista de no-seleccionadas */}
        {atLimit ? (
          <div className="mt-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            Llegaste al máximo de 15 materias. Quitá alguna para agregar otra.
          </div>
        ) : (
          <div
            role="listbox"
            aria-label="Materias disponibles"
            className="glass mt-3 max-h-[260px] overflow-y-auto rounded-2xl"
          >
            {matches.map((subject, idx) => {
              const avanzo = isBachiller && isAvanzo(subject);
              return (
                <button
                  key={subject}
                  type="button"
                  role="option"
                  aria-selected={false}
                  aria-label={avanzo ? `${subject} (entra en AVANZO)` : subject}
                  onClick={() => addSubject(subject)}
                  className={cn(
                    'flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-white/85 transition-colors hover:bg-white/5 hover:text-white',
                    idx !== matches.length - 1 && 'border-b border-white/5',
                  )}
                >
                  {avanzo && (
                    <span aria-hidden="true" className="text-primary-glow">
                      ★
                    </span>
                  )}
                  <span className="flex-1">{subject}</span>
                </button>
              );
            })}

            {matches.length === 0 && !showAddOption && (
              <div className="px-4 py-3 text-sm text-white/55">
                {normalized.length > 0
                  ? `No encontramos "${query.trim()}" en el catálogo.`
                  : 'Ya agregaste todas las materias del catálogo.'}
              </div>
            )}

            {showAddOption && (
              <button
                type="button"
                onClick={() => addSubject(query.trim())}
                className={cn(
                  'flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-primary-glow transition-colors hover:bg-primary/10',
                  matches.length > 0 && 'border-t border-primary/20',
                )}
              >
                <Plus aria-hidden className="h-4 w-4 shrink-0" />
                <span>
                  Agregar materia{' '}
                  <span className="text-white">&quot;{query.trim()}&quot;</span>
                </span>
              </button>
            )}
          </div>
        )}
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
