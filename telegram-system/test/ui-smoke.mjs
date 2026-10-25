// Browser UI checks with fixture responses, never production member data.
// Uses the optional Playwright runtime already installed under the app's .expo.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const root = path.resolve(project, '..');
const runtime = createRequire(path.join(root, '.expo/premium-debug/test-runtime/package.json'));
const { chromium } = runtime('playwright');
const tomorrow = new Date(Date.now() + 5 * 86400000).toISOString();
const later = new Date(Date.now() + 24 * 86400000).toISOString();
const makeMember = (id, name, reference, expiry) => ({ id, name, email: name.toLowerCase().replaceAll(' ', '.') + '@example.test', reference, manualActive: !!expiry, manualExpiresAt: expiry, activeUntil: expiry });
const darin = makeMember('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Darin Ahmed', 'ISKAN-A7F3K9', later);
const mina = makeMember('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Mina Karim', 'ISKAN-K9M2L4', tomorrow);
const sara = makeMember('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'Sara Ali', 'CHYA-9D66D8', null);
let members;
let calls;
const headers = JSON.parse(fs.readFileSync(path.join(project, 'vercel.json'), 'utf8')).headers[0].headers;
const server = http.createServer(async (req, res) => {
  for (const { key, value } of headers) res.setHeader(key, value);
  if (req.url === '/api/system') {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = JSON.parse(Buffer.concat(chunks).toString());
    calls.push(body);
    res.setHeader('Content-Type', 'application/json');
    if (req.headers.authorization !== 'tma ui-fixture-only') { res.writeHead(401).end(JSON.stringify({ message: 'Private workspace' })); return; }
    let result;
    if (body.action === 'session') result = { owner: { id: 5549806778, expiresAt: Date.now() + 900000 } };
    if (body.action === 'members') result = { items: members.filter(m => m.manualActive), nextCursor: null, stats: { active: members.filter(m => m.manualActive).length, expiringSoon: 1 } };
    if (body.action === 'lookup') result = { member: members.find(m => m.reference === body.reference), confirmation: 'fixture-grant' };
    if (body.action === 'prepare_expire') result = { member: members.find(m => m.id === body.userId), confirmation: 'fixture-expire' };
    if (body.action === 'grant') { assert.deepEqual(Object.keys(body).sort(), ['action', 'confirmation']); assert.equal(body.confirmation, 'fixture-grant'); members[2].manualActive = true; members[2].manualExpiresAt = new Date(Date.now() + 30 * 86400000).toISOString(); result = { ok: true, expiresAt: members[2].manualExpiresAt }; }
    if (body.action === 'expire') { assert.deepEqual(Object.keys(body).sort(), ['action', 'confirmation']); assert.equal(body.confirmation, 'fixture-expire'); members[0].manualActive = false; result = { ok: true, expiresAt: new Date().toISOString() }; }
    res.end(JSON.stringify(result));
    return;
  }
  const files = { '/': 'index.html', '/app.js': 'app.js', '/styles.css': 'styles.css' };
  const file = files[req.url];
  if (!file) { res.writeHead(404).end(); return; }
  res.setHeader('Content-Type', file.endsWith('.js') ? 'text/javascript' : file.endsWith('.css') ? 'text/css' : 'text/html');
  res.end(fs.readFileSync(path.join(project, 'public', file)));
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const url = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  for (const [label, viewport] of [['desktop', { width: 1280, height: 1000 }], ['phone', { width: 390, height: 844 }]]) {
    members = structuredClone([darin, mina, sara]);
    calls = [];
    const context = await browser.newContext({ viewport });
    await context.route('https://telegram.org/js/**', route => route.fulfill({ contentType: 'text/javascript', body: 'window.Telegram={WebApp:{initData:"ui-fixture-only",ready(){},expand(){},setHeaderColor(){},setBackgroundColor(){}}};' }));
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(url);
    await page.getByText('Darin Ahmed', { exact: true }).waitFor();
    assert.equal(await page.locator('#stat-active').textContent(), '2');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: path.join(root, `.expo/premium-debug/telegram-system-${label}.png`), fullPage: true });
    await page.getByRole('button', { name: 'Add member', exact: false }).click();
    await page.getByLabel('Account reference', { exact: true }).fill('CHYA-9D66D8');
    await page.getByRole('button', { name: 'Find member', exact: false }).click();
    await page.getByText('Sara Ali', { exact: true }).waitFor();
    await page.screenshot({ path: path.join(root, `.expo/premium-debug/telegram-system-add-${label}.png`), fullPage: true });
    assert.equal(calls.filter(c => c.action === 'grant').length, 0);
    await page.getByRole('button', { name: 'Review 30-day subscription' }).click();
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();
    assert.equal(calls.filter(c => c.action === 'grant').length, 0);
    await page.getByRole('button', { name: 'Review 30-day subscription' }).click();
    await page.getByRole('button', { name: 'Confirm 30 days', exact: true }).click();
    await page.getByText('Premium active until', { exact: false }).waitFor();
    await page.getByRole('button', { name: 'Expire manual access for Darin Ahmed' }).click();
    await page.getByRole('button', { name: 'Expire access', exact: true }).click();
    await page.getByText('Manual subscription expired.', { exact: true }).waitFor();
    await page.locator('#member-list').getByText('Darin Ahmed', { exact: true }).waitFor({ state: 'detached' });
    members[1].name = '<img src=x onerror="window.injected=true">';
    await page.getByRole('button', { name: 'Reload members' }).click();
    await page.getByText(members[1].name, { exact: true }).waitFor();
    assert.equal(await page.evaluate(() => window.injected), undefined);
    assert.deepEqual(errors, []);
    assert.equal(calls.filter(c => c.action === 'grant').length, 1);
    assert.equal(calls.filter(c => c.action === 'expire').length, 1);
    await context.close();
    console.log(`${label}: member list, reference lookup, confirmation/cancel, grant, expire, text escaping and no uncaught errors passed`);
  }
  calls = [];
  const direct = await browser.newContext();
  await direct.route('https://telegram.org/js/**', route => route.fulfill({ contentType: 'text/javascript', body: '' }));
  const page = await direct.newPage();
  await page.goto(url);
  await page.getByText('A private workspace.', { exact: true }).waitFor();
  assert.equal(await page.locator('#workspace').isVisible(), false);
  assert.equal(calls.length, 0);
  await direct.close();
  console.log('Direct public URL: locked interface, no member data requested');
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
