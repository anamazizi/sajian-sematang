-- ============================================
-- FIX: Update Customer Views (Remove p.category)
-- ============================================
-- This fixes: ERROR: column p.category does not exist
-- ============================================

-- Drop and recreate products_customer_view WITHOUT category column
DROP VIEW IF EXISTS public.products_customer_view CASCADE;

CREATE OR REPLACE VIEW public.products_customer_view AS
SELECT
  p.id,
  p.seller_id,
  p.name,
  p.description,
  p.price AS selling_price,
  -- p.category, -- REMOVED: Column doesn't exist in actual table
  p.image_url,
  p.is_available,
  p.stock_quantity,
  p.is_preorder,
  p.available_from,
  p.available_until,
  p.created_at,
  p.updated_at,
  s.shop_name AS seller_name
FROM public.products p
LEFT JOIN public.sellers s ON p.seller_id = s.id
WHERE p.is_available = true;

-- Grant access
GRANT SELECT ON public.products_customer_view TO authenticated;
GRANT SELECT ON public.products_customer_view TO anon;

-- Recreate sellers view (no changes needed, but recreate for consistency)
DROP VIEW IF EXISTS public.sellers_customer_view CASCADE;

CREATE OR REPLACE VIEW public.sellers_customer_view AS
SELECT
  s.id,
  s.shop_name,
  s.description,
  s.created_at
FROM public.sellers s;

GRANT SELECT ON public.sellers_customer_view TO authenticated;
GRANT SELECT ON public.sellers_customer_view TO anon;
