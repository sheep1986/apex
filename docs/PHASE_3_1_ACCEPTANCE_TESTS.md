# Phase 3.1 Acceptance Tests: Inbound MVP

## 1. Number Management
- [ ] **Search Numbers**:
    - `curl -X POST /.netlify/functions/numbers-search -d '{ "areaCode": "415", "source": "mock" }' -H "Content-Type: application/json" -H "Authorization: Bearer <TOKEN>"`
    - Verify returns mock numbers list.
- [ ] **Buy Number**:
    - `curl -X POST /.netlify/functions/numbers-purchase -d '{ "phoneNumber": "+14155550100" }' -H "Authorization: Bearer <TOKEN>"`
    - **Constraint**: Client does NOT pass `organizationId`. It must be derived from the Token.
    - Verify returns `success: true`.
    - Verify DB `phone_numbers` has row with `provider_number_sid`.

## 2. Inbound Routing
- [ ] **Assign Route**:
    - `curl -X POST /.netlify/functions/numbers-assign-route -d '{ "phoneNumberId": "...", "routeId": "..." }'`
- [ ] **Simulate Inbound Call (Secure)**:
    - **Headers Required**:
        - `x-trinity-signature`: HMAC-SHA256(RAW_BODY, SECRET) hex digest
        - `x-trinity-timestamp`: Current Unix timestamp (ms)
    - **Payload**:
      ```json
      { 
        "message": { 
          "customer": { "number": "+1234567890" }, 
          "phoneNumber": { "number": "+14155550100" }, 
          "call": { "id": "prov_unique_123" } 
        } 
      }
      ```
    - `curl -X POST /.netlify/functions/telephony-inbound ...` (with headers)
    - Verify Response contains `{ "assistantId": "..." }` (Provider ID).
    - Verify `metadata.trinityCallId` is present in response.
    - Verify `voice_calls` DB row created with `direction='inbound'` and `status='ringing'`.
    - Verify `voice_call_events` DB rows created (`resolved_number`, `created_call`, `routed`).

- [ ] **Idempotency Verification**:
    - Re-run the EXACT same curl command (same `call.id` and `customer.number`).
    - Verify Response is 200 OK.
    - Verify Response Body matches previous call (same `trinityCallId` in metadata).
    - **Check DB**: Verify `voice_calls` count for this call ID is exactly 1.
    - Verify `voice_call_events` were NOT duplicated.

- [ ] **Race Condition Test (Constraint Verification)**:
    - **Check Constraint**: Run `\d voice_calls` or query pg_constraint to see `uq_voice_calls_provider_id`.
    - **Simultaneous Request**:
        - Run: `curl ... & curl ... & wait` (send two identical requests instantly).
    - **Verify**:
        - Both requests return 200 OK.
        - Both return the SAME `trinityCallId`.
        - DB has exactly ONE `voice_calls` row for that `provider_call_id`.

- [ ] **Zero-Trace Check**:
    - **Response**: Must NOT contain "Vapi", "Twilio", or raw provider errors.
    - **Logs**: Must NOT show unredacted provider call IDs.
    - **Logs**: Must NOT show full phone numbers (masked `***-1234` is OK).
    - **UI Data**: Frontend must receive only `trinityCallId` via API, never provider ID.
    - **Redaction**: Verify event payloads in DB have `providerId: "REDACTED"`.

## 3. Recording
- [ ] **Get Recording URL**:
    - `curl /.netlify/functions/recording-proxy?callId=<UUID> -H "Authorization:..."`
    - Verify returns valid signed URL (or proxy URL).
