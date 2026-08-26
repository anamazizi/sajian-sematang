-- RLS TESTING SUITE
-- Test policies work correctly

-- TEST 1: Verify policies exist
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- TEST 2: Verify helper functions exist
SELECT proname FROM pg_proc
WHERE proname IN ('is_admin', 'is_staff', 'is_admin_or_staff', 'get_user_seller_id');

-- TEST 3: Verify customer views exist
SELECT viewname FROM pg_views
WHERE viewname IN ('products_customer_view', 'sellers_customer_view');

-- TEST 4: Customer cannot access cost_price
-- Run as customer: SELECT cost_price FROM products LIMIT 1; (should FAIL)
-- Run as customer: SELECT * FROM products_customer_view LIMIT 1; (should SUCCEED, no cost_price column)

-- TEST 5: Summary
SELECT 'Policies' AS item, COUNT(*)::text AS count FROM pg_policies WHERE schemaname = 'public'
UNION ALL
SELECT 'Functions', COUNT(*)::text FROM pg_proc WHERE proname LIKE '%admin%' OR proname LIKE '%seller%'
UNION ALL
SELECT 'Views', COUNT(*)::text FROM pg_views WHERE viewname LIKE '%customer%';
