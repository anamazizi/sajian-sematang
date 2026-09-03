-- ============================================
-- SAJIAN SEMATANG - COMPLETE PRODUCT REORDER MIGRATION
-- Version 1.0 (03/09/2026)
-- ============================================
-- Skrip ini menambah system untuk menyusun kedudukan produk
-- Jalankan script ini dalam urutan:
-- 1. 18_add_product_display_order_complete.sql
-- ============================================

-- ============================================
-- PART 1: ADD DISPLAY_ORDER COLUMN
-- ============================================
ALTER TABLE public.products 
  ADD COLUMN IF NOT EXISTS display_order integer DEFAULT 0;

-- Update existing records dengan sequential order berdasarkan created_at
-- Pastikan display_order unik untuk setiap seller
WITH numbered_products AS (
  SELECT 
    id,
    seller_id,
    ROW_NUMBER() OVER (PARTITION BY seller_id ORDER BY created_at ASC) as new_order
  FROM public.products
  WHERE display_order IS NULL OR display_order = 0
)
UPDATE public.products p
SET display_order = np.new_order
FROM numbered_products np
WHERE p.id = np.id;

-- Create index untuk performance
CREATE INDEX IF NOT EXISTS idx_products_display_order 
  ON public.products(seller_id, display_order);

-- ============================================
-- PART 2: RPC FUNCTIONS FOR PRODUCT REORDERING
-- ============================================

-- RPC FUNCTION: swap_product_order
CREATE OR REPLACE FUNCTION public.swap_product_order(
  p_product_id_1 uuid,
  p_product_id_2 uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_1 integer;
  v_order_2 integer;
  v_seller_id_1 uuid;
  v_seller_id_2 uuid;
BEGIN
  -- Dapatkan current order values
  SELECT display_order, seller_id INTO v_order_1, v_seller_id_1
  FROM public.products 
  WHERE id = p_product_id_1;
  
  SELECT display_order, seller_id INTO v_order_2, v_seller_id_2
  FROM public.products 
  WHERE id = p_product_id_2;
  
  -- Verify both products belong to same seller
  IF v_seller_id_1 != v_seller_id_2 THEN
    RAISE EXCEPTION 'Products must belong to the same seller';
  END IF;
  
  -- Swap the display orders
  UPDATE public.products 
  SET display_order = v_order_2,
      updated_at = NOW()
  WHERE id = p_product_id_1;
  
  UPDATE public.products 
  SET display_order = v_order_1,
      updated_at = NOW()
  WHERE id = p_product_id_2;
  
  -- Log the change to audit_logs
  INSERT INTO public.audit_logs (
    user_id,
    action,
    table_name,
    record_id,
    old_value,
    new_value,
    reason,
    created_at
  ) VALUES (
    auth.uid(), -- current user ID from Supabase Auth
    'update',
    'products',
    p_product_id_1,
    jsonb_build_object('display_order', v_order_1),
    jsonb_build_object('display_order', v_order_2),
    'Product reorder (swap with product ' || p_product_id_2 || ')',
    NOW()
  );
  
  INSERT INTO public.audit_logs (
    user_id,
    action,
    table_name,
    record_id,
    old_value,
    new_value,
    reason,
    created_at
  ) VALUES (
    auth.uid(), -- current user ID from Supabase Auth
    'update',
    'products',
    p_product_id_2,
    jsonb_build_object('display_order', v_order_2),
    jsonb_build_object('display_order', v_order_1),
    'Product reorder (swap with product ' || p_product_id_1 || ')',
    NOW()
  );
END;
$$;

-- RPC FUNCTION: move_product_up
CREATE OR REPLACE FUNCTION public.move_product_up(
  p_product_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_order integer;
  v_current_seller_id uuid;
  v_previous_product_id uuid;
BEGIN
  -- Get current product details
  SELECT display_order, seller_id 
  INTO v_current_order, v_current_seller_id
  FROM public.products 
  WHERE id = p_product_id;