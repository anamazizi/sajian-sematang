-- ============================================
-- MIGRATION 23: FIX PRE-ORDER COLUMNS & ENSURE DISPLAY_ORDER EXISTS
-- ============================================
-- Tarikh: 07/09/2026
-- Objektif: 
--   1. Rename available_from/available_until ke preorder_start/preorder_end
--   2. Pastikan display_order wujud dengan default 1 (bukan 0)
--   3. Pastikan image_url wujud
--   4. Refresh schema cache untuk elak ralat "Could not find the 'preorder_end' column"
-- ============================================

-- ============================================
-- PART 1: RENAME AVAILABLE COLUMNS TO PREORDER COLUMNS
-- ============================================

-- Rename available_from to preorder_start jika wujud
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'products' 
    AND column_name = 'available_from'
  ) THEN
    ALTER TABLE public.products RENAME COLUMN available_from TO preorder_start;
    RAISE NOTICE 'Renamed available_from to preorder_start';
  END IF;
END $$;

-- Rename available_until to preorder_end jika wujud
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'products' 
    AND column_name = 'available_until'
  ) THEN
    ALTER TABLE public.products RENAME COLUMN available_until TO preorder_end;
    RAISE NOTICE 'Renamed available_until to preorder_end';
  END IF;
END $$;

-- ============================================
-- PART 2: ENSURE ALL REQUIRED COLUMNS EXIST
-- ============================================

-- Pastikan is_preorder column wujud
ALTER TABLE public.products 
  ADD COLUMN IF NOT EXISTS is_preorder BOOLEAN DEFAULT false;

-- Pastikan preorder_start column wujud (jika rename gagal atau column tidak wujud)
ALTER TABLE public.products 
  ADD COLUMN IF NOT EXISTS preorder_start TIMESTAMPTZ;

-- Pastikan preorder_end column wujud (jika rename gagal atau column tidak wujud)
ALTER TABLE public.products 
  ADD COLUMN IF NOT EXISTS preorder_end TIMESTAMPTZ;

-- Pastikan image_url column wujud
ALTER TABLE public.products 
  ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Pastikan display_order column wujud dengan default 1 (bukan 0 untuk consistency)
ALTER TABLE public.products 
  ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 1;

-- Update display_order default untuk records yang mempunyai 0
UPDATE public.products 
SET display_order = 1 
WHERE display_order = 0 OR display_order IS NULL;

-- ============================================
-- PART 3: COPY DATA FROM OLD COLUMNS IF NEEDED
-- ============================================

-- Jika ada column lama "available_from" selepas rename attempt, copy data ke preorder_start
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'products' 
    AND column_name = 'available_from'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'products' 
    AND column_name = 'preorder_start'
  ) THEN
    UPDATE public.products 
    SET preorder_start = available_from 
    WHERE available_from IS NOT NULL AND preorder_start IS NULL;
    RAISE NOTICE 'Copied data from available_from to preorder_start';
  END IF;
END $$;

-- Jika ada column lama "available_until" selepas rename attempt, copy data ke preorder_end
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'products' 
    AND column_name = 'available_until'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'products' 
    AND column_name = 'preorder_end'
  ) THEN
    UPDATE public.products 
    SET preorder_end = available_until 
    WHERE available_until IS NOT NULL AND preorder_end IS NULL;
    RAISE NOTICE 'Copied data from available_until to preorder_end';
  END IF;
END $$;

-- ============================================
-- PART 5: CREATE INDEX FOR PERFORMANCE
-- ============================================

-- Create index untuk performance (jika belum wujud)
CREATE INDEX IF NOT EXISTS idx_products_display_order_seller 
  ON public.products(seller_id, display_order);

-- ============================================
-- PART 6: REFRESH SCHEMA CACHE
-- ============================================

-- Refresh PostgREST schema cache untuk elak ralat "Could not find the 'preorder_end' column"
NOTIFY pgrst, 'reload schema';

-- Drop available_from jika masih wujud (selepas data dicopy)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'products' 
    AND column_name = 'available_from'
  ) THEN
    ALTER TABLE public.products DROP COLUMN available_from;
    RAISE NOTICE 'Dropped column available_from';
  END IF;
END $$;

-- Drop available_until jika masih wujud (selepas data dicopy)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'products' 
    AND column_name = 'available_until'
  ) THEN
    ALTER TABLE public.products DROP COLUMN available_until;
    RAISE NOTICE 'Dropped column available_until';
  END IF;
END $$;

-- ============================================
-- PART 5: REFRESH SCHEMA CACHE
-- ============================================

-- Refresh PostgREST schema cache untuk elak ralat "Could not find the 'preorder_end' column"
NOTIFY pgrst, 'reload schema';

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- ✅ Renamed available_from/available_until to preorder_start/preorder_end
-- ✅ Ensured all required columns exist with proper defaults  
-- ✅ Copied data from old columns if needed
-- ✅ Dropped old columns after data migration
-- ✅ Created index for performance
-- ✅ Refreshed schema cache
-- ============================================