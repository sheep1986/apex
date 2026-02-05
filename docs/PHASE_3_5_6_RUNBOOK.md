# Phase 3.5 & 3.6 Runbook: Finalization & Governance

**Goal**: Deploy Telephony Finalizer (Status Webhook) and Governance Layer (Audit/Rules).

## 1. Environment & Secrets
Ensure these are set in Netlify:
*   `TRINITY_WEBHOOK_SECRET` (Required for HMAC)
*   `SUPABASE_SERVICE_ROLE_KEY` (Required for RLS Bypass)

## 2. Deployment Protocol
1.  **Commit & Push**:
    ```bash
    git add .
    git commit -m "feat: Phase 3.5/3.6 telephony finaliser + governance"
    git push origin main
    ```
2.  **Apply Migrations** (Remote):
    ```bash
    npx supabase db push
    ```

## 3. Acceptance Testing

### A. Idempotency & Campaign Closure
**Scenario**: Simulate a provider callback for a specific call ID attached to a campaign.

1.  **Setup (SQL)**:
    ```sql
    -- Insert Active Campaign Item linked to a Voice Call
    -- REPLACE WITH REAL ORG ID
    INSERT INTO voice_calls (organization_id, provider_call_id, campaign_id, status)
    VALUES ('ORG_UUID', 'prov-123', 'CAMPAIGN_UUID', 'in_progress') RETURNING id; 
    
    -- Link Item
    UPDATE campaign_items SET voice_call_id = 'VOICE_CALL_ID_FROM_ABOVE', status = 'in_progress' 
    WHERE id = 'ITEM_UUID';
    ```

2.  **Execute (Terminal)**:
    ```bash
    # Set Variables
    SECRET="YOUR_SECRET"
    URL="https://YOUR_DOMAIN.netlify.app/.netlify/functions/telephony-status"
    BODY='{ "message": { "type": "end-of-call-report", "call": { "id": "prov-123" }, "duration": 60, "cost": 0.10, "endedReason": "completed", "transcript": "Hello world" } }'

    # Generate Sig
    TS=$(date +%s%3N)
    SIG=$(echo -n "$BODY" | openssl dgst -sha256 -hmac "$SECRET" | awk '{print $NF}')

    # Send Request TWICE
    curl -X POST "$URL" -H "x-trinity-signature: $SIG" -H "x-trinity-timestamp: $TS" -d "$BODY"
    curl -X POST "$URL" -H "x-trinity-signature: $SIG" -H "x-trinity-timestamp: $TS" -d "$BODY"
    ```

3.  **Verify (SQL)**:
    ```sql
    -- 1. Idempotency: Expect 1 Row
    SELECT count(*) FROM voice_call_finalisations WHERE provider_call_id = 'prov-123';
    
    -- 2. Campaign Loop: Expect Item 'completed'
    SELECT status FROM campaign_items WHERE voice_call_id = (SELECT id FROM voice_calls WHERE provider_call_id = 'prov-123');
    
    -- 3. Private Data: Expect Transcript in PRIVATE table, NOT public
    SELECT transcript_summary FROM voice_call_private WHERE voice_call_id = ...;
    SELECT transcript_summary FROM voice_calls WHERE id = ...; -- Should be NULL or minimal header
    ```

### B. Audit Log Verification (No PII)
1.  **Action**: Update a Contact in the Dashboard or via SQL.
    ```sql
    UPDATE contacts SET name = 'Audit Test' WHERE phone_e164 = '+15550009999';
    ```
2.  **Check Log**:
    ```sql
    SELECT resource_type, action, changed_fields FROM audit_logs WHERE resource_type = 'contacts' ORDER BY created_at DESC LIMIT 1;
    ```
    *   **Expect**: `changed_fields` = `{"name", "updated_at"}`.
    *   **Expect**: `diff` column (if present) or `changed_fields` MUST NOT contain the string 'Audit Test'.

### C. Outcome Rules
1.  **Setup Rule**:
    ```sql
    INSERT INTO conversation_outcome_rules (organization_id, name, trigger_pattern, outcome_label)
    VALUES ('ORG_UUID', 'Interest Check', 'interested', 'Appointment Set');
    ```
2.  **Simulate Call**: End a call with transcript summary containing "User is interested".
3.  **Verify**: `voice_calls.outcome` should equal `'Appointment Set'`.

## 4. Final Checklist
- [ ] `voice_call_recordings` is empty of User Policies? (Service Role Only)
- [ ] `voice_call_private` created and restricted?
- [ ] `audit_logs` contains column names ONLY (No values)?

**Status**: READY FOR DEPLOY 🚀
