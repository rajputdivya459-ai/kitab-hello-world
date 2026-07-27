import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface TeacherStaff {
  id: string;
  full_name: string;
  staff_code: string | null;
  role: string;
  email: string | null;
  phone: string | null;
  qualification: string | null;
  experience_years: number | null;
  joining_date: string | null;
  photo_url: string | null;
}

export interface Assignment {
  id: string;
  class_id: string;
  section_id: string | null;
  subject_id: string | null;
  is_class_teacher: boolean;
}

interface Ctx {
  loading: boolean;
  teacher: TeacherStaff | null;
  assignments: Assignment[];
  classMap: Record<string, string>;
  sectionMap: Record<string, string>;
  subjectMap: Record<string, string>;
  refresh: () => void;
}

const TeacherContext = createContext<Ctx | null>(null);

export function TeacherProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [teacher, setTeacher] = useState<TeacherStaff | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [classMap, setClassMap] = useState<Record<string, string>>({});
  const [sectionMap, setSectionMap] = useState<Record<string, string>>({});
  const [subjectMap, setSubjectMap] = useState<Record<string, string>>({});
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const sb = supabase as any;
      const [{ data: s }, { data: cls }, { data: secs }, { data: subs }] = await Promise.all([
        sb.from('staff').select('*').eq('auth_user_id', user.id).maybeSingle(),
        supabase.from('classes').select('id,name'),
        supabase.from('sections').select('id,name'),
        supabase.from('subjects').select('id,name'),
      ]);
      setTeacher((s as TeacherStaff | null) ?? null);
      setClassMap(Object.fromEntries((cls ?? []).map((c: any) => [c.id, c.name])));
      setSectionMap(Object.fromEntries((secs ?? []).map((x: any) => [x.id, x.name])));
      setSubjectMap(Object.fromEntries((subs ?? []).map((x: any) => [x.id, x.name])));

      if (s?.id) {
        const { data: a } = await sb.from('teacher_assignments').select('*').eq('staff_id', s.id);
        setAssignments((a ?? []) as Assignment[]);
      } else {
        setAssignments([]);
      }
      setLoading(false);
    })();
  }, [user, tick]);

  return (
    <TeacherContext.Provider
      value={{ loading, teacher, assignments, classMap, sectionMap, subjectMap, refresh: () => setTick(t => t + 1) }}
    >
      {children}
    </TeacherContext.Provider>
  );
}

export const useTeacherCtx = () => {
  const ctx = useContext(TeacherContext);
  if (!ctx) throw new Error('useTeacherCtx outside TeacherProvider');
  return ctx;
};
