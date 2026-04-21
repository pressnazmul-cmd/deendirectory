-- Advertisements table
CREATE TABLE public.advertisements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  image_url TEXT NOT NULL,
  link_url TEXT,
  placement TEXT NOT NULL DEFAULT 'homepage', -- 'homepage', 'stories', 'browse', 'all'
  ad_type TEXT NOT NULL DEFAULT 'banner', -- 'banner', 'card'
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ,
  views_count INTEGER NOT NULL DEFAULT 0,
  clicks_count INTEGER NOT NULL DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.advertisements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active ads"
ON public.advertisements FOR SELECT
TO public
USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

CREATE POLICY "Admins can view all ads"
ON public.advertisements FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert ads"
ON public.advertisements FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update ads"
ON public.advertisements FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete ads"
ON public.advertisements FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_advertisements_updated_at
BEFORE UPDATE ON public.advertisements
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Tracking RPC functions (so anyone can increment counters without UPDATE policy)
CREATE OR REPLACE FUNCTION public.increment_ad_view(_ad_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.advertisements SET views_count = views_count + 1 WHERE id = _ad_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_ad_click(_ad_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.advertisements SET clicks_count = clicks_count + 1 WHERE id = _ad_id;
END;
$$;

-- Products table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(12,2),
  image_url TEXT,
  whatsapp_number TEXT,
  phone_number TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active products"
ON public.products FOR SELECT
TO public
USING (is_active = true);

CREATE POLICY "Owners can view own products"
ON public.products FOR SELECT
TO authenticated
USING (auth.uid() = seller_id);

CREATE POLICY "Admins can view all products"
ON public.products FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Logged in users can create products"
ON public.products FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Owners can update own products"
ON public.products FOR UPDATE
TO authenticated
USING (auth.uid() = seller_id);

CREATE POLICY "Admins can update any product"
ON public.products FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Owners can delete own products"
ON public.products FOR DELETE
TO authenticated
USING (auth.uid() = seller_id);

CREATE POLICY "Admins can delete any product"
ON public.products FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage buckets for ads and products
INSERT INTO storage.buckets (id, name, public) VALUES ('ads', 'ads', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('products', 'products', true) ON CONFLICT DO NOTHING;

CREATE POLICY "Public read ads bucket"
ON storage.objects FOR SELECT
USING (bucket_id = 'ads');

CREATE POLICY "Admins manage ads bucket"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'ads' AND (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role)))
WITH CHECK (bucket_id = 'ads' AND (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role)));

CREATE POLICY "Public read products bucket"
ON storage.objects FOR SELECT
USING (bucket_id = 'products');

CREATE POLICY "Auth users upload products"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'products');

CREATE POLICY "Users manage own product files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'products' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own product files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'products' AND (auth.uid()::text = (storage.foldername(name))[1] OR has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role)));