'use client';

import { useState } from 'react';
import { Check, X, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * QuizQuestions — preguntas interactivas estilo Quizlet/test.
 *
 * UX por pregunta:
 *   - Si tiene options: muestra opciones como botones. Click reveal:
 *     * Verde con ✓ en la opción correcta
 *     * Rojo con × en la que el user eligió (si era incorrecta)
 *     * Justificación aparece abajo
 *     * Botón "Reintentar" resetea
 *   - Si NO tiene options: pregunta abierta. Botón "Ver respuesta"
 *     muestra correct + justificación.
 *
 * Trackea estado por pregunta (no global).
 */

interface Question {
  prompt: string;
  options?: string[] | null;
  correct?: string | null;
  justification: string;
}

interface Props {
  questions: Question[];
}

export function QuizQuestions({ questions }: Props) {
  return (
    <div className="space-y-4">
      {questions.map((q, i) => (
        <QuizCard key={i} question={q} index={i} />
      ))}
    </div>
  );
}

function QuizCard({
  question,
  index,
}: {
  question: Question;
  index: number;
}) {
  // null = no respondida, string = opción elegida (multiple choice),
  // 'shown' = respuesta abierta revelada
  const [picked, setPicked] = useState<string | null>(null);
  const [shown, setShown] = useState(false);

  const hasOptions = question.options && question.options.length > 0;
  const isAnswered = hasOptions ? picked !== null : shown;

  const handleReset = () => {
    setPicked(null);
    setShown(false);
  };

  return (
    <article className="glass shadow-card-premium overflow-hidden rounded-3xl p-5 sm:p-6">
      {/* Prompt */}
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className="bg-gradient-primary shadow-button-premium grid h-9 w-9 shrink-0 place-items-center rounded-xl text-sm font-semibold text-white"
        >
          {index + 1}
        </span>
        <p className="flex-1 pt-1 text-base font-medium leading-relaxed text-white">
          {question.prompt}
        </p>
      </div>

      {/* Options o botón "Ver respuesta" */}
      {hasOptions ? (
        <div className="mt-4 flex flex-col gap-2">
          {question.options!.map((opt) => {
            const isCorrect = opt === question.correct;
            const isPicked = opt === picked;
            const showState = isAnswered;

            return (
              <button
                key={opt}
                type="button"
                onClick={() => !isAnswered && setPicked(opt)}
                disabled={isAnswered}
                aria-pressed={isPicked}
                className={cn(
                  'flex items-start gap-3 rounded-2xl px-4 py-3 text-left text-sm transition-all',
                  // Antes de responder
                  !showState &&
                    'glass text-white/85 hover:bg-white/[0.18] hover:text-white',
                  // Después de responder
                  showState &&
                    isCorrect &&
                    'border border-emerald-400/50 bg-emerald-500/15 text-emerald-50',
                  showState &&
                    !isCorrect &&
                    isPicked &&
                    'border border-red-400/50 bg-red-500/15 text-red-50',
                  showState &&
                    !isCorrect &&
                    !isPicked &&
                    'glass text-white/55 opacity-60',
                  isAnswered && 'cursor-default',
                )}
              >
                {showState && isCorrect && (
                  <Check
                    aria-hidden
                    className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300"
                  />
                )}
                {showState && !isCorrect && isPicked && (
                  <X
                    aria-hidden
                    className="mt-0.5 h-4 w-4 shrink-0 text-red-300"
                  />
                )}
                <span className="flex-1">{opt}</span>
              </button>
            );
          })}
        </div>
      ) : (
        !shown && (
          <button
            type="button"
            onClick={() => setShown(true)}
            className="glass mt-4 flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium text-white transition-all hover:bg-white/[0.18]"
          >
            <ChevronDown aria-hidden className="h-4 w-4" />
            Ver respuesta
          </button>
        )
      )}

      {/* Reveal: respuesta + justificación */}
      {isAnswered && (
        <div className="animate-fade-up mt-4 space-y-2 border-t border-white/15 pt-4">
          {question.correct && (
            <div className="text-sm">
              <span className="font-semibold text-emerald-300">
                ✓ Respuesta correcta:
              </span>{' '}
              <span className="text-white">{question.correct}</span>
            </div>
          )}
          <div className="text-sm leading-relaxed text-white/85">
            <span className="font-semibold text-white">Justificación:</span>{' '}
            {question.justification}
          </div>
          {hasOptions && (
            <button
              type="button"
              onClick={handleReset}
              className="mt-2 text-xs text-primary-glow underline underline-offset-2 hover:text-white"
            >
              Reintentar pregunta
            </button>
          )}
        </div>
      )}
    </article>
  );
}
