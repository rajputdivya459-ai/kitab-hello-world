
CREATE TABLE public.students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  course text NOT NULL,
  year integer NOT NULL DEFAULT 1,
  semester integer NOT NULL DEFAULT 1,
  admission_date date NOT NULL DEFAULT CURRENT_DATE,
  total_fees numeric NOT NULL DEFAULT 0,
  paid_fees numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage students" ON public.students FOR ALL USING (is_admin());
CREATE POLICY "Admins can view students" ON public.students FOR SELECT USING (is_admin());
