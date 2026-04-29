import Anthropic from '@anthropic-ai/sdk';
import { env } from '@/lib/env';

// La validación de ANTHROPIC_API_KEY (formato sk-ant-*) ocurre en lib/env.ts
// al primer import. Si falla, fail-fast con mensaje descriptivo.
export const anthropic = new Anthropic({
  apiKey: env.ANTHROPIC_API_KEY,
});

/**
 * Modelos Claude — IDs verificados oficiales (2026).
 * Usar alias "claude-sonnet-4-6" / "claude-haiku-4-5" mapea al snapshot estable.
 * Si querés fijar a un snapshot específico para que NO cambie, usar el ID con fecha.
 */
export const CLAUDE_SONNET = 'claude-sonnet-4-6';
export const CLAUDE_HAIKU = 'claude-haiku-4-5';
