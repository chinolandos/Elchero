import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase/server';
import { transcribeAudio } from '@/lib/openai/transcribe';
import { detectContext } from '@/lib/anthropic/detect';
import { checkUsage } from '@/lib/usage/check';
import type { UserProfile } from '@/lib/types/chero';

// Vercel Pro con Fluid Compute permite hasta 800s
export const maxDuration = 300;
export const runtime = 'nodejs';

/**
 * POST /api/process
 *
 * Body: FormData con campo "audio" (File)
 *
 * Flow:
 * 1. Auth check (usuario autenticado)
 * 2. Counter check (50 global / 5 user)
 * 3. Subir audio a Supabase Storage (signed URL, TTL 1h)
 * 4. Transcribir con GPT-4o Mini Transcribe
 * 5. Auto-detectar materia/modo con Claude Haiku
 * 6. Devolver { audioUrl, transcript, detected, costs }
 *    (NO incrementa counter ni genera apunte aún — eso pasa en /api/generate-notes)
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Auth check
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'unauthorized', message: 'Tenés que iniciar sesión.' },
        { status: 401 },
      );
    }

    // 2. Counter check
    const usage = await checkUsage(user.id);
    if (!usage.can_process) {
      const message =
        usage.reason === 'global_exhausted'
          ? 'La beta de Chero llegó al límite de 50 usos totales. Volvé en Q2 2026 para el lanzamiento completo.'
          : 'Ya usaste tus 5 audios de la beta. Esperá al lanzamiento completo en Q2 2026.';

      return NextResponse.json(
        { error: 'usage_exhausted', reason: usage.reason, usage, message },
        { status: 429 },
      );
    }

    // 3. Parse form data
    const formData = await req.formData();
    const audioFile = formData.get('audio');

    if (!audioFile || !(audioFile instanceof File)) {
      return NextResponse.json(
        { error: 'missing_audio', message: 'No se recibió archivo de audio.' },
        { status: 400 },
      );
    }

    if (audioFile.size === 0) {
      return NextResponse.json(
        { error: 'empty_audio', message: 'El archivo de audio está vacío.' },
        { status: 400 },
      );
    }

    // 4. Subir a Supabase Storage con signed URL (TTL 1h)
    const admin = createSupabaseAdminClient();
    const audioPath = `audios/${user.id}/${Date.now()}-${audioFile.name}`;

    const buffer = Buffer.from(await audioFile.arrayBuffer());
    const { error: uploadError } = await admin.storage
      .from('audios')
      .upload(audioPath, buffer, {
        contentType: audioFile.type || 'audio/mpeg',
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload failed:', uploadError);
      return NextResponse.json(
        { error: 'upload_failed', message: 'No se pudo subir el audio. Intentá de nuevo.' },
        { status: 500 },
      );
    }

    // 5. Transcribir
    let transcript: Awaited<ReturnType<typeof transcribeAudio>>;
    try {
      transcript = await transcribeAudio(audioFile);
    } catch (err) {
      console.error('Transcription failed:', err);
      // Borrar audio del storage si falla
      await admin.storage.from('audios').remove([audioPath]);
      return NextResponse.json(
        {
          error: 'transcription_failed',
          message: err instanceof Error ? err.message : 'Falló la transcripción.',
        },
        { status: 500 },
      );
    }

    // 6. Cargar perfil del usuario para auto-detect
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    // 7. Auto-detect contexto (Claude Haiku)
    let detected: Awaited<ReturnType<typeof detectContext>>;
    try {
      detected = await detectContext(
        transcript.text.slice(0, 2000),
        (profile as Partial<UserProfile>) ?? {},
      );
    } catch (err) {
      console.error('Detection failed:', err);
      // Fallback: detección básica
      detected = {
        mode: profile?.user_type === 'universitario' ? 'parciales' : 'periodo',
        subject: 'No detectado',
        institution: profile?.institution ?? null,
        year: profile?.year ?? null,
        topic: 'No detectado',
        confidence: 0,
      };
    }

    return NextResponse.json({
      success: true,
      audioPath,
      transcript: {
        text: transcript.text,
        duration_minutes: transcript.durationMinutes,
        cost_usd: transcript.costUsd,
      },
      detected,
      usage,
    });
  } catch (err) {
    console.error('Unexpected error in /api/process:', err);
    return NextResponse.json(
      {
        error: 'internal_error',
        message: 'Algo salió mal. Si vuelve a pasar, decinos.',
      },
      { status: 500 },
    );
  }
}
