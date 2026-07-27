import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { getSession } from '@/auth/mockAuth';

export type AppRole = 'admin' | 'teacher' | 'parent' | 'student' | 'member' | 'principal' | 'accountant' | 'staff' | null;

export function useRole() {
  const { user, isLoading: authLoading } = useAuth();
  const [role, setRole] = useState<AppRole>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const onChange = () => setTick(t => t + 1);
    window.addEventListener('erp:session', onChange);
    window.addEventListener('storage', onChange);
    return () => {
      window.removeEventListener('erp:session', onChange);
      window.removeEventListener('storage', onChange);
    };
  }, []);

  useEffect(() => {
    // Mock session wins if present — Phase 7 runtime auth.
    const mock = getSession();
    if (mock) { setRole(mock.role as AppRole); setLoading(false); return; }

    let cancelled = false;
    if (authLoading) return;
    if (!user) { setRole(null); setLoading(false); return; }
    setLoading(true);
    supabase.from('user_roles').select('role').eq('user_id', user.id).then(({ data }) => {
      if (cancelled) return;
      const roles = (data ?? []).map((r: any) => r.role);
      const priority: AppRole[] = ['admin', 'teacher', 'parent', 'student', 'member'];
      const found = priority.find(p => p && roles.includes(p)) ?? null;
      setRole(found);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [user, authLoading, tick]);

  return { role, loading: loading || (authLoading && !getSession()), user: user ?? (getSession() ? ({ id: getSession()!.userId } as any) : null) };
}
