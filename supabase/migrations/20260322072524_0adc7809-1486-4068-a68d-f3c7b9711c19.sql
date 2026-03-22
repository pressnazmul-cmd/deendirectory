
CREATE TABLE public.prayer_times (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institute_id uuid NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
  fajr text NOT NULL DEFAULT '',
  dhuhr text NOT NULL DEFAULT '',
  asr text NOT NULL DEFAULT '',
  maghrib text NOT NULL DEFAULT '',
  isha text NOT NULL DEFAULT '',
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(institute_id)
);

ALTER TABLE public.prayer_times ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read prayer_times" ON public.prayer_times FOR SELECT TO public USING (true);
CREATE POLICY "Auth users can insert prayer_times" ON public.prayer_times FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update prayer_times" ON public.prayer_times FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth users can delete prayer_times" ON public.prayer_times FOR DELETE TO authenticated USING (true);
