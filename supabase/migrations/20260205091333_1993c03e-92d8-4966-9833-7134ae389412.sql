-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'member');

-- Create user_roles table for role management
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role app_role NOT NULL DEFAULT 'member',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    full_name TEXT,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create homepage_content table
CREATE TABLE public.homepage_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_key TEXT NOT NULL UNIQUE,
    title TEXT,
    subtitle TEXT,
    content TEXT,
    image_url TEXT,
    cta_text TEXT,
    cta_link TEXT,
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on homepage_content
ALTER TABLE public.homepage_content ENABLE ROW LEVEL SECURITY;

-- Create about_section table
CREATE TABLE public.about_section (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_key TEXT NOT NULL UNIQUE,
    title TEXT,
    content TEXT,
    image_url TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on about_section
ALTER TABLE public.about_section ENABLE ROW LEVEL SECURITY;

-- Create departments table
CREATE TABLE public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    courses TEXT[],
    head_of_department TEXT,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on departments
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

-- Create faculty table
CREATE TABLE public.faculty (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    designation TEXT,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    email TEXT,
    phone TEXT,
    bio TEXT,
    qualifications TEXT[],
    photo_url TEXT,
    is_active BOOLEAN DEFAULT true,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on faculty
ALTER TABLE public.faculty ENABLE ROW LEVEL SECURITY;

-- Create events table
CREATE TABLE public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    event_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    location TEXT,
    image_url TEXT,
    is_featured BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on events
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Create gallery table
CREATE TABLE public.gallery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT,
    caption TEXT,
    image_url TEXT NOT NULL,
    category TEXT,
    is_featured BOOLEAN DEFAULT false,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on gallery
ALTER TABLE public.gallery ENABLE ROW LEVEL SECURITY;

-- Create contact_submissions table
CREATE TABLE public.contact_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    subject TEXT,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on contact_submissions
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- Create stats table for homepage statistics
CREATE TABLE public.stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    label TEXT NOT NULL,
    value TEXT NOT NULL,
    icon TEXT,
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on stats
ALTER TABLE public.stats ENABLE ROW LEVEL SECURITY;

-- Create helper function to check admin role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
        AND role = _role
    )
$$;

-- Create helper function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = auth.uid()
        AND role = 'admin'
    )
$$;

-- Create trigger function for profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (user_id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
    RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_homepage_content_updated_at BEFORE UPDATE ON public.homepage_content FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_about_section_updated_at BEFORE UPDATE ON public.about_section FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON public.departments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_faculty_updated_at BEFORE UPDATE ON public.faculty FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_gallery_updated_at BEFORE UPDATE ON public.gallery FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_stats_updated_at BEFORE UPDATE ON public.stats FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.is_admin());

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.is_admin());

-- RLS Policies for homepage_content (public read, admin write)
CREATE POLICY "Anyone can view homepage content" ON public.homepage_content FOR SELECT USING (true);
CREATE POLICY "Admins can manage homepage content" ON public.homepage_content FOR ALL USING (public.is_admin());

-- RLS Policies for about_section (public read, admin write)
CREATE POLICY "Anyone can view about section" ON public.about_section FOR SELECT USING (true);
CREATE POLICY "Admins can manage about section" ON public.about_section FOR ALL USING (public.is_admin());

-- RLS Policies for departments (public read, admin write)
CREATE POLICY "Anyone can view departments" ON public.departments FOR SELECT USING (true);
CREATE POLICY "Admins can manage departments" ON public.departments FOR ALL USING (public.is_admin());

-- RLS Policies for faculty (public read, admin write)
CREATE POLICY "Anyone can view faculty" ON public.faculty FOR SELECT USING (true);
CREATE POLICY "Admins can manage faculty" ON public.faculty FOR ALL USING (public.is_admin());

-- RLS Policies for events (public read, admin write)
CREATE POLICY "Anyone can view events" ON public.events FOR SELECT USING (true);
CREATE POLICY "Admins can manage events" ON public.events FOR ALL USING (public.is_admin());

-- RLS Policies for gallery (public read, admin write)
CREATE POLICY "Anyone can view gallery" ON public.gallery FOR SELECT USING (true);
CREATE POLICY "Admins can manage gallery" ON public.gallery FOR ALL USING (public.is_admin());

-- RLS Policies for stats (public read, admin write)
CREATE POLICY "Anyone can view stats" ON public.stats FOR SELECT USING (true);
CREATE POLICY "Admins can manage stats" ON public.stats FOR ALL USING (public.is_admin());

-- RLS Policies for contact_submissions (public insert, admin read)
CREATE POLICY "Anyone can submit contact form" ON public.contact_submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view contact submissions" ON public.contact_submissions FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can manage contact submissions" ON public.contact_submissions FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can delete contact submissions" ON public.contact_submissions FOR DELETE USING (public.is_admin());

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('images', 'images', true);

-- Storage policies for images bucket
CREATE POLICY "Anyone can view images" ON storage.objects FOR SELECT USING (bucket_id = 'images');
CREATE POLICY "Admins can upload images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'images' AND public.is_admin());
CREATE POLICY "Admins can update images" ON storage.objects FOR UPDATE USING (bucket_id = 'images' AND public.is_admin());
CREATE POLICY "Admins can delete images" ON storage.objects FOR DELETE USING (bucket_id = 'images' AND public.is_admin());

-- Insert default homepage content
INSERT INTO public.homepage_content (section_key, title, subtitle, content, cta_text, cta_link, order_index) VALUES
('hero', 'Welcome to Apex University', 'Shaping Tomorrow''s Leaders Today', 'Discover world-class education, cutting-edge research, and a vibrant campus community at one of the nation''s premier institutions.', 'Explore Programs', '/departments', 1),
('mission', 'Our Mission', NULL, 'To provide transformative education that empowers students to become innovative leaders and responsible global citizens.', NULL, NULL, 2);

-- Insert default about section content
INSERT INTO public.about_section (section_key, title, content, order_index) VALUES
('vision', 'Our Vision', 'To be recognized globally as a center of excellence in education, research, and innovation.', 1),
('mission', 'Our Mission', 'We are committed to fostering intellectual curiosity, critical thinking, and ethical leadership through quality education.', 2),
('history', 'Our History', 'Founded in 1965, Apex University has grown from a small regional college to a nationally recognized institution with over 15,000 students.', 3);

-- Insert default stats
INSERT INTO public.stats (label, value, icon, order_index) VALUES
('Students Enrolled', '15,000+', 'users', 1),
('Faculty Members', '850+', 'graduation-cap', 2),
('Programs Offered', '120+', 'book-open', 3),
('Years of Excellence', '58+', 'award', 4);

-- Insert sample departments
INSERT INTO public.departments (name, description, icon, courses, order_index) VALUES
('Computer Science & Engineering', 'Cutting-edge programs in software development, AI, and cybersecurity.', 'laptop', ARRAY['B.Tech Computer Science', 'M.Tech AI & ML', 'Ph.D. Computer Science'], 1),
('Business Administration', 'Develop leadership skills and business acumen for the modern economy.', 'briefcase', ARRAY['BBA', 'MBA', 'Executive MBA'], 2),
('Mechanical Engineering', 'Innovation in design, manufacturing, and thermal systems.', 'settings', ARRAY['B.Tech Mechanical', 'M.Tech Manufacturing', 'Ph.D. Mechanical'], 3),
('Arts & Humanities', 'Explore literature, philosophy, history, and the arts.', 'palette', ARRAY['BA English', 'MA History', 'Ph.D. Philosophy'], 4);