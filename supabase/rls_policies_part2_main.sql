-- ============================================
-- SAJIAN SEMATANG - RLS POLICIES PART 2
-- MAIN TABLE POLICIES
-- ============================================
-- Run AFTER rls_policies_part1_cleanup.sql
-- ============================================

-- ============================================
-- USERS TABLE POLICIES
-- ============================================

CREATE POLICY "users_select_own"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "users_select_admin"
  ON public.users FOR SELECT
  USING (is_admin());

CREATE POLICY "users_update_own"
  ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT role FROM public.users WHERE id = auth.uid())
  );

CREATE POLICY "users_update_admin"
  ON public.users FOR UPDATE
  USING (is_admin());

CREATE POLICY "users_insert_signup"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "users_delete_admin"
  ON public.users FOR DELETE
  USING (is_admin());

-- ============================================
-- SELLERS TABLE POLICIES
-- ============================================

CREATE POLICY "sellers_select_admin_staff"
  ON public.sellers FOR SELECT
  USING (is_admin_or_staff());

CREATE POLICY "sellers_select_own"
  ON public.sellers FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "sellers_update_own"
  ON public.sellers FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "sellers_update_admin"
  ON public.sellers FOR UPDATE
  USING (is_admin());

CREATE POLICY "sellers_insert_admin"
  ON public.sellers FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "sellers_delete_admin"
  ON public.sellers FOR DELETE
  USING (is_admin());

-- ============================================
-- PRODUCTS TABLE POLICIES (STRICT - NO CUSTOMER ACCESS)
-- ============================================
-- Customers MUST use products_customer_view

CREATE POLICY "products_select_seller_own"
  ON public.products FOR SELECT
  USING (seller_id = get_user_seller_id());

CREATE POLICY "products_select_admin_staff"
  ON public.products FOR SELECT
  USING (is_admin_or_staff());

CREATE POLICY "products_insert_seller_own"
  ON public.products FOR INSERT
  WITH CHECK (seller_id = get_user_seller_id());

CREATE POLICY "products_insert_admin_staff"
  ON public.products FOR INSERT
  WITH CHECK (is_admin_or_staff());

CREATE POLICY "products_update_seller_own"
  ON public.products FOR UPDATE
  USING (seller_id = get_user_seller_id())
  WITH CHECK (seller_id = get_user_seller_id());

CREATE POLICY "products_update_admin_staff"
  ON public.products FOR UPDATE
  USING (is_admin_or_staff());

CREATE POLICY "products_delete_seller_own"
  ON public.products FOR DELETE
  USING (seller_id = get_user_seller_id());

CREATE POLICY "products_delete_admin_staff"
  ON public.products FOR DELETE
  USING (is_admin_or_staff());

-- ============================================
-- ORDERS TABLE POLICIES
-- ============================================

CREATE POLICY "orders_select_customer_own"
  ON public.orders FOR SELECT
  USING (
    customer_email = (SELECT email FROM public.users WHERE id = auth.uid())
  );

CREATE POLICY "orders_select_seller_own"
  ON public.orders FOR SELECT
  USING (seller_id = get_user_seller_id());

CREATE POLICY "orders_select_admin_staff"
  ON public.orders FOR SELECT
  USING (is_admin_or_staff());

CREATE POLICY "orders_insert_customer"
  ON public.orders FOR INSERT
  WITH CHECK (
    customer_email = (SELECT email FROM public.users WHERE id = auth.uid())
  );

CREATE POLICY "orders_insert_admin_staff"
  ON public.orders FOR INSERT
  WITH CHECK (is_admin_or_staff());

CREATE POLICY "orders_update_seller_status"
  ON public.orders FOR UPDATE
  USING (seller_id = get_user_seller_id())
  WITH CHECK (seller_id = get_user_seller_id());

CREATE POLICY "orders_update_admin_staff"
  ON public.orders FOR UPDATE
  USING (is_admin_or_staff());

CREATE POLICY "orders_delete_admin"
  ON public.orders FOR DELETE
  USING (is_admin());

-- ============================================
-- ORDER_ITEMS TABLE POLICIES
-- ============================================

CREATE POLICY "order_items_select_via_order"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id
      AND (
        o.customer_email = (SELECT email FROM public.users WHERE id = auth.uid())
        OR o.seller_id = get_user_seller_id()
        OR is_admin_or_staff()
      )
    )
  );

CREATE POLICY "order_items_insert_admin_staff"
  ON public.order_items FOR INSERT
  WITH CHECK (is_admin_or_staff());

CREATE POLICY "order_items_update_admin"
  ON public.order_items FOR UPDATE
  USING (is_admin());

CREATE POLICY "order_items_delete_admin"
  ON public.order_items FOR DELETE
  USING (is_admin());

-- ============================================
-- PAYOUTS TABLE POLICIES
-- ============================================

CREATE POLICY "payouts_select_admin"
  ON public.payouts FOR SELECT
  USING (is_admin());

CREATE POLICY "payouts_select_seller_own"
  ON public.payouts FOR SELECT
  USING (seller_id = get_user_seller_id());

CREATE POLICY "payouts_insert_admin"
  ON public.payouts FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "payouts_update_admin"
  ON public.payouts FOR UPDATE
  USING (is_admin());

CREATE POLICY "payouts_delete_admin"
  ON public.payouts FOR DELETE
  USING (is_admin());

-- ============================================
-- AUDIT_LOGS TABLE POLICIES
-- ============================================

CREATE POLICY "audit_logs_select_admin"
  ON public.audit_logs FOR SELECT
  USING (is_admin());

CREATE POLICY "audit_logs_select_own"
  ON public.audit_logs FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "audit_logs_insert_system"
  ON public.audit_logs FOR INSERT
  WITH CHECK (true);
