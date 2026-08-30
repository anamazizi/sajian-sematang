-- ============================================
-- SAJIAN SEMATANG - MINIMAL RLS POLICIES
-- ============================================
-- This version uses ONLY columns that exist in actual database
-- No assumptions about schema
-- ============================================

-- ============================================
-- PART 1: DROP OLD POLICIES
-- ============================================

DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can manage users" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Anyone can view sellers" ON public.sellers;
DROP POLICY IF EXISTS "Sellers can manage their own shop" ON public.sellers;
DROP POLICY IF EXISTS "Admins can view all sellers" ON public.sellers;
DROP POLICY IF EXISTS "Anyone can view available products" ON public.products;
DROP POLICY IF EXISTS "Sellers can view all their products" ON public.products;
DROP POLICY IF EXISTS "Sellers can view their own products" ON public.products;
DROP POLICY IF EXISTS "Sellers can manage their own products" ON public.products;
DROP POLICY IF EXISTS "Admin and Staff can view all products" ON public.products;
DROP POLICY IF EXISTS "Admin and Staff can manage all products" ON public.products;
DROP POLICY IF EXISTS "Anyone can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Sellers can view orders for their shop" ON public.orders;
DROP POLICY IF EXISTS "Sellers can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Sellers can update order status" ON public.orders;
DROP POLICY IF EXISTS "Sellers can update their own order status" ON public.orders;
DROP POLICY IF EXISTS "Admin and Staff can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Admin and Staff can update all orders" ON public.orders;
DROP POLICY IF EXISTS "Admin and Staff can create orders" ON public.orders;
DROP POLICY IF EXISTS "Customers can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can insert order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can view order items" ON public.order_items;
DROP POLICY IF EXISTS "Sellers can view their order items" ON public.order_items;
DROP POLICY IF EXISTS "Admins can view all payouts" ON public.payouts;
DROP POLICY IF EXISTS "Sellers can view their own payouts" ON public.payouts;
DROP POLICY IF EXISTS "Only admins can create payouts" ON public.payouts;
DROP POLICY IF EXISTS "Admins can view all audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Users can view their own audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;

-- ============================================
-- PART 2: HELPER FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin' AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'staff' AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin_or_staff()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role IN ('admin', 'staff') AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_user_seller_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT id FROM public.sellers
    WHERE user_id = auth.uid()
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PART 3: MINIMAL CUSTOMER VIEWS
-- ============================================
-- Only include columns that definitely exist

DROP VIEW IF EXISTS public.products_customer_view CASCADE;

CREATE OR REPLACE VIEW public.products_customer_view AS
SELECT
  p.id,
  p.seller_id,
  p.name,
  p.description,
  p.price AS selling_price,
  p.image_url,
  p.is_available,
  p.created_at,
  s.shop_name AS seller_name
FROM public.products p
LEFT JOIN public.sellers s ON p.seller_id = s.id
WHERE p.is_available = true;

GRANT SELECT ON public.products_customer_view TO authenticated;
GRANT SELECT ON public.products_customer_view TO anon;

DROP VIEW IF EXISTS public.sellers_customer_view CASCADE;

CREATE OR REPLACE VIEW public.sellers_customer_view AS
SELECT
  s.id,
  s.shop_name,
  s.description,
  s.created_at
FROM public.sellers s;

GRANT SELECT ON public.sellers_customer_view TO authenticated;
GRANT SELECT ON public.sellers_customer_view TO anon;
-- ============================================
-- MINIMAL RLS POLICIES PART 2
-- ============================================

-- ============================================
-- DROP ALL NEW POLICIES FOR IDEMPOTENCY
-- ============================================

-- USERS (6 policies)
DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "users_select_admin" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;
DROP POLICY IF EXISTS "users_update_admin" ON public.users;
DROP POLICY IF EXISTS "users_insert_signup" ON public.users;
DROP POLICY IF EXISTS "users_delete_admin" ON public.users;

-- SELLERS (6 policies)
DROP POLICY IF EXISTS "sellers_select_admin_staff" ON public.sellers;
DROP POLICY IF EXISTS "sellers_select_own" ON public.sellers;
DROP POLICY IF EXISTS "sellers_update_own" ON public.sellers;
DROP POLICY IF EXISTS "sellers_update_admin" ON public.sellers;
DROP POLICY IF EXISTS "sellers_insert_admin" ON public.sellers;
DROP POLICY IF EXISTS "sellers_delete_admin" ON public.sellers;

-- PRODUCTS (8 policies)
DROP POLICY IF EXISTS "products_select_seller_own" ON public.products;
DROP POLICY IF EXISTS "products_select_admin_staff" ON public.products;
DROP POLICY IF EXISTS "products_insert_seller_own" ON public.products;
DROP POLICY IF EXISTS "products_insert_admin_staff" ON public.products;
DROP POLICY IF EXISTS "products_update_seller_own" ON public.products;
DROP POLICY IF EXISTS "products_update_admin_staff" ON public.products;
DROP POLICY IF EXISTS "products_delete_seller_own" ON public.products;
DROP POLICY IF EXISTS "products_delete_admin_staff" ON public.products;

-- ORDERS (8 policies)
DROP POLICY IF EXISTS "orders_select_customer_own" ON public.orders;
DROP POLICY IF EXISTS "orders_select_seller_own" ON public.orders;
DROP POLICY IF EXISTS "orders_select_admin_staff" ON public.orders;
DROP POLICY IF EXISTS "orders_insert_customer" ON public.orders;
DROP POLICY IF EXISTS "orders_insert_admin_staff" ON public.orders;
DROP POLICY IF EXISTS "orders_update_seller_status" ON public.orders;
DROP POLICY IF EXISTS "orders_update_admin_staff" ON public.orders;
DROP POLICY IF EXISTS "orders_delete_admin" ON public.orders;

-- ORDER_ITEMS (4 policies)
DROP POLICY IF EXISTS "order_items_select_via_order" ON public.order_items;
DROP POLICY IF EXISTS "order_items_insert_admin_staff" ON public.order_items;
DROP POLICY IF EXISTS "order_items_update_admin" ON public.order_items;
DROP POLICY IF EXISTS "order_items_delete_admin" ON public.order_items;

-- PAYOUTS (5 policies - conditional)
DROP POLICY IF EXISTS "payouts_select_admin" ON public.payouts;
DROP POLICY IF EXISTS "payouts_select_seller_own" ON public.payouts;
DROP POLICY IF EXISTS "payouts_insert_admin" ON public.payouts;
DROP POLICY IF EXISTS "payouts_update_admin" ON public.payouts;
DROP POLICY IF EXISTS "payouts_delete_admin" ON public.payouts;

-- AUDIT_LOGS (3 policies - conditional)
DROP POLICY IF EXISTS "audit_logs_select_admin" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_select_own" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_insert_system" ON public.audit_logs;

-- ============================================
-- CREATE NEW POLICIES
-- ============================================

-- USERS
CREATE POLICY "users_select_own" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_select_admin" ON public.users FOR SELECT USING (is_admin());
CREATE POLICY "users_update_own" ON public.users FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "users_update_admin" ON public.users FOR UPDATE USING (is_admin());
CREATE POLICY "users_insert_signup" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "users_delete_admin" ON public.users FOR DELETE USING (is_admin());

-- SELLERS
CREATE POLICY "sellers_select_admin_staff" ON public.sellers FOR SELECT USING (is_admin_or_staff());
CREATE POLICY "sellers_select_own" ON public.sellers FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "sellers_update_own" ON public.sellers FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "sellers_update_admin" ON public.sellers FOR UPDATE USING (is_admin());
CREATE POLICY "sellers_insert_admin" ON public.sellers FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "sellers_delete_admin" ON public.sellers FOR DELETE USING (is_admin());

-- PRODUCTS
CREATE POLICY "products_select_seller_own" ON public.products FOR SELECT USING (seller_id = get_user_seller_id());
CREATE POLICY "products_select_admin_staff" ON public.products FOR SELECT USING (is_admin_or_staff());
CREATE POLICY "products_insert_seller_own" ON public.products FOR INSERT WITH CHECK (seller_id = get_user_seller_id());
CREATE POLICY "products_insert_admin_staff" ON public.products FOR INSERT WITH CHECK (is_admin_or_staff());
CREATE POLICY "products_update_seller_own" ON public.products FOR UPDATE USING (seller_id = get_user_seller_id()) WITH CHECK (seller_id = get_user_seller_id());
CREATE POLICY "products_update_admin_staff" ON public.products FOR UPDATE USING (is_admin_or_staff());
CREATE POLICY "products_delete_seller_own" ON public.products FOR DELETE USING (seller_id = get_user_seller_id());
CREATE POLICY "products_delete_admin_staff" ON public.products FOR DELETE USING (is_admin_or_staff());

-- ORDERS
CREATE POLICY "orders_select_customer_own" ON public.orders FOR SELECT USING (
  customer_email = (SELECT email FROM public.users WHERE id = auth.uid())
  OR customer_phone = (SELECT phone_number FROM public.users WHERE id = auth.uid())
);
CREATE POLICY "orders_select_seller_own" ON public.orders FOR SELECT USING (seller_id = get_user_seller_id());
CREATE POLICY "orders_select_admin_staff" ON public.orders FOR SELECT USING (is_admin_or_staff());
CREATE POLICY "orders_insert_customer" ON public.orders FOR INSERT WITH CHECK (
  customer_email = (SELECT email FROM public.users WHERE id = auth.uid())
  OR customer_phone = (SELECT phone_number FROM public.users WHERE id = auth.uid())
);
CREATE POLICY "orders_insert_admin_staff" ON public.orders FOR INSERT WITH CHECK (is_admin_or_staff());
CREATE POLICY "orders_update_seller_status" ON public.orders FOR UPDATE USING (seller_id = get_user_seller_id()) WITH CHECK (seller_id = get_user_seller_id());
CREATE POLICY "orders_update_admin_staff" ON public.orders FOR UPDATE USING (is_admin_or_staff());
CREATE POLICY "orders_delete_admin" ON public.orders FOR DELETE USING (is_admin());

-- ORDER_ITEMS
CREATE POLICY "order_items_select_via_order" ON public.order_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id
    AND (
      o.customer_email = (SELECT email FROM public.users WHERE id = auth.uid())
      OR o.customer_phone = (SELECT phone_number FROM public.users WHERE id = auth.uid())
      OR o.seller_id = get_user_seller_id()
      OR is_admin_or_staff()
    )
  )
);
CREATE POLICY "order_items_insert_admin_staff" ON public.order_items FOR INSERT WITH CHECK (is_admin_or_staff());
CREATE POLICY "order_items_update_admin" ON public.order_items FOR UPDATE USING (is_admin());
CREATE POLICY "order_items_delete_admin" ON public.order_items FOR DELETE USING (is_admin());

-- PAYOUTS (if exists)
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'payouts') THEN
    EXECUTE 'CREATE POLICY "payouts_select_admin" ON public.payouts FOR SELECT USING (is_admin())';
    EXECUTE 'CREATE POLICY "payouts_select_seller_own" ON public.payouts FOR SELECT USING (seller_id = get_user_seller_id())';
    EXECUTE 'CREATE POLICY "payouts_insert_admin" ON public.payouts FOR INSERT WITH CHECK (is_admin())';
    EXECUTE 'CREATE POLICY "payouts_update_admin" ON public.payouts FOR UPDATE USING (is_admin())';
    EXECUTE 'CREATE POLICY "payouts_delete_admin" ON public.payouts FOR DELETE USING (is_admin())';
  END IF;
END $$;

-- AUDIT_LOGS (if exists)
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'audit_logs') THEN
    EXECUTE 'CREATE POLICY "audit_logs_select_admin" ON public.audit_logs FOR SELECT USING (is_admin())';
    EXECUTE 'CREATE POLICY "audit_logs_select_own" ON public.audit_logs FOR SELECT USING (user_id = auth.uid())';
    EXECUTE 'CREATE POLICY "audit_logs_insert_system" ON public.audit_logs FOR INSERT WITH CHECK (true)';
  END IF;
END $$;
