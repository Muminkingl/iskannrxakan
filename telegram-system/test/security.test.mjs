import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { test } from 'node:test';
import { authenticate, BOT_ID, CONFIRMATION_MAX_AGE, createConfirmation, OWNER_ID, readConfig, sameSecret, validateFields, verifyConfirmation, verifyTelegramInitData } from '../lib/security.mjs';
import { ownerMessage } from '../lib/telegram.mjs';
import system from '../api/system.mjs';
import webhook from '../api/telegram.mjs';

const now = Math.floor(Date.now() / 1000);
const token = BOT_ID + ':unit_test_bot_secret_that_is_not_a_live_credential';
const config = { botToken: token, appUrl: 'https://system.example.test' };
const env = { TELEGRAM_BOT_TOKEN: token, TELEGRAM_WEBHOOK_SECRET: 'w'.repeat(43), CONFIRMATION_SECRET: 'c'.repeat(43), APP_URL: config.appUrl, SUPABASE_URL: 'https://db.example.test', SUPABASE_SERVICE_ROLE_KEY: 'test-server-key' };
const member = { user_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', manual_revision: 'a'.repeat(32) };
function signed(fields = {}, signer = token) {
  const params = new URLSearchParams({ user: JSON.stringify({ id: OWNER_ID, first_name: 'Owner' }), auth_date: String(now), query_id: 'test', ...fields });
  const check = [...params].sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k}=${v}`).join('\n');
  const key = createHmac('sha256', 'WebAppData').update(signer).digest();
  params.set('hash', createHmac('sha256', key).update(check).digest('hex'));
  return params.toString();
}
const throwsCode = (fn, code) => assert.throws(fn, error => error.code === code);
function response() {
  return { headers: {}, setHeader(k, v) { this.headers[k] = v; }, end(value) { this.body = JSON.parse(value); } };
}
const req = (body, headers = {}) => ({ method: 'POST', headers: { 'content-type': 'application/json', origin: config.appUrl, authorization: 'tma ' + signed(), ...headers }, body });

test('valid Telegram signature authenticates exactly the configured owner', () => {
  assert.equal(verifyTelegramInitData(signed(), token, now).id, OWNER_ID);
});
test('another Telegram user is denied even with a valid signature', () => throwsCode(() => verifyTelegramInitData(signed({ user: JSON.stringify({ id: OWNER_ID + 1 }) }), token, now), 'OWNER_ONLY'));
test('another bot cannot authenticate the owner', () => throwsCode(() => verifyTelegramInitData(signed({}, 'another-bot-token'), token, now), 'SESSION_INVALID'));
test('a forged owner ID without the bot signature is denied', () => throwsCode(() => verifyTelegramInitData(signed({ user: JSON.stringify({ id: 42 }) }).replace('42', String(OWNER_ID)), token, now), 'SESSION_INVALID'));
test('expired and future Telegram sessions are denied', () => {
  for (const auth_date of [String(now - 901), String(now + 31)]) throwsCode(() => verifyTelegramInitData(signed({ auth_date }), token, now), 'SESSION_EXPIRED');
});
test('duplicate fields and malformed hashes cannot bypass validation', () => {
  throwsCode(() => verifyTelegramInitData(signed() + '&user=%7B%22id%22%3A5549806778%7D', token, now), 'SESSION_INVALID');
  throwsCode(() => verifyTelegramInitData('hash=broken&auth_date=1', token, now), 'SESSION_INVALID');
});
test('all signed fields including Telegram signature are verified', () => {
  const valid = signed({ signature: 'telegram-ed25519-signature' });
  assert.equal(verifyTelegramInitData(valid, token, now).id, OWNER_ID);
  throwsCode(() => verifyTelegramInitData(valid.replace('telegram-ed25519', 'altered-ed25519'), token, now), 'SESSION_INVALID');
});
test('same-origin alone never provides authentication', () => {
  throwsCode(() => authenticate({ headers: { origin: config.appUrl } }, config), 'SESSION_INVALID');
  throwsCode(() => authenticate(req({}, { origin: 'https://attacker.example' }), config), 'ORIGIN_DENIED');
  assert.equal(authenticate(req({}), config).id, OWNER_ID);
});
test('confirmation is bound to the target, actor, action, revision and expiry', () => {
  const confirmation = createConfirmation(member, 'grant', env.CONFIRMATION_SECRET, now);
  const decoded = verifyConfirmation(confirmation, 'grant', env.CONFIRMATION_SECRET, now);
  assert.equal(decoded.userId, member.user_id);
  assert.equal(decoded.actor, OWNER_ID);
  assert.equal(decoded.revision, member.manual_revision);
  throwsCode(() => verifyConfirmation(confirmation, 'expire', env.CONFIRMATION_SECRET, now), 'CONFIRMATION_INVALID');
  throwsCode(() => verifyConfirmation(confirmation, 'grant', env.CONFIRMATION_SECRET, now + CONFIRMATION_MAX_AGE), 'CONFIRMATION_INVALID');
  const [body, signature] = confirmation.split('.');
  const altered = JSON.parse(Buffer.from(body, 'base64url').toString());
  altered.userId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  throwsCode(() => verifyConfirmation(Buffer.from(JSON.stringify(altered)).toString('base64url') + '.' + signature, 'grant', env.CONFIRMATION_SECRET, now), 'CONFIRMATION_INVALID');
});
test('changing the confirmation secret invalidates outstanding confirmations', () => {
  const confirmation = createConfirmation(member, 'expire', env.CONFIRMATION_SECRET, now);
  throwsCode(() => verifyConfirmation(confirmation, 'expire', 'd'.repeat(43), now), 'CONFIRMATION_INVALID');
});
test('unknown request fields cannot select a different membership target', () => throwsCode(() => validateFields({ action: 'grant', confirmation: 'signed-token', userId: 'other-user' }, ['action', 'confirmation']), 'INVALID_REQUEST'));
test('incomplete and insecure deployment configurations fail closed', () => {
  assert.equal(readConfig(env).appUrl, config.appUrl);
  for (const changes of [{ APP_URL: '' }, { APP_URL: 'http://system.example.test' }, { APP_URL: config.appUrl + '/other' }, { TELEGRAM_BOT_TOKEN: '123:another' }, { CONFIRMATION_SECRET: '' }, { SUPABASE_SERVICE_ROLE_KEY: '' }]) throwsCode(() => readConfig({ ...env, ...changes }), 'NOT_CONFIGURED');
});
test('only the owner private chat can interact with the bot', () => {
  const message = { from: { id: OWNER_ID }, chat: { id: OWNER_ID, type: 'private' }, text: '/start' };
  assert.ok(ownerMessage({ message }));
  assert.equal(ownerMessage({ message: { ...message, from: { id: 42 } } }), null);
  assert.equal(ownerMessage({ message: { ...message, chat: { id: OWNER_ID, type: 'group' } } }), null);
  assert.equal(ownerMessage({ message: { ...message, chat: { id: 42, type: 'private' } } }), null);
});
test('constant-time secret comparison rejects missing or wrong secrets', () => {
  assert.equal(sameSecret('abc', 'abc'), true);
  assert.equal(sameSecret('abc', 'wrong'), false);
  assert.equal(sameSecret(undefined, 'abc'), false);
});
test('all unauthenticated API actions are rejected before database access', async () => {
  const original = { ...process.env };
  const fetchBefore = globalThis.fetch;
  let requests = 0;
  Object.assign(process.env, env);
  globalThis.fetch = async () => { requests++; throw new Error('Should not reach database'); };
  try {
    for (const action of ['session', 'members', 'lookup', 'prepare_expire', 'grant', 'expire']) {
      const res = response();
      await system(req({ action }, { authorization: '' }), res);
      assert.equal(res.statusCode, 401);
      assert.equal(res.headers['Cache-Control'], 'no-store');
    }
    assert.equal(requests, 0);
  } finally { globalThis.fetch = fetchBefore; process.env = original; }
});
test('a valid signature for a different user cannot use any API action', async () => {
  const original = { ...process.env };
  const fetchBefore = globalThis.fetch;
  let requests = 0;
  Object.assign(process.env, env);
  globalThis.fetch = async () => { requests++; throw new Error('Should not reach database'); };
  try {
    for (const action of ['session', 'members', 'lookup', 'prepare_expire', 'grant', 'expire']) {
      const res = response();
      await system(req({ action }, { authorization: 'tma ' + signed({ user: JSON.stringify({ id: OWNER_ID + 1 }) }) }), res);
      assert.equal(res.statusCode, 403);
    }
    assert.equal(requests, 0);
  } finally { globalThis.fetch = fetchBefore; process.env = original; }
});
test('GET and oversized bodies are denied before membership operations', async () => {
  const original = { ...process.env };
  const fetchBefore = globalThis.fetch;
  let requests = 0;
  Object.assign(process.env, env);
  globalThis.fetch = async () => { requests++; throw new Error('Should not reach database'); };
  try {
    const get = response();
    await system({ ...req({ action: 'members' }), method: 'GET' }, get);
    assert.equal(get.statusCode, 405);
    const large = response();
    await system(req({ action: 'grant', confirmation: 'x'.repeat(17000) }, { 'content-length': '17000' }), large);
    assert.equal(large.statusCode, 413);
    assert.equal(requests, 0);
  } finally { globalThis.fetch = fetchBefore; process.env = original; }
});
test('forged webhook requests are denied before Telegram or database access', async () => {
  const original = { ...process.env };
  const fetchBefore = globalThis.fetch;
  let requests = 0;
  Object.assign(process.env, env);
  globalThis.fetch = async () => { requests++; throw new Error('Should not send'); };
  try {
    const res = response();
    await webhook(req({ message: { from: { id: OWNER_ID } } }), res);
    assert.equal(res.statusCode, 401);
    const other = response();
    await webhook(req({ message: { from: { id: 42 }, chat: { id: 42, type: 'private' }, text: '/start' } }, { 'x-telegram-bot-api-secret-token': env.TELEGRAM_WEBHOOK_SECRET }), other);
    assert.equal(other.statusCode, 200);
    assert.equal(requests, 0);
  } finally { globalThis.fetch = fetchBefore; process.env = original; }
});
test('target overrides on grant/expire and unauthorised origins are rejected', async () => {
  const original = { ...process.env };
  Object.assign(process.env, env);
  try {
    for (const action of ['grant', 'expire']) {
      const res = response();
      await system(req({ action, confirmation: 'not-signed', userId: member.user_id }), res);
      assert.equal(res.statusCode, 400);
    }
    const res = response();
    await system(req({ action: 'members' }, { origin: 'https://attacker.example' }), res);
    assert.equal(res.statusCode, 403);
  } finally { process.env = original; }
});
