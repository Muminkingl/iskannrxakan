import { errorResponse, HttpError, isUserId, json, requiredEnv, syncSubscriber } from '../_shared/revenuecat.ts';

async function validAuthorization(actual: string, expected: string) {
  const hash = async (text: string) => new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)));
  const [left, right] = await Promise.all([hash(actual), hash(expected)]);
  return left.reduce((difference, byte, index) => difference | (byte ^ right[index]), 0) === 0;
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  try {
    const expected = requiredEnv('REVENUECAT_WEBHOOK_AUTHORIZATION');
    if (expected.length < 32) throw new HttpError(503, 'Webhook authentication is not configured');
    if (!await validAuthorization(request.headers.get('Authorization') || '', expected)) {
      throw new HttpError(401, 'Invalid webhook authorization');
    }
    const body = await request.text();
    if (body.length > 65536) throw new HttpError(413, 'Webhook payload is too large');
    let payload;
    try { payload = JSON.parse(body); }
    catch { throw new HttpError(400, 'Invalid webhook payload'); }
    const event = payload?.event;
    if (!event || typeof event.type !== 'string') throw new HttpError(400, 'Missing webhook event');
    if (event.type === 'TEST') return json({ received: true });

    // Transfers must refresh both the old and new owner. Re-fetch the current
    // subscriber state so duplicate and delayed events cannot replay old grants.
    const candidates = [event.app_user_id, event.original_app_user_id,
      ...(Array.isArray(event.aliases) ? event.aliases : []),
      ...(Array.isArray(event.transferred_from) ? event.transferred_from : []),
      ...(Array.isArray(event.transferred_to) ? event.transferred_to : [])];
    const userIds = [...new Set(candidates.filter(isUserId))];
    if (userIds.length > 100) throw new HttpError(400, 'Too many account identifiers');
    for (const userId of userIds) {
      try { await syncSubscriber(userId); }
      catch (error) {
        // Deleted accounts must not be recreated by a delayed subscription event.
        if (!(error instanceof HttpError && error.status === 404)) throw error;
      }
    }
    return json({ received: true });
  } catch (error) { return errorResponse(error); }
});
