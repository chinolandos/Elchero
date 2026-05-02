import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createLogger } from '@/lib/logger';

const log = createLogger('api/push/unsubscribe');

export const runtime = 'nodejs';

const UnsubscribeBody = z.object({
  endpoint: z.string().url(),
});

/**
 * POST /api/push/unsubscribe
 *
 * Body: { endpoint }
 *
 * Borra la subscription del DB. RLS asegura que solo borra las del user actual.
 * El cliente también debe llamar registration.pushManager.getSubscription()
 * y .unsubscribe() para limpiar el browser-side.
 */
export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let body: z.infer<typeof UnsubscribeBody>;
  try {
    const json = await req.json();
    body = UnsubscribeBody.parse(json);
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const { error } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('endpoint', body.endpoint)
    .eq('user_id', user.id);

  if (error) {
    log.error('Unsubscribe delete failed', { err: error.message });
    return NextResponse.json({ error: 'db_failed' }, { status: 500 });
  }

  log.info('Push subscription removed', {
    userId: user.id,
    endpoint: body.endpoint.slice(0, 60),
  });

  return NextResponse.json({ success: true });
}
