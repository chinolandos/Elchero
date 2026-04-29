-- ─── Chero — Fix race condition en try_increment_usage (Audit Días 1-4) ───
-- Correr DESPUÉS de 04-single-use-tokens.sql.
-- Idempotente: CREATE OR REPLACE FUNCTION reescribe.
--
-- Resuelve hallazgo C-C de la auditoría 3-rondas Días 1-4:
--
-- BUG observado (lectura SQL):
--   try_increment_usage hacía:
--     1) SELECT total_uses FROM usage_counter WHERE id=1 FOR UPDATE  ← lockeado ✓
--     2) IF total >= max → return error
--     3) SELECT uses FROM user_usage WHERE user_id=X            ← SIN lock ✗
--     4) IF uses >= max_user → return error
--     5) UPDATE usage_counter ... + UPSERT user_usage
--
--   Bajo READ COMMITTED (default Postgres), 2 transactions concurrentes del
--   MISMO user con uses=4 pueden ambas pasar el check del paso 4 (ambos leen
--   uses=4), luego ambas UPSERT → user llega a uses=6 (sobrepasa límite 5).
--
-- FIX (estrategia 5/5 evaluada):
--   - INSERT preventivo en user_usage si no existe (idempotente)
--   - SELECT FOR UPDATE adquiere row lock — la 2da transaction queda bloqueada
--   - Ahora el check del límite del user es atómico
--   - El INSERT inicial garantiza que la fila siempre existe (FOR UPDATE no
--     funciona con NOT FOUND)

CREATE OR REPLACE FUNCTION public.try_increment_usage(p_user_id UUID, p_max_global INT, p_max_user INT)
RETURNS JSONB AS $$
DECLARE
  v_total INT;
  v_user INT;
BEGIN
  -- 1. Lock + read global counter (atómico)
  SELECT total_uses INTO v_total FROM public.usage_counter WHERE id = 1 FOR UPDATE;

  -- Check global limit ANTES de tocar nada
  IF v_total >= p_max_global THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'global_exhausted',
      'total_uses', v_total,
      'user_uses', 0
    );
  END IF;

  -- 2. Garantizar que la fila de user_usage existe (idempotente)
  INSERT INTO public.user_usage (user_id, uses, last_use)
    VALUES (p_user_id, 0, NOW())
    ON CONFLICT (user_id) DO NOTHING;

  -- 3. Lock + read user counter (AHORA SÍ atómico — la fila existe)
  --    Bajo concurrencia, la 2da transaction queda bloqueada acá hasta que
  --    la 1ra commitee. Cuando se desbloquea, lee el valor actualizado.
  SELECT uses INTO v_user FROM public.user_usage
    WHERE user_id = p_user_id FOR UPDATE;

  -- Check user limit con valor recién bloqueado
  IF v_user >= p_max_user THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'user_exhausted',
      'total_uses', v_total,
      'user_uses', v_user
    );
  END IF;

  -- 4. Increment ambos counters (los locks se liberan al COMMIT del bloque)
  UPDATE public.usage_counter SET total_uses = total_uses + 1 WHERE id = 1
    RETURNING total_uses INTO v_total;

  UPDATE public.user_usage
    SET uses = uses + 1, last_use = NOW()
    WHERE user_id = p_user_id
    RETURNING uses INTO v_user;

  RETURN jsonb_build_object(
    'success', true,
    'total_uses', v_total,
    'user_uses', v_user
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── B-A: Limpiar funciones huérfanas ───
-- increment_global_counter y increment_user_usage se crearon pero nunca se
-- usaron desde el TS (el código TS solo usa try_increment_usage y refund_usage).
-- Las dropeamos para que no haya código muerto en la DB.
DROP FUNCTION IF EXISTS public.increment_global_counter();
DROP FUNCTION IF EXISTS public.increment_user_usage(UUID);
