# Iskan System

Private Telegram Mini App for manual Premium memberships. This is a standalone
Vercel project: **deploy `telegram-system/`, not the Expo app at the repository root.**

## What it does

- Bot: [@iskannrxakanbot](https://t.me/iskannrxakanbot), displayed as **Iskan System**.
- Only Telegram user **5549806778** can authenticate and use the bot or API.
- The private chat menu button is **System**. `/start` also offers **Open System**.
- Members lists active **manual** subscriptions, with search and pagination.
- Add Member resolves the unique account reference from WhatsApp, shows the
  account, and requires confirmation before granting 30 days.
- An active manual plan gets 30 days added to its existing expiry. An inactive
  plan starts from the database server's current time.
- Expire ends manual access immediately; the account and subscription row remain.
- The existing app recognizes these records through its existing account RPC.
  Access refreshes when the app returns to the foreground or performs its periodic
  account check.

This project never reads or changes Apple subscription records or purchase code.

## Vercel deployment

1. Import this repository into Vercel, or run `npx vercel` from `telegram-system/`.
   For a Git import, the new folder must first be included in a commit that you push.
2. Set **Root Directory** to `telegram-system`.
3. Framework Preset: **Other**. Node.js: **22.x**.
4. Build Command: **`npm run build`**. Output Directory: **`public`**.
5. Add the following **Production** environment variables. The live values are
   already saved locally in the ignored `telegram-system/.env`; use Vercel's
   environment-variable import or copy the values directly into its dashboard.
   Do not commit `.env`, put these values into frontend files, or use a
   `NEXT_PUBLIC_`, `VITE_`, or `EXPO_PUBLIC_` prefix.

   | Variable | Purpose |
   | --- | --- |
   | `TELEGRAM_BOT_TOKEN` | Server token for this exact bot |
   | `TELEGRAM_WEBHOOK_SECRET` | Generated secret for Telegram webhook requests |
   | `CONFIRMATION_SECRET` | Separate generated secret for confirmation tokens |
   | `SUPABASE_URL` | Existing project's HTTPS URL |
   | `SUPABASE_SERVICE_ROLE_KEY` | Server-only database API credential |
   | `APP_URL` | Exact final HTTPS origin, e.g. `https://your-system.vercel.app` |

6. If you do not know the URL yet, deploy the five filled server variables first.
   The API will deny requests until `APP_URL` is set. Copy the permanent production
   URL, add it as `APP_URL`, and **redeploy** so the functions receive it.
7. The deployment must be accessible to Telegram. If Vercel deployment protection
   requires a Vercel login for production, make this production deployment public.
   The app's own authentication still requires the signed Telegram owner session.
   Preview deployments intentionally cannot access a differently configured
   production origin; do not broaden CORS or add an authentication bypass.
8. Open [the bot](https://t.me/iskannrxakanbot) using your allowed Telegram account
   and press **Start**. Send the final HTTPS production URL back in this chat.
   We can then save it and configure the webhook and owner-specific menu button.

No Vercel account or project has been created by the implementation. You control
the deployment. No URL or webhook is registered until the final URL is supplied.

## Finish Telegram setup after deployment

Set `APP_URL` in the local `.env` to the same URL used in Vercel, then run:

```powershell
cd E:\iskannrxakan\telegram-system
npm run telegram:configure
```

The script validates the bot identity, sets the owner-only commands and **System**
menu button, installs the secret-authenticated webhook at `/api/telegram`, and
checks the saved webhook URL. Other users receive no bot replies or member access.
The owner must have started the bot before the private chat menu can be configured.

To inspect bot identity without registering a webhook:

```powershell
npm run telegram:info
```

## Database setup

The additive migration is
`../supabase/migrations/20261025000001_telegram_system.sql`. It adds a private
read view, service-only RPCs, durable rate-limit counters, and an operation audit.
It does not replace the app's account-state function or modify existing manual
memberships when installed. Do not reapply older setup scripts over newer schemas.

For this workspace, installation and transactional verification are performed with:

```powershell
cd E:\iskannrxakan
node scripts/verify-telegram-system.mjs --apply
```

The script uses the existing ignored root database configuration with verified TLS.
Synthetic users, grants, extensions, and expiration checks are rolled back before
the migration is installed. It never runs a membership change on a real member.
For another environment, apply the migration through that environment's normal
database migration process before configuring the bot.

## Request protections

- Every data or mutation request verifies Telegram's bot-specific HMAC signature,
  a 15-minute maximum session age, and the exact numeric owner ID. User IDs from
  browser globals, URL parameters, and request bodies are not authentication.
- The browser sends signed `initData` only in an Authorization header. It is never
  written to cookies, localStorage, analytics, application logs, or API URLs.
- Requests must come from the configured origin and use POST with JSON. There is
  no wildcard CORS configuration. Body sizes, field names, types, and IDs are bounded.
- A confirmation lasts two minutes and binds the actor, target, action, operation
  ID, and current membership revision. Changing a target or action invalidates it.
- Database row locks and revision checks prevent stale confirmations from
  overwriting newer membership changes. Completed operation IDs are idempotent;
  a network retry cannot grant another 30 days.
- Database rate limits survive Vercel restarts: 90 reads and 15 mutations per minute.
- Ordinary Supabase users and anonymous callers have no access to the new view,
  audit/rate tables, or administrative RPCs. Only the server credential can use them.
- The Telegram webhook separately verifies its secret header and sender/private
  chat IDs. It never performs membership operations from incoming text or
  `web_app_data`.
- User-provided names, emails, and references are rendered with `textContent`.
  CSP, no-store caching, no-referrer, and other HTTP headers are in `vercel.json`.
- A leaked website URL reveals only the locked static interface. It does not
  provide signed owner data or access to member information.

Rotate the bot token or either server secret by replacing its local and Vercel
environment values and redeploying. After a webhook secret change, run the Telegram
configuration script again. Signing-secret rotation invalidates pending confirmations.

## Local checks

```powershell
cd E:\iskannrxakan\telegram-system
npm ci
npm run build
npm test
```

Security checks use fake bot tokens and mocked network calls. They never send
messages or make membership changes on production accounts. The live Telegram
launch still needs the final deployed HTTPS URL and an owner interaction in Telegram.

On 25 October 2026, 19 request-security checks and 33 transactional database
checks passed. The migration was installed, the live service RPC responded, and
the anonymous RPC request was rejected with HTTP 401. The actual bot token was
validated and the bot was named **Iskan System**. No webhook is configured yet.

Browser verification at desktop and phone sizes passed for lookup, review/cancel,
grant, expiry, and escaping untrusted names. These use fixture member data through
an isolated local server. Opening the public URL without Telegram shows the lock
screen and makes no member request. To repeat these optional browser checks:

```powershell
node test/ui-smoke.mjs
```

The browser script uses Playwright from the workspace's ignored
`.expo/premium-debug/test-runtime` directory and an installed Edge browser.

Official references: [Telegram Mini App validation](https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app),
[Telegram webhook secrets](https://core.telegram.org/bots/api#setwebhook),
[Vercel Node.js functions](https://vercel.com/docs/functions/runtimes/node-js).
