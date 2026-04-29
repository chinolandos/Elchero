-- ─── Chero — Polish post-audit Días 1-4 ───
-- Correr DESPUÉS de 05-counter-race-fix.sql.
-- Idempotente.
--
-- Aplicaciones:
--   M-A: documentar la decisión de "usage_counter SELECT público"
--   M-B: nada accionable en SQL (es un finding sobre código TS)
--   M-C: nada accionable en SQL (es un finding sobre Zod en TS)

-- M-A: La policy "Anyone can read counter" intencional para mostrar
-- "X/50 usos beta" en la landing pública (FOMO marketing). El counter
-- NO contiene info sensible (solo 1 número). RLS sigue protegiendo
-- INSERT/UPDATE (solo nuestras RPCs SECURITY DEFINER pueden escribir).
COMMENT ON POLICY "Anyone can read counter" ON public.usage_counter IS
  'Lectura pública intencional para mostrar progreso de la beta en la landing. '
  'No expone info sensible (solo total_uses). INSERT/UPDATE están restringidos '
  'a las RPCs SECURITY DEFINER (try_increment_usage, refund_usage).';

-- También documentamos la tabla notes para futuros desarrolladores
COMMENT ON TABLE public.notes IS
  'Apuntes generados por Chero. NOTA: el campo `transcript` contiene el texto '
  'COMPLETO del audio del user — datos potencialmente sensibles (nombres, casos '
  'mencionados en clase). El cliente NUNCA debe hacer SELECT *; siempre seleccionar '
  'columnas específicas. RLS aísla por user_id.';

COMMENT ON COLUMN public.notes.transcript IS
  'Texto completo de la transcripción de Whisper. Sensible — contiene voz del '
  'estudiante y posibles datos personales mencionados en clase. Usar regenerate '
  'para mejorar el apunte sin re-grabar.';

COMMENT ON COLUMN public.notes.regenerate_count IS
  'Veces que el user regeneró este apunte. Max 5 lifetime (CHECK constraint). '
  'Cada regeneración cuesta ~$0.10 en Sonnet, por eso el cap.';
