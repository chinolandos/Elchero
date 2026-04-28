import { z } from 'zod';
import { anthropic, CLAUDE_HAIKU } from './client';
import type { DetectedContext, UserProfile } from '@/lib/types/chero';
import { createLogger } from '@/lib/logger';

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

REGLAS DE DETECCIÓN:
- Universitario → modo "parciales".
- Bachiller 2° año + materia AVANZO (Precálculo, Ciudadanía y Valores, Ciencia y Tecnología, Lenguaje y Literatura, Inglés):
  - Si faltan ≤90 días para AVANZO de octubre → modo "avanzo"
  - Si faltan >90 días → modo "periodo" (preparándose en períodos normales)
- Bachiller 1° año o tercer ciclo → modo "periodo".
- Si la transcripción es claramente una sesión de tutoría o repaso libre → modo "repaso".
- Si la materia detectada NO está en las materias actuales del perfil → bajar confianza significativamente.

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

  const userPrompt = `FECHA ACTUAL: ${today.toISOString().slice(0, 10)}
DÍAS HASTA PRÓXIMO AVANZO (28 oct): ${daysUntilAvanzo}

PERFIL DEL USUARIO:
- Tipo: ${profile.user_type ?? 'desconocido'}
- Institución: ${profile.institution ?? 'desconocida'}
- Año: ${profile.year ?? 'desconocido'}
- Carrera: ${profile.career ?? 'N/A'}
- Materias actuales: ${profile.subjects?.join(', ') ?? 'desconocidas'}

PRIMERAS PALABRAS DEL AUDIO (transcripción):
${transcriptSnippet.slice(0, 1500)}`;

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

  // Extraer JSON: Claude puede responder con markdown ```json ... ```, texto antes, etc.
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    log.error('No JSON found in Claude response', { rawText });
    throw new Error(`Claude devolvió respuesta sin JSON: ${rawText.slice(0, 200)}`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch (err) {
    log.error('JSON parse failed', { match: jsonMatch[0], err });
    throw new Error('JSON inválido en respuesta de Claude');
  }

  const validated = DetectSchema.safeParse(parsed);
  if (!validated.success) {
    log.error('Schema validation failed', {
      issues: validated.error.issues,
      parsed,
    });
    throw new Error(
      `Estructura de respuesta inválida: ${validated.error.issues.map((i) => i.message).join(', ')}`,
    );
  }

  log.info('Detected context', {
    mode: validated.data.mode,
    subject: validated.data.subject,
    confidence: validated.data.confidence,
    daysUntilAvanzo,
  });

  return validated.data;
}
