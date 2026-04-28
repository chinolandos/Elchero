-- ─── Chero MVP — Funciones SQL para counters atómicos ───
-- Correr DESPUÉS del schema inicial (01-schema.sql).
-- Estas funciones evitan race conditions cuando varios usuarios procesan a la vez.

-- 1. Incrementar contador global (max enforced en try_increment_usage)
CREATE OR REPLACE FUNCTION public.increment_global_counter()
RETURNS INT AS $$
DECLARE
  new_count INT;
BEGIN
  UPDATE public.usage_counter
  SET total_uses = total_uses + 1
  WHERE id = 1
  RETURNING total_uses INTO new_count;

  RETURN new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Incrementar contador del usuario
CREATE OR REPLACE FUNCTION public.increment_user_usage(p_user_id UUID)
RETURNS INT AS $$
DECLARE
  new_count INT;
BEGIN
  INSERT INTO public.user_usage (user_id, uses, last_use)
  VALUES (p_user_id, 1, NOW())
  ON CONFLICT (user_id)
  DO UPDATE SET
    uses = public.user_usage.uses + 1,
    last_use = NOW()
  RETURNING uses INTO new_count;

  RETURN new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Función combinada que verifica límites Y incrementa de forma atómica
--    Esta es la función PRINCIPAL que usa /api/process.
CREATE OR REPLACE FUNCTION public.try_increment_usage(p_user_id UUID, p_max_global INT, p_max_user INT)
RETURNS JSONB AS $$
DECLARE
  v_total INT;
  v_user INT;
BEGIN
  -- Lock and read global counter
  SELECT total_uses INTO v_total FROM public.usage_counter WHERE id = 1 FOR UPDATE;

  -- Check global limit
  IF v_total >= p_max_global THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'global_exhausted',
      'total_uses', v_total,
      'user_uses', 0
    );
  END IF;

  -- Read user counter (sin lock — lo lockeamos en el upsert)
  SELECT COALESCE(uses, 0) INTO v_user FROM public.user_usage WHERE user_id = p_user_id;
  IF v_user IS NULL THEN v_user := 0; END IF;

  -- Check user limit
  IF v_user >= p_max_user THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'user_exhausted',
      'total_uses', v_total,
      'user_uses', v_user
    );
  END IF;

  -- Increment both
  UPDATE public.usage_counter SET total_uses = total_uses + 1 WHERE id = 1
    RETURNING total_uses INTO v_total;

  INSERT INTO public.user_usage (user_id, uses, last_use)
    VALUES (p_user_id, 1, NOW())
    ON CONFLICT (user_id) DO UPDATE SET
      uses = public.user_usage.uses + 1,
      last_use = NOW()
    RETURNING uses INTO v_user;

  RETURN jsonb_build_object(
    'success', true,
    'total_uses', v_total,
    'user_uses', v_user
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Refund — decrementa ambos contadores si algo falla post-incremento.
--    No baja de 0. Útil cuando incrementamos antes de transcribir y la transcripción falla.
CREATE OR REPLACE FUNCTION public.refund_usage(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_total INT;
  v_user INT;
BEGIN
  -- Decrementar global (no bajar de 0)
  UPDATE public.usage_counter
  SET total_uses = GREATEST(0, total_uses - 1)
  WHERE id = 1
  RETURNING total_uses INTO v_total;

  -- Decrementar user (no bajar de 0)
  UPDATE public.user_usage
  SET uses = GREATEST(0, uses - 1)
  WHERE user_id = p_user_id
  RETURNING uses INTO v_user;

  RETURN jsonb_build_object(
    'success', true,
    'total_uses', v_total,
    'user_uses', COALESCE(v_user, 0)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
