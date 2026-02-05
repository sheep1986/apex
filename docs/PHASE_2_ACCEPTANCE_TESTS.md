# Phase 2 Acceptance Tests: Billing & Reliability

## 1. Zero-Trace Verification
- [ ] **TestDashboard**: Check that Platform name header is neutral/branded (Trinity).
- [ ] **TestDashboard**: Check that "API Key" is masked/removed.
- [ ] **ClientOnboarding**: Check that support email is `support@trinity-labs.ai`.
- [ ] **Team Page**: Check that Permissions use "Voice Engine" or generic terms.
- [ ] **PhoneNumbers**: Check that header text is generic ("Phone Numbers").
- [ ] **Help Service**: Check that support tickets do not return mock vendor strings.

## 2. Billing Infrastructure
- [ ] **Top-up Checkout Endpoint**:
    - Trigger `POST /.netlify/functions/billing-create-checkout` with `{ amount: 20, organizationId: "..." }`.
    - Verify response contains `url` (Redirect URL).
- [ ] **Payment Webhook**:
    - Trigger `POST /.netlify/functions/billing-webhook` with valid signature headers.
    - Verify it calls `apply_ledger_entry` RPC.
    - Verify Supabase `credits_ledger` has new entry (Positive amount).
    - Verify `organizations.credit_balance` increases.

## 3. Wallet UI
- [ ] **Settings Page**: Check for "Billing" tab.
- [ ] **Balance Display**: Verify "Current Balance" shows REAL data from server.
- [ ] **Top Up**: Click "$20" button -> Should redirect to Payment Gateway.
- [ ] **Transactions**: Verify list shows real history from ledger.

## 4. Reliability & Safety
- [ ] **Cost Rating**:
    - Simulate voice engine "end-of-call" event.
    - Verify ledger entry created with negative amount.
    - Verify usage of Trinity ID in ledger `reference_id`.
- [ ] **Hard Stop**:
    - Set org balance to $0.00.
    - Trigger outbound call using Authenticated Request (Token).
    - `curl -H "Authorization: Bearer <TOKEN>" -X POST ... -d '{"assistantId": "..."}'`
    - Verify 402 "Insufficient credits" error.
