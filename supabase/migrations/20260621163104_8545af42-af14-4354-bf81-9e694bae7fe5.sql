
-- Phase 6: Transport, ID Cards, Certificates

CREATE TYPE public.certificate_type AS ENUM ('bonafide', 'leaving', 'character');

-- ROUTES
CREATE TABLE public.transport_routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_name text NOT NULL,
  route_number text NOT NULL UNIQUE,
  pickup_points jsonb NOT NULL DEFAULT '[]'::jsonb,
  monthly_fee numeric NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.transport_routes TO authenticated;
GRANT ALL ON public.transport_routes TO service_role;
ALTER TABLE public.transport_routes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated can view routes" ON public.transport_routes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage routes" ON public.transport_routes FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- VEHICLES
CREATE TABLE public.transport_vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_number text NOT NULL UNIQUE,
  vehicle_type text NOT NULL DEFAULT 'bus',
  capacity integer NOT NULL DEFAULT 0,
  route_id uuid REFERENCES public.transport_routes(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.transport_vehicles TO authenticated;
GRANT ALL ON public.transport_vehicles TO service_role;
ALTER TABLE public.transport_vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated can view vehicles" ON public.transport_vehicles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage vehicles" ON public.transport_vehicles FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- DRIVERS
CREATE TABLE public.transport_drivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text,
  license_number text,
  vehicle_id uuid REFERENCES public.transport_vehicles(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.transport_drivers TO authenticated;
GRANT ALL ON public.transport_drivers TO service_role;
ALTER TABLE public.transport_drivers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated can view drivers" ON public.transport_drivers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage drivers" ON public.transport_drivers FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- STUDENT TRANSPORT
CREATE TABLE public.student_transport (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL UNIQUE REFERENCES public.students(id) ON DELETE CASCADE,
  route_id uuid NOT NULL REFERENCES public.transport_routes(id) ON DELETE RESTRICT,
  pickup_point text,
  transport_fee numeric NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_transport TO authenticated;
GRANT ALL ON public.student_transport TO service_role;
ALTER TABLE public.student_transport ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage student transport" ON public.student_transport FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Parents and students view own transport" ON public.student_transport FOR SELECT TO authenticated
  USING (student_id IN (SELECT public.current_student_ids()));

-- CERTIFICATES
CREATE TABLE public.certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_type public.certificate_type NOT NULL,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  certificate_number text NOT NULL UNIQUE,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  issued_on date NOT NULL DEFAULT current_date,
  issued_by uuid REFERENCES auth.users(id),
  remarks text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.certificates TO authenticated;
GRANT ALL ON public.certificates TO service_role;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage certificates" ON public.certificates FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Parents and students view own certificates" ON public.certificates FOR SELECT TO authenticated
  USING (student_id IN (SELECT public.current_student_ids()));

-- Updated_at triggers
CREATE TRIGGER trg_transport_routes_updated BEFORE UPDATE ON public.transport_routes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_transport_vehicles_updated BEFORE UPDATE ON public.transport_vehicles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_transport_drivers_updated BEFORE UPDATE ON public.transport_drivers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_student_transport_updated BEFORE UPDATE ON public.student_transport FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_certificates_updated BEFORE UPDATE ON public.certificates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Certificate number generator
CREATE OR REPLACE FUNCTION public.generate_certificate_number(_type public.certificate_type)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  prefix text;
  yr text := to_char(now(), 'YYYY');
  next_seq int;
BEGIN
  prefix := CASE _type
    WHEN 'bonafide' THEN 'BON'
    WHEN 'leaving' THEN 'LC'
    WHEN 'character' THEN 'CHR'
  END;
  SELECT COALESCE(MAX(
    CASE WHEN certificate_number LIKE prefix || '-' || yr || '-%'
      THEN CAST(substring(certificate_number FROM length(prefix) + length(yr) + 3) AS integer)
      ELSE 0 END
  ), 0) + 1 INTO next_seq FROM public.certificates WHERE certificate_type = _type;
  RETURN prefix || '-' || yr || '-' || LPAD(next_seq::text, 4, '0');
END;
$$;

-- Seed
INSERT INTO public.transport_routes (route_name, route_number, pickup_points, monthly_fee) VALUES
  ('Ashta - Sangli Route', 'R-01', '[{"name":"Ashta Bus Stand","time":"07:15"},{"name":"Peth Naka","time":"07:35"},{"name":"Sangli Station","time":"08:00"}]'::jsonb, 800),
  ('Islampur Route', 'R-02', '[{"name":"Islampur Chowk","time":"07:00"},{"name":"Urun Islampur","time":"07:25"}]'::jsonb, 900),
  ('Local Town Route', 'R-03', '[{"name":"Main Market","time":"07:40"},{"name":"Gandhi Chowk","time":"07:50"}]'::jsonb, 500);

INSERT INTO public.transport_vehicles (vehicle_number, vehicle_type, capacity, route_id)
SELECT v.vn, v.vt, v.cap, r.id FROM (VALUES
  ('MH-10-AB-1234','bus',45,'R-01'),
  ('MH-10-CD-5678','bus',40,'R-02'),
  ('MH-10-EF-9012','mini-bus',24,'R-03')
) AS v(vn,vt,cap,rn)
JOIN public.transport_routes r ON r.route_number = v.rn;

INSERT INTO public.transport_drivers (name, phone, license_number, vehicle_id)
SELECT d.nm, d.ph, d.ln, v.id FROM (VALUES
  ('Ramesh Patil','9876500001','MH1020230001','MH-10-AB-1234'),
  ('Suresh Jadhav','9876500002','MH1020230002','MH-10-CD-5678'),
  ('Vikas More','9876500003','MH1020230003','MH-10-EF-9012')
) AS d(nm,ph,ln,vn)
JOIN public.transport_vehicles v ON v.vehicle_number = d.vn;

-- Assign first 5 students to routes
INSERT INTO public.student_transport (student_id, route_id, pickup_point, transport_fee)
SELECT s.id, r.id, (r.pickup_points->0->>'name'), r.monthly_fee
FROM (SELECT id, row_number() OVER (ORDER BY created_at) AS rn FROM public.students LIMIT 5) s
JOIN (SELECT id, pickup_points, monthly_fee, row_number() OVER (ORDER BY route_number) AS rn FROM public.transport_routes) r
  ON ((s.rn - 1) % 3) + 1 = r.rn
ON CONFLICT (student_id) DO NOTHING;
