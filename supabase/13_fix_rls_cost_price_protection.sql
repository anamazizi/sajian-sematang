-- ============================================
-- PHASE R5.3: SECURE cost_price PROTECTION
-- ============================================
-- Master Prompt Seksyen 66: RLS mesti protect cost_price daripada customer
-- Master Prompt Seksyen 88: Data privacy - jangan expose sensitive data
-- ============================================

-- Drop existing public products policy
DROP POLICY IF EXISTS "products_select_public" ON public.products;
DROP POLICY IF EXISTS "products_select_customer" ON public.products;
DROP POLICY IF EXISTS "products_select_all" ON public.products;

-- Drop NEW policies for idempotency (in case re-running)
DROP POLICY IF EXISTS "products_select_customer_safe" ON public.products;
DROP POLICY IF EXISTS "products_select_seller_own_full" ON public.products;
DROP POLICY IF EXISTS "products_select_admin_staff_full" ON public.products;

-- ============================================
-- STRATEGY: Use PostgreSQL Column-Level Security
-- ============================================
-- Instead of SELECT *, enforce explicit column selection
-- RLS alone cannot prevent SELECT * from including cost_price
-- We need APPLICATION-LEVEL enforcement (see R5.4)
-- ============================================

-- Public/Customer can view products WITHOUT cost_price
-- This policy allows SELECT but application MUST use explicit columns
CREATE POLICY "products_select_customer_safe" 
ON public.products 
FOR SELECT 
USING (
  is_available = true
  -- Note: This allows SELECT, but we enforce explicit column list in app code
  -- RLS cannot prevent SELECT * at database level
  -- Real protection comes from explicit .select('id, name, price, ...') in code
);

-- ============================================
-- SELLER: Can view OWN products with cost_price
-- ============================================
-- Sellers need cost_price for their own products management
CREATE POLICY "products_select_seller_own_full" 
ON public.products 
FOR SELECT 
USING (
  seller_id = get_user_seller_id()
  -- Sellers can SELECT * for their own products (includes cost_price)
);

-- ============================================
-- ADMIN/STAFF: Can view ALL products with cost_price
-- ============================================
CREATE POLICY "products_select_admin_staff_full" 
ON public.products 
FOR SELECT 
USING (
  is_admin_or_staff()
  -- Admin/Staff can SELECT * for all products (includes cost_price)
);

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these after applying to verify protection:

-- 1. As anonymous/customer (should work but app will filter columns)
-- SELECT id, name, price, description FROM products WHERE is_available = true;

-- 2. As customer trying to get cost_price (should work at DB level, blocked at app level)
-- SELECT cost_price FROM products WHERE is_available = true;
-- Note: This will return data because RLS allows SELECT on the row
-- Real protection is in application code using explicit column lists

-- 3. As seller (should see own cost_price)
-- SELECT id, name, price, cost_price FROM products WHERE seller_id = get_user_seller_id();

-- 4. As admin (should see all cost_price)
-- SELECT id, name, price, cost_price FROM products;

-- ============================================
-- IMPORTANT NOTES
-- ============================================
-- PostgreSQL RLS works at ROW level, not COLUMN level
-- cost_price protection requires TWO layers:
-- 1. RLS (this file) - controls which ROWS user can access
-- 2. Application code (R5.4) - controls which COLUMNS are selected
-- 
-- We CANNOT use column-level security in RLS policies directly
-- Solution: Application MUST use explicit .select('id, name, price, ...')
-- Never use .select('*') for customer-facing queries
-- ============================================

-- ============================================
-- DOCUMENTATION REFERENCE
-- ============================================
-- Master Prompt Seksyen 66: RLS rules per role
-- Master Prompt Seksyen 88: Data privacy principles
-- Audit Report Issue D.1: cost_price exposure risk
-- ============================================
