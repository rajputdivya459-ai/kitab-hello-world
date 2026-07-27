
ALTER TABLE public.attendance DROP CONSTRAINT IF EXISTS attendance_status_check;

ALTER TABLE public.attendance
  ADD COLUMN IF NOT EXISTS class_id uuid,
  ADD COLUMN IF NOT EXISTS section_id uuid,
  ADD COLUMN IF NOT EXISTS marked_by uuid;

UPDATE public.attendance SET status = 'half_day' WHERE status IN ('late','excused');

ALTER TABLE public.attendance
  ADD CONSTRAINT attendance_status_check
  CHECK (status IN ('present','absent','leave','half_day'));

CREATE INDEX IF NOT EXISTS attendance_date_idx ON public.attendance(date);
CREATE INDEX IF NOT EXISTS attendance_class_date_idx ON public.attendance(class_id, date);
CREATE INDEX IF NOT EXISTS attendance_section_date_idx ON public.attendance(section_id, date);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendance TO authenticated;
GRANT ALL ON public.attendance TO service_role;
