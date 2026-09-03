-- Check for products with NULL seller_id
-- This can cause stock movement logging errors during checkout

SELECT 
  COUNT(*) as total_products,
  COUNT(CASE WHEN seller_id IS NULL THEN 1 END) as null_seller_products,
  ROUND(COUNT(CASE WHEN seller_id IS NULL THEN 1 END)::numeric / COUNT(*)::numeric * 100, 2) as null_percentage
FROM public.products;

-- Show products with NULL seller_id
SELECT 
  id,
  name,
  category,
  stock_quantity,
  is_preorder,
  is_available,
  created_at
FROM public.products
WHERE seller_id IS NULL
ORDER BY created_at DESC;

-- If there are products with NULL seller_id, you need to update them:
-- 1. First find available sellers
-- SELECT id, shop_name FROM public.sellers LIMIT 5;

-- 2. Update products with NULL seller_id (example - use a valid seller_id)
-- UPDATE public.products 
-- SET seller_id = 'valid-seller-uuid-here'
-- WHERE seller_id IS NULL;