import { adminClient, corsHeaders, errorResponse, HttpError, json, syncSubscriber } from '../_shared/revenuecat.ts';

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  try {
    const token = request.headers.get('Authorization')?.match(/^Bearer (.+)$/i)?.[1];
    if (!token) throw new HttpError(401, 'Sign in is required');
    const admin = adminClient();
    // Verify with Supabase Auth; never trust decoded JWT claims or a body user ID.
    const { data, error } = await admin.auth.getUser(token);
    if (error || !data.user) throw new HttpError(401, 'Invalid session');
    return json(await syncSubscriber(data.user.id, admin));
  } catch (error) { return errorResponse(error); }
});
