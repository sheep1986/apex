/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  pgm.sql(`
    -- Consolidated Initial Schema

    -- phone_numbers table
    CREATE TABLE phone_numbers (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      organization_id UUID NOT NULL,
      phone_number VARCHAR(20) NOT NULL UNIQUE,
      friendly_name VARCHAR(255),
      country_code VARCHAR(5) DEFAULT '+1',
      country VARCHAR(2) DEFAULT 'US',
      area_code VARCHAR(10),
      provider VARCHAR(50) DEFAULT 'vapi',
      provider_id VARCHAR(255),
      provider_sid VARCHAR(255),
      voice_enabled BOOLEAN DEFAULT true,
      sms_enabled BOOLEAN DEFAULT false,
      mms_enabled BOOLEAN DEFAULT false,
      fax_enabled BOOLEAN DEFAULT false,
      status VARCHAR(50) DEFAULT 'active',
      is_available BOOLEAN DEFAULT true,
      current_campaign_id UUID,
      last_used_at TIMESTAMP WITH TIME ZONE,
      max_calls_per_hour INTEGER DEFAULT 60,
      max_calls_per_day INTEGER DEFAULT 500,
      current_hour_calls INTEGER DEFAULT 0,
      current_day_calls INTEGER DEFAULT 0,
      rate_limit_reset_hour TIMESTAMP WITH TIME ZONE,
      rate_limit_reset_day TIMESTAMP WITH TIME ZONE,
      monthly_cost DECIMAL(10, 2) DEFAULT 0,
      per_minute_cost DECIMAL(10, 4) DEFAULT 0.01,
      billing_type VARCHAR(50) DEFAULT 'metered',
      capabilities JSONB DEFAULT '{}',
      settings JSONB DEFAULT '{}',
      tags TEXT[],
      notes TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      deleted_at TIMESTAMP WITH TIME ZONE
    );

    CREATE INDEX idx_phone_numbers_organization_id ON phone_numbers(organization_id);
    CREATE INDEX idx_phone_numbers_status ON phone_numbers(status);
    CREATE INDEX idx_phone_numbers_is_available ON phone_numbers(is_available);
    CREATE INDEX idx_phone_numbers_phone_number ON phone_numbers(phone_number);
    CREATE INDEX idx_phone_numbers_country ON phone_numbers(country);
    CREATE INDEX idx_phone_numbers_last_used_at ON phone_numbers(last_used_at);
    CREATE INDEX idx_phone_numbers_provider ON phone_numbers(provider);
    CREATE INDEX idx_phone_numbers_current_campaign_id ON phone_numbers(current_campaign_id);

    ALTER TABLE phone_numbers ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "Enable all operations for authenticated users on phone_numbers"
      ON phone_numbers
      FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);

    -- leads table
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS address TEXT;
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS city TEXT;
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS state TEXT;
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS zip_code TEXT;
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS spouse_partner_name TEXT;
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_source_details TEXT;
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS best_time_to_call TEXT;
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS preferred_contact_method TEXT;
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS annual_energy_bill DECIMAL;
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS home_ownership_status TEXT;
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS roof_condition TEXT;
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS decision_maker_status TEXT;
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS timeline_interest TEXT;
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS budget_range TEXT;
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS current_energy_provider TEXT;
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS referral_source TEXT;
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES campaigns(id);
    CREATE INDEX IF NOT EXISTS idx_leads_campaign_id ON leads(campaign_id);

    -- call_queue table
    ALTER TABLE call_queue ADD COLUMN IF NOT EXISTS attempt INTEGER DEFAULT 1;
    ALTER TABLE call_queue ADD COLUMN IF NOT EXISTS contact_id TEXT;
    ALTER TABLE call_queue ADD COLUMN IF NOT EXISTS contact_name TEXT;
    ALTER TABLE call_queue ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    ALTER TABLE call_queue ADD COLUMN IF NOT EXISTS last_call_id TEXT;
    ALTER TABLE call_queue ADD COLUMN IF NOT EXISTS last_outcome TEXT;
    ALTER TABLE call_queue ADD COLUMN IF NOT EXISTS last_attempt_at TIMESTAMP WITH TIME ZONE;
    ALTER TABLE call_queue ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMP WITH TIME ZONE;
    CREATE INDEX IF NOT EXISTS idx_call_queue_campaign_id ON call_queue(campaign_id);
    CREATE INDEX IF NOT EXISTS idx_call_queue_status ON call_queue(status);
    CREATE INDEX IF NOT EXISTS idx_call_queue_scheduled_for ON call_queue(scheduled_for);


    -- campaigns table
    ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE;
    ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

    -- phone_number_usage_logs table
    CREATE TABLE IF NOT EXISTS phone_number_usage_logs (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      phone_number_id UUID NOT NULL REFERENCES phone_numbers(id) ON DELETE CASCADE,
      campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
      call_id UUID,
      action VARCHAR(50) NOT NULL,
      direction VARCHAR(20),
      duration_seconds INTEGER,
      cost DECIMAL(10, 4) DEFAULT 0,
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_phone_number_usage_logs_phone_number_id ON phone_number_usage_logs(phone_number_id);
    CREATE INDEX IF NOT EXISTS idx_phone_number_usage_logs_campaign_id ON phone_number_usage_logs(campaign_id);
    CREATE INDEX IF NOT EXISTS idx_phone_number_usage_logs_created_at ON phone_number_usage_logs(created_at);

    -- Functions and Triggers
    CREATE OR REPLACE FUNCTION update_phone_numbers_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER update_phone_numbers_updated_at_trigger
      BEFORE UPDATE ON phone_numbers
      FOR EACH ROW
      EXECUTE FUNCTION update_phone_numbers_updated_at();

    CREATE OR REPLACE FUNCTION get_available_phone_number(
      p_organization_id UUID,
      p_campaign_id UUID DEFAULT NULL
    )
    RETURNS UUID AS $$
    DECLARE
      v_phone_number_id UUID;
    BEGIN
      SELECT id INTO v_phone_number_id
      FROM phone_numbers
      WHERE organization_id = p_organization_id
        AND status = 'active'
        AND is_available = true
        AND (current_hour_calls < max_calls_per_hour OR rate_limit_reset_hour < NOW())
        AND (current_day_calls < max_calls_per_day OR rate_limit_reset_day < NOW())
        AND deleted_at IS NULL
      ORDER BY last_used_at ASC NULLS FIRST
      LIMIT 1
      FOR UPDATE SKIP LOCKED;
      
      IF v_phone_number_id IS NOT NULL THEN
        UPDATE phone_numbers
        SET 
          last_used_at = NOW(),
          current_campaign_id = COALESCE(p_campaign_id, current_campaign_id),
          current_hour_calls = CASE 
            WHEN rate_limit_reset_hour < NOW() THEN 1
            ELSE current_hour_calls + 1
          END,
          current_day_calls = CASE 
            WHEN rate_limit_reset_day < NOW() THEN 1
            ELSE current_day_calls + 1
          END,
          rate_limit_reset_hour = CASE 
            WHEN rate_limit_reset_hour < NOW() THEN NOW() + INTERVAL '1 hour'
            ELSE rate_limit_reset_hour
          END,
          rate_limit_reset_day = CASE 
            WHEN rate_limit_reset_day < NOW() THEN NOW() + INTERVAL '1 day'
            ELSE rate_limit_reset_day
          END
        WHERE id = v_phone_number_id;
      END IF;
      
      RETURN v_phone_number_id;
    END;
    $$ LANGUAGE plpgsql;

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
        IF NEW.transcript IS NULL OR NEW.transcript = '' THEN
            RETURN NEW;
        END IF;
        
        transcript_lower := LOWER(NEW.transcript);
        
        IF transcript_lower ~* '(not interested|remove.*list|hung up|don''t call|stop calling)' THEN
            RETURN NEW;
        END IF;
        
        extracted_name := COALESCE(
            (SELECT substring(NEW.transcript FROM '(?i)(?:this is|i''m|my name is)\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)')),
            (SELECT substring(NEW.transcript FROM '(?i)(?:hello|hi)\s+([A-Za-z]+)')),
            'Unknown Contact'
        );
        
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
        
        appointment_detected := transcript_lower ~* '(appointment|schedule|book|meeting|visit)';
        callback_detected := transcript_lower ~* '(call.*back|callback|call.*later)';
        
        IF appointment_detected THEN
            next_action_text := 'Follow up before appointment';
        ELSIF callback_detected THEN
            next_action_text := 'Schedule callback at requested time';
        ELSE
            next_action_text := 'Send follow-up information';
        END IF;
        
        SELECT * INTO lead_record 
        FROM leads 
        WHERE phone = NEW.phone_number OR phone = NEW.customer_phone
        LIMIT 1;
        
        IF lead_record IS NOT NULL THEN
            UPDATE leads SET
                name = CASE 
                    WHEN extracted_name != 'Unknown Contact' AND (name IS NULL OR name = 'Unknown Contact') 
                    THEN extracted_name 
                    ELSE name 
                END,
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
            INSERT INTO leads (
                organization_id, name, phone, email, company, source, status, priority, notes,
                call_id, call_duration, call_cost, call_transcript, sentiment_score,
                interest_level, appointment_scheduled, callback_requested, next_action, campaign_id,
                created_at, updated_at
            ) VALUES (
                NEW.organization_id, extracted_name, COALESCE(NEW.phone_number, NEW.customer_phone), NULL, 'Unknown Company', 'call',
                status_value, priority_level, 'Auto-converted from call on ' || CURRENT_DATE::TEXT,
                NEW.id, NEW.duration, NEW.cost, NEW.transcript, sentiment_value, interest_level_value,
                appointment_detected, callback_detected, next_action_text, NULL, NOW(), NOW()
            );
        END IF;
        
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.sql(`
    DROP TABLE phone_number_usage_logs;
    DROP TABLE phone_numbers;
    DROP FUNCTION update_phone_numbers_updated_at;
    DROP FUNCTION get_available_phone_number;
    DROP FUNCTION process_call_to_lead;
  `);
};
