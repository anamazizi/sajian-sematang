-- ========================================
-- PHASE R4D Part 4: ORDER ITEM OPTIONS SNAPSHOT
-- ========================================
-- Purpose: Store selected options snapshot in order_items
-- Compliance: Master Prompt Seksyen 28, 64 - Order Snapshot (Options)
-- ========================================

-- 1. ADD COLUMNS TO order_items FOR OPTIONS SNAPSHOT
ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS selected_options JSONB DEFAULT '[]'::jsonb;

-- 2. ADD COMMENT
COMMENT ON COLUMN public.order_items.selected_options IS 
  'Snapshot of selected options at order time. Format: [{"option_id":"uuid","option_group":"Temperature","option_name":"Iced","price_adjustment":1.00}]';

-- 3. CREATE INDEX FOR JSONB QUERIES (optional, for future analytics)
CREATE INDEX IF NOT EXISTS idx_order_items_selected_options 
  ON public.order_items USING GIN (selected_options);

-- 4. VERIFICATION
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ ORDER ITEM OPTIONS SNAPSHOT ADDED!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Column added:';
  RAISE NOTICE '- order_items.selected_options (JSONB)';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Update RPC create_order_with_stock_check()';
  RAISE NOTICE '2. Update Server Action to pass options';
  RAISE NOTICE '3. Update UI to display options';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;
