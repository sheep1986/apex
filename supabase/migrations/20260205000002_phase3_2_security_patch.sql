-- Phase 3.2 Security Patch (P0): Prevent Zero-Trace leakage of provider_recording_ref
-- Goal: voice_call_recordings must be service-role only until provider URLs are synced/sanitised.

-- 1) Drop the dangerous user SELECT policy (if it exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'voice_call_recordings'
      AND policyname = 'Users can view recordings in their org'
  ) THEN
    EXECUTE 'DROP POLICY "Users can view recordings in their org" ON public.voice_call_recordings;';
  END IF;
END $$;

-- 2) Ensure RLS is enabled (service role bypasses RLS; authenticated users do not)
ALTER TABLE public.voice_call_recordings ENABLE ROW LEVEL SECURITY;

-- 3) (Optional but recommended) Explicitly revoke table privileges from authenticated/anon
-- RLS alone is usually enough, but this makes it belt-and-braces.
REVOKE ALL ON TABLE public.voice_call_recordings FROM anon;
REVOKE ALL ON TABLE public.voice_call_recordings FROM authenticated;
