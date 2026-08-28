-- ============================================
-- PHASE R2: ADD USER LOCATION FIELDS
-- ============================================
-- Menambah fields untuk location tracking dan delivery calculation
-- Run selepas 00_patch_all_missing_columns.sql (Phase R1)
-- ============================================

-- Add latitude and longitude for precise location
-- Needed for delivery fee calculation (Seksyen 23-24 Master Prompt)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS latitude decimal(10, 6);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS longitude decimal(10, 6);

-- Add Google Maps URL field
-- Customer will provide this during profile setup (Seksyen 26 Master Prompt)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS google_maps_url text;

-- Create index for future geospatial queries
-- Useful for finding nearby customers/calculating distances
CREATE INDEX IF NOT EXISTS idx_users_location ON public.users(latitude, longitude);

-- Set default NULL for existing users (they will update during next profile edit)
-- No need to update existing rows - NULL means "not yet provided"

-- Verify the columns were added
DO $$ 
BEGIN
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'User location fields added successfully!';
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Fields added:';
  RAISE NOTICE '  - latitude (decimal 10,6)';
  RAISE NOTICE '  - longitude (decimal 10,6)';
  RAISE NOTICE '  - google_maps_url (text)';
  RAISE NOTICE '===========================================';
END $$;

-- ============================================
-- VERIFICATION QUERY (optional - uncomment to test)
-- ============================================
/*
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'users'
  AND column_name IN ('latitude', 'longitude', 'google_maps_url')
ORDER BY column_name;
*/
