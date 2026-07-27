
-- Fees collection table
CREATE TABLE public.fees_collection (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  amount numeric NOT NULL DEFAULT 0,
  date date NOT NULL DEFAULT CURRENT_DATE,
  student_name text,
  course text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.fees_collection ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage fees" ON public.fees_collection FOR ALL USING (is_admin());
CREATE POLICY "Admins can view fees" ON public.fees_collection FOR SELECT USING (is_admin());

-- Expenses table
CREATE TABLE public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  date date NOT NULL DEFAULT CURRENT_DATE,
  category text NOT NULL DEFAULT 'General',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage expenses" ON public.expenses FOR ALL USING (is_admin());
CREATE POLICY "Admins can view expenses" ON public.expenses FOR SELECT USING (is_admin());

-- Salaries table
CREATE TABLE public.salaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_name text NOT NULL,
  designation text,
  salary_amount numeric NOT NULL DEFAULT 0,
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'unpaid',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.salaries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage salaries" ON public.salaries FOR ALL USING (is_admin());
CREATE POLICY "Admins can view salaries" ON public.salaries FOR SELECT USING (is_admin());

-- Pending fees setting (manual input by admin)
INSERT INTO public.site_settings (setting_key, setting_value, setting_type, category, label)
VALUES ('pending_fees', '0', 'text', 'finance', 'Pending Fees Amount')
ON CONFLICT DO NOTHING;
