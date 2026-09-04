-- ============================================
-- CHECK ORDERS TABLE SCHEMA
-- ============================================

-- 1. List all columns in orders table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'orders'
ORDER BY ordinal_position;

-- 2. Count total rows in orders table
SELECT 'Total orders:' AS label, COUNT(*) AS count FROM public.orders;

-- 3. Show first 5 orders if any exist
SELECT 
    'First 5 orders (if any):' AS label,
    id,
    customer_name,
    customer_email,
    customer_phone,
    status,
    created_at
FROM public.orders
LIMIT 5;

-- 4. Check RLS status and policies
SELECT 
    'RLS status:' AS label,
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'orders';

-- 5. List all RLS policies for orders table
SELECT 
    'RLS policies for orders:' AS label,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'orders'
ORDER BY policyname;

-- 6. Check if admin user exists and role
SELECT 
    'Admin user check:' AS label,
    id,
    email,
    role,
    is_active,
    phone_number
FROM public.users
WHERE id = 'c5d09aaf-c597-4922-bcaa-60d7d67d2d56';

-- 7. Try to select orders as admin user (simulate RLS check)
SELECT 
    'Test query as admin:' AS label,
    COUNT(*) AS total_count
FROM public.orders
WHERE EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = 'c5d09aaf-c597-4922-bcaa-60d7d67d2d56'
    AND users.role = 'admin'
    AND COALESCE(users.is_active, true) = true
);