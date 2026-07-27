import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface SelfStudent {
  id: string;
  name: string;
  admission_number: string | null;
  course: string;
  total_fees: number;
  paid_fees: number;
  profile_image_url: string | null;
  parent_phone: string | null;
  class_id: string | null;
  section_id: string | null;
}

interface Ctx {
  loading: boolean;
  student: SelfStudent | null;
  classMap: Record<string, string>;
  sectionMap: Record<string, string>;
}

const StudentContext = createContext<Ctx | null>(null);

export function StudentProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<SelfStudent | null>(null);
  const [classMap, setClassMap] = useState<Record<string, string>>({});
  const [sectionMap, setSectionMap] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: s }, { data: cls }, { data: secs }] = await Promise.all([
        supabase.from('students').select('*').eq('auth_user_id', user.id).maybeSingle(),
        supabase.from('classes').select('id,name'),
        supabase.from('sections').select('id,name'),
      ]);
      setStudent(s as SelfStudent | null);
      setClassMap(Object.fromEntries((cls ?? []).map((c: any) => [c.id, c.name])));
      setSectionMap(Object.fromEntries((secs ?? []).map((s: any) => [s.id, s.name])));
      setLoading(false);
    })();
  }, [user]);

  return (
    <StudentContext.Provider value={{ loading, student, classMap, sectionMap }}>
      {children}
    </StudentContext.Provider>
  );
}

export const useStudentCtx = () => {
  const ctx = useContext(StudentContext);
  if (!ctx) throw new Error('useStudentCtx outside StudentProvider');
  return ctx;
};
