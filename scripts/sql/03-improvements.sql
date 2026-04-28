-- ─── Chero MVP — Mejoras post-Día 3 (Ronda audit profunda) ───
-- Correr DESPUÉS de 01-schema.sql y 02-counter-rpcs.sql.
-- Idempotente: usa IF NOT EXISTS, DROP IF EXISTS, etc.

-- 1. CHECK constraint en notes.detected_confidence (debe estar entre 0 y 100)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE constraint_name = 'notes_confidence_range'
  ) THEN
    ALTER TABLE public.notes
      ADD CONSTRAINT notes_confidence_range
      CHECK (detected_confidence IS NULL OR (detected_confidence >= 0 AND detected_confidence <= 100));
  END IF;
END $$;

-- 2. CHECK constraint en notes.audio_duration_minutes (debe ser positivo)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE constraint_name = 'notes_duration_positive'
  ) THEN
    ALTER TABLE public.notes
      ADD CONSTRAINT notes_duration_positive
      CHECK (audio_duration_minutes IS NULL OR audio_duration_minutes >= 0);
  END IF;
END $$;

-- 3. CHECK constraint en profiles.year (debe ser 1-5)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE constraint_name = 'profiles_year_range'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_year_range
      CHECK (year IS NULL OR (year >= 1 AND year <= 5));
  END IF;
END $$;

-- 4. CHECK constraint en profiles.age (rango razonable: 12-99)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE constraint_name = 'profiles_age_range'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_age_range
      CHECK (age IS NULL OR (age >= 12 AND age <= 99));
  END IF;
END $$;

-- 5. Índices adicionales para queries comunes
-- Filtrar apuntes por modo (para library con tabs por modo)
CREATE INDEX IF NOT EXISTS notes_user_id_mode_idx
  ON public.notes (user_id, mode);

-- Filtrar apuntes por materia
CREATE INDEX IF NOT EXISTS notes_user_id_subject_idx
  ON public.notes (user_id, subject)
  WHERE subject IS NOT NULL;

-- Análisis de actividad de usuarios (para validación día 8)
CREATE INDEX IF NOT EXISTS user_usage_last_use_idx
  ON public.user_usage (last_use DESC);

-- 6. Trigger para mantener profiles.updated_at automáticamente
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_set_updated_at ON public.profiles;
CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
