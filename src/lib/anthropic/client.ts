import Anthropic from '@anthropic-ai/sdk';

if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error('ANTHROPIC_API_KEY no está configurada en environment');
}

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const CLAUDE_SONNET = 'claude-sonnet-4-6';
export const CLAUDE_HAIKU = 'claude-haiku-4-5-20251001';
