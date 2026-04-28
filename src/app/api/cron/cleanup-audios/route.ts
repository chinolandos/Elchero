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
  // Verificación: solo Vercel Cron puede llamar esto
  const authHeader = req.headers.get('authorization');
  const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

  if (process.env.CRON_SECRET && authHeader !== expectedAuth) {
    log.warn('Unauthorized cron request');
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

    log.info('Cleanup complete', {
      totalScanned,
      totalDeleted,
      errors: errors.length,
    });

    return NextResponse.json({
      success: true,
      total_scanned: totalScanned,
      total_deleted: totalDeleted,
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
