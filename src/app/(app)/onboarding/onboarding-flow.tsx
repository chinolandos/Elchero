'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';
import {
  INSTITUTIONS,
  BACHILLER_SUBJECTS,
  UNIVERSITARIO_SUBJECTS,
  AVANZO_SUBJECTS,
} from '@/lib/catalog/subjects';
import type { UserType } from '@/lib/types/chero';
import { cn } from '@/lib/utils';

type Step = 1 | 2 | 3;

interface OnboardingState {
  step: Step;
  user_type: UserType | null;
  age: number | null;
  has_guardian_consent: boolean;
  institution: string | null;
  /** Flag interno: el user eligió "Otro/Otra" y va a escribir su institución a mano. */
  institutionIsOther: boolean;
  /** Texto custom cuando institutionIsOther === true. */
  institutionOther: string;
  career: string | null;
  year: number | null;
  subjects: string[];
}

const INITIAL: OnboardingState = {
  step: 1,
  // Pre-seleccionado a 'bachiller' porque es el target principal de Chero.
  // Universitario sigue disponible (toggleable) por compatibilidad backend.
  user_type: 'bachiller',
  age: null,
  has_guardian_consent: false,
  institution: null,
  institutionIsOther: false,
  institutionOther: '',
  career: null,
  year: null,
  subjects: [],
};

interface OnboardingFlowProps {
  initialEmail: string | null;
}

export function OnboardingFlow({ initialEmail }: OnboardingFlowProps) {
  const router = useRouter();
  const [state, setState] = useState<OnboardingState>(INITIAL);
  const [isSaving, setIsSaving] = useState(false);

  const update = (patch: Partial<OnboardingState>) =>
    setState((s) => ({ ...s, ...patch }));

  const goNext = () => update({ step: Math.min(3, state.step + 1) as Step });
  const goBack = () => update({ step: Math.max(1, state.step - 1) as Step });

  const canAdvanceStep1 =
    state.user_type !== null &&
    typeof state.age === 'number' &&
    state.age >= 12 &&
    state.age <= 99 &&
    (state.age >= 18 || state.has_guardian_consent);

  // Para avanzar de step 2: si eligió "Otro", el campo custom no puede estar vacío.
  const canAdvanceStep2 = state.institutionIsOther
    ? state.institutionOther.trim().length > 1
    : state.institution !== null;

  const handleFinish = async () => {
    setIsSaving(true);
    try {
      const finalInstitution = state.institutionIsOther
        ? state.institutionOther.trim()
        : state.institution;

      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          user_type: state.user_type,
          age: state.age,
          has_guardian_consent: state.has_guardian_consent,
          institution: finalInstitution,
          career: state.career,
          year: state.year,
          subjects: state.subjects,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? 'No se pudo guardar tu perfil.');
      }
      toast.success('¡Listo! Tu cuenta quedó configurada.');
      router.push('/capture');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error inesperado.');
      setIsSaving(false);
    }
  };

  return (
    <div>
      <ProgressBar step={state.step} />

      {state.step === 1 && (
        <Step1
          state={state}
          update={update}
          email={initialEmail}
        />
      )}

      {state.step === 2 && <Step2 state={state} update={update} />}

      {state.step === 3 && <Step3 state={state} update={update} />}

      {/* Nav — Atrás ghost, Siguiente/Empezar premium gradient (v5) */}
      <div className="mt-10 flex items-center justify-between gap-3">
        <Button
          variant="ghost"
          onClick={goBack}
          disabled={state.step === 1 || isSaving}
          className="text-white/70 hover:bg-white/10 hover:text-white"
        >
          ← Atrás
        </Button>

        {state.step < 3 ? (
          <Button
            variant="premium"
            size="xl"
            onClick={goNext}
            disabled={
              isSaving ||
              (state.step === 1 && !canAdvanceStep1) ||
              (state.step === 2 && !canAdvanceStep2)
            }
          >
            Siguiente
          </Button>
        ) : (
          <Button
            variant="premium"
            size="xl"
            onClick={handleFinish}
            disabled={isSaving}
          >
            {isSaving ? <Spinner size="sm" /> : '¡Empezar!'}
          </Button>
        )}
      </div>
    </div>
  );
}

function ProgressBar({ step }: { step: Step }) {
  return (
    <div
      className="mb-10 flex items-center gap-2"
      role="progressbar"
      aria-valuenow={step}
      aria-valuemin={1}
      aria-valuemax={3}
      aria-label={`Onboarding paso ${step} de 3`}
    >
      {[1, 2, 3].map((n) => (
        <div
          key={n}
          className={cn(
            'h-1.5 flex-1 rounded-full transition-all',
            // v5: barras llenas usan el gradient warm magenta→ember para
            // matching con el premium button. Pendientes en glass blanco sutil.
            n <= step ? 'bg-gradient-primary shadow-button-premium' : 'bg-white/10',
          )}
          aria-hidden="true"
        />
      ))}
      <div className="ml-3 shrink-0 text-xs text-white/60" aria-hidden="true">
        {step} / 3
      </div>
    </div>
  );
}

// ─── Step 1: tipo + edad ───
function Step1({
  state,
  update,
  email,
}: {
  state: OnboardingState;
  update: (p: Partial<OnboardingState>) => void;
  email: string | null;
}) {
  const isMinor = typeof state.age === 'number' && state.age < 18;

  return (
    <div>
      <h1 className="font-display-pf mb-2 text-3xl font-semibold tracking-tight md:text-4xl">
        ¿Quién sos?
      </h1>
      <p className="mb-8 text-white/75">
        {email ? `Hola, ${email}. ` : ''}Esto nos ayuda a personalizar tus apuntes.
      </p>

      <div className="mb-8 space-y-3">
        <Label className="text-white/80">Tipo de estudiante</Label>
        <div className="grid grid-cols-2 gap-3">
          <TypeCard
            selected={state.user_type === 'bachiller'}
            onClick={() => update({ user_type: 'bachiller' })}
            title="Bachillerato"
            subtitle="AVANZO + exámenes de período"
            badge="El target de Chero"
          />
          <TypeCard
            selected={state.user_type === 'universitario'}
            onClick={() => update({ user_type: 'universitario' })}
            title="Universidad"
            subtitle="Parciales y finales"
          />
        </div>
      </div>

      <div className="mb-6">
        <Label htmlFor="age" className="text-white/80">
          Edad
        </Label>
        <Input
          id="age"
          type="number"
          min={12}
          max={99}
          inputMode="numeric"
          placeholder="Ej: 19"
          value={state.age ?? ''}
          onChange={(e) => {
            const v = e.target.value === '' ? null : Number(e.target.value);
            update({ age: v });
          }}
          className="mt-2 max-w-[160px]"
        />
        {typeof state.age === 'number' && state.age < 12 && (
          <p className="mt-2 text-xs text-red-400">
            Edad mínima: 12 años (Ley de Protección de Datos SV).
          </p>
        )}
        {typeof state.age === 'number' && state.age > 99 && (
          <p className="mt-2 text-xs text-red-400">
            La edad máxima permitida es 99.
          </p>
        )}
        {(state.age === null ||
          (state.age >= 12 && state.age <= 99)) && (
          <p className="mt-2 text-xs text-white/40">
            Edad mínima: 12 años (Ley de Protección de Datos SV).
          </p>
        )}
      </div>

      {isMinor && (
        <div className="mt-6 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
          <div className="mb-3 font-semibold">Sos menor de edad</div>
          <p className="mb-4 text-amber-200/80">
            Por la Ley de Protección de Datos Personales de El Salvador, necesitamos
            que tu madre, padre o tutor sepa que vas a usar Chero.
          </p>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={state.has_guardian_consent}
              onChange={(e) => update({ has_guardian_consent: e.target.checked })}
              className="mt-1 h-4 w-4 cursor-pointer accent-primary"
            />
            <span className="text-amber-100">
              Confirmo que mi madre, padre o tutor está al tanto de que voy a usar Chero
              para generar apuntes a partir de audios de clase.
            </span>
          </label>
        </div>
      )}
    </div>
  );
}

function TypeCard({
  selected,
  onClick,
  title,
  subtitle,
  badge,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  subtitle: string;
  badge?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      aria-label={`${title} — ${subtitle}`}
      className={cn(
        'relative min-h-[80px] rounded-2xl p-5 text-left transition-all',
        // v5: glass-strong + ring magenta cuando seleccionado, glass simple
        // cuando no. Mucho más legible sobre el fondo warm.
        selected
          ? 'glass-strong shadow-button-premium ring-2 ring-white/40'
          : 'glass hover:bg-white/[0.18]',
      )}
    >
      {badge && (
        <span className="bg-gradient-primary absolute -top-2 right-3 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-button-premium">
          {badge}
        </span>
      )}
      <div className="font-semibold text-white">{title}</div>
      <div className="mt-1 text-xs text-white/70">{subtitle}</div>
    </button>
  );
}

// ─── Step 2: institución + año + carrera ───
function Step2({
  state,
  update,
}: {
  state: OnboardingState;
  update: (p: Partial<OnboardingState>) => void;
}) {
  const isUniversitario = state.user_type === 'universitario';

  return (
    <div>
      <h1 className="font-display-pf mb-2 text-3xl font-semibold tracking-tight md:text-4xl">
        ¿Dónde estudiás?
      </h1>
      <p className="mb-8 text-white/75">
        {isUniversitario
          ? 'Elegí tu universidad y año actual.'
          : 'Decinos tu colegio y año de bachillerato.'}
      </p>

      <div className="mb-6">
        <Label className="text-white/80">
          {isUniversitario ? 'Universidad' : 'Colegio'}
        </Label>
        <InstitutionCombobox state={state} update={update} />
      </div>

      <div className="mb-6">
        <Label className="text-white/80">
          {isUniversitario ? 'Año de carrera' : 'Año de bachillerato'}
        </Label>
        <div className="mt-3 flex gap-2" role="radiogroup" aria-label="Año de estudios">
          {/* Bachillerato general SV: 2 años. Bachillerato técnico (INTI,
              INFRAMEN, etc.): 3 años. Damos las 3 opciones para cubrir ambos. */}
          {(isUniversitario ? [1, 2, 3, 4, 5] : [1, 2, 3]).map((y) => (
            <button
              key={y}
              type="button"
              role="radio"
              aria-checked={state.year === y}
              aria-label={`${y}° año`}
              onClick={() => update({ year: y })}
              className={cn(
                'h-12 w-12 rounded-xl text-sm font-semibold transition-all',
                // v5: glass + gradient warm cuando seleccionado, glass simple
                // cuando no.
                state.year === y
                  ? 'bg-gradient-primary shadow-button-premium text-white'
                  : 'glass text-white/80 hover:bg-white/[0.18]',
              )}
            >
              {y}°
            </button>
          ))}
        </div>
      </div>

      {isUniversitario && (
        <div>
          <Label htmlFor="career" className="text-white/80">
            Carrera <span className="text-white/40">(opcional)</span>
          </Label>
          <Input
            id="career"
            placeholder="Ej: Ingeniería de Software"
            value={state.career ?? ''}
            onChange={(e) => update({ career: e.target.value || null })}
            className="mt-2"
          />
        </div>
      )}
    </div>
  );
}

/**
 * InstitutionCombobox — input de búsqueda + lista filtrada con CTA "+ Agregar".
 *
 * Estados visuales:
 *   1. Sin selección → input + lista scrollable filtrada por substring
 *   2. Selección hecha → pill con label + botón × para limpiar y volver a buscar
 *
 * Match exacto: si el query coincide exact-string con label o value (case-insens),
 * NO se ofrece "+ Agregar". Eso evita duplicar instituciones existentes.
 *
 * Filtro: substring sobre label + value, case-insensitive, normalize trim.
 *
 * Reuso: el mismo componente sirve para colegios y universidades. La lista
 * se filtra por `state.user_type` desde INSTITUTIONS.
 */
function InstitutionCombobox({
  state,
  update,
}: {
  state: OnboardingState;
  update: (p: Partial<OnboardingState>) => void;
}) {
  const isUniversitario = state.user_type === 'universitario';
  const [query, setQuery] = useState('');

  const pool = useMemo(
    () => INSTITUTIONS.filter((i) => i.type === state.user_type),
    [state.user_type],
  );

  const normalized = query.trim().toLowerCase();

  const matches = useMemo(() => {
    if (normalized.length === 0) return pool;
    return pool.filter(
      (i) =>
        i.label.toLowerCase().includes(normalized) ||
        i.value.toLowerCase().includes(normalized),
    );
  }, [normalized, pool]);

  // ¿El query coincide EXACT con algún label/value? Si sí, no mostramos "+ Agregar"
  const hasExactMatch = useMemo(() => {
    if (normalized.length === 0) return false;
    return pool.some(
      (i) =>
        i.label.toLowerCase() === normalized ||
        i.value.toLowerCase() === normalized,
    );
  }, [normalized, pool]);

  const showAddOption = normalized.length >= 2 && !hasExactMatch;

  // Etiqueta visible de la selección actual (si hay una)
  const currentLabel = state.institutionIsOther
    ? state.institutionOther.trim()
    : pool.find((i) => i.value === state.institution)?.label ?? null;

  const clearSelection = () => {
    update({
      institution: null,
      institutionIsOther: false,
      institutionOther: '',
    });
    setQuery('');
  };

  const pickInstitution = (value: string) => {
    update({
      institution: value,
      institutionIsOther: false,
      institutionOther: '',
    });
    setQuery('');
  };

  const pickCustom = (custom: string) => {
    update({
      institution: null,
      institutionIsOther: true,
      institutionOther: custom,
    });
    setQuery('');
  };

  // Estado 2: ya hay selección → mostrar pill con × para reset
  if (currentLabel) {
    return (
      <div
        className="glass-strong mt-3 flex items-center gap-3 rounded-2xl px-4 py-3 ring-1 ring-white/30"
        role="status"
      >
        <div className="flex-1 text-sm text-white">
          {currentLabel}
          {state.institutionIsOther && (
            <span className="ml-2 text-xs text-white/55">(agregado por vos)</span>
          )}
        </div>
        <button
          type="button"
          onClick={clearSelection}
          aria-label="Cambiar selección"
          className="rounded-md p-1 text-white/70 transition-colors hover:bg-white/15 hover:text-white"
        >
          <X aria-hidden className="h-4 w-4" />
        </button>
      </div>
    );
  }

  // Estado 1: sin selección → input + lista
  return (
    <div className="mt-3">
      <div className="relative">
        <Search
          aria-hidden
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40"
        />
        <Input
          type="text"
          inputMode="search"
          autoComplete="off"
          placeholder={
            isUniversitario ? 'Buscar tu universidad...' : 'Buscar tu colegio...'
          }
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
          aria-label={isUniversitario ? 'Buscar universidad' : 'Buscar colegio'}
        />
      </div>

      <div
        role="listbox"
        aria-label={isUniversitario ? 'Universidades' : 'Colegios'}
        className="glass mt-2 max-h-[260px] overflow-y-auto rounded-2xl"
      >
        {matches.map((inst, idx) => (
          <button
            key={inst.value}
            type="button"
            role="option"
            aria-selected={false}
            onClick={() => pickInstitution(inst.value)}
            className={cn(
              'block w-full px-4 py-3 text-left text-sm text-white/85 transition-colors hover:bg-white/5 hover:text-white',
              idx !== matches.length - 1 && 'border-b border-white/5',
            )}
          >
            {inst.label}
          </button>
        ))}

        {matches.length === 0 && !showAddOption && (
          <div className="px-4 py-3 text-sm text-white/40">
            Escribí al menos 2 letras para ver opciones o agregar una nueva.
          </div>
        )}

        {showAddOption && (
          <button
            type="button"
            onClick={() => pickCustom(query.trim())}
            className={cn(
              'flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-primary transition-colors hover:bg-primary/10',
              matches.length > 0 && 'border-t border-primary/20',
            )}
          >
            <Plus aria-hidden className="h-4 w-4 shrink-0" />
            <span>
              Agregar{' '}
              <span className="text-white">&quot;{query.trim()}&quot;</span>
            </span>
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Step 3: materias (combobox multi-select) ───
function Step3({
  state,
  update,
}: {
  state: OnboardingState;
  update: (p: Partial<OnboardingState>) => void;
}) {
  return (
    <div>
      <h1 className="font-display-pf mb-2 text-3xl font-semibold tracking-tight md:text-4xl">
        Tus materias actuales
      </h1>
      <p className="mb-8 text-white/75">
        Elegí las que estás cursando este período. Sirve para que Chero detecte
        mejor el contexto del audio. Podés cambiarlas después.
      </p>

      <SubjectsCombobox state={state} update={update} />

      <p className="mt-6 text-xs text-white/40">
        Si no las elegís ahora no pasa nada — el motor detecta la materia
        automáticamente del audio.
      </p>
    </div>
  );
}

/**
 * SubjectsCombobox — multi-select con search + chips persistentes.
 *
 * Layout:
 *   - Header: contador X/15 + leyenda ★ AVANZO (si bachiller)
 *   - Selected: chips wrap, cada uno con × para remover
 *   - Search: input "Buscar materia..." con icono lupa
 *   - List: filtrado substring case-insens, SOLO no-seleccionadas, AVANZO ★
 *   - "+ Agregar 'X'" CTA al final de la lista cuando query >= 2 chars y
 *     no hay match exacto en el catálogo ni en las seleccionadas
 *   - Cap 15: al llegar al límite la lista se deshabilita con mensaje
 *
 * Las materias custom (las que no están en el catálogo MINED) se guardan
 * como strings tal cual el user las escribe. NO llevan ★ AVANZO porque
 * esa lista es fija oficial del MINED.
 */
function SubjectsCombobox({
  state,
  update,
}: {
  state: OnboardingState;
  update: (p: Partial<OnboardingState>) => void;
}) {
  const isBachiller = state.user_type === 'bachiller';
  const [query, setQuery] = useState('');

  const allSubjects = useMemo<readonly string[]>(
    () => (isBachiller ? BACHILLER_SUBJECTS : UNIVERSITARIO_SUBJECTS),
    [isBachiller],
  );

  const isAvanzo = (s: string) =>
    (AVANZO_SUBJECTS as readonly string[]).includes(s);

  const selected = state.subjects;
  const atLimit = selected.length >= 15;

  // Lista que aparece en el dropdown: solo no-seleccionadas + filtro substring
  const normalized = query.trim().toLowerCase();
  const matches = useMemo(() => {
    const available = allSubjects.filter((s) => !selected.includes(s));
    if (normalized.length === 0) return available;
    return available.filter((s) => s.toLowerCase().includes(normalized));
  }, [allSubjects, selected, normalized]);

  // ¿El query coincide EXACT con algo del catálogo o de las seleccionadas?
  // Si sí, no mostramos "+ Agregar" — usar el botón existente o ya está agregada.
  const hasExactMatch = useMemo(() => {
    if (normalized.length === 0) return false;
    const inCatalog = allSubjects.some((s) => s.toLowerCase() === normalized);
    const inSelected = selected.some((s) => s.toLowerCase() === normalized);
    return inCatalog || inSelected;
  }, [allSubjects, selected, normalized]);

  const showAddOption =
    !atLimit && normalized.length >= 2 && !hasExactMatch;

  const addSubject = (subject: string) => {
    if (selected.includes(subject) || atLimit) return;
    update({ subjects: [...selected, subject] });
    setQuery('');
  };

  const removeSubject = (subject: string) => {
    update({ subjects: selected.filter((s) => s !== subject) });
  };

  return (
    <div>
      {/* Header: contador + leyenda AVANZO */}
      <div className="mb-3 flex items-center gap-2 text-xs">
        <span
          className={cn(
            'rounded-full px-3 py-1 font-medium',
            atLimit
              ? 'bg-amber-500/20 text-amber-300'
              : 'bg-primary/20 text-primary',
          )}
        >
          {selected.length} / 15
        </span>
        {isBachiller && <span className="text-white/40">★ AVANZO</span>}
      </div>

      {/* Chips seleccionadas — siempre visibles */}
      {selected.length > 0 && (
        <div
          className="mb-4 flex flex-wrap gap-2"
          role="group"
          aria-label="Materias seleccionadas"
        >
          {selected.map((subject) => {
            const avanzo = isBachiller && isAvanzo(subject);
            return (
              <span
                key={subject}
                className="inline-flex items-center gap-1.5 rounded-full border border-primary bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
              >
                {avanzo && <span aria-hidden="true">★</span>}
                {subject}
                <button
                  type="button"
                  onClick={() => removeSubject(subject)}
                  aria-label={`Quitar ${subject}`}
                  className="ml-0.5 rounded-full p-0.5 text-primary-foreground/70 transition-colors hover:bg-white/15 hover:text-primary-foreground"
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
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40"
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
        <div className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          Llegaste al máximo de 15 materias. Quitá alguna para agregar otra.
        </div>
      ) : (
        <div
          role="listbox"
          aria-label="Materias disponibles"
          className="glass mt-2 max-h-[260px] overflow-y-auto rounded-2xl"
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
                  <span aria-hidden="true" className="text-primary">
                    ★
                  </span>
                )}
                <span className="flex-1">{subject}</span>
              </button>
            );
          })}

          {matches.length === 0 && !showAddOption && (
            <div className="px-4 py-3 text-sm text-white/40">
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
                'flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-primary transition-colors hover:bg-primary/10',
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
    </div>
  );
}
