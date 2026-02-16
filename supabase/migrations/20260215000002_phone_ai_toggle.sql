-- AI toggle and forwarding for phone numbers
ALTER TABLE phone_numbers ADD COLUMN IF NOT EXISTS ai_enabled BOOLEAN DEFAULT true;
ALTER TABLE phone_numbers ADD COLUMN IF NOT EXISTS ai_disabled_forward_to TEXT;
-- Business hours config on inbound_routes
ALTER TABLE inbound_routes ADD COLUMN IF NOT EXISTS business_hours JSONB DEFAULT '{}'::jsonb;
ALTER TABLE inbound_routes ADD COLUMN IF NOT EXISTS after_hours_action TEXT DEFAULT 'voicemail';
ALTER TABLE inbound_routes ADD COLUMN IF NOT EXISTS after_hours_forward_to TEXT;
ALTER TABLE inbound_routes ADD COLUMN IF NOT EXISTS after_hours_greeting TEXT;
