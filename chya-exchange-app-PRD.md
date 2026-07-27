# Chya Exchange App — Product Requirements Document

**Client:** Chya Group
**Built by:** Memo
**Deadline:** 7 days
**Stack:** Expo (React Native) — native Android build for Play Store + Expo Web (react-native-web) as PWA fallback for iOS — Supabase + Google Identity Services

---

## 1. Product Summary

A simple mobile app showing live buy/sell currency exchange rates for a local Erbil "borsa bazar" (USD, IQD, and other pairs the client confirms). Prices are set manually by 1-2 employees inside the app itself. Full price access is gated behind a 5,000 IQD/month **activation** (not framed as a "subscription" — see Section 4.4), paid via manual FIB bank transfer and approved by the employee inside the app. Built with Expo/React Native as a single codebase: a real native Android build for Google Play Store, and a real native iOS build for the Apple App Store. Distribution itself works — Iraqi users install both free and paid apps via neighboring-country Apple IDs (Kuwait/Jordan/etc.) or directly via Play Store (Iraq CMC opened developer registration in 2025). The remaining real risk is policy, not distribution: see Section 2 for the honest read on where this stands with both stores.

---

## 2. Why This Architecture (context for future reference)

- **iOS distribution is possible — corrected from an earlier assumption.** Iraq has no Iraq-region App Store, but Iraqi users routinely use a neighboring country's Apple ID (Kuwait, Jordan, etc.) to download apps, and this works fine for free/normal downloads. Real Kurdistan/Iraq market apps (currency trackers, Kurdish keyboard apps) are live on the App Store today. Distribution is not the blocker.
- **The real, remaining risk is App Store / Play Store *policy* on the payment flow, not distribution.** Both Apple (guideline 3.1.1) and Google Play (Payments policy) formally require in-app purchases/content unlocks to go through their own billing systems (Apple IAP / Google Play Billing) — a manual-FIB-transfer-and-employee-approval unlock is technically outside policy on both platforms. **Evidence this is lower-risk in practice than the policy reading suggests:** a live Kurdish keyboard app on the App Store today uses this exact pattern — framed as "چالاکردن" (Activation) rather than "Subscribe," with payment routed to an external agent/number and manual admin confirmation, and it has passed review. This app is built the same way, using the same "activation" framing rather than subscription language, on the reasoning that this specific pattern appears to pass review in practice even though it isn't formally policy-compliant. **This is a real, live risk — not a compliant, guaranteed-safe pattern.** Apple/Google can still reject on submission, flag on a future update review, or pull the app later if reported. Framing (see 4.4) reduces — does not eliminate — this risk.
- **Why Expo over plain Next.js+Capacitor:** one Expo codebase can output a true native Android build (Play Store-ready) and a true native iOS build — same logic, same components, both real store submissions. Tradeoff: less code reuse from existing Next.js projects (BorsaAPI, Nova Portal), and EAS Build/deployment is a new tool for this project.
- **Developer accounts (Apple Developer Program, Google Play Console):** handled directly by Memo — out of scope for this PRD.
- **No FIB business API.** Client refused to submit company registration for FIB's webhook/API access. Payment confirmation is therefore fully manual, employee-reviewed — not automated bank matching.
- **No Supabase-branded auth.** Client wants no visible Supabase domain during login. Solution: use Google Identity Services directly client-side, then hand the resulting ID token to Supabase (`signInWithIdToken`) — avoids Supabase's OAuth redirect flow entirely, keeps everything on Supabase free tier, no custom domain / Pro plan needed.

---

## 3. Core User Roles

| Role | Access |
|---|---|
| **Customer** | View calculator + rates (if subscribed), submit payment requests, see own subscription status |
| **Employee/Admin** | Everything a customer has, plus: edit currency rates, view/approve/reject pending payment requests |

Single app, single codebase — admin capabilities are just extra UI shown when `role = 'admin'` on the logged-in user's row, enforced at the database level (not just hidden in the UI).

---

## 4. Screens

### 4.1 Splash / Loading
- App opens → brief loading screen while Supabase session is checked
- Routes to: onboarding (first-time), or straight to home if session valid

### 4.2 Onboarding + Auth (single screen)
- One screen, two buttons: **Continue with Google**, **Continue with Apple**
- No separate sign-up/sign-in — same button handles both (create-if-new, login-if-existing is default Supabase OAuth behavior)
- Google flow: Google Identity Services client-side popup/token → passed to `supabase.auth.signInWithIdToken()` — no Supabase-branded redirect ever shown
- Apple: standard Sign in with Apple flow

### 4.3 Home / Calculator (matches reference screenshot style)
- Two input boxes: "From" currency and "To" currency, each with flag + name
- Swap icon (↻) to flip direction instantly
- Numeric keypad for input
- Live conversion using the currently set admin rate — recalculates on every keystroke
- Top banner shows current headline rate (e.g. "1 USD = 1500.00 IQD")
- **Locked behind subscription** — if `expires_at` has passed or is null, show paywall instead of live rates (exact behavior TBD per client — likely: calculator visible but rate is blurred/hidden, or full paywall overlay)

### 4.4 Activation Screen (paywall — UI copy deliberately avoids "Subscribe"/"Buy")
- Shown when user has no active activation
- **Copy/framing note:** use "چالاکردن" (Activation) language throughout, not "Subscribe" or "Buy Now" — mirrors the live App Store precedent found during research (Kurdish keyboard app). List benefits with checkmarks, present it as unlocking a feature rather than purchasing content. Button label: **"چالاک بکە" (Activate)**, not "Subscribe"
- Displays: price (5,000 IQD/month), boss's FIB account number, and the user's **unique reference code** (e.g. `CHYA-A73F`), shown large and easily copyable
- Instructions: "Send via FIB, put this code in the transfer note, then tap below"
- Button: **"I've Paid"** → creates a `pending` payment request
- After tapping: screen shows **"Pending — waiting for confirmation"** state so the user isn't left guessing
- If rejected: show rejection reason (if provided) + button to submit a new request

### 4.5 Admin Panel (visible only to `role = 'admin'` users, inside the same app)
**Rates tab:**
- One row per currency pair: flag + name, buy rate input, sell rate input, "last updated" timestamp
- Big **Save** button per row (or one global save — decide during build based on employee comfort)
- Save triggers Supabase Realtime broadcast — all open customer apps update instantly, no refresh needed

**Payment Requests tab:**
- List of `pending` requests: user name/code, amount expected, timestamp submitted
- Each row: **Approve** / **Reject** buttons
- Approve → sets `expires_at = now() + 30 days`, status → `approved`
- Reject → status → `rejected`, optional reason text field, unlocks user to submit a new request

---

## 5. Data Model (Supabase / Postgres)

```sql
-- Users table extends Supabase auth.users
create table profiles (
  id uuid primary key references auth.users(id),
  full_name text,
  role text not null default 'customer', -- 'customer' | 'admin'
  created_at timestamp default now()
);

-- Currency pairs and current rates
create table rates (
  id uuid primary key default gen_random_uuid(),
  currency_code text not null unique, -- 'USD', 'IQD', etc.
  currency_name text not null,
  flag_emoji text,
  buy_rate numeric not null,
  sell_rate numeric not null,
  updated_at timestamp default now(),
  updated_by uuid references profiles(id)
);

-- Subscriptions
create table subscriptions (
  user_id uuid primary key references profiles(id),
  expires_at timestamp
);

-- Payment requests (manual FIB confirmation flow)
create table payment_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) not null,
  code text not null, -- e.g. CHYA-A73F, shown to user for FIB note
  status text not null default 'pending', -- pending | approved | rejected
  rejected_reason text,
  created_at timestamp default now(),
  reviewed_at timestamp,
  reviewed_by uuid references profiles(id)
);

-- Anti-spam: only one pending request per user, enforced by the DB itself
create unique index one_pending_per_user
on payment_requests (user_id)
where status = 'pending';
```

---

## 6. Row Level Security (RLS) — required, not optional

```sql
-- Only admins can update rates (client-side button hiding is NOT enough)
alter table rates enable row level security;

create policy "anyone can read rates"
on rates for select
using (true);

create policy "only admins can update rates"
on rates for update
using (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  )
);

-- Payment requests: users can only see/create their own; admins see all
alter table payment_requests enable row level security;

create policy "users manage own requests"
on payment_requests for select using (auth.uid() = user_id);

create policy "users create own requests"
on payment_requests for insert with check (auth.uid() = user_id);

create policy "admins update any request"
on payment_requests for update using (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  )
);
```

---

## 7. Payment Flow (fully manual — no FIB API)

```
1. User taps "Subscribe" → app shows FIB number + user's unique code
2. User sends 5,000 IQD via their own FIB app, code goes in the transfer note
3. User taps "I've Paid" → INSERT into payment_requests (status: pending)
   - Blocked automatically if a pending request already exists (unique index)
4. Employee opens FIB, sees incoming transfer + note code
5. Employee opens admin panel → Payment Requests tab → finds matching code
6. Employee taps Approve (or Reject with optional reason)
7. Approve → subscriptions.expires_at = now() + 30 days
8. Customer's app re-checks on next load: expires_at > now() → unlocks rates
```

**Access check (no polling, no background server, no cron):**
```ts
const hasAccess = subscription?.expires_at
  ? new Date(subscription.expires_at) > new Date()
  : false;
```
This runs at read-time, on app load — not on a schedule. No server "watches" the clock.

---

## 8. Design Direction

Matches the reference screenshots — clean, flat, functional, no gradients/glow:

- **Primary:** Indigo/blue (header, primary buttons)
- **Surface:** White cards on light gray background
- **Accent (CTA):** Orange (e.g. multiply/action buttons)
- **Danger:** Red (clear, reject actions)
- **Success/positive:** Green (approved states, positive amounts)
- Large, legible numeric keypad
- No ad banners, no unrelated UI clutter — subscription model, not ad-supported

---

## 9. Open Items to Confirm with Client Before/During Build

1. **Full currency list** — confirmed pairs beyond USD/IQD (Iranian Toman, Turkish Lira, gold, etc.)
2. **Update frequency expectation** — does "last updated" timestamp need to be user-visible?
3. **Paywall behavior detail** — is the calculator itself locked, or just the live rate numbers?
4. **Branding assets** — logo, exact color hex values, any assets reused from the existing Chya portfolio site

---

## 10. Suggested 7-Day Build Order

| Day | Focus |
|---|---|
| 1 | Supabase schema + RLS policies, Google Identity Services auth wiring |
| 2 | Home/calculator screen + live rate fetch + swap logic |
| 3 | Subscription paywall screen + payment_requests flow (user side) |
| 4 | Admin panel — rates tab (edit + Realtime broadcast) |
| 5 | Admin panel — payment requests tab (approve/reject) |
| 6 | EAS Build for Android (Play Store submission prep), Expo Web build + PWA install testing on iOS Safari, full end-to-end test of payment loop |
| 7 | Buffer — bug fixes, employee walkthrough/training, handoff |

---

## 11. Explicitly Out of Scope (for now)

- Automated FIB payment detection/webhooks (blocked by client's refusal to register)
- Apple App Store / Google Play Store listing
- Multi-employee audit trail beyond basic `updated_by` / `reviewed_by` fields
- Push notifications / expiry reminders (nice-to-have, not core to launch)
