import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  createSupabaseServerClient,
  createSupabaseAdminClient,
} from '@/lib/supabase/server';
import { createLogger } from '@/lib/logger';

export const runtime = 'nodejs';

const log = createLogger('api/profile');

const ProfileUpdateSchema = z.object({
  age: z.number().int().min(12).max(99).nullable().optional(),
  is_minor: z.boolean().optional(),
  has_guardian_consent: z.boolean().optional(),
  user_type: z.enum(['bachiller', 'universitario']).nullable().optional(),
  institution: z.string().max(100).nullable().optional(),
  career: z.string().max(100).nullable().optional(),
  year: z.number().int().min(1).max(5).nullable().optional(),
  subjects: z.array(z.string().max(100)).max(15).optional(),
  preferred_voice: z
    .enum(['nova', 'echo', 'alloy', 'onyx', 'shimmer', 'fable', 'coral', 'sage'])
    .optional(),
});

/**
 * GET /api/profile
 *
 * Devuelve el perfil del usuario autenticado.
 */
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'unauthorized', message: 'Tenés que iniciar sesión.' },
        { status: 401 },
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      log.error('Failed to load profile', { err: profileError.message });
      return NextResponse.json(
        { error: 'load_failed', message: 'No se pudo cargar el perfil.' },
        { status: 500 },
      );
    }

    // Si todavía no existe (caso raro: trigger falló), devolvemos el shape vacío
    if (!profile) {
      return NextResponse.json({
        profile: {
          id: user.id,
          email: user.email ?? null,
          age: null,
          is_minor: false,
          has_guardian_consent: false,
          user_type: null,
          institution: null,
          career: null,
          year: null,
          subjects: [],
          preferred_voice: 'nova',
        },
        is_new: true,
      });
    }

    return NextResponse.json({ profile, is_new: false });
  } catch (err) {
    log.error('Unexpected error in GET', {
      err: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: 'internal_error' },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/profile
 *
 * Body: campos del perfil a actualizar (ProfileUpdateSchema).
 * El user solo puede actualizar SU propio perfil (RLS lo enforza).
 *
 * Notas:
 *   - `is_minor` se calcula automáticamente desde `age` si se pasa age.
 *   - Si is_minor === true, has_guardian_consent debe ser true para usar la app.
 */
export async function PUT(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'unauthorized', message: 'Tenés que iniciar sesión.' },
        { status: 401 },
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
    }

    const validated = ProfileUpdateSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: 'invalid_body', issues: validated.error.issues },
        { status: 400 },
      );
    }

    const updates = { ...validated.data };

    // Auto-derivar is_minor desde age (si age viene)
    if (typeof updates.age === 'number') {
      updates.is_minor = updates.age < 18;
    }

    // Upsert: actualizamos si existe, creamos si no (caso raro pero defensivo)
    const { data: profile, error: upsertError } = await supabase
      .from('profiles')
      .upsert(
        {
          id: user.id,
          email: user.email ?? null,
          ...updates,
        },
        { onConflict: 'id' },
      )
      .select('*')
      .single();

    if (upsertError) {
      log.error('Profile upsert failed', { err: upsertError.message });
      return NextResponse.json(
        {
          error: 'update_failed',
          message: upsertError.message,
        },
        { status: 500 },
      );
    }

    log.info('Profile updated', {
      userId: user.id,
      keys: Object.keys(updates),
    });

    return NextResponse.json({ success: true, profile });
  } catch (err) {
    log.error('Unexpected error in PUT', {
      err: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: 'internal_error' },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/profile
 *
 * Elimina la cuenta del usuario y TODOS sus datos.
 * Cumplimiento Ley Datos SV (Nov 2024): derecho al olvido REAL.
 *
 * Cómo funciona:
 *   1. Listar y borrar TTS audios del bucket público tts-output
 *   2. Llamar admin.auth.admin.deleteUser(user.id) — esto borra
 *      auth.users → ON DELETE CASCADE → profiles + notes + user_usage
 *      todo se elimina en una transacción atómica
 *   3. La sesión del user queda invalidada automáticamente
 *
 * Esto reemplaza el flow anterior que solo borraba public.profiles
 * (lo cual NO eliminaba auth.users, ni notes, ni user_usage — un user
 * podía re-loguear y ver sus apuntes intactos).
 */
export async function DELETE() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'unauthorized', message: 'Tenés que iniciar sesión.' },
        { status: 401 },
      );
    }

    const admin = createSupabaseAdminClient();

    // 1. Limpiar audios TTS del bucket público (no se cascade-deletean
    //    automáticamente — Supabase Storage es independiente de la DB).
    try {
      const { data: files } = await admin.storage
        .from('tts-output')
        .list(user.id, { limit: 100 });
      if (files && files.length > 0) {
        const paths = files.map((f) => `${user.id}/${f.name}`);
        const { error: removeError } = await admin.storage
          .from('tts-output')
          .remove(paths);
        if (removeError) {
          log.warn('TTS bucket cleanup failed (non-blocking)', {
            err: removeError.message,
          });
        }
      }
    } catch (err) {
      log.warn('TTS bucket cleanup threw (non-blocking)', {
        err: err instanceof Error ? err.message : String(err),
      });
    }

    // 2. Borrar auth.users — el CASCADE limpia profiles, notes, user_usage
    //    en una sola transacción atómica. Esto es lo que faltaba.
    const { error: deleteAuthError } = await admin.auth.admin.deleteUser(user.id);

    if (deleteAuthError) {
      log.error('Auth user delete failed', {
        err: deleteAuthError.message,
        userId: user.id,
      });
      return NextResponse.json(
        {
          error: 'delete_failed',
          message: 'No se pudo eliminar la cuenta. Intentá de nuevo.',
        },
        { status: 500 },
      );
    }

    // 3. Sign out (limpia las cookies del client)
    await supabase.auth.signOut();

    log.info('Account fully deleted (auth + cascade + tts)', {
      userId: user.id,
    });

    return NextResponse.json({
      success: true,
      message: 'Tu cuenta y todos tus datos fueron eliminados.',
    });
  } catch (err) {
    log.error('Unexpected error in DELETE', {
      err: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: 'internal_error' },
      { status: 500 },
    );
  }
}
