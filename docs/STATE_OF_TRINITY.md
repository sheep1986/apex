# State of Trinity Platform

**Date:** 2026-02-04
**Commit:** Current Head

## 1. Architecture Map

### Frontend
- **Framework:** React (Vite)
- **Entry Point:** `src/App.tsx`
- **Key Routes:**
  - `/` (Landing)
  - `/login`, `/signup` (Auth)
  - `/dashboard` (Main App)
  - `/voice-dashboard` (Voice Management)
  - `/campaigns/*` (Campaign Wizards)
  - `/settings` (Account/Org Settings)

### Backend (Netlify Functions)
Located in `netlify/functions/`:
- `api-proxy.ts`: General API proxy.
- `voice-calls.ts`: Voice API handling.
- `voice-webhook.ts`: Webhook receiver for voice events.
- `billing-webhook.ts`: Payment processor webhook.
- `billing-create-checkout.ts`: Payment checkout session.
- `make-call.ts`: Outbound call trigger.

### Database (Supabase)
- `organizations`: Org details, settings.
- `campaigns`: Campaign data.
- `calls`: Call history.
- `credits_ledger`: Financial ledger.

## 2. Zero-Trace Audit

**Status:** Hardening In-Progress.

### ✅ Compliant Areas
- `AccountSetup.tsx`: Zero-trace managed mode.
- `CampaignSetupWizard.tsx`: Primary flows abstracted.
- `Landing.tsx`: Clean assertions.

### ⚠️ Audited Files (Cleaned in Phase 2.1)
- `src/pages/TestDashboard.tsx`
- `src/pages/ClientOnboarding.tsx`
- `src/services/help-service.ts`
- `src/pages/Team.tsx`
- `src/pages/PhoneNumbers.tsx`

## 3. Functionality Status

- **Authentication:** Hybrid.
- **Voice Engine:** Abstracted behind `/api/voice/*`.
- **Billing:** Real Wallet implementation.
- **Reliability:** Balance enforcement and cost rating active.

## 4. Phase 2 Features

1.  **Wallet System:** `credits_ledger` table and Real UI.
2.  **Payments:** Payment Gateway integration.
3.  **Cost Rating:** Automated call rating and deduction.
4.  **Enforcement:** Hard Stop logic active.
