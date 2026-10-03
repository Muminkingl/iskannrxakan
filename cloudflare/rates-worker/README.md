# Iskan Nrxakan rate snapshot Worker

This Worker is the public, read-only delivery layer for customer rates. It
reads only the `rates` table from Supabase and caches one compact JSON snapshot
for 30 seconds at Cloudflare's edge. The mobile app refreshes that snapshot on
launch, when returning to the foreground, and every five minutes while active.
It never opens a Supabase Realtime channel for customer rates.

The five-minute client interval is deliberate: Cloudflare Workers Free has a
100,000-request daily limit. The CDN cache protects Supabase, while the local
snapshot cache keeps the app usable during a temporary Worker outage.

## Deploy once

Install and authenticate Wrangler with the Cloudflare account that owns the
Worker:

```bash
npm install --global wrangler
wrangler login
cd cloudflare/rates-worker
wrangler secret put SUPABASE_ANON_KEY
wrangler deploy
```

When prompted for `SUPABASE_ANON_KEY`, paste the Supabase **anon/public** key.
Never put a `service_role` key in this Worker or in the app. The Worker should
expose only the public `rates` data.

The deployed endpoint is:

```text
https://iskan-nrxakan-rates.<your-subdomain>.workers.dev/rates
```

Set that URL as `EXPO_PUBLIC_RATES_SNAPSHOT_URL` in the EAS environment used for
the app build. The app also stores the last successful snapshot locally, so a
temporary network or Worker failure keeps the last known rates visible.

## Supabase read policy

The Worker uses the anon key, so the `rates` table must allow public reads. Apply
`scripts/scale-readiness.sql` in the Supabase SQL editor before deploying.
