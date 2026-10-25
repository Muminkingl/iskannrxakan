import { BOT_ID, OWNER_ID, readConfig } from '../lib/security.mjs';
import { telegramApi } from '../lib/telegram.mjs';

try {
  const infoOnly = process.argv.includes('--info');
  const prepareOnly = process.argv.includes('--prepare');
  const config = infoOnly || prepareOnly ? { botToken: process.env.TELEGRAM_BOT_TOKEN } : readConfig();
  if (!config.botToken?.startsWith(BOT_ID + ':')) throw new Error('The configured bot token does not match this System bot.');
  const bot = await telegramApi(config, 'getMe');
  if (String(bot.id) !== BOT_ID) throw new Error('Unexpected bot identity.');
  if (infoOnly) {
    const [webhook, profile] = await Promise.all([telegramApi(config, 'getWebhookInfo'), telegramApi(config, 'getMyName')]);
    console.log(JSON.stringify({ botId: bot.id, username: bot.username, name: profile.name || bot.first_name, webhookConfigured: !!webhook.url, pendingUpdates: webhook.pending_update_count }, null, 2));
  } else {
    // Run only after the database migration and canonical deployment are ready.
    // This changes the private bot's configuration; it never grants membership.
    await telegramApi(config, 'setMyName', { name: 'Iskan System' });
    await telegramApi(config, 'setMyDescription', { description: 'Private Iskan membership administration.' });
    await telegramApi(config, 'setMyShortDescription', { short_description: 'Iskan System · Private workspace' });
    await telegramApi(config, 'setMyCommands', { commands: [], scope: { type: 'default' } });
    await telegramApi(config, 'setChatMenuButton', { menu_button: { type: 'commands' } });
    if (prepareOnly) {
      console.log(JSON.stringify({ prepared: true, bot: `https://t.me/${bot.username}`, name: 'Iskan System', ownerId: OWNER_ID, deploymentUrlPending: true }, null, 2));
      process.exit(0);
    }
    await telegramApi(config, 'setMyCommands', { scope: { type: 'chat', chat_id: OWNER_ID }, commands: [{ command: 'start', description: 'Open your private System' }, { command: 'system', description: 'Manage manual memberships' }] });
    await telegramApi(config, 'setChatMenuButton', { chat_id: OWNER_ID, menu_button: { type: 'web_app', text: 'System', web_app: { url: config.appUrl } } });
    await telegramApi(config, 'setWebhook', { url: `${config.appUrl}/api/telegram`, secret_token: config.webhookSecret, allowed_updates: ['message'], drop_pending_updates: false });
    const webhook = await telegramApi(config, 'getWebhookInfo');
    if (webhook.url !== `${config.appUrl}/api/telegram`) throw new Error('The webhook URL was not saved.');
    console.log(JSON.stringify({ configured: true, bot: `https://t.me/${bot.username}`, ownerId: OWNER_ID, button: 'System', url: config.appUrl, pendingUpdates: webhook.pending_update_count }, null, 2));
  }
} catch (error) {
  // Error messages are controlled locally; never print HTTP errors with URLs
  // because Telegram API URLs contain the live bot token.
  console.error(error.message?.includes('https://') ? 'Telegram configuration failed.' : error.message || 'Telegram configuration failed.');
  process.exitCode = 1;
}
