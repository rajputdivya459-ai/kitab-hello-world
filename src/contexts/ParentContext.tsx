import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface ParentChild {
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
  children: ParentChild[];
  selected: ParentChild | null;
  selectedId: string;
  setSelectedId: (id: string) => void;
  classMap: Record<string, string>;
  sectionMap: Record<string, string>;
}

const ParentContext = createContext<Ctx | null>(null);

export function ParentProvider({ children: kids }: { children: ReactNode }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState<ParentChild[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [classMap, setClassMap] = useState<Record<string, string>>({});
  const [sectionMap, setSectionMap] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: rows }, { data: cls }, { data: secs }] = await Promise.all([
        supabase.from('students').select('*').eq('parent_auth_user_id', user.id),
        supabase.from('classes').select('id,name'),
        supabase.from('sections').select('id,name'),
      ]);
      const items = (rows ?? []) as ParentChild[];
      setList(items);
      if (items[0]) setSelectedId(items[0].id);
      setClassMap(Object.fromEntries((cls ?? []).map((c: any) => [c.id, c.name])));
      setSectionMap(Object.fromEntries((secs ?? []).map((s: any) => [s.id, s.name])));
      setLoading(false);
    })();
  }, [user]);

  const selected = list.find(c => c.id === selectedId) ?? null;

  return (
    <ParentContext.Provider value={{ loading, children: list, selected, selectedId, setSelectedId, classMap, sectionMap }}>
      {kids}
    </ParentContext.Provider>
  );
}

export const useParentCtx = () => {
  const ctx = useContext(ParentContext);
  if (!ctx) throw new Error('useParentCtx outside ParentProvider');
  return ctx;
};
