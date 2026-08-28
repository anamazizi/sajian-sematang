-- ============================================
-- QUICK TEST - Copy & Paste ke Supabase SQL Editor
-- ============================================
-- Test basic column existence selepas run patch
-- ============================================

-- Test 1: Check sellers.user_id (yang error semalam)
SELECT 
  'Test 1: sellers.user_id' as test_name,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ PASS - Column exists' 
    ELSE '❌ FAIL - Column missing'
  END as result
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'sellers' 
  AND column_name = 'user_id';

-- Test 2: Check sellers.shop_name
SELECT 
  'Test 2: sellers.shop_name' as test_name,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ PASS - Column exists' 
    ELSE '❌ FAIL - Column missing'
  END as result
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'sellers' 
  AND column_name = 'shop_name';

-- Test 3: Check products.category
SELECT 
  'Test 3: products.category' as test_name,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ PASS - Column exists' 
    ELSE '❌ FAIL - Column missing'
  END as result
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'products' 
  AND column_name = 'category';

-- Test 4: Check users.is_active (untuk RLS helper functions)
SELECT 
  'Test 4: users.is_active' as test_name,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ PASS - Column exists' 
    ELSE '❌ FAIL - Column missing'
  END as result
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'users' 
  AND column_name = 'is_active';

-- Test 5: Check products.cost_price (untuk seller payable calculation)
SELECT 
  'Test 5: products.cost_price' as test_name,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ PASS - Column exists' 
    ELSE '❌ FAIL - Column missing'
  END as result
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'products' 
  AND column_name = 'cost_price';

-- Test 6: Check order_items.product_name_snapshot (untuk order snapshot)
SELECT 
  'Test 6: order_items.product_name_snapshot' as test_name,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ PASS - Column exists' 
    ELSE '❌ FAIL - Column missing'
  END as result
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'order_items' 
  AND column_name = 'product_name_snapshot';

-- Test 7: Check RLS enabled on critical tables
SELECT 
  'Test 7: RLS on users' as test_name,
  CASE 
    WHEN relrowsecurity = true THEN '✅ PASS - RLS enabled' 
    ELSE '⚠️  WARNING - RLS not enabled'
  END as result
FROM pg_class 
WHERE relname = 'users' AND relnamespace = 'public'::regnamespace;

SELECT 
  'Test 8: RLS on sellers' as test_name,
  CASE 
    WHEN relrowsecurity = true THEN '✅ PASS - RLS enabled' 
    ELSE '⚠️  WARNING - RLS not enabled'
  END as result
FROM pg_class 
WHERE relname = 'sellers' AND relnamespace = 'public'::regnamespace;

SELECT 
  'Test 9: RLS on products' as test_name,
  CASE 
    WHEN relrowsecurity = true THEN '✅ PASS - RLS enabled' 
    ELSE '⚠️  WARNING - RLS not enabled'
  END as result
FROM pg_class 
WHERE relname = 'products' AND relnamespace = 'public'::regnamespace;

SELECT 
  'Test 10: RLS on orders' as test_name,
  CASE 
    WHEN relrowsecurity = true THEN '✅ PASS - RLS enabled' 
    ELSE '⚠️  WARNING - RLS not enabled'
  END as result
FROM pg_class 
WHERE relname = 'orders' AND relnamespace = 'public'::regnamespace;

-- Summary
SELECT 
  '=====================' as separator,
  'All tests completed' as summary;
