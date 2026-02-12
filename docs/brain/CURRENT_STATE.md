# Current Project State

**Last Updated**: 2026-02-13
**Session Agent**: Claude Code (Opus 4.6)
**Branch**: staging
**Netlify Site**: https://trinitylabs.netlify.app

---

## Status: SUBSCRIPTION MODEL IMPLEMENTED — READY FOR TESTING

### What Just Happened (This Session)

#### Subscription SaaS Redesign (10 Phases, ALL COMPLETE)

The entire platform was transformed from a pay-as-you-go credit model to a subscription SaaS model with plan tiers, auto-provisioned phone numbers, usage tracking, and Stripe subscription billing.

**Phase 0: Pricing Config** (`src/config/plans.ts`)
- Single source of truth for 4 plan tiers: Starter ($199), Growth ($599), Business ($1,499), Enterprise (custom)
- Includes limits (minutes, phone numbers, assistants, concurrent calls, users), features, overage rates
- Helper functions: `getPlanById()`, `getDefaultPlan()`, `getPlanLimits()`, `getStripePriceIds()`

**Phase 1: Database Migration** (`supabase/migrations/20260213000000_subscription_billing.sql`)
- Extended `organizations` table with subscription fields (stripe IDs, period dates, plan limits)
- New `subscription_usage` table for per-period tracking
- `record_call_usage` RPC: atomic usage increment with overage calculation
- `check_call_allowed` RPC: pre-call limit check (status + minutes + credits)
- Soft-deprecated per-org Vapi key columns via COMMENT (not DROP)

**Phase 2: Credential Simplification** (5 Netlify functions)
- Removed `getOrgKey()` from: voice-assistant, voice-squad, voice-tool, voice-phone-number
- All functions now use `process.env.VAPI_PRIVATE_API_KEY` exclusively (platform master key)
- voice-credentials simplified to just check if platform key exists

**Phase 3: Stripe Subscription Billing** (3 Netlify functions + redirect)
- `billing-create-checkout.ts` — Subscription mode (creates Stripe customer, recurring billing) + credit top-up mode
- `billing-webhook.ts` — Handles: checkout.session.completed, invoice.paid, subscription.updated, subscription.deleted, invoice.payment_failed
- `billing-manage-subscription.ts` — Actions: change_plan (with proration), cancel, reactivate, Stripe portal
- Stripe Price IDs in `.env.template`

**Phase 4: Onboarding Wizard Redesign** (`src/pages/OnboardingWizard.tsx`)
- 6 steps: Welcome -> Plan Selection -> Create Assistant -> Phone Number -> Checkout -> Launch
- Auto-provision phone number during onboarding
- Stripe checkout integration with return handling
- Plan cards display from `@/config/plans`

**Phase 5: Usage Tracking & Limit Enforcement**
- `voice-webhook.ts` — Calls `record_call_usage` RPC, only charges overage credits
- `make-call.ts` — Uses `check_call_allowed` RPC instead of simple balance check
- `numbers-purchase.ts` — Checks phone number count against `max_phone_numbers`
- `voice-assistant.ts` — Checks assistant count against `max_assistants` on POST

**Phase 6: Auto-Number Provisioning**
- `auto-provision-number.ts` — Auth + org check + Vapi API buy + DB save
- `voice-service.ts` — Added `autoProvisionNumber()` method
- Added netlify.toml redirect

**Phase 7: Billing Page Redesign** (`src/pages/Billing.tsx`)
- Current Plan card with status badge, renewal date, cancel/reactivate
- Usage dashboard (progress bar, overage indicator)
- Resource limits display (numbers, assistants, concurrent, users)
- Tabs: Plans (upgrade/downgrade cards) | Top Up (overage credits) | Transactions (ledger history)
- Stripe billing portal link

**Phase 8: Layout & Settings Cleanup**
- Layout.tsx: Added Tools, Billing, Assistants, Telephony, Knowledge Base to client & agency menus
- Layout.tsx: Reordered nav items logically, used BookOpen for Knowledge Base
- Settings.tsx: Removed entire API Management tab (600+ lines), removed Billing tab
- Settings: Now 3 tabs only: Profile, Notifications, Appearance

**Phase 9: Service Layer Updates**
- MinimalUserProvider.tsx: Added plan info to user context (plan, subscription_status, included_minutes, max_phone_numbers, max_assistants, max_concurrent_calls)
- Fetches org plan data from Supabase on user load

---

### What IS Working
1. Supabase Auth Context: Full sign in/up/out/OAuth
2. Login Page: Trinity aesthetic, Supabase auth, bootstrap call
3. AI Assistants Page: Live Vapi CRUD with assistant limits
4. Telephony Page: Buy/configure/delete numbers with limits
5. Onboarding Wizard: 6-step with plan selection + number provisioning + Stripe checkout
6. Billing Page: Subscription management + usage dashboard + plan upgrades
7. Campaign Manager: Atomic job queue with concurrency
8. Voice Webhook: Usage tracking + overage billing
9. Make Call: Pre-call limit enforcement via RPC
10. Auto-Provision Number: During onboarding
11. All proxy functions: Platform master key (no per-org keys)
12. Build Pipeline: TypeScript + Vite build both pass cleanly
13. Sidebar navigation: Full nav for all roles with Tools, Billing, etc.

### What NEEDS Testing (Sean)
1. **Run Supabase migration**: `supabase/migrations/20260213000000_subscription_billing.sql`
2. **Set 6 Stripe env vars on Netlify** (production + staging):
   - `STRIPE_PRICE_STARTER` = `price_1T08lxDN0rITNR2gtCDhYf3H`
   - `STRIPE_PRICE_GROWTH` = `price_1T08lyDN0rITNR2gJtkcuCAT`
   - `STRIPE_PRICE_BUSINESS` = `price_1T08lzDN0rITNR2gM2Bo5HbF`
   - `STRIPE_OVERAGE_STARTER` = `price_1T08mEDN0rITNR2gBC4YuQRI`
   - `STRIPE_OVERAGE_GROWTH` = `price_1T08mFDN0rITNR2g1XwUfQSM`
   - `STRIPE_OVERAGE_BUSINESS` = `price_1T08mHDN0rITNR2gBTmYyIat`
3. **Test subscription flow**: Signup -> onboarding -> plan select -> Stripe checkout -> return
4. **Test call**: Make a call -> verify usage tracking on billing page
5. **Test limits**: Exceed phone number / assistant limits -> verify enforcement
6. **Test plan change**: Upgrade/downgrade from billing page

### Post-Launch Roadmap (Sean's Requirements)
These were explicitly requested for ongoing development:
1. Lead distribution (round-robin, weighted) between team members
2. SMS and email sequence confirmations
3. Data cleansing with human-in-the-loop approval
4. Manager reporting / daily summaries
5. Multi-lingual support
6. Hold music / call on hold
7. Inbound receptionist mode
8. CRM wiring (contacts from mock to live)
9. Knowledge base completion
10. Campaign engine completion (upload CSV, mass calling)
11. Transition away from Vapi (long-term cost reduction)

---

### Files Modified This Session

**Created:**
- `src/config/plans.ts` — Plan tier configuration
- `supabase/migrations/20260213000000_subscription_billing.sql` — Subscription billing migration
- `netlify/functions/auto-provision-number.ts` — Auto-provision phone number
- `netlify/functions/billing-manage-subscription.ts` — Plan change/cancel/reactivate

**Rewritten:**
- `src/pages/Billing.tsx` — Credit-based -> subscription-based
- `src/pages/OnboardingWizard.tsx` — 4-step -> 6-step with Stripe
- `src/pages/Settings.tsx` — Removed API Management + Billing tabs
- `netlify/functions/billing-create-checkout.ts` — Added subscription mode
- `netlify/functions/billing-webhook.ts` — Full subscription lifecycle
- `src/components/Layout.tsx` — Added Tools, Billing, nav cleanup

**Modified:**
- `netlify/functions/voice-assistant.ts` — Platform key + assistant limits
- `netlify/functions/voice-squad.ts` — Platform key
- `netlify/functions/voice-tool.ts` — Platform key
- `netlify/functions/voice-phone-number.ts` — Platform key
- `netlify/functions/voice-credentials.ts` — Simplified
- `netlify/functions/voice-webhook.ts` — Usage tracking
- `netlify/functions/make-call.ts` — check_call_allowed RPC
- `netlify/functions/numbers-purchase.ts` — Phone number limits
- `src/services/MinimalUserProvider.tsx` — Plan info in context
- `src/services/voice-service.ts` — autoProvisionNumber method
- `netlify.toml` — 2 new redirects
- `.env.template` — Stripe price IDs

### For Next AI Agent
Read these files in this order:
1. `docs/brain/STRATEGIC_MASTERPLAN.md` — full project bible
2. `docs/brain/CURRENT_STATE.md` (this file) — what's done, what's next
3. `docs/brain/DECISION_LOG.md` — all locked architectural decisions
4. `src/config/plans.ts` — plan tiers and pricing
5. `supabase/migrations/20260213000000_subscription_billing.sql` — DB schema changes
