import { createClient } from 'npm:@supabase/supabase-js@2.110.8';

export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, x-client-info, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

export function requiredEnv(name: string): string {
  const value = Deno.env.get(name)?.trim();
  if (!value) throw new HttpError(503, 'Purchase verification is not configured');
  return value;
}

export function adminClient() {
  return createClient(requiredEnv('SUPABASE_URL'), requiredEnv('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export const isUserId = (value: unknown): value is string =>
  typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

type RevenueCatSubscription = {
  store?: string;
  is_sandbox?: boolean;
  refunded_at?: string | null;
};
type RevenueCatEntitlement = {
  product_identifier?: string;
  expires_date?: string | null;
  grace_period_expires_date?: string | null;
};
type RevenueCatResponse = {
  request_date_ms?: number;
  subscriber?: {
    entitlements?: Record<string, RevenueCatEntitlement>;
    subscriptions?: Record<string, RevenueCatSubscription>;
  };
};

export async function syncSubscriber(userId: string, admin = adminClient()) {
  if (!isUserId(userId)) throw new HttpError(400, 'Invalid account');
  const { data: userData, error: userError } = await admin.auth.admin.getUserById(userId);
  if (userError || !userData.user) throw new HttpError(404, 'Account not found');

  const response = await fetch(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(userId)}`, {
    headers: { Authorization: `Bearer ${requiredEnv('REVENUECAT_SECRET_API_KEY')}` },
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new HttpError(502, 'Purchase verification service is unavailable');
  const payload = await response.json() as RevenueCatResponse;
  if (!payload.subscriber || !Number.isFinite(payload.request_date_ms)) {
    throw new HttpError(502, 'Invalid purchase verification response');
  }

  const entitlementId = Deno.env.get('REVENUECAT_ENTITLEMENT_ID') || 'premium';
  const productId = Deno.env.get('REVENUECAT_PRODUCT_ID') || 'com.trxstudio.iskannrxakan.premium.monthly';
  const entitlement = payload.subscriber.entitlements?.[entitlementId];
  const subscription = entitlement?.product_identifier
    ? payload.subscriber.subscriptions?.[entitlement.product_identifier] : undefined;
  const dates = [entitlement?.expires_date, entitlement?.grace_period_expires_date]
    .map((value) => value ? Date.parse(value) : NaN).filter(Number.isFinite);
  const expiry = dates.length ? Math.max(...dates) : null;
  const active = entitlement?.product_identifier === productId && subscription?.store === 'app_store' &&
    !subscription.refunded_at && expiry !== null && expiry > Date.now();

  const snapshot = {
    entitlement_id: entitlementId,
    product_id: entitlement?.product_identifier ?? null,
    is_active: active,
    expires_at: expiry === null ? null : new Date(expiry).toISOString(),
    is_sandbox: subscription?.is_sandbox === true,
    checked_at: new Date(payload.request_date_ms!).toISOString(),
  };
  const { error } = await admin.rpc('record_store_subscription', {
    p_user_id: userId, p_snapshot: snapshot,
  });
  if (error) throw new HttpError(500, 'Could not save confirmed purchase status');
  return { active, expires_at: snapshot.expires_at };
}

export function errorResponse(error: unknown) {
  const status = error instanceof HttpError ? error.status : 500;
  // Do not include provider payloads, email addresses, tokens, or secrets.
  console.error('Premium verification failed', { status });
  return json({ error: error instanceof HttpError ? error.message : 'Purchase verification failed' }, status);
}
