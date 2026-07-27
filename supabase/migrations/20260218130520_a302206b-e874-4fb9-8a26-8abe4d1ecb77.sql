
-- Create site_settings table (key-value store for all site configuration)
CREATE TABLE public.site_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key text NOT NULL UNIQUE,
  setting_value text,
  setting_type text NOT NULL DEFAULT 'text',
  category text NOT NULL DEFAULT 'general',
  label text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read settings
CREATE POLICY "Anyone can view site settings"
ON public.site_settings FOR SELECT
USING (true);

-- Only admins can manage settings
CREATE POLICY "Admins can manage site settings"
ON public.site_settings FOR ALL
USING (is_admin());

-- Trigger for updated_at
CREATE TRIGGER update_site_settings_updated_at
BEFORE UPDATE ON public.site_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default settings
INSERT INTO public.site_settings (setting_key, setting_value, category, label, setting_type) VALUES
-- General
('college_name', 'Mahatma Gandhi Mahavidhyala Ashta', 'general', 'College Name', 'text'),
('tagline', 'Empowering Minds, Building Futures Since 1995', 'general', 'Tagline', 'text'),
('logo_url', 'https://i.pinimg.com/736x/cb/f7/3e/cbf73e976099716e0afe01b6eb78ff53.jpg', 'general', 'Logo URL', 'url'),
('favicon_url', '', 'general', 'Favicon URL', 'url'),
('established_year', '1995', 'general', 'Established Year', 'text'),
('address', 'Near Mukharji Ground, Kannod Road, Ashta, District Sehore, Madhya Pradesh', 'general', 'Address', 'textarea'),
('contact_email', 'info@mgmahavidhyala.ac.in', 'general', 'Contact Email', 'text'),
('contact_phone', '+91 7562-222XXX', 'general', 'Contact Phone', 'text'),
('footer_text', 'Affiliated to Barkatullah University, Bhopal. Empowering students with knowledge, skills, and values since 1995.', 'general', 'Footer Text', 'textarea'),
('copyright_text', 'Mahatma Gandhi Mahavidhyala, Ashta. All rights reserved.', 'general', 'Copyright Text', 'text'),
-- Hero
('hero_image_url', 'https://i.pinimg.com/736x/cb/f7/3e/cbf73e976099716e0afe01b6eb78ff53.jpg', 'hero', 'Hero Background Image', 'url'),
-- College Photo Section
('college_photo_desktop', 'https://i.pinimg.com/736x/cb/f7/3e/cbf73e976099716e0afe01b6eb78ff53.jpg', 'college_photo', 'Desktop Image URL', 'url'),
('college_photo_mobile', 'https://i.pinimg.com/736x/cb/f7/3e/cbf73e976099716e0afe01b6eb78ff53.jpg', 'college_photo', 'Mobile Image URL', 'url'),
('college_photo_title', 'Mahatma Gandhi Mahavidhyala Ashta', 'college_photo', 'Overlay Title', 'text'),
('college_photo_tagline', 'Empowering Minds, Building Futures Since 1995', 'college_photo', 'Overlay Tagline', 'text'),
-- Social Links
('social_facebook', '', 'social', 'Facebook URL', 'url'),
('social_instagram', '', 'social', 'Instagram URL', 'url'),
('social_twitter', '', 'social', 'Twitter/X URL', 'url'),
('social_linkedin', '', 'social', 'LinkedIn URL', 'url'),
('social_youtube', '', 'social', 'YouTube URL', 'url'),
-- WhatsApp
('whatsapp_number', '', 'whatsapp', 'WhatsApp Number', 'text'),
('whatsapp_message', 'Hello! I would like to know more about admissions.', 'whatsapp', 'Pre-filled Message', 'textarea');
