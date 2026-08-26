-- ============================================
-- SAJIAN SEMATANG - RLS POLICIES PART 1
-- CLEANUP & HELPER FUNCTIONS
-- ============================================
-- Phase: REBUILD-1
-- Date: 26 Ogos 2026
-- ============================================

-- ============================================
-- STEP 1: DROP ALL EXISTING POLICIES
-- ============================================

-- Users table
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can manage users" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;

-- Sellers table
DROP POLICY IF EXISTS "Anyone can view sellers" ON public.sellers;
DROP POLICY IF EXISTS "Sellers can manage their own shop" ON public.sellers;
DROP POLICY IF EXISTS "Admins can view all sellers" ON public.sellers;

-- Products table
DROP POLICY IF EXISTS "Anyone can view available products" ON public.products;
DROP POLICY IF EXISTS "Sellers can view all their products" ON public.products;
DROP POLICY IF EXISTS "Sellers can view their own products" ON public.products;
DROP POLICY IF EXISTS "Sellers can manage their own products" ON public.products;
DROP POLICY IF EXISTS "Admin and Staff can view all products" ON public.products;
DROP POLICY IF EXISTS "Admin and Staff can manage all products" ON public.products;

-- Orders table
DROP POLICY IF EXISTS "Anyone can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Sellers can view orders for their shop" ON public.orders;
DROP POLICY IF EXISTS "Sellers can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Sellers can update order status" ON public.orders;
DROP POLICY IF EXISTS "Sellers can update their own order status" ON public.orders;
DROP POLICY IF EXISTS "Admin and Staff can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Admin and Staff can update all orders" ON public.orders;
DROP POLICY IF EXISTS "Admin and Staff can create orders" ON public.orders;
DROP POLICY IF EXISTS "Customers can view their own orders" ON public.orders;

-- Order Items table
DROP POLICY IF EXISTS "Anyone can insert order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can view order items" ON public.order_items;
DROP POLICY IF EXISTS "Sellers can view their order items" ON public.order_items;

-- Payouts table
DROP POLICY IF EXISTS "Admins can view all payouts" ON public.payouts;
DROP POLICY IF EXISTS "Sellers can view their own payouts" ON public.payouts;
DROP POLICY IF EXISTS "Only admins can create payouts" ON public.payouts;

-- Audit Logs table
DROP POLICY IF EXISTS "Admins can view all audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Users can view their own audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;

-- ============================================
-- STEP 2: HELPER FUNCTIONS FOR RLS
-- ============================================

-- Function: Check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin' AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Check if current user is staff
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'staff' AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Check if current user is admin or staff
CREATE OR REPLACE FUNCTION public.is_admin_or_staff()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role IN ('admin', 'staff') AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get seller_id for current user
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
-- STEP 3: CREATE CUSTOMER-SAFE VIEWS
-- ============================================

-- Products view (excludes cost_price)
CREATE OR REPLACE VIEW public.products_customer_view AS
SELECT
  p.id,
  p.seller_id,
  p.name,
  p.description,
  p.price AS selling_price,
  p.category,
  p.image_url,
  p.is_available,
  p.stock_quantity,
  p.is_preorder,
  p.available_from,
  p.available_until,
  p.created_at,
  p.updated_at,
  s.shop_name AS seller_name
FROM public.products p
LEFT JOIN public.sellers s ON p.seller_id = s.id
WHERE p.is_available = true;

GRANT SELECT ON public.products_customer_view TO authenticated;
GRANT SELECT ON public.products_customer_view TO anon;

-- Sellers view (excludes QR code and sensitive data)
CREATE OR REPLACE VIEW public.sellers_customer_view AS
SELECT
  s.id,
  s.shop_name,
  s.description,
  s.created_at
FROM public.sellers s;

GRANT SELECT ON public.sellers_customer_view TO authenticated;
GRANT SELECT ON public.sellers_customer_view TO anon;
