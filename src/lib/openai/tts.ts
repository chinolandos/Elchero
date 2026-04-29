import { openai } from './client';
import { createLogger } from '@/lib/logger';

const log = createLogger('openai/tts');

const TTS_MODEL = 'gpt-4o-mini-tts' as const;
type TtsVoice = 'nova' | 'echo' | 'alloy' | 'onyx' | 'shimmer' | 'fable' | 'coral' | 'sage';

const VALID_VOICES: TtsVoice[] = [
  'nova',
  'echo',
  'alloy',
  'onyx',
  'shimmer',
  'fable',
  'coral',
  'sage',
];

const MAX_TTS_CHARS = 4096;

const DEFAULT_INSTRUCTIONS =
  'Tono: profe joven salvadoreña explicando con calma y entusiasmo a un estudiante. ' +
  'Ritmo natural, no apurado. Pronunciación clara del español latinoamericano neutro. ' +
  'Cuando aparezca un concepto clave o número importante, marcalo con énfasis sutil. ' +
  'Pausá brevemente entre secciones del apunte. Cero monotonía, cero acento robótico.';

export interface TtsResult {
  audio: ArrayBuffer;
  contentType: 'audio/mpeg';
  durationEstimateSeconds: number;
  costUsd: number;
  charsUsed: number;
  /** true si el texto original superaba el límite de 4096 chars y fue cortado. */
  truncated: boolean;
  /** chars perdidos por truncado (0 si no se truncó). */
  truncatedChars: number;
}

export interface TtsInput {
  text: string;
  voice?: TtsVoice;
  speed?: number;
  instructions?: string;
}

/**
 * Genera audio MP3 a partir de texto usando OpenAI `gpt-4o-mini-tts`.
 *
 * Pricing: $0.015 por 1K chars (mismo que tts-1, pero mucho más natural).
 * Para 50 audios × ~3K chars = $2.25 total.
 *
 * Voz default: 'nova' (femenina cálida, acento Latinoamericano).
 * Alternativas: 'coral' (femenina expresiva), 'sage' (femenina profesional),
 *               'echo' (masculina), 'onyx' (masculina grave).
 *
 * Velocidad: 0.25 a 4.0. Default 1.0.
 *
 * `instructions`: prompt opcional para controlar tono, ritmo, énfasis.
 * Si no se pasa, usa DEFAULT_INSTRUCTIONS (profe salvadoreña explicando con calma).
 *
 * Límite OpenAI: 4096 caracteres por llamada.
 */
export async function generateTts(input: TtsInput): Promise<TtsResult> {
  const {
    text,
    voice = 'nova',
    speed = 1.0,
    instructions = DEFAULT_INSTRUCTIONS,
  } = input;

  if (!VALID_VOICES.includes(voice)) {
    throw new Error(`Voz inválida: ${voice}. Usá: ${VALID_VOICES.join(', ')}`);
  }

  const trimmed = text.trim();
  if (trimmed.length === 0) {
    throw new Error('Texto vacío. No hay nada que sintetizar.');
  }

  const truncated = trimmed.slice(0, MAX_TTS_CHARS);
  const charsUsed = truncated.length;
  const wasTruncated = trimmed.length > MAX_TTS_CHARS;
  if (wasTruncated) {
    log.warn('TTS input truncated', {
      original_chars: trimmed.length,
      truncated_to: MAX_TTS_CHARS,
      lost_chars: trimmed.length - MAX_TTS_CHARS,
    });
  }

  const response = await openai.audio.speech.create({
    model: TTS_MODEL,
    voice,
    input: truncated,
    instructions,
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
    truncated: wasTruncated,
    truncatedChars: wasTruncated ? trimmed.length - MAX_TTS_CHARS : 0,
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
