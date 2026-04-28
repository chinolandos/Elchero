-- ─── Chero MVP — Schema completo (ejecutado en Supabase SQL editor el Día 1) ───
--
-- Crea las 4 tablas core: profiles, notes, usage_counter, user_usage
-- Aplica Row Level Security con policies por usuario.
-- Trigger auto-crea profile + user_usage al registrarse un user nuevo.
--
-- Idempotente: usa IF NOT EXISTS y CREATE OR REPLACE.
-- Si necesitás recrear desde cero, este es el archivo a correr.

-- 1. Extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabla profiles (perfil del usuario, 1:1 con auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email TEXT,
  age INT,
  is_minor BOOLEAN DEFAULT FALSE,
  has_guardian_consent BOOLEAN DEFAULT FALSE,
  user_type TEXT CHECK (user_type IN ('bachiller', 'universitario')),
  institution TEXT,
  career TEXT,
  year INT,
  subjects TEXT[] DEFAULT '{}',
  preferred_voice TEXT DEFAULT 'nova',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabla notes (apuntes generados)
CREATE TABLE IF NOT EXISTS public.notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  mode TEXT CHECK (mode IN ('avanzo', 'periodo', 'parciales', 'repaso')) NOT NULL,
  subject TEXT,
  institution TEXT,
  detected_confidence NUMERIC,
  audio_duration_minutes NUMERIC,
  transcript TEXT,
  summary TEXT,
  concepts JSONB,
  questions JSONB,
  flashcards JSONB,
  quick_review TEXT,
  audio_tts_url TEXT,
  mermaid_chart TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS notes_user_id_created_idx
  ON public.notes (user_id, created_at DESC);

-- 4. Counter global (max 50 usos totales en MVP)
CREATE TABLE IF NOT EXISTS public.usage_counter (
  id INT PRIMARY KEY DEFAULT 1,
  total_uses INT DEFAULT 0,
  CONSTRAINT singleton CHECK (id = 1)
);

INSERT INTO public.usage_counter (id, total_uses)
  VALUES (1, 0)
  ON CONFLICT (id) DO NOTHING;

-- 5. Counter por usuario (max 5 por persona)
CREATE TABLE IF NOT EXISTS public.user_usage (
  user_id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  uses INT DEFAULT 0,
  last_use TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Row Level Security (RLS) ───
-- Cada usuario solo puede ver/modificar sus propios datos.

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_counter ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first (idempotent)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own notes" ON public.notes;
DROP POLICY IF EXISTS "Users can insert own notes" ON public.notes;
DROP POLICY IF EXISTS "Users can update own notes" ON public.notes;
DROP POLICY IF EXISTS "Users can delete own notes" ON public.notes;
DROP POLICY IF EXISTS "Users can view own usage" ON public.user_usage;
DROP POLICY IF EXISTS "Anyone can read counter" ON public.usage_counter;

-- Policies para profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Policies para notes
CREATE POLICY "Users can view own notes"
  ON public.notes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notes"
  ON public.notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notes"
  ON public.notes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notes"
  ON public.notes FOR DELETE
  USING (auth.uid() = user_id);

-- Policies para user_usage
CREATE POLICY "Users can view own usage"
  ON public.user_usage FOR SELECT
  USING (auth.uid() = user_id);

-- Counter global: lectura pública (para mostrar X/50 en landing)
CREATE POLICY "Anyone can read counter"
  ON public.usage_counter FOR SELECT
  USING (true);

-- ─── Auto-crear profile + user_usage al registrarse ───
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_usage (user_id, uses)
  VALUES (NEW.id, 0)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
