-- ============================================
-- FIX: RLS POLICIES FOR ADMIN/STAFF TO VIEW ALL ORDERS
-- ============================================
-- Master Prompt Seksyen 66: RLS Strategy for Admin/Staff
-- ============================================

-- Drop old policies that might conflict
DROP POLICY IF EXISTS "orders_select_seller_own" ON public.orders;
DROP POLICY IF EXISTS "orders_select_admin_staff" ON public.orders;

-- Create comprehensive policies for orders table
-- 1. Admin can view ALL orders
CREATE POLICY "orders_select_admin" ON public.orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
      AND users.is_active = true
    )
  );

-- 2. Staff can view ALL orders
CREATE POLICY "orders_select_staff" ON public.orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role = 'staff'
      AND users.is_active = true
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
      SELECT email FROM public.users WHERE id = auth.uid()
    )
    OR
    orders.customer_phone = (
      SELECT phone_number FROM public.users WHERE id = auth.uid()
    )
  );

-- ============================================
-- FIX: RLS POLICIES FOR ORDER_ITEMS
-- ============================================

DROP POLICY IF EXISTS "order_items_select_via_order" ON public.order_items;

-- Admin can view all order items
CREATE POLICY "order_items_select_admin" ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
      AND users.is_active = true
    )
  );

-- Staff can view all order items
CREATE POLICY "order_items_select_staff" ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role = 'staff'
      AND users.is_active = true
    )
  );

-- Sellers can view order items for their orders
CREATE POLICY "order_items_select_seller" ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      INNER JOIN public.sellers s ON o.seller_id = s.id
      WHERE s.user_id = auth.uid()
      AND o.id = order_items.order_id
    )
  );

-- Customers can view their own order items
CREATE POLICY "order_items_select_customer" ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id
      AND (
        o.customer_email = (SELECT email FROM public.users WHERE id = auth.uid())
        OR o.customer_phone = (SELECT phone_number FROM public.users WHERE id = auth.uid())
      )
    )
  );

-- ============================================
-- FIX: UPDATE FUNCTION FOR ORDER STATUS AUDIT
-- ============================================

-- Update the function to work with current schema
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
-- VERIFICATION QUERIES
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ RLS FIXES APPLIED SUCCESSFULLY!';
  RAISE NOTICE '';
  RAISE NOTICE 'Policies created:';
  RAISE NOTICE '  - orders_select_admin (Admin can view ALL orders)';
  RAISE NOTICE '  - orders_select_staff (Staff can view ALL orders)';
  RAISE NOTICE '  - orders_select_seller (Sellers can view their own orders)';
  RAISE NOTICE '  - orders_select_customer (Customers can view their own orders)';
  RAISE NOTICE '';
  RAISE NOTICE '  - order_items_select_admin (Admin can view ALL order items)';
  RAISE NOTICE '  - order_items_select_staff (Staff can view ALL order items)';
  RAISE NOTICE '  - order_items_select_seller (Sellers can view their order items)';
  RAISE NOTICE '  - order_items_select_customer (Customers can view their order items)';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  IMPORTANT: Ensure users table has is_active column';
  RAISE NOTICE '   If not, run: ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;';
END $$;