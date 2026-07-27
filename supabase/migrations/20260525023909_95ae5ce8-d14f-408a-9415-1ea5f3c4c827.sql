
-- 1. Extend role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'parent';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'student';

-- 2. Extend students table
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS parent_name text,
  ADD COLUMN IF NOT EXISTS parent_phone text,
  ADD COLUMN IF NOT EXISTS parent_email text,
  ADD COLUMN IF NOT EXISTS student_login_email text,
  ADD COLUMN IF NOT EXISTS auth_user_id uuid,
  ADD COLUMN IF NOT EXISTS parent_auth_user_id uuid,
  ADD COLUMN IF NOT EXISTS profile_image_url text;

CREATE INDEX IF NOT EXISTS idx_students_auth_user_id ON public.students(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_students_parent_auth_user_id ON public.students(parent_auth_user_id);

-- 3. Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  target_type text NOT NULL CHECK (target_type IN ('all','class','section','student')),
  class_id uuid,
  section_id uuid,
  student_id uuid,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.notification_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id uuid NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  read_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (notification_id, user_id)
);
ALTER TABLE public.notification_reads ENABLE ROW LEVEL SECURITY;

-- 4. Attendance
CREATE TABLE IF NOT EXISTS public.attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'present' CHECK (status IN ('present','absent','late','excused')),
  remarks text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, date)
);
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON public.attendance(student_id);

-- 5. Helper: get current user's linked student id (as student) or children ids (as parent)
CREATE OR REPLACE FUNCTION public.current_student_ids()
RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.students
  WHERE auth_user_id = auth.uid() OR parent_auth_user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.current_user_class_ids()
RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT DISTINCT class_id FROM public.students
  WHERE (auth_user_id = auth.uid() OR parent_auth_user_id = auth.uid())
    AND class_id IS NOT NULL;
$$;

CREATE OR REPLACE FUNCTION public.current_user_section_ids()
RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT DISTINCT section_id FROM public.students
  WHERE (auth_user_id = auth.uid() OR parent_auth_user_id = auth.uid())
    AND section_id IS NOT NULL;
$$;

-- 6. RLS: students - add parent/student SELECT
CREATE POLICY "Parents and students can view their linked rows"
ON public.students FOR SELECT
USING (auth_user_id = auth.uid() OR parent_auth_user_id = auth.uid());

-- 7. RLS: fees_collection - parent/student view scoped by student_id
CREATE POLICY "Parents and students can view their fees"
ON public.fees_collection FOR SELECT
USING (student_id IN (SELECT public.current_student_ids()));

-- 8. RLS: discounts
CREATE POLICY "Parents and students can view their discounts"
ON public.discounts FOR SELECT
USING (student_id IN (SELECT public.current_student_ids()));

-- 9. RLS: attendance
CREATE POLICY "Admins manage attendance"
ON public.attendance FOR ALL
USING (is_admin());

CREATE POLICY "Parents and students can view their attendance"
ON public.attendance FOR SELECT
USING (student_id IN (SELECT public.current_student_ids()));

-- 10. RLS: notifications
CREATE POLICY "Admins manage notifications"
ON public.notifications FOR ALL
USING (is_admin());

CREATE POLICY "Authenticated users can view targeted notifications"
ON public.notifications FOR SELECT
USING (
  auth.uid() IS NOT NULL AND (
    target_type = 'all'
    OR (target_type = 'class' AND class_id IN (SELECT public.current_user_class_ids()))
    OR (target_type = 'section' AND section_id IN (SELECT public.current_user_section_ids()))
    OR (target_type = 'student' AND student_id IN (SELECT public.current_student_ids()))
    OR is_admin()
  )
);

-- 11. RLS: notification_reads
CREATE POLICY "Users manage their own notification reads"
ON public.notification_reads FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
