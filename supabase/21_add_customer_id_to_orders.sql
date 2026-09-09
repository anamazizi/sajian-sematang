-- Add customer_id column to orders table for linking orders to authenticated users
-- This ensures orders can be retrieved by customer ID, and also fallback to phone matching

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES auth.users(id);

-- Update existing orders: set customer_id = created_by where created_by is not null
UPDATE public.orders SET customer_id = created_by WHERE created_by IS NOT NULL AND customer_id IS NULL;

-- Add comment
COMMENT ON COLUMN public.orders.customer_id IS 'Link to authenticated user (auth.users.id). If null, order was created by guest.';

-- Optional index for faster customer order lookups
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);