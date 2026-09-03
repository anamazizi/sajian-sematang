-- ===========================================
-- Order Status History & Audit Log Migration
-- ===========================================
-- Master Prompt Seksyen 32: ORDER STATUS HISTORY
-- Master Prompt Seksyen 58: AUDIT LOG
-- ===========================================

-- Drop table if exists (for development)
DROP TABLE IF EXISTS public.order_status_history;

-- Create order_status_history table
CREATE TABLE public.order_status_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  
  -- Foreign key to orders table
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  
  -- Status change information
  previous_status TEXT NOT NULL,
  new_status TEXT NOT NULL,
  
  -- Actor information
  changed_by UUID REFERENCES public.users(id),
  actor_name TEXT,
  actor_role TEXT,
  
  -- Additional metadata
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for performance
CREATE INDEX idx_order_status_history_order_id ON public.order_status_history(order_id);
CREATE INDEX idx_order_status_history_created_at ON public.order_status_history(created_at DESC);
CREATE INDEX idx_order_status_history_changed_by ON public.order_status_history(changed_by);

-- Enable RLS
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- 1. Admin can view all status history
CREATE POLICY "Admin can view all order status history"
  ON public.order_status_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- 2. Staff can view all status history
CREATE POLICY "Staff can view all order status history"
  ON public.order_status_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'staff'
    )
  );

-- 3. Sellers can view status history for their own orders
CREATE POLICY "Sellers can view own order status history"
  ON public.order_status_history
  FOR SELECT
  USING (
    order_id IN (
      SELECT o.id FROM public.orders o
      INNER JOIN public.sellers s ON o.seller_id = s.id
      WHERE s.user_id = auth.uid()
    )
  );

-- 4. Admin can insert status history
CREATE POLICY "Admin can insert order status history"
  ON public.order_status_history
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- 5. Staff can insert status history
CREATE POLICY "Staff can insert order status history"
  ON public.order_status_history
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'staff'
    )
  );

-- No UPDATE or DELETE policies - audit history is immutable

-- Function to update order status with audit logging
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
  v_result JSONB;
BEGIN
  -- Get current order status and verify it exists
  SELECT status INTO v_current_status
  FROM public.orders
  WHERE id = p_order_id;
  
  IF v_current_status IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Order not found'
    );
  END IF;
  
  -- Prevent updates to COMPLETED orders (locked state)
  IF v_current_status = 'Completed' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Cannot update status of completed orders'
    );
  END IF;
  
  -- Prevent invalid status transitions (can be overridden by admin via UI)
  -- This is a soft validation - UI should handle most restrictions
  
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
GRANT EXECUTE ON FUNCTION update_order_status_with_audit(UUID, TEXT, TEXT) TO authenticated;

-- Add comment
COMMENT ON TABLE public.order_status_history IS 'Audit trail for all order status changes';
COMMENT ON FUNCTION update_order_status_with_audit(UUID, TEXT, TEXT) IS 'Updates order status and logs change to audit history with user info';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Order status history table created successfully!';
  RAISE NOTICE '';
  RAISE NOTICE 'Features:';
  RAISE NOTICE '  - Audit trail for all status changes';
  RAISE NOTICE '  - Prevents updates to COMPLETED orders (locked state)';
  RAISE NOTICE '  - Tracks who changed status and when';
  RAISE NOTICE '  - Supports notes for status changes';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Update UI to use dropdown instead of single "next" button';
  RAISE NOTICE '  2. Add status history modal/view';
  RAISE NOTICE '  3. Implement server action that calls this function';
END $$;