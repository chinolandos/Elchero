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

      {/* Nav */}
      <div className="mt-10 flex items-center justify-between gap-3">
        <Button
          variant="ghost"
          onClick={goBack}
          disabled={state.step === 1 || isSaving}
          className="text-white/60 hover:bg-white/5 hover:text-white"
        >
          ← Atrás
        </Button>

        {state.step < 3 ? (
          <Button
            size="lg"
            onClick={goNext}
            disabled={
              isSaving ||
              (state.step === 1 && !canAdvanceStep1) ||
              (state.step === 2 && !canAdvanceStep2)
            }
            className="px-8"
          >
            Siguiente
          </Button>
        ) : (
          <Button
            size="lg"
            onClick={handleFinish}
            disabled={isSaving}
            className="px-8"
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
            'h-1.5 flex-1 rounded-full transition-colors',
            n <= step ? 'bg-primary' : 'bg-white/10',
          )}
          aria-hidden="true"
        />
      ))}
      <div className="ml-3 shrink-0 text-xs text-white/50" aria-hidden="true">
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
      <h1 className="mb-2 text-3xl font-black tracking-tight">¿Quién sos?</h1>
      <p className="mb-8 text-white/60">
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
        'relative rounded-xl border p-5 text-left transition-all min-h-[80px]',
        selected
          ? 'border-primary bg-primary/10 ring-2 ring-primary/40'
          : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10',
      )}
    >
      {badge && (
        <span className="absolute -top-2 right-3 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
          {badge}
        </span>
      )}
      <div className="font-semibold">{title}</div>
      <div className="mt-1 text-xs text-white/50">{subtitle}</div>
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
      <h1 className="mb-2 text-3xl font-black tracking-tight">
        ¿Dónde estudiás?
      </h1>
      <p className="mb-8 text-white/60">
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
                'h-12 w-12 rounded-lg border text-sm font-semibold transition-all',
                state.year === y
                  ? 'border-primary bg-primary/10 text-white'
                  : 'border-white/10 bg-white/5 text-white/80 hover:border-white/20 hover:bg-white/10',
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
        className="mt-3 flex items-center gap-3 rounded-lg border border-primary bg-primary/10 px-4 py-3"
        role="status"
      >
        <div className="flex-1 text-sm text-white">
          {currentLabel}
          {state.institutionIsOther && (
            <span className="ml-2 text-xs text-white/40">(agregado por vos)</span>
          )}
        </div>
        <button
          type="button"
          onClick={clearSelection}
          aria-label="Cambiar selección"
          className="rounded-md p-1 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
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
        className="mt-2 max-h-[260px] overflow-y-auto rounded-lg border border-white/10 bg-white/[0.02]"
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

// ─── Step 3: materias (chips) ───
function Step3({
  state,
  update,
}: {
  state: OnboardingState;
  update: (p: Partial<OnboardingState>) => void;
}) {
  const allSubjects =
    state.user_type === 'bachiller'
      ? BACHILLER_SUBJECTS
      : UNIVERSITARIO_SUBJECTS;

  const isAvanzo = (s: string) =>
    (AVANZO_SUBJECTS as readonly string[]).includes(s);

  const toggle = (subject: string) => {
    const current = state.subjects;
    if (current.includes(subject)) {
      update({ subjects: current.filter((s) => s !== subject) });
    } else if (current.length < 15) {
      update({ subjects: [...current, subject] });
    }
  };

  return (
    <div>
      <h1 className="mb-2 text-3xl font-black tracking-tight">
        Tus materias actuales
      </h1>
      <p className="mb-8 text-white/60">
        Elegí las que estás cursando este período. Sirve para que Chero detecte
        mejor el contexto del audio. Podés cambiarlas después.
      </p>

      <div className="mb-4 flex items-center gap-2 text-xs">
        <span className="rounded-full bg-primary/20 px-3 py-1 text-primary">
          {state.subjects.length} / 15
        </span>
        {state.user_type === 'bachiller' && (
          <span className="text-white/40">★ AVANZO</span>
        )}
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Materias actuales">
        {allSubjects.map((subject) => {
          const selected = state.subjects.includes(subject);
          const avanzo = state.user_type === 'bachiller' && isAvanzo(subject);
          return (
            <button
              key={subject}
              type="button"
              aria-pressed={selected}
              aria-label={avanzo ? `${subject} (entra en AVANZO)` : subject}
              onClick={() => toggle(subject)}
              className={cn(
                'rounded-full border px-4 py-2 text-sm transition-all min-h-[36px]',
                selected
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-white/10 bg-white/5 text-white/80 hover:border-white/20 hover:bg-white/10',
              )}
            >
              {avanzo && <span className="mr-1.5" aria-hidden="true">★</span>}
              {subject}
            </button>
          );
        })}
      </div>

      <p className="mt-6 text-xs text-white/40">
        Si no las elegís ahora no pasa nada — el motor detecta la materia
        automáticamente del audio.
      </p>
    </div>
  );
}
