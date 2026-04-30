import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { createLogger } from '@/lib/logger';

const log = createLogger('cron/cleanup-audios');

// El cron corre 1x por día a las 3:00 AM UTC (configurado en vercel.json: "0 3 * * *")
// Vercel Hobby plan limita a daily crons; en Pro podríamos cambiar a hourly.
// Borra audios del bucket `audios` que tengan >1h de antigüedad.
//
// Esta es la red de seguridad: el flow normal en /api/process borra el audio
// inmediatamente después de transcribir. Pero si algo falla a media operación,
// este cron limpia los huérfanos al día siguiente.

export const runtime = 'nodejs';
export const maxDuration = 60;

const ONE_HOUR_MS = 60 * 60 * 1000;

export async function GET(req: NextRequest) {
  // Verificación de auth — fail-closed: si CRON_SECRET no está seteado en env,
  // el endpoint queda DESACTIVADO (503), no abierto.
  // Si CRON_SECRET existe pero el header no coincide → 401.
  // Solo si CRON_SECRET existe Y coincide → continuar.
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get('authorization');

  if (!cronSecret) {
    log.error('CRON_SECRET not configured — cron endpoint disabled');
    return NextResponse.json(
      {
        error: 'cron_disabled',
        message: 'Cron secret no configurado en server.',
      },
      { status: 503 },
    );
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    log.warn('Unauthorized cron request', {
      hasHeader: !!authHeader,
    });
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();
  const cutoff = new Date(Date.now() - ONE_HOUR_MS);

  let totalDeleted = 0;
  let totalScanned = 0;
  const errors: string[] = [];

  try {
    // Listar archivos en el bucket `audios` (recursivo en cada carpeta de user)
    const { data: userFolders, error: listError } = await admin.storage
      .from('audios')
      .list('', { limit: 1000, sortBy: { column: 'created_at', order: 'asc' } });

    if (listError) {
      log.error('Failed to list audio folders', { err: listError.message });
      return NextResponse.json({ error: 'list_failed' }, { status: 500 });
    }

    for (const folder of userFolders ?? []) {
      // Cada `folder` es la carpeta de un usuario (UUID)
      if (!folder.name) continue;

      const { data: files, error: listFilesError } = await admin.storage
        .from('audios')
        .list(folder.name, {
          limit: 1000,
          sortBy: { column: 'created_at', order: 'asc' },
        });

      if (listFilesError) {
        errors.push(`list ${folder.name}: ${listFilesError.message}`);
        continue;
      }

      const toDelete: string[] = [];
      for (const file of files ?? []) {
        totalScanned++;
        if (!file.created_at) continue;
        const createdAt = new Date(file.created_at);
        if (createdAt < cutoff) {
          toDelete.push(`${folder.name}/${file.name}`);
        }
      }

      if (toDelete.length > 0) {
        const { error: deleteError } = await admin.storage
          .from('audios')
          .remove(toDelete);

        if (deleteError) {
          errors.push(`delete ${folder.name}: ${deleteError.message}`);
        } else {
          totalDeleted += toDelete.length;
        }
      }
    }

    // También limpiamos tokens consumidos antiguos (>24h) para no acumular
    // filas innecesarias en consumed_process_tokens.
    let tokensDeleted = 0;
    try {
      const { data: tokensCount, error: tokensError } = await admin.rpc(
        'cleanup_consumed_tokens',
      );
      if (tokensError) {
        log.warn('cleanup_consumed_tokens failed (non-blocking)', {
          err: tokensError.message,
        });
      } else if (typeof tokensCount === 'number') {
        tokensDeleted = tokensCount;
      }
    } catch (err) {
      log.warn('cleanup_consumed_tokens threw (non-blocking)', {
        err: err instanceof Error ? err.message : String(err),
      });
    }

    // ── TTS huérfanos ──────────────────────────────────────────────
    // El bucket `tts-output` contiene archivos `<user_id>/<note_id>.mp3`.
    // El flow normal en /api/notes/[id] DELETE limpia el TTS al borrar la
    // nota. Pero pueden quedar huérfanos si:
    //   - Hubo un error de red al borrar el archivo después del DELETE de la nota
    //   - Race conditions, escritos abortados, etc.
    // Esta sección compara los archivos del bucket contra los note_ids vivos
    // en la tabla `notes` y borra los que no tengan match.
    let ttsScanned = 0;
    let ttsOrphansDeleted = 0;
    try {
      const { data: liveNotes, error: notesError } = await admin
        .from('notes')
        .select('id');
      if (notesError) {
        errors.push(`tts notes query: ${notesError.message}`);
      } else {
        const liveIds = new Set((liveNotes ?? []).map((n) => n.id as string));

        const { data: ttsFolders, error: ttsListError } = await admin.storage
          .from('tts-output')
          .list('', { limit: 1000 });

        if (ttsListError) {
          errors.push(`tts list: ${ttsListError.message}`);
        } else {
          for (const folder of ttsFolders ?? []) {
            if (!folder.name) continue;
            const { data: files, error: filesError } = await admin.storage
              .from('tts-output')
              .list(folder.name, { limit: 1000 });
            if (filesError) {
              errors.push(`tts list ${folder.name}: ${filesError.message}`);
              continue;
            }

            const orphans: string[] = [];
            for (const file of files ?? []) {
              ttsScanned++;
              if (!file.name) continue;
              // Extraer note_id del filename: "<note_id>.mp3"
              const match = file.name.match(/^([0-9a-f-]{36})\.mp3$/i);
              if (!match) continue; // ignorar archivos con formato inesperado
              const noteId = match[1];
              if (!liveIds.has(noteId)) {
                orphans.push(`${folder.name}/${file.name}`);
              }
            }

            if (orphans.length > 0) {
              const { error: removeError } = await admin.storage
                .from('tts-output')
                .remove(orphans);
              if (removeError) {
                errors.push(`tts remove ${folder.name}: ${removeError.message}`);
              } else {
                ttsOrphansDeleted += orphans.length;
              }
            }
          }
        }
      }
    } catch (err) {
      log.warn('TTS orphan cleanup threw (non-blocking)', {
        err: err instanceof Error ? err.message : String(err),
      });
    }

    log.info('Cleanup complete', {
      audios_scanned: totalScanned,
      audios_deleted: totalDeleted,
      tts_scanned: ttsScanned,
      tts_orphans_deleted: ttsOrphansDeleted,
      tokens_deleted: tokensDeleted,
      errors: errors.length,
    });

    return NextResponse.json({
      success: true,
      total_scanned: totalScanned,
      total_deleted: totalDeleted,
      tts_scanned: ttsScanned,
      tts_orphans_deleted: ttsOrphansDeleted,
      tokens_deleted: tokensDeleted,
      errors,
      cutoff: cutoff.toISOString(),
    });
  } catch (err) {
    log.error('Cron failed unexpectedly', {
      err: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: 'internal_error', message: String(err) },
      { status: 500 },
    );
  }
}
