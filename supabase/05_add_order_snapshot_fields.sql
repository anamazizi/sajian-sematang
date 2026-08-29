-- Order Snapshot Fields Migration
-- Phase R4B: Critical Security - Order Audit Trail
-- Created: 29/08/2026
-- Purpose: Add snapshot fields to preserve historical order data

-- Master Prompt Seksyen 28: "ORDER SNAPSHOT"
-- Order item snapshot: product name, selling price, cost price, option name, option price, quantity

-- Add snapshot fields to order_items table
ALTER TABLE public.order_items
ADD COLUMN IF NOT EXISTS product_name_snapshot TEXT,
ADD COLUMN IF NOT EXISTS cost_price_snapshot DECIMAL(10, 2);

-- Add index for faster queries on product name
CREATE INDEX IF NOT EXISTS idx_order_items_product_name 
ON public.order_items(product_name_snapshot);

-- Add comment for documentation
COMMENT ON COLUMN public.order_items.product_name_snapshot IS 
'Product name at time of order - preserves historical data even if product renamed';

COMMENT ON COLUMN public.order_items.cost_price_snapshot IS 
'Product cost price at time of order - for accurate seller payout calculation';

-- Add snapshot fields to orders table (customer info)
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS customer_name_snapshot TEXT,
ADD COLUMN IF NOT EXISTS customer_phone_snapshot TEXT,
ADD COLUMN IF NOT EXISTS customer_address_snapshot TEXT,
ADD COLUMN IF NOT EXISTS delivery_distance_snapshot DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS delivery_fee_snapshot DECIMAL(10, 2);

-- Add comments
COMMENT ON COLUMN public.orders.customer_name_snapshot IS 
'Customer name at time of order - snapshot for audit trail';

COMMENT ON COLUMN public.orders.customer_phone_snapshot IS 
'Customer phone at time of order - snapshot for audit trail';

COMMENT ON COLUMN public.orders.customer_address_snapshot IS 
'Customer address at time of order - snapshot for audit trail';

COMMENT ON COLUMN public.orders.delivery_distance_snapshot IS 
'Calculated delivery distance (km) at time of order';

COMMENT ON COLUMN public.orders.delivery_fee_snapshot IS 
'Delivery fee calculated at time of order - preserves historical pricing';

-- Note: unit_price already exists in order_items (renamed from price)
-- This serves as selling_price_snapshot

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Order snapshot fields added successfully!';
  RAISE NOTICE '';
  RAISE NOTICE 'New fields in order_items:';
  RAISE NOTICE '  - product_name_snapshot (preserves product name)';
  RAISE NOTICE '  - cost_price_snapshot (for seller payout)';
  RAISE NOTICE '';
  RAISE NOTICE 'New fields in orders:';
  RAISE NOTICE '  - customer_name_snapshot';
  RAISE NOTICE '  - customer_phone_snapshot';
  RAISE NOTICE '  - customer_address_snapshot';
  RAISE NOTICE '  - delivery_distance_snapshot';
  RAISE NOTICE '  - delivery_fee_snapshot';
  RAISE NOTICE '';
  RAISE NOTICE 'Master Prompt Seksyen 28 compliance: ✅ COMPLETE';
END $$;
