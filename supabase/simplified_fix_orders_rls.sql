-- Drop only the new policies we want to create (if they exist)
DROP POLICY IF EXISTS "orders_select_admin" ON public.orders;
DROP POLICY IF EXISTS "orders_select_staff" ON public.orders;
DROP POLICY IF EXISTS "orders_select_seller" ON public.orders;
DROP POLICY IF EXISTS "orders_select_customer" ON public.orders;

DROP POLICY IF EXISTS "order_items_select_admin" ON public.order_items;
DROP POLICY IF EXISTS "order_items_select_staff" ON public.order_items;
DROP POLICY IF EXISTS "order_items_select_seller" ON public.order_items;
DROP POLICY IF EXISTS "order_items_select_customer" ON public.order_items;