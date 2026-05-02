import { NextRequest, NextResponse } from 'next/server';
import {
  createSupabaseServerClient,
  createSupabaseAdminClient,
} from '@/lib/supabase/server';
import { createLogger } from '@/lib/logger';
import { moderateImage, moderationErrorMessage } from '@/lib/openai/moderate';

const log = createLogger('api/profile/avatar');

export const runtime = 'nodejs';
export const maxDuration = 30;

const MAX_BYTES = 2 * 1024 * 1024; // 2 MB
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const TYPE_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

/**
 * POST /api/profile/avatar
 *
 * Body: multipart/form-data con field `file` (image jpg/png/webp, max 2 MB).
 *
 * Sube a Supabase Storage bucket `avatars` con path `{user_id}.{ext}`,
 * actualiza profiles.avatar_url con la URL pública.
 *
 * Si el user ya tenía avatar (mismo path), lo sobrescribe (upsert: true).
 */
export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const formData = await req.formData().catch(() => null);
  const file = formData?.get('file');
  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { error: 'invalid_body', message: 'Falta el archivo.' },
      { status: 400 },
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      {
        error: 'file_too_large',
        message: 'Máximo 2 MB. Probá con una imagen más chica.',
      },
      { status: 413 },
    );
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      {
        error: 'invalid_type',
        message: 'Solo se aceptan JPG, PNG o WebP.',
      },
      { status: 415 },
    );
  }

  const ext = TYPE_EXT[file.type];
  const path = `${user.id}.${ext}`;

  // Upload via admin client (bypass RLS — más simple que delegar al user
  // client; RLS de Storage exige path con user_id que ya validamos arriba).
  const admin = createSupabaseAdminClient();
  const buffer = await file.arrayBuffer();

  // Content moderation — bloquear NSFW/violencia/etc antes de uploadear.
  // El bucket avatars es público, así que cualquier URL podría leakearse.
  const moderation = await moderateImage(buffer, file.type);
  if (moderation.flagged) {
    log.warn('Avatar rejected by moderation', {
      userId: user.id,
      categories: moderation.flaggedCategories,
      maxScore: moderation.maxScore,
    });
    return NextResponse.json(
      {
        error: 'content_rejected',
        message: moderationErrorMessage(moderation.flaggedCategories),
      },
      { status: 422 },
    );
  }

  // Borrar TODAS las extensiones previas del user (porque puede haber subido
  // antes un .png y ahora un .webp — sino quedan archivos huérfanos).
  // Solo borramos files cuyo nombre coincide EXACTO con userId.{otherExt}
  const otherPaths = Object.values(TYPE_EXT)
    .filter((e) => e !== ext)
    .map((e) => `${user.id}.${e}`);
  await admin.storage.from('avatars').remove(otherPaths).catch(() => {
    // ignore — los archivos pueden no existir
  });

  const { error: uploadError } = await admin.storage
    .from('avatars')
    .upload(path, buffer, {
      contentType: file.type,
      cacheControl: '3600',
      upsert: true,
    });

  if (uploadError) {
    log.error('Avatar upload failed', { err: uploadError.message });
    return NextResponse.json(
      { error: 'upload_failed', message: 'No pudimos subir la imagen.' },
      { status: 500 },
    );
  }

  // URL pública (bucket es public)
  const {
    data: { publicUrl },
  } = admin.storage.from('avatars').getPublicUrl(path);

  // Cache-bust: agregar query param con timestamp para forzar reload
  const finalUrl = `${publicUrl}?t=${Date.now()}`;

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ avatar_url: finalUrl })
    .eq('id', user.id);

  if (updateError) {
    log.error('Profile avatar_url update failed', { err: updateError.message });
    return NextResponse.json(
      {
        error: 'db_update_failed',
        message: 'Imagen subida pero no se pudo guardar.',
      },
      { status: 500 },
    );
  }

  log.info('Avatar uploaded', {
    userId: user.id,
    size: file.size,
    type: file.type,
  });

  return NextResponse.json({ success: true, url: finalUrl });
}

/**
 * DELETE /api/profile/avatar
 *
 * Borra el avatar custom del user (si existe). Después fallback al
 * Google avatar o al orb default.
 */
export async function DELETE() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();

  // Borrar todas las extensiones posibles (best-effort)
  const allPaths = Object.values(TYPE_EXT).map((ext) => `${user.id}.${ext}`);
  await admin.storage.from('avatars').remove(allPaths).catch(() => {
    // ignore
  });

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ avatar_url: null })
    .eq('id', user.id);

  if (updateError) {
    log.error('Profile avatar_url null update failed', {
      err: updateError.message,
    });
    return NextResponse.json(
      { error: 'db_update_failed' },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
