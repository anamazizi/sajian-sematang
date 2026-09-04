-- ============================================
-- DATABASE AUDIT SCRIPT FOR ORDERS
-- ============================================

-- 1. Count total orders
SELECT 'Total orders:' AS label, COUNT(*) AS count FROM public.orders;

-- 2. Check if orders table exists and structure
SELECT 'Orders table exists?' AS label, 
       CASE WHEN EXISTS (SELECT FROM information_schema.tables 
                         WHERE table_schema = 'public' 
                         AND table_name = 'orders') 
            THEN 'YES' 
            ELSE 'NO' 
       END AS exists_status;

-- 3. Show sample orders (first 5 rows)
SELECT 'Sample orders (first 5):' AS label;
SELECT 
    id,
    customer_name,
    customer_email,
    customer_phone,
    seller_id,
    status,
    subtotal,
    delivery_fee,
    total_price,
    created_at
FROM public.orders 
LIMITम 5;

-- 4. Check if there are order_items
SELECT 'Total order_items:' AS label, COUNT(*) AS count FROM public.order_items;

-- 5. Sample order_items (first 5)
SELECT 'Sample order_items (first 5):' AS label;
SELECT 
    id,
    order_id,
    product_id,
    quantity,
    unit_price,
    product_name_snapshot
FROM public.order_items 
LIMIT 5;

-- 6. Check RLS status for orders table
SELECT 'RLS status for orders table:' AS label;
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'orders';

-- 7. Check users table for admin user
SELECT 'Admin user (ID: c5d09aaf-c597-4922-bcaa-60d7d67d2d56):' AS label;
SELECT 
    id,
    email,
    role,
    is_active,
    phone_number
FROM public.users 
WHERE id = 'c5d09aaf-c597-4922-bcaa-60d7d67d2d56';

-- 8. Create test data if orders table is empty
DO $$
DECLARE 
    new_order_id UUID;
    test_seller_id UUID;
    test_product_id UUID;
    order_count INT;
BEGIN
    -- Check if orders table is empty
    SELECT COUNT(*) INTO order_count FROM public.orders;
    
    IF order_count = 0 THEN
        RAISE NOTICE '⚠️ Orders table is empty. Creating test data...';
        
        -- Get a seller_id (first seller)
        SELECT id INTO test_seller_id FROM public.sellers LIMIT 1;
        
        -- Get a product_id (first product)
        SELECT id INTO test_product_id FROM public.products LIMIT 1;
        
        -- Insert test order
        INSERT INTO public.orders (
            customer_name,
            customer_email,
            customer_phone,
            seller_id,
            subtotal,
            delivery_fee,
            total_price,
            status,
            created_at,
            updated_at
        ) VALUES (
            'Test Customer',
            'test@example.com',
            '0123456789',
            test_seller_id,
            25.00,
            5.00,
            30.00,
            'PENDING',
            NOW(),
            NOW()
        ) RETURNING id INTO new_order_id;
        
        -- Insert order item
        INSERT INTO public.order_items (
            order_id,
            product_id,
            quantity,
            unit_price,
            product_name_snapshot
        ) VALUES (
            new_order_id,
            test_product_id,
            2,
            12.50,
            'Test Product'
        );
        
        RAISE NOTICE '✅ Test order created with ID: %', new_order_id;
    ELSE
        RAISE NOTICE '✅ Orders table has % records. No test data needed.', order_count;
    END IF;
END $$;