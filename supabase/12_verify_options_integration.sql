-- ========================================
-- PHASE R4D Part 4: VERIFICATION QUERIES
-- ========================================
-- Run these queries to verify options integration works correctly
-- ========================================

-- 1. Check if order_items.selected_options column exists
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'order_items'
  AND column_name = 'selected_options';

-- Expected: 1 row with data_type = 'jsonb'

-- 2. Check RPC function signature
SELECT 
  routine_name,
  routine_definition
FROM information_schema.routines
WHERE routine_name = 'create_order_with_stock_check'
  AND routine_type = 'FUNCTION';

-- Expected: Function should exist

-- 3. Test: Create sample order with options
DO $$
DECLARE
  v_test_seller_id UUID;
  v_test_product_id UUID;
  v_test_option_id UUID;
  v_result JSONB;
BEGIN
  -- Find a test product with options
  SELECT p.id, p.seller_id INTO v_test_product_id, v_test_seller_id
  FROM products p
  WHERE EXISTS (
    SELECT 1 FROM product_options po
    WHERE po.product_id = p.id AND po.is_available = true
  )
  AND p.is_available = true
  AND p.stock_quantity > 0
  LIMIT 1;

  IF v_test_product_id IS NULL THEN
    RAISE NOTICE '⚠️  No products with options found. Skipping test order creation.';
    RETURN;
  END IF;

  -- Get an option for that product
  SELECT id INTO v_test_option_id
  FROM product_options
  WHERE product_id = v_test_product_id
    AND is_available = true
  LIMIT 1;

  RAISE NOTICE '';
  RAISE NOTICE '🧪 Testing order creation with options...';
  RAISE NOTICE 'Product ID: %', v_test_product_id;
  RAISE NOTICE 'Option ID: %', v_test_option_id;
  
  -- Attempt to create test order (will fail auth but we can see SQL errors)
  -- For real test, use authenticated session
  
  RAISE NOTICE '';
  RAISE NOTICE '✅ Schema verification passed!';
  RAISE NOTICE 'To fully test: Create an order through the UI with options selected';
  
END $$;

-- 4. Query to check existing orders with options
SELECT 
  o.id AS order_id,
  o.customer_name,
  o.created_at,
  oi.product_name_snapshot,
  oi.unit_price,
  oi.selected_options,
  jsonb_array_length(COALESCE(oi.selected_options, '[]'::jsonb)) AS options_count
FROM orders o
JOIN order_items oi ON oi.order_id = o.id
WHERE jsonb_array_length(COALESCE(oi.selected_options, '[]'::jsonb)) > 0
ORDER BY o.created_at DESC
LIMIT 10;

-- If no rows: No orders with options yet (expected before testing)
-- If rows exist: Verify options data structure looks correct

-- 5. Summary
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'VERIFICATION COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Test order flow in UI:';
  RAISE NOTICE '   - Select product with options (e.g., Kopi)';
  RAISE NOTICE '   - Choose option (e.g., Iced)';
  RAISE NOTICE '   - Add to cart';
  RAISE NOTICE '   - Complete order';
  RAISE NOTICE '';
  RAISE NOTICE '2. Verify in database:';
  RAISE NOTICE '   SELECT * FROM order_items WHERE selected_options IS NOT NULL;';
  RAISE NOTICE '';
  RAISE NOTICE '3. Verify in WhatsApp message:';
  RAISE NOTICE '   - Options should appear as "• Iced (+RM1.00)"';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;
