
-- EXAMS
CREATE TABLE public.exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  exam_type text NOT NULL DEFAULT 'unit_test',
  class_id uuid NOT NULL,
  section_id uuid,
  start_date date,
  end_date date,
  academic_year text NOT NULL DEFAULT to_char(now(), 'YYYY'),
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.exams TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.exams TO authenticated;
GRANT ALL ON public.exams TO service_role;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view exams" ON public.exams FOR SELECT USING (true);
CREATE POLICY "Admins manage exams" ON public.exams FOR ALL USING (is_admin());

-- SUBJECTS (class-wise)
CREATE TABLE public.subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  class_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (class_id, name)
);
GRANT SELECT ON public.subjects TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.subjects TO authenticated;
GRANT ALL ON public.subjects TO service_role;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view subjects" ON public.subjects FOR SELECT USING (true);
CREATE POLICY "Admins manage subjects" ON public.subjects FOR ALL USING (is_admin());

-- EXAM_SUBJECTS
CREATE TABLE public.exam_subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  max_marks numeric NOT NULL DEFAULT 100,
  passing_marks numeric NOT NULL DEFAULT 33,
  UNIQUE (exam_id, subject_id)
);
GRANT SELECT ON public.exam_subjects TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.exam_subjects TO authenticated;
GRANT ALL ON public.exam_subjects TO service_role;
ALTER TABLE public.exam_subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view exam_subjects" ON public.exam_subjects FOR SELECT USING (true);
CREATE POLICY "Admins manage exam_subjects" ON public.exam_subjects FOR ALL USING (is_admin());

-- MARKS
CREATE TABLE public.marks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  student_id uuid NOT NULL,
  marks_obtained numeric NOT NULL DEFAULT 0,
  remarks text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (exam_id, subject_id, student_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marks TO authenticated;
GRANT ALL ON public.marks TO service_role;
ALTER TABLE public.marks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage marks" ON public.marks FOR ALL USING (is_admin());
CREATE POLICY "Parents/students view own published marks" ON public.marks FOR SELECT
USING (
  student_id IN (SELECT current_student_ids())
  AND exam_id IN (SELECT id FROM public.exams WHERE is_published = true)
);

CREATE INDEX idx_marks_exam_student ON public.marks(exam_id, student_id);
CREATE INDEX idx_exams_class ON public.exams(class_id);
CREATE INDEX idx_subjects_class ON public.subjects(class_id);

CREATE TRIGGER trg_marks_updated_at
BEFORE UPDATE ON public.marks
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
