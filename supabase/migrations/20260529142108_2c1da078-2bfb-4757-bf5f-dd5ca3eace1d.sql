
CREATE TABLE public.notices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  attachment_url text,
  target_type text NOT NULL DEFAULT 'all' CHECK (target_type IN ('all','class','section','student')),
  class_id uuid,
  section_id uuid,
  student_id uuid,
  publish_date timestamptz NOT NULL DEFAULT now(),
  is_important boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_notices_publish_date ON public.notices(publish_date DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notices TO authenticated;
GRANT ALL ON public.notices TO service_role;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage notices" ON public.notices FOR ALL USING (is_admin());
CREATE POLICY "Targeted users view notices" ON public.notices FOR SELECT USING (
  auth.uid() IS NOT NULL AND (
    target_type = 'all'
    OR (target_type = 'class' AND class_id IN (SELECT current_user_class_ids()))
    OR (target_type = 'section' AND section_id IN (SELECT current_user_section_ids()))
    OR (target_type = 'student' AND student_id IN (SELECT current_student_ids()))
    OR is_admin()
  )
);

CREATE TABLE public.homework (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  subject text NOT NULL,
  class_id uuid NOT NULL,
  section_id uuid,
  attachment_url text,
  due_date date NOT NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_homework_due_date ON public.homework(due_date DESC);
CREATE INDEX idx_homework_class ON public.homework(class_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.homework TO authenticated;
GRANT ALL ON public.homework TO service_role;
ALTER TABLE public.homework ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage homework" ON public.homework FOR ALL USING (is_admin());
CREATE POLICY "Class members view homework" ON public.homework FOR SELECT USING (
  auth.uid() IS NOT NULL AND (
    is_admin()
    OR class_id IN (SELECT current_user_class_ids())
    OR (section_id IS NOT NULL AND section_id IN (SELECT current_user_section_ids()))
  )
);

CREATE TABLE public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  banner_image_url text,
  publish_date timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_announcements_publish_date ON public.announcements(publish_date DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.announcements TO authenticated;
GRANT ALL ON public.announcements TO service_role;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage announcements" ON public.announcements FOR ALL USING (is_admin());
CREATE POLICY "Authenticated view announcements" ON public.announcements FOR SELECT USING (auth.uid() IS NOT NULL);

INSERT INTO public.announcements (title, message, banner_image_url) VALUES
  ('Winter Vacation Notice', 'School will remain closed from 24th Dec to 2nd Jan for winter vacation. Classes resume on 3rd January.', 'https://images.unsplash.com/photo-1483347756197-71ef80e95f73?w=800'),
  ('Annual Day Celebration', 'Join us on 15th February for our Annual Day celebration. All parents are cordially invited.', 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800'),
  ('Parent-Teacher Meeting', 'PTM scheduled on Saturday, 10 AM onwards. Please confirm your attendance with the class teacher.', null);

INSERT INTO public.notices (title, message, target_type, is_important) VALUES
  ('Fee Payment Reminder', 'Kindly clear all pending fee dues by the 10th of this month to avoid late charges.', 'all', true),
  ('Sports Day Registration Open', 'Students interested in participating in Sports Day events should register with their class teacher by Friday.', 'all', false),
  ('Library Hours Extended', 'The school library will now remain open until 5 PM on weekdays for senior students.', 'all', false);

INSERT INTO public.homework (title, description, subject, class_id, section_id, due_date)
SELECT 
  'Chapter ' || rn || ' Exercises',
  'Complete the chapter-end exercises and submit in your notebook. Read the next chapter in advance.',
  CASE rn % 4 WHEN 0 THEN 'Mathematics' WHEN 1 THEN 'English' WHEN 2 THEN 'Science' ELSE 'Social Studies' END,
  class_id,
  section_id,
  (CURRENT_DATE + ((rn % 7 + 1) || ' days')::interval)::date
FROM (
  SELECT c.id AS class_id, s.id AS section_id, row_number() OVER () AS rn
  FROM public.classes c
  LEFT JOIN public.sections s ON s.class_id = c.id
  WHERE c.is_active = true
  LIMIT 20
) t;
