
-- Extend students table with personal/admission fields
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS gender text;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS date_of_birth date;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS admission_number text UNIQUE;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS admission_status text NOT NULL DEFAULT 'active';
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Copy name to full_name for existing records
UPDATE public.students SET full_name = name WHERE full_name IS NULL;

-- Add student_id to fees_collection for linking
ALTER TABLE public.fees_collection ADD COLUMN IF NOT EXISTS student_id uuid REFERENCES public.students(id) ON DELETE SET NULL;

-- Add foreign key constraints to students table (if not already present)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'students_course_id_fkey' AND table_name = 'students') THEN
    ALTER TABLE public.students ADD CONSTRAINT students_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'students_year_id_fkey' AND table_name = 'students') THEN
    ALTER TABLE public.students ADD CONSTRAINT students_year_id_fkey FOREIGN KEY (year_id) REFERENCES public.years(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'students_semester_id_fkey' AND table_name = 'students') THEN
    ALTER TABLE public.students ADD CONSTRAINT students_semester_id_fkey FOREIGN KEY (semester_id) REFERENCES public.semesters(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create trigger for updated_at on students
CREATE OR REPLACE TRIGGER update_students_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create a function to generate admission numbers
CREATE OR REPLACE FUNCTION public.generate_admission_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_year text;
  next_seq int;
  result text;
BEGIN
  current_year := to_char(now(), 'YYYY');
  SELECT COALESCE(MAX(
    CASE WHEN admission_number LIKE 'ADM-' || current_year || '-%'
    THEN CAST(substring(admission_number from 10) AS integer)
    ELSE 0 END
  ), 0) + 1 INTO next_seq FROM public.students;
  result := 'ADM-' || current_year || '-' || LPAD(next_seq::text, 4, '0');
  RETURN result;
END;
$$;
