-- ===========================================
-- Add Runner Cost Recording to Order Status Updates
-- ===========================================
-- Master Prompt Seksyen 47: RUNNER PAYMENT
-- ===========================================

-- Update the update_order_status_with_audit function to record runner cost
CREATE OR REPLACE FUNCTION update_order_status_with_audit(
  p_order_id UUID,
  p_new_status TEXT,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_status TEXT;
  v_changed_by UUID;
  v_actor_name TEXT;
  v_actor_role TEXT;
  v_delivery_fee DECIMAL(10, 2);
  v_order_data RECORD;
  v_result JSONB;
BEGIN
  -- Get current order status and verify it exists
  SELECT status, delivery_fee_snapshot, total_price
  INTO v_current_status, v_delivery_fee, v_order_data
  FROM public.orders
  WHERE id = p_order_id;
  
  IF v_current_status IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Order not found'
    );
  END IF;
  
  -- Prevent updates to COMPLETED orders (locked state)
  IF v_current_status = 'COMPLETED' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Cannot update status of completed orders'
    );
  END IF;
  
  -- Get current user info
  v_changed_by := auth.uid();
  
  SELECT name, role INTO v_actor_name, v_actor_role
  FROM public.users
  WHERE id = v_changed_by;
  
  -- Update order status
  UPDATE public.orders
  SET status = p_new_status,
      updated_at = now()
  WHERE id = p_order_id;
  
  -- Log status change to audit history
  INSERT INTO public.order_status_history (
    order_id,
    previous_status,
    new_status,
    changed_by,
    actor_name,
    actor_role,
    notes
  ) VALUES (
    p_order_id,
    v_current_status,
    p_new_status,
    v_changed_by,
    v_actor_name,
    v_actor_role,
    p_notes
  );
  
  -- If status changed to COMPLETED and has delivery fee, record runner cost
  IF p_new_status = 'COMPLETED' AND v_delivery_fee > 0 THEN
    -- Check if expenses table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'expenses') THEN
      -- Insert runner cost as expense
      INSERT INTO public.expenses (
        date,
        supplier,
        description,
        amount,
        notes,
        created_by,
        order_id
      ) VALUES (
        CURRENT_DATE,
        'Runner Delivery',
        CONCAT('Runner fee for Order ', p_order_id),
        v_delivery_fee,
        CONCAT('Automated runner cost for completed delivery order. Actor: ', v_actor_name),
        v_changed_by,
        p_order_id
      );
      
      RAISE NOTICE '✅ Runner cost recorded: RM % for Order %', v_delivery_fee, p_order_id;
    END IF;
  END IF;
  
  -- Return success
  RETURN jsonb_build_object(
    'success', true,
    'order_id', p_order_id,
    'previous_status', v_current_status,
    'new_status', p_new_status,
    'message', 'Order status updated successfully'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'message', 'Failed to update order status'
    );
END;
$$;

-- Update comment
COMMENT ON FUNCTION update_order_status_with_audit(UUID, TEXT, TEXT) IS 'Updates order status, logs change to audit history, and records runner cost for completed delivery orders';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Order status function updated with runner cost recording!';
  RAISE NOTICE '';
  RAISE NOTICE 'Features added:';
  RAISE NOTICE '  - Automatically records runner cost when order status changes to COMPLETED';
  RAISE NOTICE '  - Only triggers if delivery_fee_snapshot > 0';
  RAISE NOTICE '  - Creates expense record in expenses table';
  RAISE NOTICE '  - Maintains full audit trail';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Ensure expenses table exists with proper columns';
  RAISE NOTICE '  2. Test with delivery order completing';
END $$;