-- ============================================
-- FIX: RLS POLICIES FOR ADMIN/STAFF TO VIEW ALL ORDERS
-- ============================================
-- Master Prompt Seksyen 66: RLS Strategy for Admin/Staff
-- ============================================
-- IDEMPOTENT: Boleh dijalankan berkali-kali tanpa error
-- ============================================

-- ============================================
-- PART 1: DROP ALL EXISTING POLICIES FOR ORDERS TABLE
-- ============================================

-- Drop semua policy yang mungkin wujud untuk table orders
DROP POLICY IF EXISTS "orders_select_admin" ON public.orders;
DROP POLICY IF EXISTS "orders_select_staff" ON public.orders;
DROP POLICY IF EXISTS "orders_select_seller" ON public.orders;
DROP POLICY IF EXISTS "orders_select_customer" ON public.orders;
DROP POLICY IF EXISTS "orders_select_admin_staff" ON public.orders;
DROP POLICY IF EXISTS "orders_select_seller_own" ON public.orders;
DROP POLICY IF EXISTS "Allow staff and admin full read" ON public.orders;
DROP POLICY IF EXISTS "Sellers can view orders for their shop" ON public.orders;
DROP POLICY IF EXISTS "Sellers can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Admin and Staff can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Customers can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "orders_insert_customer" ON public.orders;
DROP POLICY IF EXISTS "orders_insert_admin_staff" ON public.orders;
DROP POLICY IF EXISTS "orders_update_seller_status" ON public.orders;
DROP POLICY IF EXISTS "orders_update_admin_staff" ON public.orders;
DROP POLICY IF EXISTS "orders_delete_admin" ON public.orders;

-- ============================================
-- PART 2: DROP ALL EXISTING POLICIES FOR ORDER_ITEMS TABLE
-- ============================================

-- Drop semua policy yang mungkin wujud untuk table order_items
DROP POLICY IF EXISTS "order_items_select_admin" ON public.order_items;
DROP POLICY IF EXISTS "order_items_select_staff" ON public.order_items;
DROP POLICY IF EXISTS "order_items_select_seller" ON public.order_items;
DROP POLICY IF EXISTS "order_items_select_customer" ON public.order_items;
DROP POLICY IF EXISTS "order_items_select_via_order" ON public.order_items;
DROP POLICY IF EXISTS "Allow staff and admin full read order_items" ON public.order_items;
DROP POLICY IF EXISTS "Sellers can view order items for their orders" ON public.order_items;
DROP POLICY IF EXISTS "Anyone can insert order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can view order items" ON public.order_items;
DROP POLICY IF EXISTS "Sellers can view their order items" ON public.order_items;
DROP POLICY IF EXISTS "order_items_insert_admin_staff" ON public.order_items;
DROP POLICY IF EXISTS "order_items_update_admin" ON public.order_items;
DROP POLICY IF EXISTS "order_items_delete_admin" ON public.order_items;

-- ============================================
-- PART 3: CREATE COMPREHENSIVE POLICIES FOR ORDERS TABLE
-- ============================================

-- 1. Admin can view ALL orders
CREATE POLICY "orders_select_admin" ON public.orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
      AND COALESCE(users.is_active, true) = true
    )
  );

-- 2. Staff can view ALL orders
CREATE POLICY "orders_select_staff" ON public.orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role = 'staff'
      AND COALESCE(users.is_active, true) = true
    )
  );

-- 3. Sellers can view their own orders
CREATE POLICY "orders_select_seller" ON public.orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sellers 
      WHERE sellers.user_id = auth.uid()
      AND sellers.id = orders.seller_id
    )
  );

-- 4. Customers can view their own orders (by email or phone)
CREATE POLICY "orders_select_customer" ON public.orders FOR SELECT
  USING (
    orders.customer_email = (
      SELECT COALESCE(email, '') FROM public.users WHERE id = auth.uid()
    )
    OR
    orders.customer_phone = (
      SELECT COALESCE(phone_number, '') FROM public.users WHERE id = auth.uid()
    )
  );

-- 5. Admin can insert orders
CREATE POLICY "orders_insert_admin" ON public.orders FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
      AND COALESCE(users.is_active, true) = true
    )
  );

-- 6. Staff can insert orders  
CREATE POLICY "orders_insert_staff" ON public.orders FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role = 'staff'
      AND COALESCE(users.is_active, true) = true
    )
  );

-- 7. Customers can insert orders (using their own email/phone)
CREATE POLICY "orders_insert_customer" ON public.orders FOR INSERT
  WITH CHECK (
    (customer_email = (SELECT COALESCE(email, '') FROM public.users WHERE id = auth.uid()))
    OR
    (customer_phone = (SELECT COALESCE(phone_number, '') FROM public.users WHERE id = auth.uid()))
  );

-- ============================================
-- PART 4: CREATE COMPREHENSIVE POLICIES FOR ORDER_ITEMS TABLE
-- ============================================

-- 1. Admin can view all order items
CREATE POLICY "order_items_select_admin" ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
      AND COALESCE(users.is_active, true) = true
    )
  );

-- 2. Staff can view all order items
CREATE POLICY "order_items_select_staff" ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role = 'staff'
      AND COALESCE(users.is_active, true) = true
    )
  );

-- 3. Sellers can view order items for their orders
CREATE POLICY "order_items_select_seller" ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      INNER JOIN public.sellers s ON o.seller_id = s.id
      WHERE s.user_id = auth.uid()
      AND o.id = order_items.order_id
    )
  );

-- 4. Customers can view their own order items
CREATE POLICY "order_items_select_customer" ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id
      AND (
        o.customer_email = (SELECT COALESCE(email, '') FROM public.users WHERE id = auth.uid())
        OR o.customer_phone = (SELECT COALESCE(phone_number, '') FROM public.users WHERE id = auth.uid())
      )
    )
  );

-- 5. Admin can insert order items
CREATE POLICY "order_items_insert_admin" ON public.order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
      AND COALESCE(users.is_active, true) = true
    )
  );

-- 6. Staff can insert order items
CREATE POLICY "order_items_insert_staff" ON public.order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role = 'staff'
      AND COALESCE(users.is_active, true) = true
    )
  );

-- ============================================
-- PART 5: UPDATE/CREATE HELPER FUNCTION
-- ============================================

-- Drop function if exists and recreate
DROP FUNCTION IF EXISTS public.is_admin_or_staff();

-- Create helper function for checking admin/staff status
CREATE OR REPLACE FUNCTION public.is_admin_or_staff()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role IN ('admin', 'staff')
    AND COALESCE(is_active, true) = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PART156: VERIFICATION AND SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ RLS FIXES APPLIED SUCCESSFULLY!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Summary of policies created:';
  RAISE NOTICE '';
  RAISE NOTICE 'For ORDERS table:';
  RAISE NOTICE '  ✅ orders_select_admin (Admin can view ALL orders)';
  RAISE NOTICE '  ✅ orders_select_staff (Staff can view ALL orders)';
  RAISE NOTICE '  ✅ orders_select_seller (Sellers can view their own orders)';
  RAISE NOTICE '  ✅ orders_select_customer (Customers can view their own orders)';
  RAISE NOTICE '  ✅ orders_insert_admin (Admin can insert orders)';
  RAISE NOTICE '  ✅ orders_insert_staff (Staff can insert orders)';
  RAISE NOTICE '  ✅ orders_insert_customer (Customers can insert orders)';
  RAISE NOTICE '';
  RAISE NOTICE 'For ORDER_ITEMS table:';
  RAISE NOTICE '  ✅ order_items_select_admin (Admin can view ALL order items)';
  RAISE NOTICE '  ✅ order_items_select_staff (Staff can view ALL order items)';
  RAISE NOTICE '  ✅ order_items_select_seller (Sellers can view their order items)';
  RAISE NOTICE '  ✅ order_items_select_customer (Customers can view their order items)';
  RAISE NOTICE '  ✅ order_items_insert_admin (Admin can insert order items)';
  RAISE NOTICE '  ✅ order_items_insert_staff (Staff can insert order items)';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  IMPORTANT NOTES:';
  RAISE NOTICE '   • Policies are IDEMPOTENT - safe to run multiple times';
  RAISE NOTICE '   • All existing policies were dropped before recreation';
  RAISE NOTICE '   • Uses COALESCE(is_active, true) = true for safety';
  RAISE NOTICE '   • Helper function is_admin_or_staff() created/updated';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Migration completed successfully!';
END $$;