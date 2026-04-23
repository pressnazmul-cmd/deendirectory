CREATE OR REPLACE FUNCTION public.can_add_order_items(_order_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.orders o
    WHERE o.id = _order_id
      AND (o.buyer_id IS NULL OR o.buyer_id = auth.uid())
  )
$$;

DROP POLICY IF EXISTS "Anyone can insert order items for guest or own orders" ON public.order_items;

CREATE POLICY "Anyone can insert order items for guest or own orders"
ON public.order_items
FOR INSERT
TO public
WITH CHECK (public.can_add_order_items(order_id));