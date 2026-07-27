
CREATE TABLE public.discounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.discounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage discounts" ON public.discounts FOR ALL USING (is_admin());
CREATE POLICY "Admins can view discounts" ON public.discounts FOR SELECT USING (is_admin());
