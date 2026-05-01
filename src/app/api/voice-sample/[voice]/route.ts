import { NextRequest, NextResponse } from 'next/server';
import { generateTts } from '@/lib/openai/tts';
import { createLogger } from '@/lib/logger';

const log = createLogger('api/voice-sample');

export const runtime = 'nodejs';

const VOICES = [
  'nova',
  'coral',
  'sage',
  'shimmer',
  'echo',
  'onyx',
] as const;
type SampleVoice = (typeof VOICES)[number];

/**
 * Texto de muestra por voz. Es una frase corta (~80 chars) que demuestra
 * la calidez/profundidad/expresividad de cada voz sin gastar mucho en TTS.
 *
 * Costo: ~80 chars × $0.015/1K = $0.0012 por generación. Pero como
 * cacheamos vía Cache-Control 30 días, después de la primera generación
 * todas las llamadas se sirven desde el edge de Vercel sin costo.
 */
const SAMPLES: Record<SampleVoice, string> = {
  nova: 'Hola, soy Nova. Voz cálida, recomendada para apuntes largos.',
  coral:
    'Hola, soy Coral. Voz expresiva, ideal para conceptos con énfasis.',
  sage: 'Hola, soy Sage. Voz profesional, perfecta para temas técnicos.',
  shimmer:
    'Hola, soy Shimmer. Voz suave, agradable para escuchar antes de dormir.',
  echo: 'Hola, soy Echo. Voz masculina profesional, clara y directa.',
  onyx: 'Hola, soy Onyx. Voz masculina grave, con presencia.',
};

/**
 * GET /api/voice-sample/[voice]
 *
 * Genera audio MP3 corto demostrando la voz pedida. La respuesta lleva
 * `Cache-Control: public, max-age=2592000, immutable` para que Vercel
 * Edge Cache la sirva 30 días sin re-generar.
 *
 * Resultado: primera llamada cuesta $0.0012, siguientes cero.
 *
 * NO valida auth — son samples públicos de marketing/UX y no exponen
 * datos del user. El endpoint se diseñó para ser cacheable agresivamente.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ voice: string }> },
) {
  const { voice } = await params;

  if (!VOICES.includes(voice as SampleVoice)) {
    return NextResponse.json(
      { error: 'invalid_voice', valid: VOICES },
      { status: 400 },
    );
  }

  const text = SAMPLES[voice as SampleVoice];

  try {
    const tts = await generateTts({
      text,
      voice: voice as SampleVoice,
      speed: 1.0,
      instructions:
        'Tono natural, amigable, claro. Pronunciación neutra del español latinoamericano. Ritmo normal.',
    });

    log.info('Voice sample generated', {
      voice,
      chars: tts.charsUsed,
      cost_usd: tts.costUsd,
    });

    return new Response(tts.audio, {
      headers: {
        'Content-Type': 'audio/mpeg',
        // Cache agresivo en edge (Vercel) y browser. Los samples nunca
        // cambian, así que immutable es seguro.
        'Cache-Control':
          'public, max-age=2592000, s-maxage=2592000, immutable',
      },
    });
  } catch (err) {
    log.error('Voice sample generation failed', {
      voice,
      err: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: 'tts_failed' },
      { status: 500 },
    );
  }
}
