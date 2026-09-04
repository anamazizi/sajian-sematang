-- ============================================
-- ADD MISSING COLUMNS FOR RLS COMPLIANCE
-- ============================================
-- Ensure required columns exist for RLS policies to work
-- ============================================

-- 1. Add is_active column to users table if missing
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 2. Ensure phone_number column exists for customer matching
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- 3. Update existing users to be active by default
UPDATE public.users SET is_active = true WHERE is_active IS NULL;

-- 4. Add comment for documentation
COMMENT ON COLUMN public.users.is_active IS 'User account status (true = active, false = inactive)';
COMMENT ON COLUMN public.users.phone_number IS 'User phone number for customer order matching';

-- 5. Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Missing columns added successfully!';
  RAISE NOTICE '';
  RAISE NOTICE 'Added columns:';
  RAISE NOTICE '  - public.users.is_active (BOOLEAN DEFAULT true)';
  RAISE NOTICE '  - public.users.phone_number (TEXT)';
  RAISE NOTICE '';
  RAISE NOTICE 'Important:';
  RAISE NOTICE '  - All existing users set to is_active = true';
  RAISE NOTICE '  - RLS policies now require is_active = true for access';
  RAISE NOTICE '  - Run supabase/19_fix_orders_rls_admin.sql after this';
END $$;