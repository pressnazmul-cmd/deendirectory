
CREATE TABLE public.stories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

-- Anyone can read approved stories
CREATE POLICY "Anyone can read approved stories"
ON public.stories FOR SELECT
USING (status = 'approved');

-- Logged in users can read their own stories (any status)
CREATE POLICY "Users can read own stories"
ON public.stories FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Logged in users can create stories
CREATE POLICY "Users can create stories"
ON public.stories FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Super admins can read all stories
CREATE POLICY "Super admins can read all stories"
ON public.stories FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Super admins can update any story (approve/reject/edit)
CREATE POLICY "Super admins can update stories"
ON public.stories FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Super admins can delete stories
CREATE POLICY "Super admins can delete stories"
ON public.stories FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_stories_updated_at
BEFORE UPDATE ON public.stories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
