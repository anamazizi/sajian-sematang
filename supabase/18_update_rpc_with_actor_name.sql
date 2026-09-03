-- ===========================================
-- Update RPC Function to accept actor_name and actor_role parameters
-- ===========================================
-- FIX: Jangan guna default hardcoded 'Admin/Staff'
-- ===========================================

-- Drop existing function
DROP FUNCTION IF EXISTS update_order_status_with_audit(UUID, TEXT, TEXT);

-- Recreate with parameters for actor name and role
CREATE OR REPLACE FUNCTION update_order_status_with_audit(
  p_order_id UUID,
  p_new_status TEXT,
  p_notes TEXT DEFAULT NULL,
  p_actor_name TEXT DEFAULT NULL,
  p_actor_role TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_status TEXT;
  v_changed_by UUID;
  v_final_actor_name TEXT;
  v_final_actor_role TEXT;
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
  IF v_current_status = 'COMPLETED' OR v_current_status = 'CANCELLED' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Cannot update status of completed or cancelled orders'
    );
  END IF;
  
  -- Get current user info
  v_changed_by := auth.uid();
  
  -- Determine actor name and role
  -- Priority: 1. Parameters from Server Action, 2. profiles table, 3. users table, 4. Default
  IF p_actor_name IS NOT NULL AND p_actor_role IS NOT NULL THEN
    -- Use parameters from Server Action (already has real name from profiles)
    v_final_actor_name := p_actor_name;
    v_final_actor_role := p_actor_role;
  ELSE
    -- Fallback: Try to get from profiles table (most likely source of full_name)
    BEGIN
      SELECT full_name, role INTO v_final_actor_name, v_final_actor_role
      FROM public.profiles
      WHERE id = v_changed_by;
      
      IF v_final_actor_name IS NULL THEN
        -- Try users table as secondary fallback
        SELECT name, role INTO v_final_actor_name, v_final_actor_role
        FROM public.users
        WHERE id = v_changed_by;
      END IF;
      
      IF v_final_actor_name IS NULL THEN
        v_final_actor_name := 'Admin/Staff';
        v_final_actor_role := 'admin';
      END IF;
    EXCEPTION
      WHEN OTHERS THEN
        v_final_actor_name := 'Admin/Staff';
        v_final_actor_role := 'admin';
    END;
  END IF;
  
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
    v_final_actor_name,
    v_final_actor_role,
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
        CONCAT('Automated runner cost for completed delivery order. Actor: ', v_final_actor_name),
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_order_status_with_audit(UUID, TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- Update comment
COMMENT ON FUNCTION update_order_status_with_audit(UUID, TEXT, TEXT, TEXT, TEXT) IS 'Updates order status, logs change to audit history with real actor name from profiles table';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ RPC function updated with real actor name support!';
  RAISE NOTICE '';
  RAISE NOTICE 'Features:';
  RAISE NOTICE '  - Accepts actor_name and actor_role parameters from Server Action';
  RAISE NOTICE '  - Falls back to profiles table if parameters not provided';
  RAISE NOTICE '  - Records real name (e.g., "Anam Azizi") instead of hardcoded "Admin/Staff"';
  RAISE NOTICE '  - Automatically records runner cost for COMPLETED delivery orders';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Run this SQL migration in Supabase';
  RAISE NOTICE '  2. Update Server Action to pass actor info';
END $$;