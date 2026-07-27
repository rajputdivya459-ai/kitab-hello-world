
-- Add institution_type to courses (default 'college' for backward compat)
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS institution_type text NOT NULL DEFAULT 'college';

-- Create classes table (school structure)
CREATE TABLE public.classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create sections table (school structure)
CREATE TABLE public.sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  class_id uuid REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Add class_id and section_id to students
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS class_id uuid NULL;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS section_id uuid NULL;

-- RLS for classes
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage classes" ON public.classes FOR ALL USING (is_admin());
CREATE POLICY "Anyone can view classes" ON public.classes FOR SELECT USING (true);

-- RLS for sections
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage sections" ON public.sections FOR ALL USING (is_admin());
CREATE POLICY "Anyone can view sections" ON public.sections FOR SELECT USING (true);
