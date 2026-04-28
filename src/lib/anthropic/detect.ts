import { z } from 'zod';
import { anthropic, CLAUDE_HAIKU } from './client';
import type { DetectedContext, UserProfile } from '@/lib/types/chero';

const DetectSchema = z.object({
  mode: z.enum(['avanzo', 'periodo', 'parciales', 'repaso']),
  subject: z.string(),
  institution: z.string().nullable(),
  year: z.number().int().min(1).max(5).nullable(),
  topic: z.string(),
  confidence: z.number().int().min(0).max(100),
});

const SYSTEM_PROMPT = `Sos un asistente que detecta el contexto académico de una transcripción de clase.

Tu trabajo: identificar materia, modo (AVANZO / Período / Parciales / Repaso) y nivel de confianza, considerando:
- Las primeras palabras del audio
- El perfil del usuario (institución, año, materias actuales)

REGLAS:
- Si el usuario es bachiller (1° o 2°) y el audio es de una materia AVANZO (Precálculo, Ciudadanía y Valores, Ciencia y Tecnología, Lenguaje y Literatura, Inglés) → modo "avanzo" si está cerca de la prueba (oct), o "periodo" si está en un período evaluativo normal.
- Si el usuario es universitario → modo "parciales".
- Si la materia detectada NO está en las materias actuales del perfil → bajar confianza.

DEVOLVÉ SOLAMENTE JSON con esta estructura exacta, nada más:
{
  "mode": "avanzo" | "periodo" | "parciales" | "repaso",
  "subject": "Microeconomía",
  "institution": "ESEN" | null,
  "year": 1-5 | null,
  "topic": "Elasticidad precio de la demanda",
  "confidence": 0-100
}

Si no estás seguro de algo, ponelo como null. Si la confianza es <85, mejor pedir confirmación.`;

/**
 * Detecta materia/modo del audio usando Claude Haiku.
 * Costo: ~$0.0005 por llamada.
 */
export async function detectContext(
  transcriptSnippet: string,
  profile: Partial<UserProfile>,
): Promise<DetectedContext> {
  const userPrompt = `Perfil del usuario:
- Tipo: ${profile.user_type ?? 'desconocido'}
- Institución: ${profile.institution ?? 'desconocida'}
- Año: ${profile.year ?? 'desconocido'}
- Carrera: ${profile.career ?? 'N/A'}
- Materias actuales: ${profile.subjects?.join(', ') ?? 'desconocidas'}

Primeras palabras del audio (transcripción):
${transcriptSnippet.slice(0, 1500)}`;

  const response = await anthropic.messages.create({
    model: CLAUDE_HAIKU,
    max_tokens: 300,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const textBlock = response.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('Claude no devolvió respuesta de texto');
  }

  // Extraer JSON de la respuesta (puede venir con markdown ```json ... ```)
  const rawText = textBlock.text.trim();
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(`No se encontró JSON en la respuesta de Claude: ${rawText}`);
  }

  const parsed = JSON.parse(jsonMatch[0]);
  const validated = DetectSchema.parse(parsed);

  return validated;
}
