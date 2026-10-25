import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

for (const file of ['public/index.html', 'public/styles.css', 'public/app.js', 'vercel.json']) {
  if (!fs.existsSync(file)) throw new Error(`Missing build file: ${file}`);
}
for (const directory of ['api', 'lib', 'public', 'scripts']) {
  for (const name of fs.readdirSync(directory)) {
    if (/\.(mjs|js)$/.test(name)) execFileSync(process.execPath, ['--check', `${directory}/${name}`], { stdio: 'pipe' });
  }
}
const publicFiles = fs.readdirSync('public').map(name => fs.readFileSync(`public/${name}`, 'utf8')).join('\n');
for (const name of ['TELEGRAM_BOT_TOKEN', 'TELEGRAM_WEBHOOK_SECRET', 'CONFIRMATION_SECRET', 'SUPABASE_SERVICE_ROLE_KEY']) {
  const value = process.env[name];
  if (value && value.length >= 12 && publicFiles.includes(value)) throw new Error('A server credential was found in public assets.');
}
if (/\b(?:\d{8,12}:[A-Za-z0-9_-]{30,}|eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+|SUPABASE_SERVICE_ROLE_KEY|TELEGRAM_BOT_TOKEN|CONFIRMATION_SECRET)\b/.test(publicFiles)) {
  throw new Error('A server credential or credential reference was found in public assets.');
}
console.log('Static files and server functions are ready. No server credentials occur in public assets.');
