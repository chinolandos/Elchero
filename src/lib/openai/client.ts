import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY no está configurada en environment');
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
