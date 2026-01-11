-- Migration script to add alarm logic columns to medications table

-- Add columns if they don't exist
ALTER TABLE public.medications 
ADD COLUMN IF NOT EXISTS first_dose_time TIME,
ADD COLUMN IF NOT EXISTS interval_hours INTEGER,
ADD COLUMN IF NOT EXISTS reminder_times TEXT[],
ADD COLUMN IF NOT EXISTS frequency_count INTEGER;

-- Optional: Update existing records with defaults if needed
-- UPDATE public.medications SET frequency_count = 1 WHERE frequency_count IS NULL;

-- Ensure RLS is still active (it should be)
-- ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
