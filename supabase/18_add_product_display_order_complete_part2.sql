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

-- RPC FUNCTION: move_product_down
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

-- RPC FUNCTION: reorder_products
CREATE OR REPLACE FUNCTION public.reorder_products(
  p_seller_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  WITH numbered_products AS (
    SELECT 
      id,
      ROW_NUMBER() OVER (ORDER BY display_order ASC, created_at ASC) as new_order
    FROM public.products
    WHERE seller_id = p_seller_id
      AND (is_archived IS NULL OR is_archived = false)
  )
  UPDATE public.products p
  SET display_order = np.new_order,
      updated_at = NOW()
  FROM numbered_products np
  WHERE p.id = np.id;
  
  -- Log the reorder
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
    auth.uid(),
    'update',
    'products',
    p_seller_id,
    '{}'::jsonb,
    jsonb_build_object('action', 'reorder_all_products'),
    'Reordered all products for seller',
    NOW()
  );
END;
$$;

-- ============================================
-- PART 3: GRANT PERMISSIONS
-- ============================================
GRANT EXECUTE ON FUNCTION public.swap_product_order TO authenticated;
GRANT EXECUTE ON FUNCTION public.move_product_up TO authenticated;
GRANT EXECUTE ON FUNCTION public.move_product_down TO authenticated;
GRANT EXECUTE ON FUNCTION public.reorder_products TO authenticated;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- ✅ Column display_order telah ditambah
-- ✅ Index telah dicipta
-- ✅ RPC functions untuk reorder telah ditambah
-- ✅ Permissions telah diberikan
-- ============================================