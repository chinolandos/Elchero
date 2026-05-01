-- ============================================================================
-- 09-profile-avatar.sql
-- ============================================================================
-- Migration: agregar avatar_url custom + Storage bucket `avatars`.
--
-- profiles.avatar_url → URL del avatar custom subido por el user.
-- Si null, el frontend cae al avatar de Google (user_metadata) o al orb.
--
-- Storage bucket `avatars`: public read (cualquiera puede ver el avatar
-- vía URL directa), pero write restringido al owner del archivo.
--
-- Path convention: avatars/{user_id}.{ext}
--   Ej: avatars/abc-123-uuid.webp
-- ============================================================================

-- 1. Columna avatar_url en profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

COMMENT ON COLUMN public.profiles.avatar_url IS
  'URL del avatar custom (Supabase Storage). Si null, fallback a Google avatar o orb.';

-- 2. Bucket público para avatars
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2 * 1024 * 1024, -- 2 MB max por archivo
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 3. RLS policies en storage.objects para el bucket avatars
-- Convención: el filename empieza con auth.uid() (ej: "abc-123-uuid.webp")
-- así RLS puede validar ownership por filename.

-- Read público (cualquiera ve los avatars vía URL — son públicos por diseño)
DROP POLICY IF EXISTS "avatars public read" ON storage.objects;
CREATE POLICY "avatars public read"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'avatars');

-- Insert: solo el owner puede subir (filename debe empezar con su user_id)
DROP POLICY IF EXISTS "avatars owner insert" ON storage.objects;
CREATE POLICY "avatars owner insert"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = split_part(name, '.', 1)
  );

-- Update: solo el owner (mismo check)
DROP POLICY IF EXISTS "avatars owner update" ON storage.objects;
CREATE POLICY "avatars owner update"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = split_part(name, '.', 1)
  );

-- Delete: solo el owner
DROP POLICY IF EXISTS "avatars owner delete" ON storage.objects;
CREATE POLICY "avatars owner delete"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = split_part(name, '.', 1)
  );
