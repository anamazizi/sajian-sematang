-- Migration untuk product_likes table dan total sales calculation
-- Tarikh: 31 Ogos 2026

-- 1. Create product_likes table
CREATE TABLE IF NOT EXISTS public.product_likes (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  
  -- Ensure one like per user per product
  UNIQUE(product_id, user_id)
);

-- 2. Enable RLS
ALTER TABLE public.product_likes ENABLE ROW LEVEL SECURITY;

-- 3. Create policies for product_likes
-- Customer can view all likes (count)
CREATE POLICY "Customers can view product likes" 
  ON public.product_likes
  FOR SELECT 
  USING (true);

-- Customer can insert/delete their own likes
CREATE POLICY "Customers can manage their likes" 
  ON public.product_likes
  FOR ALL
  USING (auth.uid() = user_id);

-- Admin/Staff/Seller can view all
CREATE POLICY "Admin can manage all likes" 
  ON public.product_likes
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'staff')
    )
  );

-- 4. Create function untuk mengira total likes per product
CREATE OR REPLACE FUNCTION public.get_product_total_likes(product_uuid uuid)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COUNT(*)::integer 
  FROM public.product_likes 
  WHERE product_id = product_uuid;
$$;

-- 5. Create function untuk mengira total sold per product
-- (Berdasarkan order_items yang COMPLETED)
CREATE OR REPLACE FUNCTION public.get_product_total_sold(product_uuid uuid)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(SUM(oi.quantity), 0)::integer
  FROM public.order_items oi
  JOIN public.orders o ON oi.order_id = o.id
  WHERE oi.product_id = product_uuid
    AND o.status = 'Completed';
$$;

-- 6. Create view untuk product stats
CREATE OR REPLACE VIEW public.product_stats AS
SELECT 
  p.id,
  p.name,
  p.seller_id,
  p.is_active,
  public.get_product_total_likes(p.id) as total_likes,
  public.get_product_total_sold(p.id) as total_sold
FROM public.products p;

-- 7. Grant permissions
GRANT SELECT ON public.product_stats TO authenticated;
GRANT SELECT ON public.product_stats TO anon;