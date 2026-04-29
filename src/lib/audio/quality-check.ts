/**
 * Heurística determinística para detectar calidad de transcripción.
 *
 * Se ejecuta después de Whisper, antes de Sonnet. Si detecta demasiado ruido
 * (risas, muletillas, repeticiones), avisa al user para que decida si gastar
 * el procesamiento de Sonnet (~$0.10) o regrabar.
 *
 * NO usa LLM — pura regex y conteo de palabras. Costo: 0.
 */

export type QualityVerdict = 'clean' | 'noisy' | 'very_noisy';

export interface QualityReport {
  verdict: QualityVerdict;
  /** 0-100 (mayor = más limpio). */
  score: number;
  /** Indicadores específicos detectados. */
  signals: string[];
  /** Conteo de cada tipo de ruido. */
  counts: {
    laughter: number;
    fillers: number;
    repetitions: number;
    short_words_ratio: number;
  };
  /** Mensaje sugerido para mostrar al user. */
  message: string;
  /** Total chars del transcript. */
  totalChars: number;
}

/**
 * Patrones que indican ruido / no-academia.
 * Los conteos se ponderan por su frecuencia relativa al texto.
 */
const LAUGHTER_PATTERNS = [
  /\bja+\s*ja+(\s*ja+)*\b/gi, // ja, jaja, jajaja, ja ja ja
  /\bje+\s*je+\b/gi, // jeje, je je
  /\bji+\s*ji+\b/gi, // jiji
];

const FILLER_PATTERNS = [
  /\beh+\b/gi,
  /\bah+\b/gi,
  /\bum+\b/gi,
  /\boh+\b/gi,
  /\bmm+\b/gi,
  /\bes\s+que\b/gi,
  /\bo\s+sea\b/gi, // muletilla común
];

/**
 * Detecta repeticiones inmediatas de la misma palabra (Whisper a veces
 * loop-ea al perder el audio).
 * Ej: "el el el", "la la la", "no no no no".
 */
const REPETITION_PATTERN = /\b(\w+)\s+\1(\s+\1){2,}\b/gi;

const SHORT_WORD_THRESHOLD = 3; // palabras de 1-3 chars

/**
 * Analiza el transcript y devuelve verdict + mensaje accionable.
 *
 * Reglas (afinables):
 *   - clean (score > 70): pocos indicadores, listo para Sonnet
 *   - noisy (40 <= score <= 70): alguna risa o muletillas, avisar pero sin bloquear
 *   - very_noisy (score < 40): muchísimo ruido, recomendar regrabar
 */
export function analyzeTranscriptQuality(transcript: string): QualityReport {
  const text = transcript.trim();
  const totalChars = text.length;

  if (totalChars < 50) {
    return {
      verdict: 'very_noisy',
      score: 0,
      signals: ['transcript_too_short'],
      counts: { laughter: 0, fillers: 0, repetitions: 0, short_words_ratio: 0 },
      message: 'La transcripción salió muy corta — el audio tal vez no tiene voz clara o es demasiado breve.',
      totalChars,
    };
  }

  const words = text.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  // Conteos
  let laughterCount = 0;
  for (const pattern of LAUGHTER_PATTERNS) {
    const matches = text.match(pattern);
    if (matches) laughterCount += matches.length;
  }

  let fillerCount = 0;
  for (const pattern of FILLER_PATTERNS) {
    const matches = text.match(pattern);
    if (matches) fillerCount += matches.length;
  }

  const repetitionMatches = text.match(REPETITION_PATTERN);
  const repetitionCount = repetitionMatches?.length ?? 0;

  const shortWords = words.filter((w) => w.length <= SHORT_WORD_THRESHOLD);
  const shortWordsRatio = shortWords.length / Math.max(1, wordCount);

  // Cálculo del score (0-100, mayor = más limpio)
  // Ratios relativos al wordCount para no penalizar audios largos
  const laughterRatio = laughterCount / Math.max(1, wordCount / 100); // por 100 palabras
  const fillerRatio = fillerCount / Math.max(1, wordCount / 100);

  // Penalizaciones (cada tipo descuenta puntos)
  let score = 100;
  score -= Math.min(40, laughterRatio * 8); // laughter pesa fuerte
  score -= Math.min(25, fillerRatio * 4); // fillers pesan medio
  score -= Math.min(25, repetitionCount * 5); // repeticiones pesan fuerte (Whisper looping)
  score -= Math.max(0, (shortWordsRatio - 0.55) * 100); // si >55% de palabras son cortas, penaliza
  score = Math.max(0, Math.round(score));

  // Signals para debug y UI
  const signals: string[] = [];
  if (laughterCount > 0) signals.push(`risas x${laughterCount}`);
  if (fillerCount > 0) signals.push(`muletillas x${fillerCount}`);
  if (repetitionCount > 0) signals.push(`repeticiones x${repetitionCount}`);
  if (shortWordsRatio > 0.55) signals.push('demasiadas palabras cortas');

  // Verdict
  let verdict: QualityVerdict;
  let message: string;
  if (score >= 70) {
    verdict = 'clean';
    message = 'Audio limpio — generamos el apunte directo.';
  } else if (score >= 40) {
    verdict = 'noisy';
    const parts: string[] = [];
    if (laughterCount > 5) parts.push(`detectamos risas`);
    if (fillerCount > 10) parts.push(`hay varias muletillas`);
    if (repetitionCount > 0) parts.push(`Whisper repitió palabras (puede haber perdido audio)`);
    const detail = parts.length > 0 ? ` Notamos que ${parts.join(' y ')}.` : '';
    message = `El audio tiene algo de ruido pero el LLM va a filtrarlo bien.${detail} ¿Generamos igual?`;
  } else {
    verdict = 'very_noisy';
    message =
      'El audio tiene mucho ruido (risas, repeticiones, muletillas) y el apunte puede salir con huecos. Recomendamos regrabar más cerca del profe o en un momento con menos bulla.';
  }

  return {
    verdict,
    score,
    signals,
    counts: {
      laughter: laughterCount,
      fillers: fillerCount,
      repetitions: repetitionCount,
      short_words_ratio: Math.round(shortWordsRatio * 100) / 100,
    },
    message,
    totalChars,
  };
}
