-- ============================================
-- RPC FUNCTION: swap_product_order
-- ============================================
-- Function untuk swap display_order antara dua produk
-- Menggunakan transaction untuk consistency
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