import { HttpError, OWNER_ID } from './security.mjs';

export async function telegramApi(config, method, payload = {}) {
  let response;
  try {
    response = await fetch(`https://api.telegram.org/bot${config.botToken}/${method}`, {
      method: 'POST', redirect: 'error', signal: AbortSignal.timeout(15000),
      headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    });
  } catch { throw new HttpError(503, 'TELEGRAM_UNAVAILABLE', 'Could not reach Telegram.'); }
  const result = await response.json().catch(() => null);
  if (!response.ok || !result?.ok) throw new HttpError(503, 'TELEGRAM_UNAVAILABLE', 'Telegram could not complete the configuration. Confirm that you have started the bot.');
  return result.result;
}

export function ownerMessage(update) {
  const message = update?.message;
  return message?.from?.id === OWNER_ID && message.from.is_bot !== true &&
    message.chat?.type === 'private' && message.chat.id === OWNER_ID ? message : null;
}
