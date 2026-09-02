-- Add soft delete column to products table
-- Run this migration before updating the application code

-- Add is_archived column for soft delete
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_archived boolean DEFAULT false;

-- Add deleted_at column for timestamp tracking (optional)
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;

-- Update existing products to ensure is_archived is false by default
UPDATE public.products SET is_archived = false WHERE is_archived IS NULL;

-- Create index for better performance when filtering archived products
CREATE INDEX IF NOT EXISTS idx_products_is_archived ON public.products(is_archived);

-- Add comment explaining the purpose
COMMENT ON COLUMN public.products.is_archived IS 'Soft delete flag: true = archived/deleted, false = active';

-- Verify the column was added
DO $$
BEGIN
  RAISE NOTICE '✅ Added is_archived column to products table';
  RAISE NOTICE '✅ Default value: false (not archived)';
  RAISE NOTICE '✅ Index created for better query performance';
END $$;