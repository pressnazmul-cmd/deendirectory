ALTER TABLE public.orders
ALTER COLUMN buyer_id DROP NOT NULL;

DROP POLICY IF EXISTS "Buyers create orders" ON public.orders;
DROP POLICY IF EXISTS "Buyers view own orders" ON public.orders;
DROP POLICY IF EXISTS "Buyers insert order items" ON public.order_items;

CREATE POLICY "Anyone can create guest or own orders"
ON public.orders
FOR INSERT
TO public
WITH CHECK (buyer_id IS NULL OR auth.uid() = buyer_id);

CREATE POLICY "Buyers view own orders"
ON public.orders
FOR SELECT
TO authenticated
USING (auth.uid() = buyer_id);

CREATE POLICY "Anyone can insert order items for guest or own orders"
ON public.order_items
FOR INSERT
TO public
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.orders o
    WHERE o.id = order_items.order_id
      AND (o.buyer_id IS NULL OR o.buyer_id = auth.uid())
  )
);