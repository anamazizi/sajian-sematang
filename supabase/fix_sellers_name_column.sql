-- ============================================
-- FIX SELLERS TABLE - ADD 'name' COLUMN
-- ============================================
-- Date: 30 Ogos 2026
-- Purpose: Add 'name' column to sellers table (required by RLS/views)
--          Fix NOT NULL constraint issue
-- ============================================

-- Check if 'name' column exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sellers' AND column_name = 'name'
  ) THEN
    -- Add 'name' column (NOT NULL with default from shop_name)
    ALTER TABLE public.sellers 
      ADD COLUMN name text;
    
    -- Populate 'name' from existing 'shop_name' values
    UPDATE public.sellers 
    SET name = shop_name 
    WHERE name IS NULL;
    
    -- Make it NOT NULL after populating
    ALTER TABLE public.sellers 
      ALTER COLUMN name SET NOT NULL;
    
    RAISE NOTICE '✅ Column "name" added to sellers table';
  ELSE
    RAISE NOTICE 'ℹ️  Column "name" already exists in sellers table';
  END IF;
END $$;

-- Ensure shop_name also exists (for compatibility)
ALTER TABLE public.sellers 
  ADD COLUMN IF NOT EXISTS shop_name text;

-- Create trigger to sync name and shop_name
CREATE OR REPLACE FUNCTION sync_seller_name()
RETURNS TRIGGER AS $$
BEGIN
  -- If name is set, copy to shop_name
  IF NEW.name IS NOT NULL AND NEW.shop_name IS NULL THEN
    NEW.shop_name := NEW.name;
  END IF;
  
  -- If shop_name is set, copy to name
  IF NEW.shop_name IS NOT NULL AND NEW.name IS NULL THEN
    NEW.name := NEW.shop_name;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS sync_seller_name_trigger ON public.sellers;

-- Create trigger
CREATE TRIGGER sync_seller_name_trigger
BEFORE INSERT OR UPDATE ON public.sellers
FOR EACH ROW
EXECUTE FUNCTION sync_seller_name();

-- Verification
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'sellers'
  AND column_name IN ('name', 'shop_name')
ORDER BY ordinal_position;

-- Show sample data
SELECT 
  id,
  name,
  shop_name,
  CASE 
    WHEN name = shop_name THEN '✅ Synced'
    WHEN name IS NULL OR shop_name IS NULL THEN '⚠️  Missing'
    ELSE '❌ Mismatch'
  END AS status
FROM public.sellers
LIMIT 5;

COMMENT ON COLUMN public.sellers.name IS 'Seller name (synced with shop_name)';
COMMENT ON COLUMN public.sellers.shop_name IS 'Shop name (synced with name)';
