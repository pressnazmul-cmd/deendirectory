
-- Story likes table
CREATE TABLE public.story_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(story_id, user_id)
);

ALTER TABLE public.story_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read story likes" ON public.story_likes FOR SELECT TO public USING (true);
CREATE POLICY "Auth users can like stories" ON public.story_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove own likes" ON public.story_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_story_likes_story_id ON public.story_likes(story_id);

-- Story comments table
CREATE TABLE public.story_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.story_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read story comments" ON public.story_comments FOR SELECT TO public USING (true);
CREATE POLICY "Auth users can create comments" ON public.story_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON public.story_comments FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Super admins can delete any comment" ON public.story_comments FOR DELETE TO authenticated USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE INDEX idx_story_comments_story_id ON public.story_comments(story_id);
