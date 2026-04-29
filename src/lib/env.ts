/**
 * Validación centralizada de variables de entorno.
 *
 * Resuelve hallazgo A-A de la auditoría 3-rondas Días 1-4:
 *   Antes usábamos `process.env.X!` (non-null assertion) en varios lados.
 *   Si una env var faltaba, runtime crash con error confuso (`undefined.split`)
 *   minutos después en vez de fail-fast al startup.
 *
 * Ahora: zod schema + parse al import. Si falta algo, throw inmediato con
 * mensaje claro indicando QUÉ env var falta y DÓNDE configurarla.
 *
 * Uso: importar desde server-side modules en lugar de leer process.env directo.
 *   import { env } from '@/lib/env';
 *   env.SUPABASE_URL  // siempre string, garantizado
 */

import { z } from 'zod';

const ServerEnvSchema = z.object({
  // Supabase (cliente y server)
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .url('NEXT_PUBLIC_SUPABASE_URL debe ser una URL válida'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(20, 'NEXT_PUBLIC_SUPABASE_ANON_KEY parece estar vacía o malformada'),

  // Server-only (NUNCA expuesto al cliente)
  SUPABASE_SECRET_KEY: z
    .string()
    .min(20, 'SUPABASE_SECRET_KEY parece vacía. Setear en Vercel Env Vars.'),

  // IA providers
  OPENAI_API_KEY: z
    .string()
    .startsWith('sk-', 'OPENAI_API_KEY debe empezar con "sk-"'),
  ANTHROPIC_API_KEY: z
    .string()
    .startsWith('sk-ant-', 'ANTHROPIC_API_KEY debe empezar con "sk-ant-"'),

  // Auth tokens
  PROCESS_TOKEN_SECRET: z.string().min(32).optional(),

  // Cron
  CRON_SECRET: z.string().min(16).optional(),

  // Beta limits (overrides opcionales)
  MAX_TOTAL_USES: z.coerce.number().int().positive().optional(),
  MAX_USES_PER_USER: z.coerce.number().int().positive().optional(),
});

export type ServerEnv = z.infer<typeof ServerEnvSchema>;

/**
 * Valida y parsea las env vars del server. Llama esta función al inicio
 * de cualquier módulo server-side (clients de Supabase, OpenAI, Anthropic).
 *
 * Si falla, throws Error con detalle de QUÉ falta. El build de Next.js
 * mostrará el error claro en lugar de un crash confuso a runtime.
 */
function loadServerEnv(): ServerEnv {
  const result = ServerEnvSchema.safeParse(process.env);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(
      `Variables de entorno inválidas o faltantes:\n${issues}\n\n` +
        `Configurá las que faltan en Vercel Dashboard → Settings → Environment Variables, ` +
        `o en el archivo .env.local para desarrollo.`,
    );
  }
  return result.data;
}

/**
 * Singleton — solo se valida 1 vez al primer import.
 * En Vercel, esto pasa al cold start de cada serverless function.
 */
export const env: ServerEnv = loadServerEnv();
