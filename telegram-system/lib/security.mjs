import { createHash, createHmac, randomUUID, timingSafeEqual } from 'node:crypto';

export const OWNER_ID = 5549806778;
export const BOT_ID = '8114345331';
export const SESSION_MAX_AGE = 15 * 60;
export const CONFIRMATION_MAX_AGE = 2 * 60;

export class HttpError extends Error {
  constructor(status, code, message) { super(message); this.status = status; this.code = code; }
}

export function sameSecret(left, right) {
  if (typeof left !== 'string' || typeof right !== 'string') return false;
  return timingSafeEqual(createHash('sha256').update(left).digest(), createHash('sha256').update(right).digest());
}

export function readConfig(env = process.env) {
  const botToken = env.TELEGRAM_BOT_TOKEN;
  if (!botToken?.startsWith(BOT_ID + ':') || !/^[0-9]+:[A-Za-z0-9_-]{30,}$/.test(botToken) ||
      !/^[A-Za-z0-9_-]{32,256}$/.test(env.TELEGRAM_WEBHOOK_SECRET || '') ||
      (env.CONFIRMATION_SECRET || '').length < 43) {
    throw new HttpError(503, 'NOT_CONFIGURED', 'System configuration is incomplete.');
  }
  let appUrl;
  let databaseUrl;
  try {
    appUrl = new URL(env.APP_URL);
    databaseUrl = new URL(env.SUPABASE_URL);
  } catch { throw new HttpError(503, 'NOT_CONFIGURED', 'System configuration is incomplete.'); }
  if (appUrl.protocol !== 'https:' || appUrl.username || appUrl.password || appUrl.search || appUrl.hash || appUrl.pathname !== '/' ||
      databaseUrl.protocol !== 'https:' || databaseUrl.username || databaseUrl.password || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new HttpError(503, 'NOT_CONFIGURED', 'System configuration is incomplete.');
  }
  return {
    botToken, webhookSecret: env.TELEGRAM_WEBHOOK_SECRET,
    confirmationSecret: env.CONFIRMATION_SECRET, appUrl: appUrl.origin,
    supabaseUrl: databaseUrl.origin, serviceKey: env.SUPABASE_SERVICE_ROLE_KEY,
  };
}

export function verifyTelegramInitData(raw, botToken, now = Math.floor(Date.now() / 1000)) {
  const unauthorized = () => new HttpError(401, 'SESSION_INVALID', 'Open System from the Telegram bot to sign in.');
  if (typeof raw !== 'string' || !raw || Buffer.byteLength(raw) > 12000) throw unauthorized();
  const params = new URLSearchParams(raw);
  const keys = [...params.keys()];
  if (keys.length !== new Set(keys).size) throw unauthorized();
  const suppliedHash = params.get('hash');
  if (!/^[a-fA-F0-9]{64}$/.test(suppliedHash || '')) throw unauthorized();
  params.delete('hash');
  // Telegram's HMAC algorithm includes every other field, including signature
  // when supplied. Never deserialize or trust user data before this comparison.
  const checkString = [...params].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)
    .map(([key, value]) => `${key}=${value}`).join('\n');
  const key = createHmac('sha256', 'WebAppData').update(botToken).digest();
  const expected = createHmac('sha256', key).update(checkString).digest();
  if (!timingSafeEqual(expected, Buffer.from(suppliedHash, 'hex'))) throw unauthorized();
  const authDate = Number(params.get('auth_date'));
  if (!/^\d+$/.test(params.get('auth_date') || '') || !Number.isSafeInteger(authDate) || authDate > now + 30 || now - authDate > SESSION_MAX_AGE) {
    throw new HttpError(401, 'SESSION_EXPIRED', 'Your session has expired. Close System and open it again from the bot.');
  }
  let user;
  try { user = JSON.parse(params.get('user') || 'null'); } catch { throw unauthorized(); }
  if (!user || user.id !== OWNER_ID || user.is_bot === true) {
    throw new HttpError(403, 'OWNER_ONLY', 'This System is private.');
  }
  return { id: OWNER_ID, expiresAt: (authDate + SESSION_MAX_AGE) * 1000 };
}

export function authenticate(req, config) {
  // Browser origins are an extra boundary; the Telegram signature is always
  // required, including when a non-browser client forges an Origin header.
  if (req.headers.origin !== config.appUrl) throw new HttpError(403, 'ORIGIN_DENIED', 'This request is not allowed.');
  const header = req.headers.authorization;
  if (typeof header !== 'string' || !header.startsWith('tma ')) {
    throw new HttpError(401, 'SESSION_INVALID', 'Open System from the Telegram bot to sign in.');
  }
  return verifyTelegramInitData(header.slice(4), config.botToken);
}

export function createConfirmation(member, action, secret, now = Math.floor(Date.now() / 1000)) {
  const payload = {
    version: 1, actor: OWNER_ID, action, userId: member.user_id,
    revision: member.manual_revision, operationId: randomUUID(), issuedAt: now,
    expiresAt: now + CONFIRMATION_MAX_AGE,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = createHmac('sha256', secret).update(encoded).digest('base64url');
  return `${encoded}.${signature}`;
}

export function verifyConfirmation(token, action, secret, now = Math.floor(Date.now() / 1000)) {
  const invalid = () => new HttpError(409, 'CONFIRMATION_INVALID', 'Please look up this member again and confirm the change.');
  if (typeof token !== 'string' || token.length > 1600) throw invalid();
  const parts = token.split('.');
  if (parts.length !== 2 || !/^[A-Za-z0-9_-]+$/.test(parts[0]) || !/^[A-Za-z0-9_-]{43}$/.test(parts[1])) throw invalid();
  const expected = createHmac('sha256', secret).update(parts[0]).digest('base64url');
  if (!sameSecret(parts[1], expected)) throw invalid();
  let payload;
  try { payload = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8')); } catch { throw invalid(); }
  if (payload.version !== 1 || payload.actor !== OWNER_ID || payload.action !== action ||
      !isUuid(payload.userId) || !isUuid(payload.operationId) || !/^[a-f0-9]{32}$/.test(payload.revision || '') ||
      !Number.isSafeInteger(payload.issuedAt) || !Number.isSafeInteger(payload.expiresAt) ||
      payload.issuedAt > now + 5 || payload.expiresAt <= now || payload.expiresAt - payload.issuedAt !== CONFIRMATION_MAX_AGE) throw invalid();
  return payload;
}

export function isUuid(value) {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export function validateFields(body, allowed) {
  if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some(key => !allowed.includes(key))) {
    throw new HttpError(400, 'INVALID_REQUEST', 'The request is invalid.');
  }
}
