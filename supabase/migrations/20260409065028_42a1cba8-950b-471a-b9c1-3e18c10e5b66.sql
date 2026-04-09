
CREATE TABLE public.story_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.story_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read story categories"
ON public.story_categories FOR SELECT
USING (true);

CREATE POLICY "Super admins can manage story categories"
ON public.story_categories FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

ALTER TABLE public.stories ADD COLUMN category_id UUID REFERENCES public.story_categories(id) ON DELETE SET NULL;
