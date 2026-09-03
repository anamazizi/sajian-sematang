-- SQL Fix: Ensure is_archived column has proper default and no NULL values
-- Run this script in Supabase SQL Editor to fix product visibility issues

-- 1. Add DEFAULT constraint if not exists
ALTER TABLE public.products 
ALTER COLUMN is_archived SET DEFAULT false;

-- 2. Update all NULL values to false
UPDATE public.products 
SET is_archived = false 
WHERE is_archived IS NULL;

-- 3. Add NOT NULL constraint (optional but recommended)
-- ALTER TABLE public.products 
-- ALTER COLUMN is_archived SET NOT NULL;

-- 4. Create index if not exists for better performance
CREATE INDEX IF NOT EXISTS idx_products_is_archived 
ON public.products(is_archived);

-- Verification query
SELECT 
  COUNT(*) as total_products,
  SUM(CASE WHEN is_archived IS NULL THEN 1 ELSE 0 END) as null_count,
  SUM(CASE WHEN is_archived = false THEN 1 ELSE 0 END) as false_count,
  SUM(CASE WHEN is_archived = true THEN 1 ELSE 0 END) as true_count
FROM public.products;

-- Show results
RAISE NOTICE '✅ DEFAULT constraint set for is_archived column';
RAISE NOTICE '✅ NULL values updated to false';
RAISE NOTICE '✅ Index created/verified';
RAISE NOTICE '✅ Products should now appear correctly on all pages';