import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import type { MockUser, MockRole } from '@/mock/users';
import { getCurrentUser, getSession, signIn as _signIn, signInAsRole as _signInAsRole, signOut as _signOut } from './mockAuth';

interface SessionCtx {
  user: MockUser | null;
  role: MockRole | null;
  loading: boolean;
  signIn: (username: string, password: string) => { ok: boolean; error?: string };
  signInAsRole: (role: MockRole) => { ok: boolean; error?: string };
  signOut: () => void;
  refresh: () => void;
}

const Ctx = createContext<SessionCtx | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MockUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setUser(getCurrentUser());
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const onChange = () => refresh();
    window.addEventListener('erp:session', onChange);
    window.addEventListener('storage', onChange);
    return () => {
      window.removeEventListener('erp:session', onChange);
      window.removeEventListener('storage', onChange);
    };
  }, [refresh]);

  const value: SessionCtx = {
    user,
    role: user?.role ?? getSession()?.role ?? null,
    loading,
    signIn: (u, p) => { const r = _signIn(u, p); refresh(); return r; },
    signInAsRole: (r) => { const res = _signInAsRole(r); refresh(); return res; },
    signOut: () => { _signOut(); refresh(); },
    refresh,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSession() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useSession must be used within SessionProvider');
  return c;
}
