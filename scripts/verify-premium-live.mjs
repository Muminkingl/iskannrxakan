// Creates one temporary test account, exercises the deployed free/manual access
// paths, then removes the test account and its records. Never purchases anything.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID, randomBytes } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

if (!process.argv.includes('--allow-test-account')) {
  throw new Error('Pass --allow-test-account to permit creating and cleaning up a temporary account.');
}
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
function readEnv(file) {
  return Object.fromEntries(fs.readFileSync(file, 'utf8').split(/\r?\n/).flatMap((line) => {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    return match ? [[match[1], match[2].trim().replace(/^(['"])(.*)\1$/, '$2')]] : [];
  }));
}
const env = readEnv(path.join(root, '.env'));
const server = readEnv(path.join(root, 'supabase/functions/.env'));
const options = { auth: { persistSession: false, autoRefreshToken: false } };
const admin = createClient(env.EXPO_PUBLIC_SUPABASE_URL, env.ANON_SECURE, options);
const customer = createClient(env.EXPO_PUBLIC_SUPABASE_URL, env.EXPO_PUBLIC_SUPABASE_ANON_KEY, options);
const marker = randomUUID();
const email = `iskan-premium-debug-${marker}@example.com`;
const password = randomBytes(32).toString('base64url');
const report = { checks: [], cleanup: {}, realAppleTransactionTested: false };
let userId;
let token;
function check(name, passed, details) {
  report.checks.push({ name, passed, ...(details ? { details } : {}) });
  console.log(JSON.stringify({ check: name, passed }));
  if (!passed) throw new Error(name);
}
async function callFunction(name, authorization, body = {}) {
  const response = await fetch(`${env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/${name}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...(authorization ? { Authorization: authorization } : {}) },
    body: JSON.stringify(body), signal: AbortSignal.timeout(30000),
  });
  return { status: response.status, body: await response.json() };
}
async function account() {
  const { data, error } = await customer.rpc('get_my_account_state');
  if (error) throw new Error(`account_rpc_${error.code}`);
  return data;
}
try {
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email, password, email_confirm: true, user_metadata: { iskan_premium_debug_marker: marker },
  });
  check('temporary_account_created', !createError && !!created.user);
  userId = created.user.id;
  let { data: signedIn, error: signInError } = await customer.auth.signInWithPassword({ email, password });
  if (signInError) {
    // Social-login-only projects can disable password sign-in. Generate an
    // admin-owned test link without sending email or enabling another provider.
    const { data: link, error: linkError } = await admin.auth.admin.generateLink({ type: 'magiclink', email });
    if (!linkError && link.properties?.hashed_token) {
      ({ data: signedIn, error: signInError } = await customer.auth.verifyOtp({
        token_hash: link.properties.hashed_token, type: 'magiclink',
      }));
    }
  }
  check('real_customer_session_verified', !signInError && signedIn.user?.id === userId,
    { authErrorCode: signInError?.code, authStatus: signInError?.status });
  token = signedIn.session.access_token;

  const initial = await account();
  check('new_customer_starts_without_premium', initial.is_vip === false && initial.store_premium_active === false && initial.role === 'user');
  // Existing signup triggers may use a different reference format. Preserve
  // their stored code instead of imposing the client fallback's six characters.
  check('reference_code_provisioned_and_stable', typeof initial.activation_code === 'string' && initial.activation_code.length > 0 && (await account()).activation_code === initial.activation_code);
  const { data: requests, error: requestsError } = await admin.from('payment_requests').select('id').eq('user_id', userId);
  check('account_bootstrap_creates_no_activation_request', !requestsError && requests.length === 0);

  const sync = await callFunction('sync-premium-purchase', `Bearer ${token}`);
  check('authenticated_server_to_revenuecat_to_database_sync', sync.status === 200 && sync.body.active === false, { status: sync.status, error: sync.body.error });
  const { data: store, error: storeError } = await customer.from('store_subscriptions').select('is_active').eq('user_id', userId).single();
  check('customer_can_read_only_confirmed_store_status', !storeError && store.is_active === false);

  const { error: insertError } = await customer.from('store_subscriptions').upsert({
    user_id: userId, entitlement_id: 'premium', is_active: true, checked_at: new Date().toISOString(),
  });
  check('customer_cannot_write_store_access', insertError?.code === '42501');
  const { error: grantError } = await customer.rpc('record_store_subscription', { p_user_id: userId, p_snapshot: {} });
  check('customer_cannot_call_server_grant_function', grantError?.code === '42501');

  const rejected = await callFunction('sync-premium-purchase', 'Bearer invalid-token');
  check('invalid_session_rejected', rejected.status === 401);
  const invalidWebhook = await callFunction('revenuecat-webhook', 'Bearer invalid-authorization', { event: { type: 'TEST' } });
  check('invalid_webhook_authorization_rejected', invalidWebhook.status === 401);
  const acceptedWebhook = await callFunction('revenuecat-webhook', server.REVENUECAT_WEBHOOK_AUTHORIZATION, { event: { type: 'TEST' } });
  check('valid_webhook_test_accepted', acceptedWebhook.status === 200 && acceptedWebhook.body.received === true);

  const inventedEvent = await callFunction('revenuecat-webhook', server.REVENUECAT_WEBHOOK_AUTHORIZATION, {
    event: { type: 'INITIAL_PURCHASE', id: randomUUID(), app_user_id: userId,
      product_id: env.EXPO_PUBLIC_PREMIUM_PRODUCT_ID, expiration_at_ms: Date.now() + 30 * 86400000 },
  });
  check('webhook_rechecks_provider_instead_of_trusting_event_grants', inventedEvent.status === 200 && (await account()).is_vip === false);

  const { error: manualError } = await admin.from('user_subscriptions').upsert({
    user_id: userId, email, is_vip: true,
    vip_expires_at: new Date(Date.now() + 30 * 86400000).toISOString(), updated_at: new Date().toISOString(),
  }, { onConflict: 'email' });
  check('temporary_manual_access_recorded', !manualError);
  const manuallyActive = await account();
  check('existing_manual_access_is_preserved', manuallyActive.is_vip === true && manuallyActive.store_premium_active === false);
  await callFunction('sync-premium-purchase', `Bearer ${token}`);
  check('inactive_apple_status_does_not_remove_manual_access', (await account()).is_vip === true);

  const { error: expireError } = await admin.from('user_subscriptions').update({
    vip_expires_at: new Date(Date.now() - 86400000).toISOString(),
  }).eq('user_id', userId).eq('email', email);
  check('expired_manual_access_loses_premium', !expireError && (await account()).is_vip === false);
} catch (error) {
  report.failure = { check: error.message, type: error.name };
  process.exitCode = 1;
} finally {
  if (userId) {
    const { data: identity } = await admin.auth.admin.getUserById(userId);
    if (identity.user?.user_metadata?.iskan_premium_debug_marker !== marker) {
      report.cleanup.identityCheckFailed = true;
      process.exitCode = 1;
    } else {
      const rcResponse = await fetch(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(userId)}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${server.REVENUECAT_SECRET_API_KEY}` },
        signal: AbortSignal.timeout(15000),
      }).catch(() => null);
      report.cleanup.revenueCatTestCustomerRemoved = !!rcResponse && (rcResponse.ok || rcResponse.status === 404);
      for (const [table, column, value] of [
        ['payment_requests', 'user_id', userId], ['store_subscriptions', 'user_id', userId],
        ['user_subscriptions', 'email', email], ['subscriptions', 'email', email],
        ['profiles', 'id', userId], ['deleted_accounts', 'email', email],
      ]) {
        const { error } = await admin.from(table).delete().eq(column, value);
        if (error) report.cleanup[`${table}Error`] = error.code;
      }
      const { error: deletionError } = await admin.auth.admin.deleteUser(userId);
      report.cleanup.supabaseTestUserRemoved = !deletionError;
      if (deletionError) process.exitCode = 1;
    }
  }
  const directory = path.join(root, '.expo/premium-debug');
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, 'end-to-end-report.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ cleanup: report.cleanup, failure: report.failure, realAppleTransactionTested: false }, null, 2));
}
