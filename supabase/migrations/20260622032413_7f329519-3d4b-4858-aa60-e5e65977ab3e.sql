
-- ENUMS
CREATE TYPE public.leave_status AS ENUM ('pending','approved','rejected');
CREATE TYPE public.staff_leave_type AS ENUM ('casual','sick','earned','unpaid','other');
CREATE TYPE public.calendar_event_type AS ENUM ('holiday','exam','event','meeting','vacation');
CREATE TYPE public.inquiry_status AS ENUM ('new','contacted','follow_up','interested','admitted','closed');
CREATE TYPE public.reminder_category AS ENUM ('fee','admission','staff_doc','transport','exam','general');
CREATE TYPE public.reminder_priority AS ENUM ('low','medium','high');
CREATE TYPE public.reminder_status AS ENUM ('pending','completed');

-- STUDENT LEAVES
CREATE TABLE public.student_leaves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  from_date date NOT NULL,
  to_date date NOT NULL,
  reason text NOT NULL,
  status public.leave_status NOT NULL DEFAULT 'pending',
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_leaves TO authenticated;
GRANT ALL ON public.student_leaves TO service_role;
ALTER TABLE public.student_leaves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin manages student leaves" ON public.student_leaves FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Owners view student leaves" ON public.student_leaves FOR SELECT USING (student_id IN (SELECT public.current_student_ids()));
CREATE POLICY "Owners create student leaves" ON public.student_leaves FOR INSERT WITH CHECK (student_id IN (SELECT public.current_student_ids()));

-- STAFF LEAVES
CREATE TABLE public.staff_leaves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  leave_type public.staff_leave_type NOT NULL DEFAULT 'casual',
  from_date date NOT NULL,
  to_date date NOT NULL,
  reason text NOT NULL,
  status public.leave_status NOT NULL DEFAULT 'pending',
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff_leaves TO authenticated;
GRANT ALL ON public.staff_leaves TO service_role;
ALTER TABLE public.staff_leaves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin manages staff leaves" ON public.staff_leaves FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Teacher views own leaves" ON public.staff_leaves FOR SELECT USING (staff_id = public.current_teacher_id());
CREATE POLICY "Teacher creates own leaves" ON public.staff_leaves FOR INSERT WITH CHECK (staff_id = public.current_teacher_id());

-- CALENDAR EVENTS
CREATE TABLE public.calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  event_type public.calendar_event_type NOT NULL DEFAULT 'event',
  start_date date NOT NULL,
  end_date date NOT NULL,
  class_id uuid REFERENCES public.classes(id) ON DELETE SET NULL,
  is_public boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.calendar_events TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.calendar_events TO authenticated;
GRANT ALL ON public.calendar_events TO service_role;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads public events" ON public.calendar_events FOR SELECT USING (is_public = true);
CREATE POLICY "Admin manages calendar" ON public.calendar_events FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ADMISSION INQUIRIES
CREATE TABLE public.admission_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_name text NOT NULL,
  parent_name text,
  phone text,
  email text,
  interested_class text,
  source text,
  notes text,
  status public.inquiry_status NOT NULL DEFAULT 'new',
  next_follow_up_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admission_inquiries TO authenticated;
GRANT ALL ON public.admission_inquiries TO service_role;
ALTER TABLE public.admission_inquiries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin manages inquiries" ON public.admission_inquiries FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
-- Public form submission allowed:
CREATE POLICY "Anyone submits inquiry" ON public.admission_inquiries FOR INSERT TO anon, authenticated WITH CHECK (true);
GRANT INSERT ON public.admission_inquiries TO anon;

-- VISITORS
CREATE TABLE public.visitors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_name text NOT NULL,
  phone text,
  purpose text,
  student_id uuid REFERENCES public.students(id) ON DELETE SET NULL,
  entry_time timestamptz NOT NULL DEFAULT now(),
  exit_time timestamptz,
  remarks text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.visitors TO authenticated;
GRANT ALL ON public.visitors TO service_role;
ALTER TABLE public.visitors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin manages visitors" ON public.visitors FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- REMINDERS
CREATE TABLE public.reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category public.reminder_category NOT NULL DEFAULT 'general',
  due_date date NOT NULL,
  priority public.reminder_priority NOT NULL DEFAULT 'medium',
  status public.reminder_status NOT NULL DEFAULT 'pending',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reminders TO authenticated;
GRANT ALL ON public.reminders TO service_role;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin manages reminders" ON public.reminders FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- updated_at triggers
CREATE TRIGGER trg_student_leaves_upd BEFORE UPDATE ON public.student_leaves FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_staff_leaves_upd BEFORE UPDATE ON public.staff_leaves FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_calendar_events_upd BEFORE UPDATE ON public.calendar_events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_admission_inquiries_upd BEFORE UPDATE ON public.admission_inquiries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_visitors_upd BEFORE UPDATE ON public.visitors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_reminders_upd BEFORE UPDATE ON public.reminders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- SEED
INSERT INTO public.calendar_events (title, description, event_type, start_date, end_date) VALUES
  ('Republic Day','National holiday','holiday', (date_trunc('year', now()) + interval '25 days')::date, (date_trunc('year', now()) + interval '25 days')::date),
  ('Independence Day','National holiday','holiday','2026-08-15','2026-08-15'),
  ('Annual Sports Day','Inter-house sports','event', (now() + interval '20 days')::date, (now() + interval '20 days')::date),
  ('Parent Teacher Meeting','Term review','meeting', (now() + interval '10 days')::date, (now() + interval '10 days')::date),
  ('Summer Vacation','School closed','vacation','2026-05-15','2026-06-15');

INSERT INTO public.admission_inquiries (student_name, parent_name, phone, interested_class, source, status, next_follow_up_date) VALUES
  ('Ravi Kumar','Suresh Kumar','9876543210','Class 5','Website','new',(now() + interval '2 days')::date),
  ('Anita Sharma','Mahesh Sharma','9876543211','Class 8','Referral','contacted',(now() + interval '5 days')::date),
  ('Rohan Verma','Anil Verma','9876543212','Class 1','Walk-in','follow_up',(now() - interval '1 day')::date);

INSERT INTO public.reminders (title, description, category, due_date, priority, status) VALUES
  ('Collect overdue fees','Follow up with defaulter parents','fee',(now() + interval '3 days')::date,'high','pending'),
  ('Renew transport vehicle insurance','Vehicle MH-12-AB-1234','transport',(now() + interval '15 days')::date,'medium','pending'),
  ('Prepare exam date sheet','Term 2 exams','exam',(now() + interval '7 days')::date,'high','pending'),
  ('Staff document verification','Aadhar copies for new joiners','staff_doc',(now() - interval '2 days')::date,'medium','pending');

INSERT INTO public.visitors (visitor_name, phone, purpose, entry_time, exit_time) VALUES
  ('Mr. Sharma','9876500001','Meet Principal', now() - interval '3 hours', now() - interval '2 hours'),
  ('Mrs. Patel','9876500002','Admission inquiry', now() - interval '1 hour', NULL);
