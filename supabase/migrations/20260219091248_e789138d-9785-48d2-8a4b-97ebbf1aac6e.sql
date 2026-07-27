
-- Create social_links table
CREATE TABLE public.social_links (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  platform_name text NOT NULL,
  url text,
  icon text,
  order_index integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.social_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view social links" ON public.social_links FOR SELECT USING (true);
CREATE POLICY "Admins can manage social links" ON public.social_links FOR ALL USING (is_admin());

CREATE TRIGGER update_social_links_updated_at
  BEFORE UPDATE ON public.social_links
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default social links
INSERT INTO public.social_links (platform_name, url, icon, order_index) VALUES
  ('Facebook', '', 'facebook', 1),
  ('Instagram', '', 'instagram', 2),
  ('Twitter', '', 'twitter', 3),
  ('LinkedIn', '', 'linkedin', 4),
  ('YouTube', '', 'youtube', 5);
