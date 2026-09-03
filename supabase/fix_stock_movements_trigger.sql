-- Fix Stock Movements Trigger - Handle NULL seller_id
-- This migration fixes the "null value in column "seller_id" of relation "stock_movements" violates not-null constraint" error

-- Drop existing trigger first
DROP TRIGGER IF EXISTS trigger_log_stock_movement ON public.products;

-- Drop existing function
DROP FUNCTION IF EXISTS log_stock_movement();

-- Recreate function with NULL seller_id handling
CREATE OR REPLACE FUNCTION log_stock_movement()
RETURNS TRIGGER AS $$
DECLARE
  v_seller_id UUID;
BEGIN
  -- Only log if stock_quantity changed
  IF (TG_OP = 'UPDATE' AND OLD.stock_quantity != NEW.stock_quantity) THEN
    -- Ensure seller_id is not null - get from product if NULL
    IF NEW.seller_id IS NULL THEN
      -- Fallback: try to get seller_id from product itself
      SELECT seller_id INTO v_seller_id 
      FROM public.products 
      WHERE id = NEW.id;
      
      -- If still NULL, set to a default or skip logging
      IF v_seller_id IS NULL THEN
        RAISE WARNING 'Cannot log stock movement: seller_id is NULL for product %', NEW.id;
        RETURN NEW;
      END IF;
    ELSE
      v_seller_id := NEW.seller_id;
    END IF;
    
    INSERT INTO public.stock_movements (
      product_id,
      seller_id,
      previous_quantity,
      adjustment_quantity,
      new_quantity,
      reason,
      changed_by,
      changed_by_role
    ) VALUES (
      NEW.id,
      v_seller_id,
      OLD.stock_quantity,
      NEW.stock_quantity - OLD.stock_quantity,
      NEW.stock_quantity,
      COALESCE(current_setting('app.stock_change_reason', true), 'Stock update'),
      auth.uid(),
      COALESCE(
        (SELECT role FROM public.users WHERE id = auth.uid()),
        'system'
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
CREATE TRIGGER trigger_log_stock_movement
  AFTER UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION log_stock_movement();

-- Verify products don't have NULL seller_id (data integrity check)
DO $$
DECLARE
  null_seller_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO null_seller_count
  FROM public.products
  WHERE seller_id IS NULL;
  
  IF null_seller_count > 0 THEN
    RAISE WARNING 'Found % products with NULL seller_id. This may cause stock movement logging issues.', null_seller_count;
    RAISE NOTICE 'Run: UPDATE public.products SET seller_id = [valid_seller_id] WHERE seller_id IS NULL;';
  END IF;
END $$;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Stock movement trigger updated successfully!';
  RAISE NOTICE 'Features:';
  RAISE NOTICE '  - Handles NULL seller_id gracefully';
  RAISE NOTICE '  - Fallback to query product if seller_id is NULL';
  RAISE NOTICE '  - Warning if seller_id remains NULL';
END $$;