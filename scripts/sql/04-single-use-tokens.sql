-- ─── Chero — Single-use process tokens + rate limit en regenerate (Audit Final) ───
-- Correr DESPUÉS de 01-schema.sql, 02-counter-rpcs.sql, 03-improvements.sql.
-- Idempotente: usa IF NOT EXISTS en todo.
--
-- Resuelve estos hallazgos de la auditoría final 3-rondas:
--   - C1: process_token era multi-use durante 15 min → ahora single-use
--   - C2: cancel podía refundir N veces → ahora 1 sola vez por token
--   - C3: regenerate sin rate limit → ahora max 5 por nota lifetime
--
-- Estrategia:
--   - Tabla `consumed_process_tokens` con token_hash como PK (UNIQUE garantiza
--     atomicidad bajo concurrencia)
--   - RPC `consume_token_atomic` que hace INSERT ... ON CONFLICT DO NOTHING.
--     Devuelve TRUE si era el primer uso (token consumido), FALSE si ya estaba.
--   - Cleanup: tokens >24h se borran por el cron diario (basta con TTL doble del
--     token's exp de 15 min, pero 24h cubre cualquier corner case)
--   - Columna `regenerate_count` en notes con CHECK (count <= 5)
--   - RPC `try_increment_regenerate` con UPDATE ... WHERE count < 5 atómico

-- ─── 1. Tabla consumed_process_tokens ───
CREATE TABLE IF NOT EXISTS public.consumed_process_tokens (
  -- SHA-256 del token completo (b64url payload + "." + b64url sig). 64 chars hex.
  token_hash TEXT PRIMARY KEY,
  consumed_by UUID REFERENCES auth.users ON DELETE CASCADE,
  consumed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- contexto opcional: 'generate_notes' | 'cancel' (debug/forensics)
  consumed_for TEXT
);

-- Índice por timestamp para que el cron de cleanup sea fast
CREATE INDEX IF NOT EXISTS consumed_tokens_consumed_at_idx
  ON public.consumed_process_tokens (consumed_at);

-- RLS: solo lectura para el dueño (debugging si lo necesitamos), no escritura.
-- Las RPCs SECURITY DEFINER hacen los inserts con privilegios elevados.
ALTER TABLE public.consumed_process_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own consumed tokens" ON public.consumed_process_tokens;
CREATE POLICY "Users can view own consumed tokens"
  ON public.consumed_process_tokens FOR SELECT
  USING (auth.uid() = consumed_by);

-- ─── 2. RPC: consume_token_atomic ───
-- Marca un token como consumido. Retorna TRUE si fue el primer uso (operación
-- exitosa, el caller puede continuar). Retorna FALSE si el token ya estaba
-- consumido (rechazar request — anti-abuso).
--
-- Atómico gracias a INSERT ... ON CONFLICT DO NOTHING + UNIQUE PK.
-- Bajo concurrencia, exactamente UN caller obtendrá TRUE; el resto FALSE.
CREATE OR REPLACE FUNCTION public.consume_token_atomic(
  p_token_hash TEXT,
  p_user_id UUID,
  p_consumed_for TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_inserted_hash TEXT;
BEGIN
  INSERT INTO public.consumed_process_tokens (token_hash, consumed_by, consumed_for)
  VALUES (p_token_hash, p_user_id, p_consumed_for)
  ON CONFLICT (token_hash) DO NOTHING
  RETURNING token_hash INTO v_inserted_hash;

  -- Si v_inserted_hash es NOT NULL, fuimos el primer caller en consumir.
  -- Si es NULL, el token ya estaba consumido (otro caller ganó).
  RETURN v_inserted_hash IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── 3. Columna regenerate_count en notes ───
-- max 5 regeneraciones por nota lifetime (anti-abuso $0.10/llamada Sonnet)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'notes'
      AND column_name = 'regenerate_count'
  ) THEN
    ALTER TABLE public.notes
      ADD COLUMN regenerate_count INT NOT NULL DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE constraint_name = 'notes_regenerate_count_max'
  ) THEN
    ALTER TABLE public.notes
      ADD CONSTRAINT notes_regenerate_count_max
      CHECK (regenerate_count >= 0 AND regenerate_count <= 5);
  END IF;
END $$;

-- ─── 4. RPC: try_increment_regenerate ───
-- Incrementa regenerate_count atómicamente si está bajo el límite.
-- Retorna NULL si ya alcanzó el límite (caller debe rechazar).
-- Retorna el nuevo count (1-5) si se incrementó OK.
--
-- Atómico gracias al UPDATE ... WHERE en una sola query.
CREATE OR REPLACE FUNCTION public.try_increment_regenerate(
  p_note_id UUID,
  p_user_id UUID,
  p_max INT DEFAULT 5
)
RETURNS INT AS $$
DECLARE
  v_new_count INT;
BEGIN
  UPDATE public.notes
  SET regenerate_count = regenerate_count + 1
  WHERE id = p_note_id
    AND user_id = p_user_id
    AND regenerate_count < p_max
  RETURNING regenerate_count INTO v_new_count;

  -- v_new_count es NULL si no actualizó (límite alcanzado o nota no existe/no es del user)
  RETURN v_new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── 5. Cleanup: borrar tokens consumidos antiguos ───
-- Cualquier token con >24h ya expiró (token TTL = 15 min). 24h da buffer para clock skew.
-- Llamado por el cron de cleanup-audios (que ya corre 1x/día).
CREATE OR REPLACE FUNCTION public.cleanup_consumed_tokens()
RETURNS INT AS $$
DECLARE
  v_deleted INT;
BEGIN
  DELETE FROM public.consumed_process_tokens
  WHERE consumed_at < NOW() - INTERVAL '24 hours';

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
