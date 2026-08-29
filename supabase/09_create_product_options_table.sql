-- ========================================
-- PHASE R4D: PRODUCT OPTIONS SYSTEM
-- ========================================
-- Purpose: Support product variants (Hot/Iced, Add-ons, Size)
-- Compliance: Master Prompt Seksyen 17
-- ========================================

-- 1. CREATE PRODUCT OPTIONS TABLE
CREATE TABLE IF NOT EXISTS public.product_options (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  
  -- Option structure
  option_group TEXT NOT NULL,        -- e.g., "Temperature", "Add-ons", "Size"
  option_name TEXT NOT NULL,         -- e.g., "Hot", "Iced", "Extra Cheese"
  price_adjustment DECIMAL(10,2) NOT NULL DEFAULT 0.00,  -- e.g., +1.00, +2.50
  
  -- Control
  is_available BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,   -- For sorting options in UI
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CREATE INDEXES
CREATE INDEX IF NOT EXISTS idx_product_options_product_id 
  ON public.product_options(product_id);

CREATE INDEX IF NOT EXISTS idx_product_options_available 
  ON public.product_options(is_available) 
  WHERE is_available = true;

-- 3. ADD COMMENTS
COMMENT ON TABLE public.product_options IS 
  'Product options/variants (Hot/Iced, Add-ons, Size). Master Prompt Seksyen 17.';

COMMENT ON COLUMN public.product_options.option_group IS 
  'Category of option: Temperature, Add-ons, Size, etc.';

COMMENT ON COLUMN public.product_options.option_name IS 
  'Specific option: Hot, Iced, Extra Cheese, Large, etc.';

COMMENT ON COLUMN public.product_options.price_adjustment IS 
  'Additional price for this option. Example: Hot = +RM0, Iced = +RM1';

-- 4. ROW LEVEL SECURITY (RLS)

-- Enable RLS
ALTER TABLE public.product_options ENABLE ROW LEVEL SECURITY;

-- Policy: Public can view available options
CREATE POLICY "Anyone can view available product options"
  ON public.product_options
  FOR SELECT
  USING (is_available = true);

-- Policy: Sellers can manage their product options
CREATE POLICY "Sellers can manage own product options"
  ON public.product_options
  FOR ALL
  USING (
    product_id IN (
      SELECT id FROM public.products 
      WHERE seller_id IN (
        SELECT id FROM public.sellers 
        WHERE user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    product_id IN (
      SELECT id FROM public.products 
      WHERE seller_id IN (
        SELECT id FROM public.sellers 
        WHERE user_id = auth.uid()
      )
    )
  );

-- Policy: Admin can manage all options
CREATE POLICY "Admin can manage all product options"
  ON public.product_options
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Policy: Staff can view all options
CREATE POLICY "Staff can view all product options"
  ON public.product_options
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('staff', 'admin')
    )
  );

-- 5. SAMPLE DATA (Optional - for testing)

DO $$
DECLARE
  kopi_product_id UUID;
  teh_product_id UUID;
BEGIN
  -- Find "Kopi" products (if they exist from seed data)
  SELECT id INTO kopi_product_id 
  FROM public.products 
  WHERE name ILIKE '%kopi%' 
  LIMIT 1;

  SELECT id INTO teh_product_id 
  FROM public.products 
  WHERE name ILIKE '%teh%' 
  LIMIT 1;

  -- Add temperature options to Kopi (if found)
  IF kopi_product_id IS NOT NULL THEN
    INSERT INTO public.product_options (product_id, option_group, option_name, price_adjustment, display_order)
    VALUES 
      (kopi_product_id, 'Temperature', 'Hot', 0.00, 1),
      (kopi_product_id, 'Temperature', 'Iced', 1.00, 2)
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE '✅ Temperature options added to Kopi product';
  END IF;

  -- Add temperature options to Teh (if found)
  IF teh_product_id IS NOT NULL THEN
    INSERT INTO public.product_options (product_id, option_group, option_name, price_adjustment, display_order)
    VALUES 
      (teh_product_id, 'Temperature', 'Hot', 0.00, 1),
      (teh_product_id, 'Temperature', 'Iced', 0.50, 2)
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE '✅ Temperature options added to Teh product';
  END IF;

END $$;

-- 6. VERIFICATION QUERIES

-- Check table created
SELECT 
  'product_options' as table_name,
  COUNT(*) as row_count
FROM public.product_options;

-- Check RLS enabled
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'product_options';

-- Summary
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ PRODUCT OPTIONS TABLE CREATED!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Features:';
  RAISE NOTICE '- Support for option groups (Temperature, Add-ons, Size)';
  RAISE NOTICE '- Price adjustment per option';
  RAISE NOTICE '- RLS policies for sellers/admin/staff';
  RAISE NOTICE '- Sample data added for Kopi & Teh products';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Update TypeScript types';
  RAISE NOTICE '2. Build option selector UI';
  RAISE NOTICE '3. Integrate with cart system';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;
