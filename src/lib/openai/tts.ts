import { openai } from './client';

const TTS_MODEL = 'tts-1' as const;
type TtsVoice = 'nova' | 'echo' | 'alloy' | 'onyx' | 'shimmer' | 'fable';

const VALID_VOICES: TtsVoice[] = [
  'nova',
  'echo',
  'alloy',
  'onyx',
  'shimmer',
  'fable',
];

const MAX_TTS_CHARS = 4096;

export interface TtsResult {
  audio: ArrayBuffer;
  contentType: 'audio/mpeg';
  durationEstimateSeconds: number;
  costUsd: number;
  charsUsed: number;
}

export interface TtsInput {
  text: string;
  voice?: TtsVoice;
  speed?: number;
}

/**
 * Genera audio MP3 a partir de texto usando OpenAI TTS modelo `tts-1`.
 *
 * Pricing: $15 por 1M chars = $0.015 por 1K chars.
 * Para 50 audios × ~3K chars = $2.25 total.
 *
 * Voz default: 'nova' (femenina cálida, acento Latinoamericano).
 * Alternativas naturales para SV: 'echo' (masculina profesional).
 *
 * Velocidad: 0.25 a 4.0. Default 1.0.
 *
 * Límite OpenAI: 4096 caracteres por llamada.
 */
export async function generateTts(input: TtsInput): Promise<TtsResult> {
  const { text, voice = 'nova', speed = 1.0 } = input;

  if (!VALID_VOICES.includes(voice)) {
    throw new Error(`Voz inválida: ${voice}. Usá: ${VALID_VOICES.join(', ')}`);
  }

  const trimmed = text.trim();
  if (trimmed.length === 0) {
    throw new Error('Texto vacío. No hay nada que sintetizar.');
  }

  const truncated = trimmed.slice(0, MAX_TTS_CHARS);
  const charsUsed = truncated.length;

  const response = await openai.audio.speech.create({
    model: TTS_MODEL,
    voice,
    input: truncated,
    speed: Math.max(0.25, Math.min(4.0, speed)),
    response_format: 'mp3',
  });

  const audio = await response.arrayBuffer();

  // Estimación: ~150 wpm en español ≈ ~12 chars/sec a velocidad normal
  const durationEstimateSeconds = (charsUsed / 12) / speed;
  const costUsd = (charsUsed * 0.015) / 1000;

  return {
    audio,
    contentType: 'audio/mpeg',
    durationEstimateSeconds,
    costUsd,
    charsUsed,
  };
}

/**
 * Construye el texto que se va a leer en voz a partir del apunte.
 * Por defecto incluye solo Resumen + Conceptos clave + Repaso 30s
 * (las preguntas y flashcards quedan para lectura visual).
 */
export interface BuildTtsTextInput {
  summary: string;
  concepts: { name: string; definition: string; example?: string }[];
  quick_review: string;
  include_concepts?: boolean;
  include_examples?: boolean;
}

export function buildTtsText(input: BuildTtsTextInput): string {
  const {
    summary,
    concepts,
    quick_review,
    include_concepts = true,
    include_examples = false,
  } = input;

  const parts: string[] = [];

  parts.push(`Resumen del apunte. ${summary}`);

  if (include_concepts && concepts.length > 0) {
    const conceptsText = concepts
      .map((c) => {
        const ex = include_examples && c.example ? ` Por ejemplo: ${c.example}.` : '';
        return `${c.name}. ${c.definition}.${ex}`;
      })
      .join(' ');
    parts.push(`Conceptos clave. ${conceptsText}`);
  }

  parts.push(`Repaso de treinta segundos. ${quick_review}`);

  return parts.join('\n\n');
}
