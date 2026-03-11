
-- Create tables for BD Education Directory

CREATE TABLE public.divisions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  division_name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.districts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  district_name TEXT NOT NULL,
  division_id UUID NOT NULL REFERENCES public.divisions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.upazilas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  upazila_name TEXT NOT NULL,
  district_id UUID NOT NULL REFERENCES public.districts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.unions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  union_name TEXT NOT NULL,
  upazila_id UUID NOT NULL REFERENCES public.upazilas(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.villages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  village_name TEXT NOT NULL,
  union_id UUID NOT NULL REFERENCES public.unions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.institutes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('School', 'College', 'Madrasa')),
  address TEXT,
  phone TEXT,
  village_id UUID NOT NULL REFERENCES public.villages(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.divisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upazilas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.villages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institutes ENABLE ROW LEVEL SECURITY;

-- Public read access for all tables
CREATE POLICY "Anyone can read divisions" ON public.divisions FOR SELECT USING (true);
CREATE POLICY "Anyone can read districts" ON public.districts FOR SELECT USING (true);
CREATE POLICY "Anyone can read upazilas" ON public.upazilas FOR SELECT USING (true);
CREATE POLICY "Anyone can read unions" ON public.unions FOR SELECT USING (true);
CREATE POLICY "Anyone can read villages" ON public.villages FOR SELECT USING (true);
CREATE POLICY "Anyone can read institutes" ON public.institutes FOR SELECT USING (true);

-- Authenticated users can manage all data (admin)
CREATE POLICY "Auth users can insert divisions" ON public.divisions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update divisions" ON public.divisions FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth users can delete divisions" ON public.divisions FOR DELETE TO authenticated USING (true);

CREATE POLICY "Auth users can insert districts" ON public.districts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update districts" ON public.districts FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth users can delete districts" ON public.districts FOR DELETE TO authenticated USING (true);

CREATE POLICY "Auth users can insert upazilas" ON public.upazilas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update upazilas" ON public.upazilas FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth users can delete upazilas" ON public.upazilas FOR DELETE TO authenticated USING (true);

CREATE POLICY "Auth users can insert unions" ON public.unions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update unions" ON public.unions FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth users can delete unions" ON public.unions FOR DELETE TO authenticated USING (true);

CREATE POLICY "Auth users can insert villages" ON public.villages FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update villages" ON public.villages FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth users can delete villages" ON public.villages FOR DELETE TO authenticated USING (true);

CREATE POLICY "Auth users can insert institutes" ON public.institutes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update institutes" ON public.institutes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth users can delete institutes" ON public.institutes FOR DELETE TO authenticated USING (true);

-- Indexes for performance
CREATE INDEX idx_districts_division ON public.districts(division_id);
CREATE INDEX idx_upazilas_district ON public.upazilas(district_id);
CREATE INDEX idx_unions_upazila ON public.unions(upazila_id);
CREATE INDEX idx_villages_union ON public.villages(union_id);
CREATE INDEX idx_institutes_village ON public.institutes(village_id);

-- Timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_institutes_updated_at
  BEFORE UPDATE ON public.institutes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
