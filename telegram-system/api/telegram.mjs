import { HttpError, OWNER_ID, readConfig, sameSecret } from '../lib/security.mjs';
import { json, readJson, respondError } from '../lib/http.mjs';
import { ownerMessage, telegramApi } from '../lib/telegram.mjs';

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') throw new HttpError(405, 'METHOD_NOT_ALLOWED', 'Use POST.');
    const config = readConfig();
    if (!sameSecret(req.headers['x-telegram-bot-api-secret-token'], config.webhookSecret)) throw new HttpError(401, 'WEBHOOK_INVALID', 'This request is not allowed.');
    const update = await readJson(req, 64000);
    const message = ownerMessage(update);
    // Other users, groups, forwarded identities and web_app_data payloads never
    // cause a reply or a membership change. The webhook performs no database work.
    if (!message || typeof message.text !== 'string' || !/^\/(start|system)(?:@[A-Za-z0-9_]+)?(?:\s|$)/i.test(message.text)) return json(res, 200, { ok: true });
    await telegramApi(config, 'sendMessage', {
      chat_id: OWNER_ID, text: 'Iskan System\nYour private member workspace.',
      protect_content: true,
      reply_markup: { inline_keyboard: [[{ text: 'Open System', web_app: { url: config.appUrl } }]] },
    });
    return json(res, 200, { ok: true });
  } catch (error) { return respondError(res, error); }
}
