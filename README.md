Iskan Nrxakan Application Created By "Trx Studio"

## Iskan Premium purchases

Apple purchase integration, Premium branding, and account support are implemented.
Complete [Premium setup](docs/premium-setup.md) before building for submission.
It covers App Store products, RevenueCat, Supabase deployment, and sandbox checks.

## Free-plan rate delivery

Customer devices receive rates from the Cloudflare Worker in
`cloudflare/rates-worker`, not from Supabase Realtime. This keeps customer
traffic independent of the Free-plan Realtime connection limit while Supabase
continues to handle authentication, admin writes, and history.

Before a production build:

1. Apply `scripts/scale-readiness.sql` and `scripts/security-hardening.sql` in
   Supabase.
2. Deploy the Worker using `cloudflare/rates-worker/README.md`.
3. Set `EXPO_PUBLIC_RATES_SNAPSHOT_URL` to the deployed Worker `/rates` URL in
   the EAS environment and in the local build environment.

The app refreshes the snapshot while active, stores the last successful copy in
AsyncStorage, and uses that copy when a temporary network request fails.
