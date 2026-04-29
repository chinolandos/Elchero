'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
  career: string | null;
  year: number | null;
  subjects: string[];
}

const INITIAL: OnboardingState = {
  step: 1,
  user_type: null,
  age: null,
  has_guardian_consent: false,
  institution: null,
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

  const canAdvanceStep2 = state.institution !== null;

  const handleFinish = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          user_type: state.user_type,
          age: state.age,
          has_guardian_consent: state.has_guardian_consent,
          institution: state.institution,
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
    <div className="mb-10 flex items-center gap-2">
      {[1, 2, 3].map((n) => (
        <div
          key={n}
          className={cn(
            'h-1.5 flex-1 rounded-full transition-colors',
            n <= step ? 'bg-primary' : 'bg-white/10',
          )}
        />
      ))}
      <div className="ml-3 shrink-0 text-xs text-white/50">{step} / 3</div>
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
            subtitle="Período + AVANZO"
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
        <p className="mt-2 text-xs text-white/40">
          Edad mínima: 12 años (Ley de Protección de Datos SV).
        </p>
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
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  subtitle: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-xl border p-5 text-left transition-all',
        selected
          ? 'border-primary bg-primary/10 ring-2 ring-primary/40'
          : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10',
      )}
    >
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
  const filteredInstitutions = INSTITUTIONS.filter(
    (i) => i.type === state.user_type,
  );
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
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {filteredInstitutions.map((inst) => (
            <button
              key={inst.value}
              type="button"
              onClick={() => update({ institution: inst.value })}
              className={cn(
                'rounded-lg border px-4 py-3 text-left text-sm transition-all',
                state.institution === inst.value
                  ? 'border-primary bg-primary/10 text-white'
                  : 'border-white/10 bg-white/5 text-white/80 hover:border-white/20 hover:bg-white/10',
              )}
            >
              {inst.label}
            </button>
          ))}
        </div>
        {state.institution === 'Otro' || state.institution === 'Otra' ? (
          <Input
            placeholder={isUniversitario ? 'Ej: Universidad Tecnológica' : 'Ej: Liceo Salvadoreño'}
            value={state.institution === 'Otro' || state.institution === 'Otra' ? '' : state.institution ?? ''}
            onChange={(e) => update({ institution: e.target.value })}
            className="mt-3"
          />
        ) : null}
      </div>

      <div className="mb-6">
        <Label className="text-white/80">
          {isUniversitario ? 'Año de carrera' : 'Año de bachillerato'}
        </Label>
        <div className="mt-3 flex gap-2">
          {(isUniversitario ? [1, 2, 3, 4, 5] : [1, 2]).map((y) => (
            <button
              key={y}
              type="button"
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

      <div className="flex flex-wrap gap-2">
        {allSubjects.map((subject) => {
          const selected = state.subjects.includes(subject);
          const avanzo = state.user_type === 'bachiller' && isAvanzo(subject);
          return (
            <button
              key={subject}
              type="button"
              onClick={() => toggle(subject)}
              className={cn(
                'rounded-full border px-4 py-2 text-sm transition-all',
                selected
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-white/10 bg-white/5 text-white/80 hover:border-white/20 hover:bg-white/10',
              )}
            >
              {avanzo && <span className="mr-1.5">★</span>}
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
