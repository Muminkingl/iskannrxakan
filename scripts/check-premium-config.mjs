// Configuration diagnostics. A GET may provision the dedicated unpaid probe
// customer in RevenueCat. Never print API keys, tokens, or real customer data.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { X509Certificate } from 'node:crypto';
import pg from 'pg';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
function readEnv(file) {
  return Object.fromEntries(fs.readFileSync(file, 'utf8').split(/\r?\n/).flatMap((line) => {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!match) return [];
    return [[match[1], match[2].trim().replace(/^(['"])(.*)\1$/, '$2')]];
  }));
}
const app = readEnv(path.join(root, '.env'));
const server = readEnv(path.join(root, 'supabase/functions/.env'));
const report = { configuration: {
  clientKeyConfigured: !!app.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY?.startsWith('appl_'),
  serverKeyConfigured: !!server.REVENUECAT_SECRET_API_KEY?.startsWith('sk_'),
  webhookAuthorizationConfigured: /^Bearer [a-f0-9]{64,}$/i.test(server.REVENUECAT_WEBHOOK_AUTHORIZATION || ''),
  identifiersMatch: app.EXPO_PUBLIC_PREMIUM_ENTITLEMENT_ID === server.REVENUECAT_ENTITLEMENT_ID &&
    app.EXPO_PUBLIC_PREMIUM_PRODUCT_ID === server.REVENUECAT_PRODUCT_ID,
  privateKeysAbsentFromApp: !app.REVENUECAT_SECRET_API_KEY && !app.REVENUECAT_WEBHOOK_AUTHORIZATION,
} };
const hiddenValues = [...Object.values(server), app.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY].filter((value) => value && value.length > 15);
function safeMessage(value) {
  let result = String(value ?? '');
  for (const secret of hiddenValues) result = result.replaceAll(secret, '[redacted]');
  return result.slice(0, 400);
}
async function revenueCat(url, key) {
  try {
    const response = await fetch(url, { headers: { Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(15000) });
    const payload = await response.json();
    return { ok: response.ok, status: response.status, payload };
  } catch (error) { return { ok: false, status: 0, payload: { message: safeMessage(error.message) } }; }
}
async function checkRevenueCat() {
  const [offerings, subscriber, publicSubscriber, mapping] = await Promise.all([
    revenueCat('https://api.revenuecat.com/v1/subscribers/iskan-configuration-check/offerings', app.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY),
    revenueCat('https://api.revenuecat.com/v1/subscribers/iskan-configuration-check', server.REVENUECAT_SECRET_API_KEY),
    revenueCat('https://api.revenuecat.com/v1/subscribers/iskan-configuration-check', app.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY),
    revenueCat('https://api.revenuecat.com/v1/product_entitlement_mapping', app.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY),
  ]);
  report.revenueCat = {
    publicKeyAccepted: offerings.ok,
    publicApiStatus: offerings.status,
    publicApiError: offerings.ok ? undefined : safeMessage(offerings.payload.message),
    currentOfferingId: offerings.payload.current_offering_id ?? null,
    offerings: (offerings.payload.offerings ?? []).map((offering) => ({
      identifier: offering.identifier,
      packages: (offering.packages ?? []).map((item) => ({
        identifier: item.identifier,
        product: item.platform_product_identifier,
      })),
    })),
    secretKeyAccepted: subscriber.ok && !!subscriber.payload.subscriber,
    keysResolveSameProjectCustomer: subscriber.ok && publicSubscriber.ok &&
      subscriber.payload.subscriber?.first_seen === publicSubscriber.payload.subscriber?.first_seen &&
      subscriber.payload.subscriber?.original_app_user_id === publicSubscriber.payload.subscriber?.original_app_user_id,
    serverApiStatus: subscriber.status,
    serverApiError: subscriber.ok ? undefined : safeMessage(subscriber.payload.message),
    entitlementMappingStatus: mapping.status,
    productEntitlements: mapping.payload.product_entitlement_mapping?.[app.EXPO_PUBLIC_PREMIUM_PRODUCT_ID]?.entitlements ?? [],
    expectedEntitlementAttached: (mapping.payload.product_entitlement_mapping?.[app.EXPO_PUBLIC_PREMIUM_PRODUCT_ID]?.entitlements ?? []).includes(app.EXPO_PUBLIC_PREMIUM_ENTITLEMENT_ID),
  };
}
async function checkDatabase() {
  if (!app.SUPABASE_DB_URL) { report.database = { configured: false }; return; }
  const certificatePath = path.join(root, '.expo/premium-debug/prod-ca-2021.crt');
  if (!fs.existsSync(certificatePath)) {
    const response = await fetch('https://supabase-downloads.s3.amazonaws.com/prod/ssl/prod-ca-2021.crt');
    if (!response.ok) throw new Error('Could not retrieve the official Supabase CA');
    const certificate = await response.text();
    const parsed = new X509Certificate(certificate);
    if (!parsed.ca || !parsed.subject.includes('Supabase')) throw new Error('Unexpected database CA');
    fs.mkdirSync(path.dirname(certificatePath), { recursive: true });
    fs.writeFileSync(certificatePath, certificate);
  }
  const connection = new URL(app.SUPABASE_DB_URL);
  // pg connection-string SSL flags otherwise overwrite the explicit CA object.
  connection.searchParams.delete('sslmode');
  const client = new pg.Client({ connectionString: connection.toString(),
    ssl: { rejectUnauthorized: true, ca: fs.readFileSync(certificatePath, 'utf8') },
    connectionTimeoutMillis: 10000, query_timeout: 15000 });
  try {
    await client.connect();
    await client.query('begin read only');
    const { rows: [metadata] } = await client.query(`select
      to_regclass('public.store_subscriptions') is not null as store_table_exists,
      to_regprocedure('public.record_store_subscription(uuid,jsonb)') is not null as store_writer_exists,
      to_regprocedure('public.get_my_account_state()') is not null as account_rpc_exists,
      to_regprocedure('public.current_user_role()') is not null as role_helper_exists,
      to_regprocedure('public.is_admin()') is not null as admin_helper_exists,
      to_regprocedure('public.generate_activation_code()') is not null as reference_generator_exists`);
    let accountRpcIncludesStoreAccess = false;
    if (metadata.account_rpc_exists) {
      const { rows: [definition] } = await client.query("select pg_get_functiondef('public.get_my_account_state()'::regprocedure) as source");
      accountRpcIncludesStoreAccess = definition.source.includes('store_premium_active');
    }
    report.database = { connected: true, ...metadata, accountRpcIncludesStoreAccess };
    await client.query('rollback');
  } catch (error) {
    report.database = { connected: false, errorCode: error.code || error.name };
  } finally { await client.end().catch(() => undefined); }
}
async function checkFunctions() {
  const base = app.EXPO_PUBLIC_SUPABASE_URL;
  const probes = [
    ['sync-premium-purchase', undefined],
    ['revenuecat-webhook', undefined],
    ['revenuecat-webhook', server.REVENUECAT_WEBHOOK_AUTHORIZATION],
  ];
  report.functions = await Promise.all(probes.map(async ([name, authorization]) => {
    try {
      const response = await fetch(`${base}/functions/v1/${name}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(authorization ? { Authorization: authorization } : {}) },
        body: JSON.stringify({ event: { type: 'TEST' } }), signal: AbortSignal.timeout(15000),
      });
      const payload = await response.json().catch(() => ({}));
      return { name, authorized: !!authorization, status: response.status,
        received: payload.received === true, error: safeMessage(payload.error ?? payload.message) };
    } catch (error) { return { name, authorized: !!authorization, status: 0, error: safeMessage(error.message) }; }
  }));
}
await Promise.all([checkRevenueCat(), checkDatabase(), checkFunctions()]);
const reportDirectory = path.join(root, '.expo/premium-debug');
fs.mkdirSync(reportDirectory, { recursive: true });
fs.writeFileSync(path.join(reportDirectory, 'configuration-report.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
