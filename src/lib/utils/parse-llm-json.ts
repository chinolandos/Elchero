/**
 * Parser robusto para extraer JSON de respuestas de LLMs.
 *
 * Resuelve hallazgo M-D del audit Días 1-4:
 *   detect.ts usaba `rawText.match(/\{[\s\S]*\}/)` que falla si hay `}`
 *   dentro de strings del JSON (ej: `"texto con } brace"`). generate.ts
 *   usaba un patrón mejor (firstBrace/lastBrace) — unificamos los dos
 *   para consistencia.
 *
 * Estrategia:
 *   1. Trim el texto crudo
 *   2. Buscar primer `{` y último `}` (cubre wrapper ```json...``` y texto extra)
 *   3. JSON.parse del slice
 *   4. Si parse falla, throw con preview del inicio y final para debugging
 */

export interface ParseLLMJsonResult {
  ok: boolean;
  parsed?: unknown;
  error?: {
    reason: 'no_json_found' | 'parse_failed';
    message: string;
    previewStart?: string;
    previewEnd?: string;
  };
}

export function parseLLMJson(rawText: string): ParseLLMJsonResult {
  const trimmed = rawText.trim();

  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return {
      ok: false,
      error: {
        reason: 'no_json_found',
        message: 'El LLM no devolvió un objeto JSON.',
        previewStart: trimmed.slice(0, 200),
      },
    };
  }

  const jsonText = trimmed.slice(firstBrace, lastBrace + 1);

  try {
    const parsed = JSON.parse(jsonText);
    return { ok: true, parsed };
  } catch (err) {
    return {
      ok: false,
      error: {
        reason: 'parse_failed',
        message: err instanceof Error ? err.message : 'JSON parse error',
        previewStart: jsonText.slice(0, 200),
        previewEnd: jsonText.slice(Math.max(0, jsonText.length - 200)),
      },
    };
  }
}
