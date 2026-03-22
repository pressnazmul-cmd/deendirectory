ALTER TABLE public.institutes DROP CONSTRAINT institutes_type_check;
ALTER TABLE public.institutes ADD CONSTRAINT institutes_type_check CHECK (type IN ('School', 'College', 'Madrasa', 'Mosque'));