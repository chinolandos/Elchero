import { openai } from './client';
import { createLogger } from '@/lib/logger';

const log = createLogger('openai/moderate');

/**
 * Resultado de moderation de imagen con OpenAI.
 *
 * `omni-moderation-latest` (model) soporta texto + imagen.
 * Returns categorías flagged + scores 0-1 por cada una.
 */
export interface ModerateImageResult {
  flagged: boolean;
  /** Categorías que dispararon el flag. Vacío si flagged=false. */
  flaggedCategories: string[];
  /** Score más alto entre todas las categorías (0-1). */
  maxScore: number;
}

/**
 * Modera una imagen contra el catálogo de OpenAI Moderation API.
 *
 * Categorías que detecta:
 *   - sexual, sexual/minors (CSAM)
 *   - violence, violence/graphic
 *   - hate, hate/threatening
 *   - self-harm, self-harm/intent, self-harm/instructions
 *   - harassment, harassment/threatening
 *
 * Costo: GRATIS (Moderation API es free tier sin límite oficial).
 *
 * Si la API falla por completo (network/key inválida), por seguridad
 * REJECT el upload con error genérico — preferimos false positives
 * a content peligroso colándose.
 *
 * @param imageBuffer - ArrayBuffer del archivo de imagen
 * @param mimeType - mime type (ej: image/jpeg)
 */
export async function moderateImage(
  imageBuffer: ArrayBuffer,
  mimeType: string,
): Promise<ModerateImageResult> {
  // Convertir buffer a base64 data URL — formato que acepta OpenAI
  const base64 = Buffer.from(imageBuffer).toString('base64');
  const dataUrl = `data:${mimeType};base64,${base64}`;

  try {
    const response = await openai.moderations.create({
      model: 'omni-moderation-latest',
      input: [
        {
          type: 'image_url',
          image_url: { url: dataUrl },
        },
      ],
    });

    const result = response.results[0];
    if (!result) {
      // Edge case: API devolvió OK pero sin results. Reject por seguridad.
      log.warn('Moderation returned no results — rejecting');
      return {
        flagged: true,
        flaggedCategories: ['unknown'],
        maxScore: 1,
      };
    }

    // Encontrar categorías flagged
    const flaggedCategories: string[] = [];
    let maxScore = 0;
    const categories = result.categories as unknown as Record<string, boolean>;
    const scores = result.category_scores as unknown as Record<string, number>;

    for (const [cat, isFlagged] of Object.entries(categories)) {
      if (isFlagged) flaggedCategories.push(cat);
      const score = scores[cat] ?? 0;
      if (score > maxScore) maxScore = score;
    }

    if (result.flagged) {
      log.warn('Image moderation flagged', {
        categories: flaggedCategories,
        maxScore,
      });
    }

    return {
      flagged: result.flagged,
      flaggedCategories,
      maxScore,
    };
  } catch (err) {
    // Por seguridad: si la moderation API falla, REJECT el upload.
    // No queremos que un error de red deje pasar contenido sin moderar.
    log.error('Moderation API failed — rejecting upload as fallback', {
      err: err instanceof Error ? err.message : String(err),
    });
    return {
      flagged: true,
      flaggedCategories: ['moderation_unavailable'],
      maxScore: 1,
    };
  }
}

/**
 * Mensaje user-friendly según las categorías que se flagearon.
 * Para evitar revelar detalle del modelo, usamos mensajes genéricos.
 */
export function moderationErrorMessage(
  flaggedCategories: string[],
): string {
  if (
    flaggedCategories.includes('sexual') ||
    flaggedCategories.includes('sexual/minors')
  ) {
    return 'Esta imagen contiene contenido sexual o inapropiado. Subí otra foto.';
  }
  if (
    flaggedCategories.includes('violence') ||
    flaggedCategories.includes('violence/graphic')
  ) {
    return 'Esta imagen contiene violencia. Subí otra foto.';
  }
  if (
    flaggedCategories.includes('hate') ||
    flaggedCategories.includes('hate/threatening') ||
    flaggedCategories.includes('harassment')
  ) {
    return 'Esta imagen contiene contenido ofensivo. Subí otra foto.';
  }
  if (flaggedCategories.includes('self-harm')) {
    return 'Esta imagen contiene contenido sensible. Subí otra foto.';
  }
  if (flaggedCategories.includes('moderation_unavailable')) {
    return 'No pudimos verificar tu imagen. Probá de nuevo en un momento.';
  }
  return 'Esta imagen no es apropiada para el perfil. Subí otra foto.';
}
