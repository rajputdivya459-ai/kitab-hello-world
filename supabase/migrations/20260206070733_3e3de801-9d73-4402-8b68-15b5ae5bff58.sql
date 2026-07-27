-- Create members table for principal, directors, management
CREATE TABLE public.members (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    designation TEXT NOT NULL,
    role_type TEXT NOT NULL CHECK (role_type IN ('principal', 'director', 'management', 'staff')),
    photo_url TEXT,
    bio TEXT,
    email TEXT,
    phone TEXT,
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view members"
ON public.members FOR SELECT
USING (true);

CREATE POLICY "Admins can manage members"
ON public.members FOR ALL
USING (is_admin());

-- Create trigger for updated_at
CREATE TRIGGER update_members_updated_at
BEFORE UPDATE ON public.members
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();