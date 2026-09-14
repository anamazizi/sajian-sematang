-- ============================================
-- PHASE R6.4: ADD DELIVERY FEE CACHE TO USERS
-- ============================================
-- Menambah field untuk cache delivery fee daripada profile
-- Supabase akan calculate delivery fee menggunakan coordinates, cache untuk performance
-- Run selepas 02_add_user_location_fields.sql
-- ============================================

-- Add delivery_fee column to store cached delivery fee (for fast checkout)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS delivery_fee decimal(10, 2) DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.users.delivery_fee IS 'Cached delivery fee calculated from user coordinates (RM). Null means not yet calculated.';

-- Verification query (optional)
DO $$ 
BEGIN
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Delivery fee column added successfully!';
  RAISE NOTICE '===========================================';
END $$;