-- ===========================================
-- Fix Order Status Check Constraint
-- ===========================================
-- Master Prompt Seksyen 32: ORDER STATUS
-- ===========================================

-- Drop existing constraint if exists
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- Add new constraint with correct status values
-- Menggunakan uppercase untuk konsistensi dengan aplikasi
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check 
  CHECK (status IN ('PENDING', 'ACCEPTED', 'READY', 'DELIVERING', 'COMPLETED', 'CANCELLED'));

-- Update existing records to match new constraint
-- Convert 'New' to 'PENDING' and 'Preparing' to 'DELIVERING'
UPDATE public.orders 
SET status = 'PENDING'
WHERE status IN ('New', 'new', 'NEW', 'Baru', 'baru', 'BARU');

UPDATE public.orders 
SET status = 'DELIVERING'
WHERE status IN ('Preparing', 'preparing', 'PREPARING', 'Sediakan', 'sediakan');

-- Ensure all statuses are uppercase for consistency
UPDATE public.orders 
SET status = UPPER(status)
WHERE status NOT IN ('PENDING', 'ACCEPTED', 'READY', 'DELIVERING', 'COMPLETED', 'CANCELLED');

-- Add migration comment
COMMENT ON CONSTRAINT orders_status_check ON public.orders IS 'Valid order statuses: PENDING, ACCEPTED, READY, DELIVERING, COMPLETED, CANCELLED';

-- Update order_status_history table if exists
-- Convert statuses in audit history too
UPDATE public.order_status_history 
SET previous_status = 
  CASE 
    WHEN UPPER(previous_status) IN ('NEW', 'BARU') THEN 'PENDING'
    WHEN UPPER(previous_status) IN ('PREPARING', 'SEDIAKAN') THEN 'DELIVERING'
    ELSE UPPER(previous_status)
  END,
new_status = 
  CASE 
    WHEN UPPER(new_status) IN ('NEW', 'BARU') THEN 'PENDING'
    WHEN UPPER(new_status) IN ('PREPARING', 'SEDIAKAN') THEN 'DELIVERING'
    ELSE UPPER(new_status)
  END;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Order status constraint updated successfully!';
  RAISE NOTICE '';
  RAISE NOTICE 'Changes:';
  RAISE NOTICE '  - Constraint now accepts: PENDING, ACCEPTED, READY, DELIVERING, COMPLETED, CANCELLED';
  RAISE NOTICE '  - Converted ''New'' → ''PENDING''';
  RAISE NOTICE '  - Converted ''Preparing'' → ''DELIVERING''';
  RAISE NOTICE '  - All statuses standardized to uppercase';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Update UI to only send uppercase status values';
  RAISE NOTICE '  2. Ensure dropdown uses proper status display labels';
END $$;