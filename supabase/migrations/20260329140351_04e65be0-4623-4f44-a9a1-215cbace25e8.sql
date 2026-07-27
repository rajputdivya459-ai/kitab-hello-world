
-- Create courses table
CREATE TABLE public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage courses" ON public.courses FOR ALL USING (is_admin());
CREATE POLICY "Anyone can view courses" ON public.courses FOR SELECT USING (true);

-- Create years table
CREATE TABLE public.years (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.years ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage years" ON public.years FOR ALL USING (is_admin());
CREATE POLICY "Anyone can view years" ON public.years FOR SELECT USING (true);

-- Create semesters table
CREATE TABLE public.semesters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  year_id uuid NOT NULL REFERENCES public.years(id) ON DELETE CASCADE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.semesters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage semesters" ON public.semesters FOR ALL USING (is_admin());
CREATE POLICY "Anyone can view semesters" ON public.semesters FOR SELECT USING (true);

-- Add FK columns to students (keep old text columns for now to avoid data loss)
ALTER TABLE public.students
  ADD COLUMN course_id uuid REFERENCES public.courses(id),
  ADD COLUMN year_id uuid REFERENCES public.years(id),
  ADD COLUMN semester_id uuid REFERENCES public.semesters(id);
