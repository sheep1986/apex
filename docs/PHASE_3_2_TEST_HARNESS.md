# Phase 3.2 Test Harness: Stub Mode (Strict)

This harness allows full end-to-end testing of the CRM & Telephony flow without purchasing real phone numbers.

## 1. Database Seeding (SQL)

Run this SQL in the Supabase Editor to set up your stub environment.

```sql
-- 1. Get your Organization ID
-- SELECT id FROM organizations LIMIT 1;

-- 2. Insert a Stub Phone Number (The "Trinity Number")
INSERT INTO phone_numbers (
    organization_id, 
    e164, 
    provider_ref, 
    status
) VALUES (
    'YOUR_ORG_UUID_HERE', 
    '+14155550100', 
    'stub_sid_123', 
    'active'
) ON CONFLICT DO NOTHING;

-- 3. Create an Inbound Route
INSERT INTO inbound_routes (
    organization_id, 
    name, 
    config
) VALUES (
    'YOUR_ORG_UUID_HERE', 
    'Main Line Stub', 
    '{ "recording_policy": "always", "destination": { "type": "assistant", "targetId": "stub_assistant" } }'
) RETURNING id;

-- 4. Link Route to Number
-- UPDATE phone_numbers SET inbound_route_id = 'ROUTE_UUID_FROM_ABOVE' WHERE e164 = '+14155550100';
```

## 2. Inbound Simulation (Curl)

**Step A: Start the Call**
Simulates a new incoming call.

```bash
curl -X POST https://YOUR_SITE/netlify/functions/telephony-inbound \
  -H "Content-Type: application/json" \
  -H "x-trinity-signature: <SIGNATURE_HEX>" \
  -H "x-trinity-timestamp: <TIMESTAMP_MS>" \
  -d '{
    "message": {
      "type": "assistant-request",
      "call": { "id": "call_stub_004" },
      "customer": { "number": "+15559998888" },
      "phoneNumber": { "number": "+14155550100" }
    }
  }'
```

## 3. End-of-Call Simulation (Strict)

**Step B: End the Call (Voicemail Scenario)**
Simulates the provider reporting the call ended with a voicemail. This tests **Idempotency** and **Zero-Trace**.

```bash
# Payload
PAYLOAD='{
    "message": {
      "type": "end-of-call-report",
      "call": { "id": "call_stub_004" },
      "startedAt": "2023-11-01T12:00:00.000Z",
      "endedAt": "2023-11-01T12:01:30.000Z",
      "duration": 90,
      "cost": 0.05,
      "endedReason": "voicemail",
      "transcript": "Checking idempotency.",
      "recordingUrl": "https://vapi.bucket/rec_secret_123.wav"
    }
}'

# 1. Send Request (First Time)
curl -v -X POST https://YOUR_SITE/netlify/functions/telephony-status \
  -H "Content-Type: application/json" \
  -H "x-trinity-signature: <SIGN_1>" \
  -H "x-trinity-timestamp: <TIME_1>" \
  -d "$PAYLOAD"

# 2. Send Same Request (Second Time - Replay/Duplicate)
curl -v -X POST https://YOUR_SITE/netlify/functions/telephony-status \
  -H "Content-Type: application/json" \
  -H "x-trinity-signature: <SIGN_2>" \
  -H "x-trinity-timestamp: <TIME_2>" \
  -d "$PAYLOAD"
```

## 4. Verification Checklist

1.  **Zero-Trace Response**:
    *   Curl Output mismatch: Ensure responses are `{"received":true}` and NOT `{ "id": "call_stub_..." }`.
    *   Logs: Grep logs for `rec_secret_123.wav`. Should **NOT** be visible in plain text.

2.  **Idempotency / State**:
    *   `voice_calls`: Status `ended`, Cost `0.05`. (Not 0.10).
    *   `tickets`: **1 record** for this call. (Constraint `uq_tickets_org_ref_source` should block duplicate).
    *   `activities`: **1 record** for `call_inbound`.
    *   `credits_ledger`: **1 entry** for this `trinityCallId`.

3.  **Secure Recording**:
    *   `voice_calls.recording_path` should be `NULL` or internal ref, NOT the Vapi URL.
    *   `voice_call_recordings` table should have 1 row with `provider_recording_ref = https://vapi.bucket/...` (Server-side ONLY).
