// Transactional database verification. Synthetic members and grants are always
// rolled back. --apply installs only the migration after verification succeeds.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const env = Object.fromEntries(fs.readFileSync(path.join(root, '.env'), 'utf8').split(/\r?\n/).flatMap(line => {
  const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
  return match ? [[match[1], match[2].trim().replace(/^(['"])(.*)\1$/, '$2')]] : [];
}));
const url = new URL(env.SUPABASE_DB_URL);
url.searchParams.delete('sslmode');
const client = new pg.Client({ connectionString: url.toString(), ssl: { rejectUnauthorized: true, ca: fs.readFileSync(path.join(root, '.expo/premium-debug/prod-ca-2021.crt'), 'utf8') }, connectionTimeoutMillis: 10000, query_timeout: 20000 });
const migration = fs.readFileSync(path.join(root, 'supabase/migrations/20261025000001_telegram_system.sql'), 'utf8');
const checks = [];
const check = (name, assertion) => { assertion(); checks.push(name); };
const scalar = async (query, args = []) => (await client.query(query, args)).rows[0].value;
const reject = async (name, query, args, code) => {
  await client.query('savepoint rejection_check');
  let rejected = false;
  try { await client.query(query, args); } catch (error) { rejected = error.code === code; }
  await client.query('rollback to savepoint rejection_check');
  await client.query('release savepoint rejection_check');
  check(name, () => assert.equal(rejected, true));
};

try {
  await client.connect();
  await client.query('begin');
  await client.query(migration.replace(/^begin;\s*$/m, '').replace(/^commit;\s*$/m, ''));
  const id = randomUUID();
  const other = randomUUID();
  const email = `system-check-${id}@example.invalid`;
  for (const [userId, userEmail] of [[id, email], [other, `system-check-${other}@example.invalid`]]) {
    await client.query("insert into auth.users (id, email, aud, role, raw_app_meta_data, raw_user_meta_data, created_at, updated_at) values ($1,$2,'authenticated','authenticated','{}','{}',now(),now())", [userId, userEmail]);
  }
  const member = await scalar('select public.telegram_system_member($1) as value', [id]);
  check('new account resolves an existing unique reference', () => { assert.ok(member.reference_code); assert.equal(member.manual_active, false); });
  const found = await scalar('select public.telegram_system_lookup($1) as value', [member.reference_code.toLowerCase()]);
  check('reference lookup is exact and case-insensitive', () => assert.equal(found.user_id, id));
  const missing = await scalar("select public.telegram_system_lookup('ISKAN-NOBODY-0000') as value");
  check('unknown reference never resolves another account', () => assert.equal(missing, null));

  const mutation = 'select public.telegram_system_change_membership($1,$2,$3,$4,$5) as value';
  await reject('database rejects another Telegram actor', mutation, [42, 'grant', id, randomUUID(), member.manual_revision], 'PT403');
  await reject('database rejects a changed target revision', mutation, [5549806778, 'grant', id, randomUUID(), '0'.repeat(32)], 'PT409');
  const operation = randomUUID();
  const started = Date.now();
  const grant = await scalar(mutation, [5549806778, 'grant', id, operation, member.manual_revision]);
  check('new manual grant lasts exactly 30 days from activation', () => assert.ok(Math.abs(Date.parse(grant.expiresAt) - started - 30 * 86400000) < 5000));
  const repeated = await scalar(mutation, [5549806778, 'grant', id, operation, member.manual_revision]);
  check('retrying a successful operation cannot add another 30 days', () => assert.deepEqual(repeated, grant));
  await reject('an operation cannot be reused for another member', mutation, [5549806778, 'grant', other, operation, member.manual_revision], 'PT409');
  await reject('an old confirmation cannot apply after a membership change', mutation, [5549806778, 'grant', id, randomUUID(), member.manual_revision], 'PT409');

  const granted = await scalar('select public.telegram_system_member($1) as value', [id]);
  const extended = await scalar(mutation, [5549806778, 'grant', id, randomUUID(), granted.manual_revision]);
  check('an active manual plan is extended by precisely 30 days', () => assert.equal(Date.parse(extended.expiresAt) - Date.parse(grant.expiresAt), 30 * 86400000));
  const page = await scalar('select public.telegram_system_members($1,null,30) as value', [email]);
  check('active members list includes the granted account', () => { assert.equal(page.items.length, 1); assert.equal(page.items[0].user_id, id); });
  await client.query("select set_config('request.jwt.claim.sub', $1, true)", [id]);
  const appBefore = await scalar('select public.get_my_account_state() as value');
  check('existing app account RPC recognizes the manual grant', () => assert.equal(appBefore.is_vip, true));

  const beforeExpire = await scalar('select public.telegram_system_member($1) as value', [id]);
  const expired = await scalar(mutation, [5549806778, 'expire', id, randomUUID(), beforeExpire.manual_revision]);
  const stored = (await client.query('select is_vip,vip_expires_at from public.user_subscriptions where user_id=$1', [id])).rows;
  check('expiration keeps the subscription record and sets it inactive', () => { assert.equal(stored.length, 1); assert.equal(stored[0].is_vip, false); assert.ok(Date.parse(expired.expiresAt) <= Date.now()); });
  const appAfter = await scalar('select public.get_my_account_state() as value');
  check('existing app account RPC recognizes expired manual access', () => assert.equal(appAfter.is_vip, false));
  const afterPage = await scalar('select public.telegram_system_members($1,null,30) as value', [email]);
  check('expired members disappear from the active members list', () => assert.equal(afterPage.items.length, 0));
  const audit = await scalar('select count(*)::integer as value from public.telegram_system_audit where target_user_id=$1', [id]);
  check('each completed operation is audited once', () => assert.equal(audit, 3));

  const functions = ['telegram_system_rate_limit(bigint,text)', 'telegram_system_member(uuid)', 'telegram_system_lookup(text)', 'telegram_system_members(text,uuid,integer)', 'telegram_system_change_membership(bigint,text,uuid,uuid,text)'];
  for (const role of ['anon', 'authenticated']) {
    for (const name of functions) {
      const allowed = await scalar('select has_function_privilege($1,$2,\'execute\') as value', [role, `public.${name}`]);
      check(`${role} cannot execute ${name.split('(')[0]}`, () => assert.equal(allowed, false));
    }
    for (const table of ['telegram_system_accounts', 'telegram_system_audit', 'telegram_system_rate_limits']) {
      const allowed = await scalar('select has_table_privilege($1,$2,\'select\') as value', [role, `public.${table}`]);
      check(`${role} cannot read ${table}`, () => assert.equal(allowed, false));
    }
  }
  await client.query("delete from public.telegram_system_rate_limits where bucket='write'");
  for (let index = 0; index < 15; index++) await client.query("select public.telegram_system_rate_limit(5549806778,'write')");
  await reject('write rate limit is enforced by the database', "select public.telegram_system_rate_limit(5549806778,'write')", [], 'PT429');

  await client.query('rollback');
  if (process.argv.includes('--apply')) {
    await client.query(migration);
    checks.push('migration installed after all transactional checks passed');
  }
  console.log(JSON.stringify({ passed: checks.length, checks, syntheticChangesRolledBack: true, migrationApplied: process.argv.includes('--apply') }, null, 2));
} catch (error) {
  await client.query('rollback').catch(() => {});
  console.error(JSON.stringify({ failure: error.code || error.name, message: error instanceof assert.AssertionError ? error.message : 'Database verification failed; no synthetic changes were committed.' }));
  process.exitCode = 1;
} finally { await client.end(); }
