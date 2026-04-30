-- ─── Chero — Carpetas para organizar apuntes (Sesión 1 rediseño) ───
-- Correr DESPUÉS de 06-policies-cleanup.sql.
-- Idempotente: usa IF NOT EXISTS y DROP IF EXISTS.
--
-- Diseño:
--   - Tabla `folders` flat (sin árbol) — 1 nivel, suficiente para MVP
--   - Cada user tiene sus propias carpetas (RLS)
--   - notes.folder_id nullable → notas sin carpeta = "Inbox" (default view)
--   - ON DELETE SET NULL → borrar folder mueve notas a Inbox (no destruye)
--   - Color opcional para distinguir visualmente (preset de paleta Aura)

-- 1. Tabla folders
CREATE TABLE IF NOT EXISTS public.folders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 50),
  -- Color del icono (preset). Validamos en backend, no en CHECK SQL para flexibilidad.
  color TEXT DEFAULT 'violet',
  -- Emoji opcional como ícono visual
  emoji TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cada user puede tener nombres únicos (no duplica "Matemática" por error)
CREATE UNIQUE INDEX IF NOT EXISTS folders_user_name_unique_idx
  ON public.folders (user_id, lower(name));

-- Índice para listar rápido las carpetas del user
CREATE INDEX IF NOT EXISTS folders_user_id_created_idx
  ON public.folders (user_id, created_at DESC);

-- 2. Columna folder_id en notes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'notes'
      AND column_name = 'folder_id'
  ) THEN
    ALTER TABLE public.notes
      ADD COLUMN folder_id UUID REFERENCES public.folders(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Índice para queries "todas las notas de la carpeta X"
CREATE INDEX IF NOT EXISTS notes_folder_id_idx
  ON public.notes (folder_id)
  WHERE folder_id IS NOT NULL;

-- 3. RLS para folders
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own folders" ON public.folders;
DROP POLICY IF EXISTS "Users can insert own folders" ON public.folders;
DROP POLICY IF EXISTS "Users can update own folders" ON public.folders;
DROP POLICY IF EXISTS "Users can delete own folders" ON public.folders;

CREATE POLICY "Users can view own folders"
  ON public.folders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own folders"
  ON public.folders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own folders"
  ON public.folders FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own folders"
  ON public.folders FOR DELETE
  USING (auth.uid() = user_id);

-- 4. Trigger para mantener updated_at
DROP TRIGGER IF EXISTS folders_set_updated_at ON public.folders;
CREATE TRIGGER folders_set_updated_at
  BEFORE UPDATE ON public.folders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 5. Comments para docs
COMMENT ON TABLE public.folders IS
  'Carpetas para organizar apuntes. 1 nivel (sin sub-carpetas). Cada user
   las crea custom con presets sugeridos por el frontend (AVANZO 2026,
   1° Período, materias AVANZO, etc.) o nombre libre.';

COMMENT ON COLUMN public.notes.folder_id IS
  'Referencia a folders.id. NULL = Inbox (sin carpeta asignada).
   ON DELETE SET NULL → si la carpeta se borra, los apuntes vuelven a
   Inbox sin perderse.';
