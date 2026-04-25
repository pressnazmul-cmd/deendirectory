CREATE OR REPLACE FUNCTION public.find_order_by_prefix(_prefix text)
RETURNS SETOF public.orders
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.orders
  WHERE id::text ILIKE _prefix || '%'
  ORDER BY created_at DESC
  LIMIT 2;
$$;

GRANT EXECUTE ON FUNCTION public.find_order_by_prefix(text) TO anon, authenticated;