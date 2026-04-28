import { z } from 'zod';
import { anthropic, CLAUDE_SONNET } from './client';
import type {
  CheroNote,
  DetectedContext,
  UserProfile,
} from '@/lib/types/chero';
import { createLogger } from '@/lib/logger';
import kbData from '@/lib/kb/system-prompt.json';

const log = createLogger('anthropic/generate');

// El KB se carga al inicio del módulo (frío del primer request).
// Después está en memoria, listo para ser inyectado como system prompt cacheado.
const SYSTEM_PROMPT = kbData.content as string;
const KB_BUILT_AT = kbData.built_at as string;

// ─── Schemas de validación del output de Claude ───
const QuestionSchema = z.object({
  type: z.enum([
    'multiple_choice',
    'open',
    'completion',
    'problem',
    'essay',
    'case',
  ]),
  prompt: z.string(),
  options: z.array(z.string()).nullable(),
  correct: z.string().nullable(),
  justification: z.string(),
});

const NoteSchema = z.object({
  summary: z.string().min(50),
  concepts: z
    .array(
      z.object({
        name: z.string(),
        definition: z.string(),
        example: z.string(),
      }),
    )
    .min(3),
  questions: z.array(QuestionSchema).min(5),
  flashcards: z
    .array(z.object({ front: z.string(), back: z.string() }))
    .min(5),
  quick_review: z.string().min(20),
  mermaid_chart: z.string().nullable(),
});

export interface GenerateNotesInput {
  transcript: string;
  detected: DetectedContext;
  profile: Partial<UserProfile>;
}

export interface GenerateNotesResult {
  note: CheroNote;
  cost_usd: number;
  cache_hit: boolean;
  input_tokens: number;
  output_tokens: number;
  cache_read_tokens: number;
  cache_write_tokens: number;
  elapsed_ms: number;
}

/**
 * Genera el apunte completo usando Claude Sonnet 4.6 con prompt caching.
 *
 * El system prompt (KB de ~10K tokens) se cachea automáticamente con `cache_control: ephemeral`.
 * Esto da:
 *   - 1ra llamada: cache write (cuesta 1.25x el precio normal de input)
 *   - Siguientes llamadas en <5min: cache read (90% descuento)
 *
 * Para 50 usos esperados: ~5 cache writes + 45 cache reads.
 *
 * Costo estimado por llamada (con cache hit):
 *   - Input cached (~10K KB tokens): $0.003 (vs $0.030 sin cache)
 *   - Input fresh (transcript ~3K + user prompt ~0.5K): $0.011
 *   - Output (~10K-15K tokens): $0.150-0.225
 *   - Total: ~$0.16-0.24 por apunte
 */
export async function generateNotes(
  input: GenerateNotesInput,
): Promise<GenerateNotesResult> {
  const startedAt = Date.now();

  const userPrompt = buildUserPrompt(input);

  log.debug('Generating notes', {
    mode: input.detected.mode,
    subject: input.detected.subject,
    transcript_chars: input.transcript.length,
  });

  let response;
  try {
    response = await anthropic.messages.create({
      model: CLAUDE_SONNET,
      max_tokens: 8000,
      system: [
        {
          type: 'text',
          text: SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [{ role: 'user', content: userPrompt }],
    });
  } catch (err) {
    log.error('Claude Sonnet call failed', {
      err: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }

  const textBlock = response.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('Claude no devolvió respuesta de texto');
  }

  const rawText = textBlock.text.trim();
  // Claude puede responder con markdown wrapper ```json ... ```
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    log.error('No JSON found in Claude response', {
      preview: rawText.slice(0, 200),
    });
    throw new Error('Claude no devolvió JSON válido');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch {
    throw new Error('JSON malformado en respuesta de Claude');
  }

  const validated = NoteSchema.safeParse(parsed);
  if (!validated.success) {
    log.error('Note schema validation failed', {
      issues: validated.error.issues.slice(0, 5),
    });
    throw new Error(
      `Estructura del apunte inválida: ${validated.error.issues
        .slice(0, 3)
        .map((i) => `${i.path.join('.')}: ${i.message}`)
        .join('; ')}`,
    );
  }

  const usage = response.usage;
  const inputTokens = usage.input_tokens ?? 0;
  const outputTokens = usage.output_tokens ?? 0;
  const cacheReadTokens = usage.cache_read_input_tokens ?? 0;
  const cacheWriteTokens = usage.cache_creation_input_tokens ?? 0;

  // Pricing Claude Sonnet 4.6 (USD por 1M tokens):
  //   input fresh:     $3.00
  //   input cached:    $0.30 (90% off)
  //   cache write:     $3.75 (1.25x)
  //   output:          $15.00
  const costUsd =
    (inputTokens * 3.0) / 1_000_000 +
    (cacheReadTokens * 0.3) / 1_000_000 +
    (cacheWriteTokens * 3.75) / 1_000_000 +
    (outputTokens * 15.0) / 1_000_000;

  const cacheHit = cacheReadTokens > 0;
  const elapsedMs = Date.now() - startedAt;

  log.info('Notes generated', {
    mode: input.detected.mode,
    cache_hit: cacheHit,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    cache_read: cacheReadTokens,
    cache_write: cacheWriteTokens,
    cost_usd: costUsd.toFixed(4),
    elapsed_ms: elapsedMs,
    kb_built_at: KB_BUILT_AT,
  });

  return {
    note: validated.data,
    cost_usd: costUsd,
    cache_hit: cacheHit,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    cache_read_tokens: cacheReadTokens,
    cache_write_tokens: cacheWriteTokens,
    elapsed_ms: elapsedMs,
  };
}

function buildUserPrompt(input: GenerateNotesInput): string {
  const { transcript, detected, profile } = input;

  return `# Generá apuntes para este audio

## Contexto detectado
- **Modo:** ${detected.mode}
- **Materia:** ${detected.subject}
- **Institución:** ${detected.institution ?? 'N/A'}
- **Año:** ${detected.year ?? 'N/A'}
- **Tema:** ${detected.topic}
- **Confianza:** ${detected.confidence}/100

## Perfil del estudiante
- **Tipo:** ${profile.user_type ?? 'desconocido'}
- **Institución:** ${profile.institution ?? 'desconocida'}
- **Año:** ${profile.year ?? 'desconocido'}
- **Carrera:** ${profile.career ?? 'N/A'}
- **Materias actuales:** ${profile.subjects?.join(', ') ?? 'desconocidas'}

## Transcripción del audio

${transcript}

---

# Instrucciones

Generá el apunte completo siguiendo el formato del modo "${detected.mode}".
Devolvé SOLAMENTE JSON válido, sin texto antes ni después, sin markdown wrapper.

Estructura requerida:
\`\`\`json
{
  "summary": "string (3-5 párrafos en español salvadoreño con voseo)",
  "concepts": [
    { "name": "string", "definition": "string", "example": "string" }
  ],
  "questions": [
    {
      "type": "multiple_choice" | "open" | "completion" | "problem" | "essay" | "case",
      "prompt": "string",
      "options": ["A: ...", "B: ...", "C: ...", "D: ..."] | null,
      "correct": "A" | "B" | "C" | "D" | null,
      "justification": "string"
    }
  ],
  "flashcards": [
    { "front": "string", "back": "string" }
  ],
  "quick_review": "string (1-2 párrafos, lo absolutamente esencial)",
  "mermaid_chart": "graph TD\\n  A[Tema] --> B[Subtema]\\n  ..." | null
}
\`\`\`

Respetá las cantidades por modo según las reglas del system prompt.
Voseo natural ("vos podés", "tenés", "decime"). Cero mexicanismos/españolismos/argentinismos.
NO incluyas la fecha de hoy ni "Generado por Chero" en el contenido.`;
}
