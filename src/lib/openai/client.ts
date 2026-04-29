import OpenAI from 'openai';
import { env } from '@/lib/env';

// La validación de OPENAI_API_KEY (formato sk-*) ocurre en lib/env.ts
// al primer import. Si falla, fail-fast con mensaje descriptivo.
export const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});
