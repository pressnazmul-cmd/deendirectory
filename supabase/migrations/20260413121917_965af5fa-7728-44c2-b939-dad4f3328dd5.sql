CREATE POLICY "Anyone can read profiles for display"
ON public.profiles FOR SELECT
TO public
USING (true);