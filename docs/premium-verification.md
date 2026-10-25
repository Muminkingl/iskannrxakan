# Premium verification — 23 October 2026

## Configured and deployed

- The public RevenueCat iOS key is in the ignored app `.env` and the EAS
  production environment. The offering is `default`.
- The RevenueCat server key and webhook Authorization value are in the ignored
  `supabase/functions/.env` and Supabase Edge Function secrets.
- Both keys authenticate successfully and resolve the same RevenueCat customer
  project. The configured monthly product maps to entitlement `premium`.
- The Premium database migration is applied. Store subscription records use RLS;
  authenticated customers cannot write records or execute the server grant RPC.
- `sync-premium-purchase` and `revenuecat-webhook` are deployed. Unauthenticated
  requests receive 401; the authorized test webhook receives 200.
- The configured iOS JavaScript bundle builds successfully. The RevenueCat private
  key and webhook secret are absent from the generated bundle.

Database diagnostics use the official Supabase CA with certificate and hostname
verification enabled. No TLS verification bypass is needed.

## Live integration checks

`node scripts/verify-premium-live.mjs --allow-test-account` passed 17 checks:

- A temporary customer can authenticate without changing the app's social login
  configuration. No email is sent by this test.
- The account starts free and receives a stable account reference. Existing
  signup-trigger reference formats are preserved.
- Account initialization creates no activation request.
- A real customer JWT can invoke the deployed verifier, which reads RevenueCat
  and stores the confirmed inactive state in Supabase.
- Customers can read their own confirmed status but cannot modify it or call the
  server grant function.
- Invalid sessions and invalid webhook authorization are rejected.
- Even an authorized webhook cannot grant access just by asserting a purchase:
  the handler rechecks RevenueCat and ignores invented transaction fields.
- Valid manually granted access survives an inactive Apple state. An expired
  manual expiry loses Premium access.
- The temporary Supabase account, manual record, profile, store record, and
  RevenueCat test customer were removed after testing.

The configuration probe `iskan-configuration-check` is a dedicated unpaid
RevenueCat diagnostic identifier; it never represents a real purchase.

Repeat configuration checks with:

```powershell
node scripts/check-premium-config.mjs
```

The reports under `.expo/premium-debug` are ignored by Git and contain diagnostic
results rather than API keys. The account RPC definition from before the migration
is backed up there as `pre-premium-account-rpc.sql`.

## Native build

Production iOS build **1.0.1 (23)**:
[EAS build](https://expo.dev/accounts/memonotsafee/projects/iskannrxakan/builds/b482b6bc-b39e-4525-8ae0-6e86983c6b3c).

The EAS build finished successfully, including native iOS compilation and signing.
The archive is available from the build page. TestFlight upload completed
on 23 October 2026. EAS reports `FINISHED`, and Apple reports build 23 `VALID`:
[submission](https://expo.dev/accounts/memonotsafee/projects/iskannrxakan/submissions/4901e2dc-9d35-47ac-9088-92ccb0efe773).
No public App Review submission has been made. Native compilation does not
establish that an Apple transaction works on a device.

## App Store items still requiring completion

App Store Connect currently reports:

| Item | Result |
| --- | --- |
| Subscription group | Iskan Premium |
| Group display name | Added Iskan Premium, English (UK) |
| Product | `com.trxstudio.iskannrxakan.premium.monthly` |
| Duration | One month |
| US customer price | $19.99 |
| Product localization | Iskan Premium Monthly, English (UK) |
| Subscription availability record | Present |
| Subscription review screenshot | Missing |
| Product state | `MISSING_METADATA` |

Upload a screenshot of the actual Premium purchase screen to the subscription's
App Review Information section and complete any other fields Apple marks missing.
The first subscription must accompany the app submission.

The missing group localization was added through App Store Connect. Apple notes
that product metadata changes may take up to one hour to appear in sandbox:
[subscription group localization](https://developer.apple.com/documentation/appstoreconnectapi/post-v1-subscriptiongrouplocalizations).

## Device and provider delivery checks still pending

1. Send a test from the RevenueCat dashboard to the deployed webhook URL and
   confirm RevenueCat itself records a successful delivery. Direct endpoint tests
   establish handler behavior but do not verify dashboard registration.
2. Install the new native build through TestFlight or a configured development
   build. Confirm the price is fetched from Apple on the device.
3. Complete an Apple sandbox purchase, restore it on the same app account, and
   exercise renewal, cancellation, expiry, refund, and billing grace period.

No real or sandbox Apple transaction has been performed by these server tests.
Native StoreKit price retrieval and purchase behavior require an Apple device or
simulator; Windows server tests cannot establish those results.

## TestFlight follow-up: product loading and onboarding

The account holder's Business page initially showed **Paid Apps Agreement: New**
and required a legal entity update before signing. The latest screenshot shows
**Pending User Info**: the agreement is signed but is not yet in effect, and Apple
requests a bank account. Complete banking information and any remaining required
tax information until Apple shows **Active**. The separate Free Apps Agreement
and Digital Services Act statuses do not make the Paid Apps Agreement active.

Apple requires an active Paid Apps Agreement for sandbox In-App Purchases:
[Apple sandbox configuration requirements](https://developer.apple.com/help/app-review/before-submitting-for-review/configure-in-app-purchases).
The product's missing review screenshot must also be completed before submission;
that omission alone does not establish why a sandbox product fetch failed.

Repeated live checks confirm the RevenueCat offering, product ID, entitlement,
public/server key association, database migration, and deployed functions. The
subscription is available in 175 territories (the API's first included page only
contains ten). Actual StoreKit product resolution remains unverified while the
agreement is inactive. An empty restore result only establishes that no active
subscription was returned; it does not establish that purchasing works.

App fixes:

- Onboarding uses AsyncStorage on native and web. It no longer invokes the
  unsupported SecureStore web setter.
- Session initialization cannot skip the first-run slides. Only completing or
  skipping the slides sets `onboarding_completed_v1`. The old flag was written
  automatically on sign-in, so it is not treated as proof the slides were seen.
  Existing installs will see the corrected onboarding once.
- Account checks run outside Supabase auth callbacks. Stale checks cannot restore
  a signed-out user or overwrite a newly signed-in account.
- The support page keeps the WhatsApp action and account reference; the account
  refresh action is removed in all languages. Purchase retry and restoration stay
  on the purchase page.
- Apple product and customer-info lookups run independently. A customer-info
  error cannot hide a successfully fetched price. Failed offerings preserve known
  entitlement data and log the SDK error without keys or bearer credentials.

Verification:

- `npx tsc --noEmit`: passed.
- `node --test --test-concurrency=1 scripts/tests/startup-and-purchases.test.mjs`:
  18 checks passed with mocked native/store APIs.
- `npx expo export --platform web --output-dir .expo/premium-debug/web-fix`:
  passed.
- `node scripts/tests/onboarding-web-smoke.mjs`: passed in an isolated Edge
  browser at desktop and phone viewport sizes. First launch, completing all three
  slides, skipping, persistence, and reload have no uncaught errors. This phone
  viewport check is a web check, not an iOS device purchase test.

Optional test dependencies are installed under the ignored
`.expo/premium-debug/test-runtime` directory; the app dependency tree is unchanged.
See the test file headers for installation instructions.

Updated native build **1.0.1 (25)** finished successfully on EAS, including native
compilation and signing, and was uploaded to App Store Connect. Apple reports
`VALID` and `IN_BETA_TESTING` for internal testing; external testing is
`READY_FOR_BETA_SUBMISSION` and has not been submitted for beta review:
[EAS build](https://expo.dev/accounts/memonotsafee/projects/iskannrxakan/builds/17327d7d-5335-472c-8de5-49c986ada354),
[submission](https://expo.dev/accounts/memonotsafee/projects/iskannrxakan/submissions/08f211f1-2f72-40a2-bad7-579791fe3314).
Build number 24 was consumed by an upload attempt that failed on a DNS lookup;
no build 24 was created on EAS.
