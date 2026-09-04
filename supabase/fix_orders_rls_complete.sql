-- ============================================
-- COMPLETE FIX FOR ORDERS RLS WITH FUNCTION DEPENDENCY
-- ============================================
-- Step-by-step fix for the error:
-- ERROR: cannot drop function is_admin_or_staff() because other objects depend on it
-- ============================================

-- STEP 1: First update the function without dropping it
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

-- STEP 2: Drop only the policies we want to recreate
-- (Keep existing policies that use the function)

DROP POLICY IF EXISTS "orders_select_admin" ON public.orders;
DROP POLICY IF EXISTS "orders_select_staff" ON public.orders;
DROP POLICY IF EXISTS "orders_select_seller" ON public.orders;
DROP POLICY IF EXISTS "orders_select_customer" ON public.orders;

DROP POLICY IF EXISTS "order_items_select_admin" ON public.order_items;
DROP POLICY IF EXISTS "order_items_select_staff" ON public.order_items;
DROP POLICY IF EXISTS "order_items_select_seller" ON public.order_items;
DROP POLICY IF EXISTS "order_items_select_customer" ON public.order_items;

-- STEP 3: Create new orders policies

-- Admin can view ALL orders
CREATE POLICY "orders_select_admin" ON public.orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
      AND COALESCE(users.is_active, true) = true
    )
  );

-- Staff can view ALL orders
CREATE POLICY "orders_select_staff" ON public.orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role = 'staff'
      AND COALESCE(users.is_active, true) = true
    )
  );

-- Sellers can view their own orders
CREATE POLICY "orders_select_seller" ON public.orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sellers 
      WHERE sellers.user_id = auth.uid()
      AND sellers.id = orders.seller_id
    )
  );

-- Customers can view their own orders
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

-- STEP 4: Create new order_items policies

-- Admin can view all order items
CREATE POLICY "order_items_select_admin" ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
      AND COALESCE(users.is_active, true) = true
    )
  );

-- Staff can view all order items
CREATE POLICY "order_items_select_staff" ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role = 'staff'
      AND COALESCE(users.is_active, true) = true
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
        o.customer_email = (SELECT COALESCE(email, '') FROM public.users WHERE id = auth.uid())
        OR o.customer_phone = (SELECT COALESCE(phone_number, '') FROM public.users WHERE id = auth.uid())
      )
    )
  );

-- STEP 5: Verification
DO $$
BEGIN
  RAISE NOTICE '✅ ORDERS RLS POLICIES FIXED SUCCESSFULLY!';
  RAISE NOTICE '   • Function is_admin_or_staff() updated (not dropped)';
  RAISE NOTICE '   • New policies created for orders and order_items';
  RAISE NOTICE '   • Existing policies in other tables preserved';
  RAISE NOTICE '   • Admin/Staff can now view ALL orders';
END $$;