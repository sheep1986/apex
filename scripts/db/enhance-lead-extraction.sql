-- Enhanced Lead Conversion Function with Comprehensive Data Extraction
CREATE OR REPLACE FUNCTION process_call_to_lead()
RETURNS TRIGGER AS $$
DECLARE
    lead_record RECORD;
    extracted_name TEXT;
    extracted_email TEXT;
    extracted_company TEXT;
    extracted_address TEXT;
    extracted_city TEXT;
    extracted_state TEXT;
    extracted_zip TEXT;
    spouse_name TEXT;
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
    
    -- ENHANCED NAME EXTRACTION
    -- Try multiple patterns to extract customer name
    extracted_name := COALESCE(
        -- "This is [Name]" or "I'm [Name]" 
        (SELECT substring(NEW.transcript FROM '(?i)(?:this is|i''m|my name is)\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)')),
        -- "Hello [Name]" or "Hi [Name]"
        (SELECT substring(NEW.transcript FROM '(?i)(?:hello|hi)\s+([A-Za-z]+)')),
        -- "[Name] speaking" or "[Name] here"
        (SELECT substring(NEW.transcript FROM '(?i)([A-Za-z]+(?:\s+[A-Za-z]+)?)\s+(?:speaking|here)')),
        -- "Mr./Mrs./Ms. [Name]"
        (SELECT substring(NEW.transcript FROM '(?i)(?:mr|mrs|ms|miss)\.?\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)')),
        'Unknown Contact'
    );
    
    -- EMAIL EXTRACTION
    extracted_email := (
        SELECT substring(NEW.transcript FROM '([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})')
    );
    
    -- COMPANY EXTRACTION
    extracted_company := COALESCE(
        -- "I work at [Company]" or "I'm from [Company]"
        (SELECT substring(NEW.transcript FROM '(?i)(?:work at|from|with)\s+([A-Za-z0-9\s&.,]+?)(?:\s|$|\.)')),
        -- "[Company] Solutions/Services/Corp/LLC/Inc"
        (SELECT substring(NEW.transcript FROM '(?i)([A-Za-z0-9\s&.,]+?)\s+(?:solutions|services|corp|corporation|llc|inc|company)(?:\s|$|\.)')),
        -- Company mentioned in context
        (SELECT substring(NEW.transcript FROM '(?i)(?:at|for)\s+([A-Za-z0-9\s&.,]{3,25})(?:\s|$|\.)')),
        'Unknown Company'
    );
    
    -- ADDRESS EXTRACTION
    -- Street address pattern (number + street name)
    extracted_address := (
        SELECT substring(NEW.transcript FROM '(?i)(\d+\s+[A-Za-z0-9\s,.-]+?)(?:\s*(?:street|st|avenue|ave|road|rd|drive|dr|lane|ln|way|blvd|boulevard|circle|cir|court|ct))')
    );
    
    -- CITY EXTRACTION
    extracted_city := (
        SELECT substring(NEW.transcript FROM '(?i)(?:in|at|from)\s+([A-Za-z\s]+?),?\s+[A-Z]{2}(?:\s|$)')
    );
    
    -- STATE EXTRACTION  
    extracted_state := (
        SELECT substring(NEW.transcript FROM '(?i)([A-Z]{2})(?:\s+\d{5}|\s|$)')
    );
    
    -- ZIP CODE EXTRACTION
    extracted_zip := (
        SELECT substring(NEW.transcript FROM '(\d{5}(?:-\d{4})?)')
    );
    
    -- SPOUSE/PARTNER NAME EXTRACTION
    spouse_name := (
        SELECT substring(NEW.transcript FROM '(?i)(?:my|and my)\s+(?:wife|husband|partner|spouse)\s+([A-Za-z]+)')
    );
    
    -- PRIORITY ASSIGNMENT (Enhanced)
    IF transcript_lower ~* '(very interested|absolutely|definitely|sounds great|perfect|excellent|love to|yes please|book|schedule|appointment)' THEN
        priority_level := 'high';
        status_value := 'qualified';
        interest_level_value := 'high';
        sentiment_value := 0.8;
    ELSIF transcript_lower ~* '(interested|sounds good|tell me more|information|callback|call back|follow up)' THEN
        priority_level := 'medium';
        status_value := 'new';
        interest_level_value := 'medium';
        sentiment_value := 0.6;
    ELSIF transcript_lower ~* '(maybe|might|considering|think about|possibly|perhaps)' THEN
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
    
    -- APPOINTMENT DETECTION
    appointment_detected := transcript_lower ~* '(appointment|schedule|book|meeting|visit|come by|tuesday|wednesday|thursday|friday|saturday|sunday|monday|\d+\s*pm|\d+\s*am)';
    
    -- CALLBACK DETECTION
    callback_detected := transcript_lower ~* '(call.*back|callback|call.*later|follow.*up|contact.*later)';
    
    -- NEXT ACTION DETERMINATION
    IF appointment_detected THEN
        next_action_text := 'Confirm appointment details and send calendar invite';
    ELSIF callback_detected THEN
        next_action_text := 'Schedule callback at requested time';
    ELSIF priority_level = 'high' THEN
        next_action_text := 'Priority follow-up within 24 hours';
    ELSE
        next_action_text := 'Send follow-up information and schedule call';
    END IF;
    
    -- Check for existing lead
    SELECT * INTO lead_record 
    FROM leads 
    WHERE phone = NEW.phone_number OR phone = NEW.customer_phone
    LIMIT 1;
    
    IF lead_record IS NOT NULL THEN
        -- UPDATE existing lead with new/better information
        UPDATE leads SET
            name = CASE 
                WHEN extracted_name != 'Unknown Contact' AND (name IS NULL OR name = 'Unknown Contact' OR length(extracted_name) > length(name)) 
                THEN extracted_name 
                ELSE name 
            END,
            email = CASE 
                WHEN extracted_email IS NOT NULL THEN extracted_email 
                ELSE email 
            END,
            company = CASE 
                WHEN extracted_company != 'Unknown Company' AND (company IS NULL OR company = 'Unknown Company') 
                THEN extracted_company 
                ELSE company 
            END,
            address = CASE 
                WHEN extracted_address IS NOT NULL THEN extracted_address 
                ELSE address 
            END,
            city = CASE 
                WHEN extracted_city IS NOT NULL THEN extracted_city 
                ELSE city 
            END,
            state = CASE 
                WHEN extracted_state IS NOT NULL THEN extracted_state 
                ELSE state 
            END,
            zip_code = CASE 
                WHEN extracted_zip IS NOT NULL THEN extracted_zip 
                ELSE zip_code 
            END,
            spouse_partner_name = CASE 
                WHEN spouse_name IS NOT NULL THEN spouse_name 
                ELSE spouse_partner_name 
            END,
            -- Always update these based on latest call
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
        -- CREATE new lead
        INSERT INTO leads (
            organization_id,
            name,
            phone,
            email,
            company,
            address,
            city,
            state,
            zip_code,
            spouse_partner_name,
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
            created_at,
            updated_at
        ) VALUES (
            NEW.organization_id,
            extracted_name,
            COALESCE(NEW.phone_number, NEW.customer_phone),
            extracted_email,
            extracted_company,
            extracted_address,
            extracted_city,
            extracted_state,
            extracted_zip,
            spouse_name,
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
            NOW(),
            NOW()
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;