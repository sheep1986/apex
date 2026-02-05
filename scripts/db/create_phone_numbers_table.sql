-- Create phone_numbers table for managing Apex/VAPI phone numbers
-- This table stores phone numbers that can be used for outbound calling campaigns

CREATE TABLE IF NOT EXISTS phone_numbers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Phone number details
  phone_number VARCHAR(20) NOT NULL UNIQUE,
  friendly_name VARCHAR(255),
  country_code VARCHAR(5) DEFAULT '+1',
  area_code VARCHAR(10),
  
  -- Provider information
  provider VARCHAR(50) DEFAULT 'vapi', -- 'vapi', 'twilio', 'custom'
  provider_id VARCHAR(255), -- ID from the provider (e.g., VAPI phone number ID)
  provider_sid VARCHAR(255), -- SID from provider if applicable
  
  -- Configuration
  voice_enabled BOOLEAN DEFAULT true,
  sms_enabled BOOLEAN DEFAULT false,
  mms_enabled BOOLEAN DEFAULT false,
  fax_enabled BOOLEAN DEFAULT false,
  
  -- Usage and status
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'inactive', 'suspended', 'deleted'
  is_available BOOLEAN DEFAULT true,
  current_campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  last_used_at TIMESTAMP WITH TIME ZONE,
  
  -- Rate limiting
  max_calls_per_hour INTEGER DEFAULT 60,
  max_calls_per_day INTEGER DEFAULT 500,
  current_hour_calls INTEGER DEFAULT 0,
  current_day_calls INTEGER DEFAULT 0,
  rate_limit_reset_hour TIMESTAMP WITH TIME ZONE,
  rate_limit_reset_day TIMESTAMP WITH TIME ZONE,
  
  -- Cost tracking
  monthly_cost DECIMAL(10, 2) DEFAULT 0,
  per_minute_cost DECIMAL(10, 4) DEFAULT 0.01,
  billing_type VARCHAR(50) DEFAULT 'metered', -- 'metered', 'fixed', 'unlimited'
  
  -- Capabilities
  capabilities JSONB DEFAULT '{}', -- Store provider-specific capabilities
  settings JSONB DEFAULT '{}', -- Store additional settings
  
  -- Metadata
  tags TEXT[], -- Array of tags for categorization
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE -- Soft delete support
);

-- Create indexes for better performance
CREATE INDEX idx_phone_numbers_organization_id ON phone_numbers(organization_id);
CREATE INDEX idx_phone_numbers_status ON phone_numbers(status);
CREATE INDEX idx_phone_numbers_is_available ON phone_numbers(is_available);
CREATE INDEX idx_phone_numbers_current_campaign_id ON phone_numbers(current_campaign_id);
CREATE INDEX idx_phone_numbers_provider ON phone_numbers(provider);
CREATE INDEX idx_phone_numbers_phone_number ON phone_numbers(phone_number);
CREATE INDEX idx_phone_numbers_last_used_at ON phone_numbers(last_used_at);

-- Create trigger to update updated_at timestamp
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

-- Create RLS policies
ALTER TABLE phone_numbers ENABLE ROW LEVEL SECURITY;

-- Policy for organization members to view their phone numbers
CREATE POLICY "Organization members can view their phone numbers"
  ON phone_numbers
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM users 
      WHERE id = auth.uid()
    )
  );

-- Policy for organization admins to manage phone numbers
CREATE POLICY "Organization admins can manage phone numbers"
  ON phone_numbers
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'owner', 'platform_owner')
    )
  );

-- Create phone_number_usage_logs table for tracking usage
CREATE TABLE IF NOT EXISTS phone_number_usage_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number_id UUID NOT NULL REFERENCES phone_numbers(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  call_id UUID REFERENCES calls(id) ON DELETE SET NULL,
  
  -- Usage details
  action VARCHAR(50) NOT NULL, -- 'call_placed', 'call_received', 'sms_sent', 'sms_received'
  direction VARCHAR(20), -- 'inbound', 'outbound'
  duration_seconds INTEGER,
  
  -- Cost
  cost DECIMAL(10, 4) DEFAULT 0,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for usage logs
CREATE INDEX idx_phone_number_usage_logs_phone_number_id ON phone_number_usage_logs(phone_number_id);
CREATE INDEX idx_phone_number_usage_logs_campaign_id ON phone_number_usage_logs(campaign_id);
CREATE INDEX idx_phone_number_usage_logs_created_at ON phone_number_usage_logs(created_at);

-- Sample data insertion (commented out - uncomment and modify as needed)
/*
INSERT INTO phone_numbers (
  organization_id,
  phone_number,
  friendly_name,
  country_code,
  area_code,
  provider,
  provider_id,
  status,
  is_available,
  max_calls_per_hour,
  max_calls_per_day,
  monthly_cost,
  per_minute_cost,
  capabilities,
  tags
) VALUES 
(
  '2566d8c5-2245-4a3c-b539-4cea21a07d9b', -- Replace with actual org ID
  '+14155551234',
  'Main Campaign Line',
  '+1',
  '415',
  'vapi',
  'vapi_phone_abc123',
  'active',
  true,
  60,
  500,
  15.00,
  0.015,
  '{"voice": true, "sms": false, "recording": true, "transcription": true}'::jsonb,
  ARRAY['primary', 'sales', 'us-west']
);
*/

-- Function to rotate phone numbers for load balancing
CREATE OR REPLACE FUNCTION get_available_phone_number(
  p_organization_id UUID,
  p_campaign_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_phone_number_id UUID;
BEGIN
  -- Get the least recently used available phone number
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
  
  -- Update the phone number usage
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

-- Grant permissions
GRANT ALL ON phone_numbers TO authenticated;
GRANT ALL ON phone_number_usage_logs TO authenticated;
GRANT EXECUTE ON FUNCTION get_available_phone_number TO authenticated;
GRANT EXECUTE ON FUNCTION update_phone_numbers_updated_at TO authenticated;