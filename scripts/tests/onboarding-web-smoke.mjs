// Run after: npx expo export --platform web --output-dir .expo/premium-debug/web-fix
// Runtime: npm install --prefix .expo/premium-debug/test-runtime --no-package-lock --no-audit --no-fund playwright
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const runtime = createRequire(path.join(root, '.expo/premium-debug/test-runtime/package.json'));
const { chromium } = runtime('playwright');
const exportRoot = path.join(root, '.expo/premium-debug/web-fix');
const contentTypes = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.ttf': 'font/ttf' };
const server = http.createServer((request, response) => {
  let file = path.resolve(exportRoot, '.' + decodeURIComponent(new URL(request.url, 'http://localhost').pathname));
  if (file !== exportRoot && !file.startsWith(exportRoot + path.sep)) { response.writeHead(403).end(); return; }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file) && fs.existsSync(file + '.html')) file += '.html';
  if (!fs.existsSync(file)) { response.writeHead(404).end(); return; }
  response.setHeader('Content-Type', contentTypes[path.extname(file)] ?? 'application/octet-stream');
  fs.createReadStream(file).pipe(response);
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
let browser;
try {
  browser = await chromium.launch({ channel: 'msedge', headless: true });
  for (const [label, viewport] of [['desktop', { width: 1280, height: 900 }], ['phone', { width: 390, height: 844 }]]) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`http://127.0.0.1:${server.address().port}/`);
    await page.getByText('The rate you need,', { exact: false }).waitFor();
    await page.waitForTimeout(400); // Let the slide's FadeIn animation finish.
    await page.screenshot({ path: path.join(root, `.expo/premium-debug/onboarding-${label}.png`) });
    if (label === 'desktop') {
      await page.getByText('Continue', { exact: true }).click();
      await page.getByText('One trusted place', { exact: false }).waitFor();
      await page.getByText('Continue', { exact: true }).click();
      await page.getByText('Make your next move', { exact: false }).waitFor();
      await page.getByText('Get started', { exact: true }).click();
    } else {
      await page.getByText('Skip', { exact: true }).click();
    }
    await page.getByText('Continue with Google', { exact: true }).waitFor();
    await page.waitForFunction(() => localStorage.getItem('onboarding_completed_v1') === '1');
    await page.reload();
    await page.getByText('Continue with Google', { exact: true }).waitFor();
    assert.equal(await page.getByText('The rate you need,', { exact: false }).count(), 0);
    assert.deepEqual(errors, []);
    console.log(`${label}: first launch, completion/skip, persistence, reload, and no uncaught errors passed`);
    await context.close();
  }
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
