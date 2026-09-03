-- ============================================
-- RPC FUNCTION: move_product_up
-- ============================================
-- Function untuk move product up (swap with previous product)
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
  
  -- Find previous product (with lower display_order)
  SELECT id INTO v_previous_product_id
  FROM public.products
  WHERE seller_id = v_current_seller_id
    AND display_order < v_current_order
    AND (is_archived IS NULL OR is_archived = false)
  ORDER BY display_order DESC
  LIMIT 1;
  
  -- If found, swap with previous product
  IF v_previous_product_id IS NOT NULL THEN
    PERFORM public.swap_product_order(p_product_id, v_previous_product_id);
  END IF;
END;
$$;

-- ============================================
-- RPC FUNCTION: move_product_down
-- ============================================
-- Function untuk move product down (swap with next product)
CREATE OR REPLACE FUNCTION public.move_product_down(
  p_product_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_order integer;
  v_current_seller_id uuid;
  v_next_product_id uuid;
BEGIN
  -- Get current product details
  SELECT display_order, seller_id 
  INTO v_current_order, v_current_seller_id
  FROM public.products 
  WHERE id = p_product_id;
  
  -- Find next product (with higher display_order)
  SELECT id INTO v_next_product_id
  FROM public.products
  WHERE seller_id = v_current_seller_id
    AND display_order > v_current_order
    AND (is_archived IS NULL OR is_archived = false)
  ORDER BY display_order ASC
  LIMIT 1;
  
  -- If found, swap with next product
  IF v_next_product_id IS NOT NULL THEN
    PERFORM public.swap_product_order(p_product_id, v_next_product_id);
  END IF;
END;
$$;