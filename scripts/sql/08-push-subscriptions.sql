-- ============================================================================
-- 08-push-subscriptions.sql
-- ============================================================================
-- Migration: tabla push_subscriptions para Web Push API.
--
-- Cada user puede tener múltiples subscriptions (1 por device/browser).
-- Cuando el cron de "racha en peligro" detecta inactividad, envía push a
-- TODAS las subscriptions del user.
--
-- RLS: el user solo ve / modifica sus propias subscriptions.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,

  -- Web Push: unique endpoint URL del browser (ej: fcm.googleapis.com/...)
  endpoint TEXT NOT NULL,

  -- Encryption keys del browser (P256DH y auth secret)
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,

  -- User-Agent al subscribirse (debug + métricas)
  user_agent TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- Última vez que mandamos push exitosamente. Si endpoint falla con 410
  -- Gone, marcamos failed_at y eventualmente borramos.
  last_used_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,

  -- Una subscription por endpoint (mismo browser no puede subscribirse 2x)
  UNIQUE (endpoint)
);

-- Index para queries del cron: filtrar subscriptions activas (no failed)
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id
  ON public.push_subscriptions (user_id)
  WHERE failed_at IS NULL;

-- ─── RLS ─────────────────────────────────────────────────────────────────

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- User puede ver sus propias subscriptions
DROP POLICY IF EXISTS "users see own push subs" ON public.push_subscriptions;
CREATE POLICY "users see own push subs"
  ON public.push_subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- User puede crear subscriptions con su user_id
DROP POLICY IF EXISTS "users insert own push subs" ON public.push_subscriptions;
CREATE POLICY "users insert own push subs"
  ON public.push_subscriptions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- User puede borrar sus propias subscriptions (unsubscribe)
DROP POLICY IF EXISTS "users delete own push subs" ON public.push_subscriptions;
CREATE POLICY "users delete own push subs"
  ON public.push_subscriptions
  FOR DELETE
  USING (auth.uid() = user_id);

-- NO hay UPDATE policy: las subscriptions son immutable (delete + insert
-- si querés cambiar). El cron usa service role para marcar failed_at.

-- ─── Comments ────────────────────────────────────────────────────────────

COMMENT ON TABLE public.push_subscriptions IS
  'Web Push subscriptions del browser. Una por device/browser.';
COMMENT ON COLUMN public.push_subscriptions.endpoint IS
  'URL del Web Push provider (FCM, APNs via Apple, etc).';
COMMENT ON COLUMN public.push_subscriptions.failed_at IS
  'Timestamp cuando el endpoint devolvió 410 Gone. Se borra el registro.';
