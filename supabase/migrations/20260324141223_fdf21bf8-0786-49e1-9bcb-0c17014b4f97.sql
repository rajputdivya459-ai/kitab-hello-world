CREATE TABLE public.programs_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  icon text,
  is_active boolean NOT NULL DEFAULT true,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.programs_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view programs_activities" ON public.programs_activities FOR SELECT USING (true);
CREATE POLICY "Admins can manage programs_activities" ON public.programs_activities FOR ALL USING (is_admin());

ALTER TABLE public.homepage_content ADD COLUMN IF NOT EXISTS mobile_image_url text;