-- Test script untuk debug orders issue
-- File: /home/honor/Desktop/sajian-sematang/test-orders-issue.sql

-- 1. Check environment variables
SELECT 'NEXT_PUBLIC_SUPABASE_URL' as env_var, 
       CASE WHEN length('${NEXT_PUBLIC_SUPABASE_URL:?}') > 0 THEN 'SET' ELSE 'NOT SET' END as status;

-- 2. Check if user exists in users table with admin role
SELECT id, name, email, role, is_active 
FROM public.users 
WHERE id = 'c5d09aaf-c597-4922-bcaa-60d7d67d2d56'
   OR email LIKE '%admin%';

-- 3. Check orders table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'orders' 
ORDER BY ordinal_position;

-- 4. Check total orders count
SELECT COUNT(*) as total_orders FROM public.orders;

-- 5. Check RLS policies for orders table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'orders'
   OR tablename = 'users'
ORDER BY tablename, policyname;

-- 6. Check if is_admin_or_staff() function works for this user
SELECT public.is_admin_or_staff() as function_result;

-- 7. Insert test order if none exist (only if table is empty)
DO $$
DECLARE
  order_count INTEGER;
  test_seller_id UUID;
BEGIN
  -- Get count of orders
  SELECT COUNT(*) INTO order_count FROM public.orders;
  
  RAISE NOTICE 'Total orders in database: %', order_count;
  
  -- If no orders exist, create a test order
  IF order_count = 0 THEN
    -- Get first seller ID
    SELECT id INTO test_seller_id FROM public.sellers LIMIT 1;
    
    IF test_seller_id IS NOT NULL THEN
      -- Insert test order
      INSERT INTO public.orders (
        customer_name,
        customer_phone,
        customer_address,
        seller_id,
        subtotal,
        delivery_fee,
        total_price,
        delivery_mode,
        status,
        created_at
      ) VALUES (
        'Test Customer',
        '0123456789',
        'Test Address, Kuala Lumpur',
        test_seller_id,
        25.00,
        5.00,
        30.00,
        'Delivery',
        'PENDING',
        NOW()
      );
      
      RAISE NOTICE 'Test order created successfully';
    ELSE
      RAISE NOTICE 'No seller found to create test order';
    END IF;
  END IF;
END $$;

-- 8. Final check
SELECT 
  (SELECT COUNT(*) FROM public.orders) as final_order_count,
  (SELECT COUNT(*) FROM public.order_items) as order_items_count;