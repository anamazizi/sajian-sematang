-- Stock Movements Table Migration
-- Phase R3E: Stock History & Audit Trail
-- Created: 29/08/2026

-- Drop table if exists (for development only)
DROP TABLE IF EXISTS public.stock_movements;

-- Create stock_movements table
CREATE TABLE public.stock_movements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  
  -- Foreign keys
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  seller_id UUID REFERENCES public.sellers(id) ON DELETE CASCADE NOT NULL,
  
  -- Stock change details
  previous_quantity INTEGER NOT NULL,
  adjustment_quantity INTEGER NOT NULL, -- Can be positive or negative
  new_quantity INTEGER NOT NULL,
  
  -- Audit trail
  reason TEXT NOT NULL, -- e.g., "Manual adjustment", "Order deduction", "Stock replenish"
  changed_by UUID REFERENCES public.users(id), -- Admin/Staff who made change (NULL if system)
  changed_by_role TEXT, -- 'admin', 'staff', 'seller', 'system'
  
  -- Metadata
  notes TEXT, -- Optional additional notes
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for performance
CREATE INDEX idx_stock_movements_product_id ON public.stock_movements(product_id);
CREATE INDEX idx_stock_movements_seller_id ON public.stock_movements(seller_id);
CREATE INDEX idx_stock_movements_created_at ON public.stock_movements(created_at DESC);

-- Enable RLS
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- 1. Sellers can view their own product stock movements
CREATE POLICY "Sellers can view own stock movements"
  ON public.stock_movements
  FOR SELECT
  USING (
    seller_id IN (
      SELECT id FROM public.sellers WHERE user_id = auth.uid()
    )
  );

-- 2. Admin can view all stock movements
CREATE POLICY "Admin can view all stock movements"
  ON public.stock_movements
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- 3. Staff can view all stock movements
CREATE POLICY "Staff can view all stock movements"
  ON public.stock_movements
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'staff'
    )
  );

-- 4. Sellers can insert stock movements for own products
CREATE POLICY "Sellers can insert own stock movements"
  ON public.stock_movements
  FOR INSERT
  WITH CHECK (
    seller_id IN (
      SELECT id FROM public.sellers WHERE user_id = auth.uid()
    )
  );

-- 5. Admin can insert any stock movements
CREATE POLICY "Admin can insert stock movements"
  ON public.stock_movements
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- 6. Staff can insert any stock movements
CREATE POLICY "Staff can insert stock movements"
  ON public.stock_movements
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'staff'
    )
  );

-- 7. Nobody can update or delete stock movements (immutable audit log)
-- No UPDATE or DELETE policies = no one can modify history

-- Create a function to automatically log stock changes
CREATE OR REPLACE FUNCTION log_stock_movement()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if stock_quantity changed
  IF (TG_OP = 'UPDATE' AND OLD.stock_quantity != NEW.stock_quantity) THEN
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
      NEW.seller_id,
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

-- Create trigger on products table
CREATE TRIGGER trigger_log_stock_movement
  AFTER UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION log_stock_movement();

-- Add comment
COMMENT ON TABLE public.stock_movements IS 'Audit trail for all stock quantity changes';
COMMENT ON FUNCTION log_stock_movement() IS 'Automatically logs stock changes when products.stock_quantity is updated';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Stock movements table created successfully!';
  RAISE NOTICE '';
  RAISE NOTICE 'Features:';
  RAISE NOTICE '  - Audit trail for stock changes';
  RAISE NOTICE '  - Automatic logging via trigger';
  RAISE NOTICE '  - Immutable history (no update/delete)';
  RAISE NOTICE '  - RLS policies for seller/admin/staff';
  RAISE NOTICE '';
  RAISE NOTICE 'Next: Test by updating a product stock quantity';
END $$;
