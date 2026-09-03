-- SQL Fix: Repair is_archived column issues and restore product display
-- Run this script in Supabase SQL Editor to fix "Gagal Mencipta Produk" error

-- 1. First, check current state
SELECT 
  COUNT(*) as total_products,
  SUM(CASE WHEN is_archived IS NULL THEN 1 ELSE 0 END) as null_count,
  SUM(CASE WHEN is_archived = false THEN 1 ELSE 0 END) as false_count,
  SUM(CASE WHEN is_archived = true THEN 1 ELSE 0 END) as true_count
FROM public.products;

-- 2. If column doesn't exist, add it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'is_archived'
  ) THEN
    ALTER TABLE public.products ADD COLUMN is_archived boolean;
    RAISE NOTICE '✅ Added is_archived column to products table';
  ELSE
    RAISE NOTICE '✅ is_archived column already exists';
  END IF;
END $$;

-- 3. Ensure no NOT NULL constraint conflicts
-- First drop any existing NOT NULL constraint
ALTER TABLE public.products 
ALTER COLUMN is_archived DROP NOT NULL;

-- 4. Set DEFAULT constraint for new records
ALTER TABLE public.products 
ALTER COLUMN is_archived SET DEFAULT false;

-- 5. Update all NULL values to false (for existing products)
UPDATE public.products 
SET is_archived = false 
WHERE is_archived IS NULL;

-- 6. Create index for performance if not exists
CREATE INDEX IF NOT EXISTS idx_products_is_archived 
ON public.products(is_archived);

-- 7. Verification after fix
SELECT 
  COUNT(*) as total_products,
  SUM(CASE WHEN is_archived IS NULL THEN 1 ELSE 0 END) as null_count,
  SUM(CASE WHEN is_archived = false THEN 1 ELSE 0 END) as false_count,
  SUM(CASE WHEN is_archived = true THEN 1 ELSE 0 END) as true_count
FROM public.products;

-- 8. Show final status
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ DATABASE FIX COMPLETE';
  RAISE NOTICE '✅ is_archived column repaired';
  RAISE NOTICE '✅ NULL values updated to false';
  RAISE NOTICE '✅ DEFAULT constraint: false';
  RAISE NOTICE '✅ Products ready for display';
  RAISE NOTICE '========================================';
END $$;