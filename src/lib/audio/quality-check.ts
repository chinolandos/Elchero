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
 *
 * Notas de regex:
 *   - NO usamos \b al final porque palabras tipo "jajajajajaj" (con `j`
 *     final sin `a`) o "jajajajajaja" no tienen word boundary "limpio"
 *     entre las repeticiones — todo es word chars contiguos. El \b final
 *     hacía que el match no disparase correctamente.
 *   - Usamos lookbehind/lookahead "no-word" `(?:^|[^a-záéíóú])` para
 *     anclar el inicio sin requerir boundary final problemático.
 *   - Cobertura: "jaja", "jajaja", "jajajajajaja", "ja ja ja", "JAJAJA",
 *     "Jajaja", igual para je/ji.
 */
const LAUGHTER_PATTERNS = [
  /(?:^|\W)j[ae]+(?:\s*j[ae]+)+/gi, // ja+, je+, jaja, jeje, jajaja, ja ja, etc
  /(?:^|\W)ji+(?:\s*ji+)+/gi, // jiji, ji ji
  /(?:^|\W)ha+(?:\s*ha+){1,}/gi, // hahaha (inglés/escrito alterno)
];

/**
 * Muletillas / filler words / interjecciones de duda.
 * Sin \b al final por la misma razón que arriba.
 */
const FILLER_PATTERNS = [
  /(?:^|\W)eh+(?:\W|$)/gi,
  /(?:^|\W)ah+(?:\W|$)/gi,
  /(?:^|\W)um+(?:\W|$)/gi,
  /(?:^|\W)oh+(?:\W|$)/gi,
  /(?:^|\W)mm+(?:\W|$)/gi,
  /(?:^|\W)este\s+\.{3}/gi, // "este..."
  /\bes\s+que\b/gi,
  /\bo\s+sea\b/gi,
  /\bdigamos\b/gi,
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

  // Cálculo del score (0-100, mayor = más limpio).
  // Ratios relativos al wordCount para no penalizar audios largos.
  // Las constantes están afinadas con el caso real:
  //   - Audio "jajajajaja eh eh" (~10 palabras) con 3 risas + 2 muletillas
  //     debe dar score ~40 (very_noisy o noisy fuerte)
  //   - Audio limpio sin risas debe quedar >85
  const laughterRatio = laughterCount / Math.max(1, wordCount / 50); // por 50 palabras (más sensible)
  const fillerRatio = fillerCount / Math.max(1, wordCount / 50);

  // Penalizaciones — las risas pesan fuerte porque son señal clara de ruido
  let score = 100;
  score -= Math.min(60, laughterRatio * 15); // laughter peso aumentado (era 8)
  score -= Math.min(35, fillerRatio * 7); // fillers peso aumentado (era 4)
  score -= Math.min(40, repetitionCount * 8); // repetitions peso aumentado (era 5)
  score -= Math.max(0, (shortWordsRatio - 0.55) * 100);
  // Bonus penalty si hay AMBAS risas y fillers (señal compuesta)
  if (laughterCount > 0 && fillerCount > 0) {
    score -= 10;
  }
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
