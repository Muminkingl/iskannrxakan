# Iskan Premium: Apple purchase setup

For deployment and test results from 23 October 2026, see
[Premium verification](premium-verification.md). The instructions below remain a
reference for setting up a new environment; the current project is now configured
and its server functions are deployed.

The client integration and Supabase functions are implemented. A new environment
requires an Apple product, RevenueCat account, server secrets, and deployment
before purchases become available.

The prepared Apple plan is a **monthly auto-renewing subscription**. Its price is
read from the App Store product at runtime. Existing manual access remains valid;
Apple access is recorded separately, and the later active expiry determines access.

## 1. App Store Connect

1. Complete the Paid Apps Agreement, banking, and tax information.
2. Open the app with bundle ID `com.trxstudio.iskannrxakan`.
3. Create a subscription group named **Iskan Premium**.
4. Add an auto-renewing product:

   | Setting | Value |
   | --- | --- |
   | Product ID | `com.trxstudio.iskannrxakan.premium.monthly` |
   | Display name | Iskan Premium Monthly |
   | Duration | 1 month |
   | Price | Choose the business's price in App Store Connect |

5. Complete the product's localizations, availability, review screenshot, and
   required metadata. Submit the first subscription with the app version.
6. Publish the updated privacy policy and provide its public URL in App Store
   Connect. Review the App Privacy disclosures for the purchase data processed by
   Apple and RevenueCat. The app displays its privacy policy and terms internally.

Apple subscriptions use Apple's calendar-month periods, renewal times, and grace
periods. They do not use the manual administration feature's fixed 30-day expiry.

## 2. RevenueCat

1. Create a project and connect its Apple app to App Store Connect using credentials
   configured in RevenueCat's dashboard. Do not put those private credentials in
   the app or this repository.
2. Import the product from step 1.
3. Create entitlement **`premium`** and attach that product.
4. Add it to the monthly package of an offering and mark the offering as current.
5. For this account-based app, choose **Keep with original App User ID** as the
   restore behavior. Purchasers restore while signed into the same app account.
   This avoids moving one user's purchase into a different Supabase account.
6. Copy the Apple **public SDK key** (`appl_...`) into the client setting below.

The SDK identifies customers by their Supabase user UUID, never their support
reference code. Support references remain available for human account lookup.

## 3. App and EAS configuration

Copy the settings in `.env.premium.example` into the local `.env`. Also set them in
the EAS **production** environment through the EAS dashboard or CLI:

```dotenv
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=appl_YOUR_PUBLIC_APP_KEY
EXPO_PUBLIC_PREMIUM_ENTITLEMENT_ID=premium
EXPO_PUBLIC_PREMIUM_PRODUCT_ID=com.trxstudio.iskannrxakan.premium.monthly
EXPO_PUBLIC_PREMIUM_OFFERING_ID=
```

The offering ID is optional; empty uses RevenueCat's current offering. If you
change the product or entitlement ID, update both the client and server settings.
The current implementation only offers the configured product with a `P1M`
subscription period. A non-renewing 30-day product needs a different product and
expiry strategy; do not substitute a consumable product for this subscription.

Public environment values are embedded in the bundle, so rebuild after changing
them. Purchase support requires a native development or production build; it
cannot be tested in Expo Go. Android and web keep account access and support;
this integration only exposes Apple purchase controls on iOS.

## 4. Supabase database and functions

Apply `scripts/security-hardening.sql` if it has not already been applied, then
apply `supabase/migrations/20261023000001_premium_store_access.sql` in the Supabase
SQL editor. Reapply the Premium migration if an older setup script later replaces
`get_my_account_state()`.

The migration:

- Adds `store_subscriptions`, readable only by its owner and admins, writable only
  through server credentials.
- Lets the existing account-state RPC combine manual and Apple access without
  modifying either source's expiry.
- Keeps existing profile reference codes. For accounts without a stored code,
  preserves the prior deterministic reference where available and provisions a
  profile without creating a payment request. Hash collisions get a unique code.
- Uses RevenueCat's snapshot timestamp to ignore older concurrent updates.
- Removes Apple status automatically when its Supabase user is deleted.

Copy `supabase/functions/.env.example` to `supabase/functions/.env`, then fill:

```dotenv
REVENUECAT_SECRET_API_KEY=YOUR_SERVER_API_KEY
REVENUECAT_WEBHOOK_AUTHORIZATION=YOUR_RANDOM_AUTHORIZATION_VALUE
REVENUECAT_ENTITLEMENT_ID=premium
REVENUECAT_PRODUCT_ID=com.trxstudio.iskannrxakan.premium.monthly
```

Generate the webhook Authorization value independently; it is not your RevenueCat
API key. For example, generate `Bearer ` followed by 32 random bytes encoded as hex.

From the project root:

```powershell
npx supabase login
npx supabase link --project-ref YOUR_SUPABASE_PROJECT_REF
npx supabase secrets set --env-file supabase/functions/.env
npx supabase functions deploy sync-premium-purchase
npx supabase functions deploy revenuecat-webhook
```

`supabase/config.toml` disables the gateway JWT check for these functions. The
purchase sync handler verifies the user's token with Supabase Auth itself; the
webhook checks its configured Authorization secret. Both fail closed when their
required credentials are missing. Neither accepts a client-supplied expiry.

## 5. RevenueCat webhook

Create a webhook integration in RevenueCat pointing to:

```text
https://YOUR_SUPABASE_PROJECT_REF.supabase.co/functions/v1/revenuecat-webhook
```

Set the webhook's Authorization value to exactly the value of
`REVENUECAT_WEBHOOK_AUTHORIZATION`. Enable events for this app in both production
and sandbox during testing. Include renewals, cancellations, billing issues,
expirations, refunds, and transfers. Send a test webhook and verify a 200 response.
Check RevenueCat's current plan requirements for webhook availability.

Each event triggers a server-side lookup of the latest RevenueCat entitlement.
Duplicate or delayed events cannot replay an old expiry. Cancelling renewal keeps
access through the paid period; expiry or refund removes Apple access while any
valid manual access remains. Sandbox transactions are accepted for TestFlight and
App Review. StoreKit transactions are confirmed by RevenueCat before access is
saved in Supabase.

## 6. Native verification before submission

Build a native iOS development build or TestFlight build after completing setup.
Verify with Apple's sandbox:

1. Free account: Apple price and monthly renewal disclosure are visible.
2. Purchase: confirmed Apple purchase unlocks Premium; cancelling the payment
   sheet does not show success or grant access.
3. Interrupted verification: a completed transaction displays confirmation pending;
   retry confirms the purchase without charging again.
4. Restore: the same app account recovers its active subscription after reinstall.
5. Renewal, cancellation, expiry, refund, and grace period: the webhook and account
   state reflect the latest entitlement. Manual access survives an Apple refund.
6. Sign out and sign into another account: no Premium access leaks across accounts.
7. Existing manual customer: their current paid access and reference remain valid.
8. Support: WhatsApp opens an editable account-help draft. It never submits an
   activation request. The former Submit and pending-request screens are removed.

Purchases, restores, and App Review readiness cannot be confirmed until real
products, keys, server deployment, and sandbox transactions are configured.

## Private bot

The bot is intentionally outside this change, as requested. Your existing admin
panel and `user_subscriptions` remain the manual administration path. Admin grants
add 30 days to an active manual expiry, or start today if the old expiry passed.
The `is_vip` and `vip_expires_at` database columns keep their legacy names for
compatibility; all customer-facing plan branding is Premium.

Source references: [Expo purchases](https://docs.expo.dev/guides/in-app-purchases/),
[RevenueCat Expo](https://www.revenuecat.com/docs/getting-started/installation/expo),
[RevenueCat webhooks](https://www.revenuecat.com/docs/integrations/webhooks),
[Supabase deployment](https://supabase.com/docs/guides/functions/deploy).
