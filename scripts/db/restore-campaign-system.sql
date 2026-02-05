-- RESTORE CAMPAIGN SYSTEM FUNCTIONALITY
-- This fixes the campaign-lead relationship broken during CRM update

-- 1. Add back the campaign_id column to leads table
ALTER TABLE leads 
ADD COLUMN campaign_id UUID REFERENCES campaigns(id);

-- 2. Create index for better performance
CREATE INDEX idx_leads_campaign_id ON leads(campaign_id);

-- 3. Update the lead conversion trigger to preserve campaign relationships
-- Modified trigger that won't overwrite existing campaign assignments
CREATE OR REPLACE FUNCTION process_call_to_lead()
RETURNS TRIGGER AS $$
DECLARE
    lead_record RECORD;
    extracted_name TEXT;
    priority_level TEXT;
    status_value TEXT;
    interest_level_value TEXT;
    sentiment_value DECIMAL;
    appointment_detected BOOLEAN := FALSE;
    callback_detected BOOLEAN := FALSE;
    next_action_text TEXT;
    transcript_lower TEXT;
BEGIN
    -- Skip if no transcript
    IF NEW.transcript IS NULL OR NEW.transcript = '' THEN
        RETURN NEW;
    END IF;
    
    transcript_lower := LOWER(NEW.transcript);
    
    -- Skip negative calls
    IF transcript_lower ~* '(not interested|remove.*list|hung up|don''t call|stop calling)' THEN
        RETURN NEW;
    END IF;
    
    -- Simple name extraction
    extracted_name := COALESCE(
        (SELECT substring(NEW.transcript FROM '(?i)(?:this is|i''m|my name is)\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)')),
        (SELECT substring(NEW.transcript FROM '(?i)(?:hello|hi)\s+([A-Za-z]+)')),
        'Unknown Contact'
    );
    
    -- Priority assignment
    IF transcript_lower ~* '(very interested|absolutely|definitely|sounds great|appointment|schedule)' THEN
        priority_level := 'high';
        status_value := 'qualified';
        interest_level_value := 'high';
        sentiment_value := 0.8;
    ELSIF transcript_lower ~* '(interested|sounds good|tell me more|callback|call back)' THEN
        priority_level := 'medium';
        status_value := 'new';
        interest_level_value := 'medium';
        sentiment_value := 0.6;
    ELSIF transcript_lower ~* '(maybe|might|considering|think about)' THEN
        priority_level := 'low';
        status_value := 'contacted';
        interest_level_value := 'low';
        sentiment_value := 0.5;
    ELSE
        priority_level := 'medium';
        status_value := 'new';
        interest_level_value := 'medium';
        sentiment_value := 0.6;
    END IF;
    
    -- Detect appointment and callback
    appointment_detected := transcript_lower ~* '(appointment|schedule|book|meeting|visit)';
    callback_detected := transcript_lower ~* '(call.*back|callback|call.*later)';
    
    -- Next action
    IF appointment_detected THEN
        next_action_text := 'Follow up before appointment';
    ELSIF callback_detected THEN
        next_action_text := 'Schedule callback at requested time';
    ELSE
        next_action_text := 'Send follow-up information';
    END IF;
    
    -- Check for existing lead
    SELECT * INTO lead_record 
    FROM leads 
    WHERE phone = NEW.phone_number OR phone = NEW.customer_phone
    LIMIT 1;
    
    IF lead_record IS NOT NULL THEN
        -- UPDATE existing lead but preserve campaign_id if it exists
        UPDATE leads SET
            name = CASE 
                WHEN extracted_name != 'Unknown Contact' AND (name IS NULL OR name = 'Unknown Contact') 
                THEN extracted_name 
                ELSE name 
            END,
            -- Keep existing campaign_id - DON'T overwrite it
            priority = priority_level,
            status = status_value,
            call_id = NEW.id,
            call_duration = NEW.duration,
            call_cost = NEW.cost,
            call_transcript = NEW.transcript,
            sentiment_score = sentiment_value,
            interest_level = interest_level_value,
            appointment_scheduled = appointment_detected,
            callback_requested = callback_detected,
            next_action = next_action_text,
            notes = COALESCE(notes || E'\n', '') || 'Updated from call on ' || CURRENT_DATE::TEXT,
            updated_at = NOW()
        WHERE id = lead_record.id;
        
    ELSE
        -- CREATE new lead (will not have campaign_id initially)
        INSERT INTO leads (
            organization_id,
            name,
            phone,
            email,
            company,
            source,
            status,
            priority,
            notes,
            call_id,
            call_duration,
            call_cost,
            call_transcript,
            sentiment_score,
            interest_level,
            appointment_scheduled,
            callback_requested,
            next_action,
            -- campaign_id is NULL for auto-converted leads
            campaign_id,
            created_at,
            updated_at
        ) VALUES (
            NEW.organization_id,
            extracted_name,
            COALESCE(NEW.phone_number, NEW.customer_phone),
            NULL,
            'Unknown Company',
            'call',
            status_value,
            priority_level,
            'Auto-converted from call on ' || CURRENT_DATE::TEXT,
            NEW.id,
            NEW.duration,
            NEW.cost,
            NEW.transcript,
            sentiment_value,
            interest_level_value,
            appointment_detected,
            callback_detected,
            next_action_text,
            NULL, -- No campaign assignment for auto-converted leads
            NOW(),
            NOW()
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;