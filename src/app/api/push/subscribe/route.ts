import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createLogger } from '@/lib/logger';

const log = createLogger('api/push/subscribe');

export const runtime = 'nodejs';

const SubscribeBody = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(10),
    auth: z.string().min(10),
  }),
});

/**
 * POST /api/push/subscribe
 *
 * Body: PushSubscription serializado del browser (subscription.toJSON()).
 *
 * Guarda la subscription en la tabla push_subscriptions. Si ya existe el
 * mismo endpoint, hace UPSERT (update keys + last_used_at).
 *
 * RLS valida user_id = auth.uid() automáticamente.
 */
export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let body: z.infer<typeof SubscribeBody>;
  try {
    const json = await req.json();
    body = SubscribeBody.parse(json);
  } catch (err) {
    log.warn('Invalid subscribe body', {
      err: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: 'invalid_body', message: 'Body inválido.' },
      { status: 400 },
    );
  }

  const userAgent = req.headers.get('user-agent') ?? null;

  // Upsert por endpoint (UNIQUE constraint en DB).
  const { error } = await supabase
    .from('push_subscriptions')
    .upsert(
      {
        user_id: user.id,
        endpoint: body.endpoint,
        p256dh: body.keys.p256dh,
        auth: body.keys.auth,
        user_agent: userAgent,
        last_used_at: new Date().toISOString(),
        failed_at: null, // resetear si re-subscribió un endpoint que había failed
      },
      { onConflict: 'endpoint' },
    );

  if (error) {
    log.error('Subscribe insert failed', { err: error.message });
    return NextResponse.json(
      { error: 'db_failed', message: 'No pudimos guardar tu subscription.' },
      { status: 500 },
    );
  }

  log.info('Push subscription created', {
    userId: user.id,
    endpoint: body.endpoint.slice(0, 60),
  });

  return NextResponse.json({ success: true });
}
