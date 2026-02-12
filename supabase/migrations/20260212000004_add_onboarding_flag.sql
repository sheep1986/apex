-- Add onboarding_completed flag to profiles table
-- This tracks whether a user has gone through the onboarding wizard

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;
