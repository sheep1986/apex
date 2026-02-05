-- Add missing columns to leads table for comprehensive data capture
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS zip_code TEXT,
ADD COLUMN IF NOT EXISTS spouse_partner_name TEXT,
ADD COLUMN IF NOT EXISTS lead_source_details TEXT,
ADD COLUMN IF NOT EXISTS best_time_to_call TEXT,
ADD COLUMN IF NOT EXISTS preferred_contact_method TEXT,
ADD COLUMN IF NOT EXISTS annual_energy_bill DECIMAL,
ADD COLUMN IF NOT EXISTS home_ownership_status TEXT,
ADD COLUMN IF NOT EXISTS roof_condition TEXT,
ADD COLUMN IF NOT EXISTS decision_maker_status TEXT,
ADD COLUMN IF NOT EXISTS timeline_interest TEXT,
ADD COLUMN IF NOT EXISTS budget_range TEXT,
ADD COLUMN IF NOT EXISTS current_energy_provider TEXT,
ADD COLUMN IF NOT EXISTS referral_source TEXT;