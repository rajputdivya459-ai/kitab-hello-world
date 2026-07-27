
-- ─── Enums ───
DO $$ BEGIN
  CREATE TYPE public.staff_type AS ENUM ('teaching','non_teaching');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.staff_role AS ENUM ('teacher','principal','coordinator','accountant','clerk','receptionist','librarian','other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── 1. staff ───
CREATE TABLE IF NOT EXISTS public.staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  staff_code text UNIQUE,
  staff_type public.staff_type NOT NULL DEFAULT 'teaching',
  role public.staff_role NOT NULL DEFAULT 'teacher',
  qualification text,
  experience_years int DEFAULT 0,
  email text,
  phone text,
  address text,
  joining_date date DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'active',
  photo_url text,
  auth_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT staff_status_check CHECK (status IN ('active','inactive'))
);
CREATE INDEX IF NOT EXISTS idx_staff_auth_user ON public.staff(auth_user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff TO authenticated;
GRANT ALL ON public.staff TO service_role;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage staff" ON public.staff;
CREATE POLICY "Admins manage staff" ON public.staff FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Staff view own row" ON public.staff;
CREATE POLICY "Staff view own row" ON public.staff FOR SELECT USING (auth_user_id = auth.uid());
DROP TRIGGER IF EXISTS trg_staff_updated_at ON public.staff;
CREATE TRIGGER trg_staff_updated_at BEFORE UPDATE ON public.staff
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ─── 2. teacher_assignments ───
CREATE TABLE IF NOT EXISTS public.teacher_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  section_id uuid REFERENCES public.sections(id) ON DELETE CASCADE,
  subject_id uuid REFERENCES public.subjects(id) ON DELETE CASCADE,
  is_class_teacher boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS teacher_assignments_unique
  ON public.teacher_assignments(staff_id, class_id, COALESCE(section_id,'00000000-0000-0000-0000-000000000000'::uuid), COALESCE(subject_id,'00000000-0000-0000-0000-000000000000'::uuid));
CREATE INDEX IF NOT EXISTS idx_ta_staff ON public.teacher_assignments(staff_id);
CREATE INDEX IF NOT EXISTS idx_ta_class ON public.teacher_assignments(class_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.teacher_assignments TO authenticated;
GRANT ALL ON public.teacher_assignments TO service_role;
ALTER TABLE public.teacher_assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage assignments" ON public.teacher_assignments;
CREATE POLICY "Admins manage assignments" ON public.teacher_assignments FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Teacher views own assignments" ON public.teacher_assignments;
CREATE POLICY "Teacher views own assignments" ON public.teacher_assignments FOR SELECT
USING (staff_id IN (SELECT id FROM public.staff WHERE auth_user_id = auth.uid()));

-- ─── 3. staff_attendance ───
CREATE TABLE IF NOT EXISTS public.staff_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'present',
  remarks text,
  marked_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT staff_attendance_status_check CHECK (status IN ('present','absent','leave','half_day')),
  CONSTRAINT staff_attendance_unique UNIQUE (staff_id, date)
);
CREATE INDEX IF NOT EXISTS idx_sa_date ON public.staff_attendance(date);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff_attendance TO authenticated;
GRANT ALL ON public.staff_attendance TO service_role;
ALTER TABLE public.staff_attendance ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage staff attendance" ON public.staff_attendance;
CREATE POLICY "Admins manage staff attendance" ON public.staff_attendance FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Staff view own attendance" ON public.staff_attendance;
CREATE POLICY "Staff view own attendance" ON public.staff_attendance FOR SELECT
USING (staff_id IN (SELECT id FROM public.staff WHERE auth_user_id = auth.uid()));

-- ─── 4. salary_structures ───
CREATE TABLE IF NOT EXISTS public.salary_structures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  basic numeric NOT NULL DEFAULT 0,
  hra numeric NOT NULL DEFAULT 0,
  allowances numeric NOT NULL DEFAULT 0,
  deductions numeric NOT NULL DEFAULT 0,
  effective_from date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ss_staff ON public.salary_structures(staff_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.salary_structures TO authenticated;
GRANT ALL ON public.salary_structures TO service_role;
ALTER TABLE public.salary_structures ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage salary structures" ON public.salary_structures;
CREATE POLICY "Admins manage salary structures" ON public.salary_structures FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Staff view own salary structure" ON public.salary_structures;
CREATE POLICY "Staff view own salary structure" ON public.salary_structures FOR SELECT
USING (staff_id IN (SELECT id FROM public.staff WHERE auth_user_id = auth.uid()));

-- ─── 5. salaries: link to staff ───
ALTER TABLE public.salaries ADD COLUMN IF NOT EXISTS staff_id uuid REFERENCES public.staff(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_salaries_staff ON public.salaries(staff_id);
DROP POLICY IF EXISTS "Staff view own salaries" ON public.salaries;
CREATE POLICY "Staff view own salaries" ON public.salaries FOR SELECT
USING (staff_id IS NOT NULL AND staff_id IN (SELECT id FROM public.staff WHERE auth_user_id = auth.uid()));

-- ─── 6. Helpers ───
CREATE OR REPLACE FUNCTION public.current_teacher_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.staff WHERE auth_user_id = auth.uid() LIMIT 1;
$$;
CREATE OR REPLACE FUNCTION public.current_teacher_class_ids()
RETURNS SETOF uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT DISTINCT class_id FROM public.teacher_assignments
  WHERE staff_id IN (SELECT id FROM public.staff WHERE auth_user_id = auth.uid());
$$;
CREATE OR REPLACE FUNCTION public.current_teacher_section_ids()
RETURNS SETOF uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT DISTINCT section_id FROM public.teacher_assignments
  WHERE staff_id IN (SELECT id FROM public.staff WHERE auth_user_id = auth.uid())
    AND section_id IS NOT NULL;
$$;
CREATE OR REPLACE FUNCTION public.current_teacher_subject_ids()
RETURNS SETOF uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT DISTINCT subject_id FROM public.teacher_assignments
  WHERE staff_id IN (SELECT id FROM public.staff WHERE auth_user_id = auth.uid())
    AND subject_id IS NOT NULL;
$$;
CREATE OR REPLACE FUNCTION public.is_teacher()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'teacher');
$$;

-- ─── 7. Teacher access extensions ───
DROP POLICY IF EXISTS "Teachers view assigned students" ON public.students;
CREATE POLICY "Teachers view assigned students" ON public.students FOR SELECT
USING (public.is_teacher() AND (
  class_id IN (SELECT public.current_teacher_class_ids())
  OR (section_id IS NOT NULL AND section_id IN (SELECT public.current_teacher_section_ids()))
));

DROP POLICY IF EXISTS "Teachers manage attendance for assigned" ON public.attendance;
CREATE POLICY "Teachers manage attendance for assigned" ON public.attendance FOR ALL
USING (public.is_teacher() AND (
  (class_id IS NOT NULL AND class_id IN (SELECT public.current_teacher_class_ids()))
  OR (section_id IS NOT NULL AND section_id IN (SELECT public.current_teacher_section_ids()))
))
WITH CHECK (public.is_teacher() AND (
  (class_id IS NOT NULL AND class_id IN (SELECT public.current_teacher_class_ids()))
  OR (section_id IS NOT NULL AND section_id IN (SELECT public.current_teacher_section_ids()))
));

DROP POLICY IF EXISTS "Teachers manage marks for assigned subjects" ON public.marks;
CREATE POLICY "Teachers manage marks for assigned subjects" ON public.marks FOR ALL
USING (public.is_teacher() AND subject_id IN (SELECT public.current_teacher_subject_ids()))
WITH CHECK (public.is_teacher() AND subject_id IN (SELECT public.current_teacher_subject_ids()));

DROP POLICY IF EXISTS "Teachers manage homework for assigned" ON public.homework;
CREATE POLICY "Teachers manage homework for assigned" ON public.homework FOR ALL
USING (public.is_teacher() AND (
  class_id IN (SELECT public.current_teacher_class_ids())
  OR (section_id IS NOT NULL AND section_id IN (SELECT public.current_teacher_section_ids()))
))
WITH CHECK (public.is_teacher() AND (
  class_id IN (SELECT public.current_teacher_class_ids())
  OR (section_id IS NOT NULL AND section_id IN (SELECT public.current_teacher_section_ids()))
));

DROP POLICY IF EXISTS "Teachers manage class/section notices" ON public.notices;
CREATE POLICY "Teachers manage class/section notices" ON public.notices FOR ALL
USING (public.is_teacher() AND (
  (target_type = 'class' AND class_id IN (SELECT public.current_teacher_class_ids()))
  OR (target_type = 'section' AND section_id IN (SELECT public.current_teacher_section_ids()))
))
WITH CHECK (public.is_teacher() AND target_type IN ('class','section') AND (
  (target_type = 'class' AND class_id IN (SELECT public.current_teacher_class_ids()))
  OR (target_type = 'section' AND section_id IN (SELECT public.current_teacher_section_ids()))
));

-- ─── 8. Seed ───
INSERT INTO public.staff (full_name, staff_code, staff_type, role, qualification, experience_years, email, phone, joining_date, status) VALUES
  ('Raj Sharma',     'STF-001', 'teaching',     'teacher',     'M.Sc Mathematics, B.Ed', 8,  'raj.sharma@mgcm.ac.in',     '9876500001', '2018-06-01', 'active'),
  ('Anita Verma',    'STF-002', 'teaching',     'teacher',     'M.A English, B.Ed',      6,  'anita.verma@mgcm.ac.in',    '9876500002', '2020-04-15', 'active'),
  ('Suresh Patil',   'STF-003', 'teaching',     'teacher',     'M.Sc Science, B.Ed',     10, 'suresh.patil@mgcm.ac.in',   '9876500003', '2016-07-10', 'active'),
  ('Meena Joshi',    'STF-004', 'teaching',     'teacher',     'M.A History, B.Ed',      4,  'meena.joshi@mgcm.ac.in',    '9876500004', '2022-06-20', 'active'),
  ('Ramesh Kulkarni','STF-005', 'non_teaching', 'accountant',  'B.Com',                  12, 'ramesh.k@mgcm.ac.in',       '9876500005', '2014-03-01', 'active'),
  ('Priya Desai',    'STF-006', 'non_teaching', 'receptionist','HSC',                    3,  'priya.d@mgcm.ac.in',        '9876500006', '2023-01-10', 'active')
ON CONFLICT (staff_code) DO NOTHING;

INSERT INTO public.teacher_assignments (staff_id, class_id, section_id, subject_id, is_class_teacher)
SELECT s.id, sub.class_id, NULL, sub.id, false
FROM public.staff s
JOIN public.subjects sub ON (
  (s.staff_code = 'STF-001' AND sub.name ILIKE '%math%') OR
  (s.staff_code = 'STF-002' AND sub.name ILIKE '%english%') OR
  (s.staff_code = 'STF-003' AND sub.name ILIKE '%science%') OR
  (s.staff_code = 'STF-004' AND (sub.name ILIKE '%history%' OR sub.name ILIKE '%social%'))
)
ON CONFLICT DO NOTHING;
