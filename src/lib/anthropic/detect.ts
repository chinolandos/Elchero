import { z } from 'zod';
import { anthropic, CLAUDE_HAIKU } from './client';
import type { DetectedContext, UserProfile } from '@/lib/types/chero';
import { createLogger } from '@/lib/logger';
import { parseLLMJson } from '@/lib/utils/parse-llm-json';

const log = createLogger('anthropic/detect');

const DetectSchema = z.object({
  mode: z.enum(['avanzo', 'periodo', 'parciales', 'repaso']),
  subject: z.string(),
  institution: z.string().nullable(),
  year: z.number().int().min(1).max(5).nullable(),
  topic: z.string(),
  confidence: z.number().int().min(0).max(100),
});

const SYSTEM_PROMPT = `Sos un asistente que detecta el contexto académico de una transcripción de clase salvadoreña.

Tu trabajo: identificar materia, modo (AVANZO / Período / Parciales / Repaso) y nivel de confianza.

CONTEXTO DEL SISTEMA EDUCATIVO SV:
- Bachillerato: 2 años (1° y 2°). Tiene 4 períodos evaluativos.
- AVANZO: prueba nacional MINED para 2° año bachillerato. Se aplica el 28-29 de octubre cada año.
- Universidades: ESEN, UCA, UES, UDB, UEES, UFG, UTEC, UNICAES, UJMD. Sistema de parciales por semestre.

REGLAS DE DETECCIÓN (en orden de prioridad):

REGLA 0 — MENCIONES EXPLÍCITAS DEL HABLANTE (sobreescriben TODO lo demás):
- Si el audio menciona literalmente "AVANZO", "para AVANZO", "entra en AVANZO" → modo "avanzo" con confianza ≥85.
- Si menciona "primer/segundo/tercer/cuarto período", "examen de período" → modo "periodo" con confianza ≥85.
- Si menciona "parcial", "parciales", "examen parcial" → modo "parciales" con confianza ≥85.
- Si menciona "repaso", "tutoría", "estoy estudiando por mi cuenta" → modo "repaso" con confianza ≥80.
- Las menciones explícitas SIEMPRE ganan, aunque el perfil diga otra cosa. El hablante sabe para qué está estudiando.

REGLA 1 — INFERENCIA POR PERFIL (solo si NO hay mención explícita):
- Universitario → modo "parciales".
- Bachiller 2° año + materia AVANZO (Precálculo, Ciudadanía y Valores, Ciencia y Tecnología, Lenguaje y Literatura, Inglés, Estudios Sociales, Matemática, Ciencias Naturales):
  - Si faltan ≤90 días para AVANZO de octubre → modo "avanzo"
  - Si faltan >90 días → modo "periodo"
- Bachiller 1° año o tercer ciclo → modo "periodo".
- Sin perfil claro y materia clásica de bachillerato → modo "repaso".

REGLA 2 — CONFIANZA:
- Subject debe coincidir con tema real del audio (no inventes).
- Si la materia detectada NO está en las materias actuales del perfil → bajar confianza ~20 puntos.
- Confianza alta (≥85) solo si: hay mención explícita del modo, O el audio + perfil coinciden claramente.

DEVOLVÉ SOLAMENTE JSON con esta estructura exacta, sin texto antes ni después, sin markdown:
{
  "mode": "avanzo" | "periodo" | "parciales" | "repaso",
  "subject": "Microeconomía",
  "institution": "ESEN" | null,
  "year": 1-5 | null,
  "topic": "Elasticidad precio de la demanda",
  "confidence": 0-100
}

Si no estás seguro de algo, ponelo como null. Si la confianza es <85, marcala así para que el frontend pida confirmación.`;

/**
 * Detecta materia/modo del audio usando Claude Haiku.
 * Costo: ~$0.0005 por llamada.
 */
export async function detectContext(
  transcriptSnippet: string,
  profile: Partial<UserProfile>,
): Promise<DetectedContext> {
  // Cálculo de días hasta el AVANZO más próximo (28 octubre del año actual o siguiente)
  const today = new Date();
  const currentYear = today.getUTCFullYear();
  const avanzoThisYear = new Date(Date.UTC(currentYear, 9, 28)); // 9 = octubre
  const avanzoNextYear = new Date(Date.UTC(currentYear + 1, 9, 28));
  const nextAvanzo = today <= avanzoThisYear ? avanzoThisYear : avanzoNextYear;
  const daysUntilAvanzo = Math.floor(
    (nextAvanzo.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );

  // Audit fix A-C: pasamos hasta 4000 chars (~10 min de habla) en vez de 1500.
  // Antes Haiku solo veía el inicio del audio — si la clase comenzaba con
  // saludo/avisos y el contenido real arrancaba después del minuto 2, el LLM
  // subestimaba el subject. 4000 chars cubren la mayoría de los casos
  // manteniendo Haiku rápido (latencia ~1-2s).
  const userPrompt = `FECHA ACTUAL: ${today.toISOString().slice(0, 10)}
DÍAS HASTA PRÓXIMO AVANZO (28 oct): ${daysUntilAvanzo}

PERFIL DEL USUARIO:
- Tipo: ${profile.user_type ?? 'desconocido'}
- Institución: ${profile.institution ?? 'desconocida'}
- Año: ${profile.year ?? 'desconocido'}
- Carrera: ${profile.career ?? 'N/A'}
- Materias actuales: ${profile.subjects?.join(', ') ?? 'desconocidas'}

TRANSCRIPCIÓN DEL AUDIO (primeros ~10 min):
${transcriptSnippet.slice(0, 4000)}`;

  let response;
  try {
    response = await anthropic.messages.create({
      model: CLAUDE_HAIKU,
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    });
  } catch (err) {
    log.error('Claude Haiku call failed', {
      err: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }

  const textBlock = response.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('Claude no devolvió respuesta de texto');
  }

  const rawText = textBlock.text.trim();

  // Audit fix M-D: usar parser robusto compartido (firstBrace/lastBrace).
  // Antes: regex /\{[\s\S]*\}/ que falla si hay `}` dentro de strings del JSON.
  const parseResult = parseLLMJson(rawText);
  if (!parseResult.ok) {
    log.error('LLM JSON parse failed', {
      reason: parseResult.error?.reason,
      message: parseResult.error?.message,
      previewStart: parseResult.error?.previewStart,
      previewEnd: parseResult.error?.previewEnd,
    });
    throw new Error(
      parseResult.error?.reason === 'no_json_found'
        ? `Claude devolvió respuesta sin JSON: ${rawText.slice(0, 200)}`
        : 'JSON inválido en respuesta de Claude',
    );
  }

  const validated = DetectSchema.safeParse(parseResult.parsed);
  if (!validated.success) {
    log.error('Schema validation failed', {
      issues: validated.error.issues,
      parsed: parseResult.parsed,
    });
    throw new Error(
      `Estructura de respuesta inválida: ${validated.error.issues.map((i) => i.message).join(', ')}`,
    );
  }

  // Override determinístico por menciones explícitas (más confiable que el LLM)
  const lower = transcriptSnippet.toLowerCase();
  const explicit = detectExplicitMode(lower);
  if (explicit && explicit !== validated.data.mode) {
    log.info('Mode override by explicit mention', {
      llm_said: validated.data.mode,
      explicit,
      llm_confidence: validated.data.confidence,
    });
    validated.data.mode = explicit;
    validated.data.confidence = Math.max(validated.data.confidence, 90);
  }

  log.info('Detected context', {
    mode: validated.data.mode,
    subject: validated.data.subject,
    confidence: validated.data.confidence,
    daysUntilAvanzo,
  });

  return validated.data;
}

/**
 * Busca menciones literales del modo en la transcripción.
 * Si el hablante dice "para AVANZO", "entra en AVANZO", etc., debería ser detectivo.
 */
function detectExplicitMode(
  text: string,
): 'avanzo' | 'periodo' | 'parciales' | null {
  // AVANZO: variantes "avanzo", "para avanzo", "entra en avanzo"
  if (/\bavanzo\b/.test(text)) return 'avanzo';
  // Período: "examen de período", "primer/segundo/tercer/cuarto período"
  if (/\b(primer|segundo|tercer|cuarto)\s+per[ií]odo\b/.test(text)) return 'periodo';
  if (/\bexamen\s+de\s+per[ií]odo\b/.test(text)) return 'periodo';
  // Parciales: "parcial", "parciales", "examen parcial"
  if (/\bparcial(es)?\b/.test(text)) return 'parciales';
  return null;
}
