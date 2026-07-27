import { getCollection, setCollection } from '@/mock/db';
import type { MockUser, MockRole } from '@/mock/users';

const SESSION_KEY = 'erp.session';

export interface MockSession {
  userId: string;
  role: MockRole;
  rememberMe: boolean;
  issuedAt: string;
}

export function getSession(): MockSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function getCurrentUser(): MockUser | null {
  const s = getSession();
  if (!s) return null;
  return getCollection<MockUser>('users').find(u => u.id === s.userId) ?? null;
}

export function signIn(username: string, password: string, rememberMe = true): { ok: boolean; user?: MockUser; error?: string } {
  const users = getCollection<MockUser>('users');
  const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
  if (!user) return { ok: false, error: 'Invalid credentials' };
  if (user.password !== password) return { ok: false, error: 'Invalid credentials' };
  if (user.status !== 'active') return { ok: false, error: 'Account inactive' };
  const session: MockSession = { userId: user.id, role: user.role, rememberMe, issuedAt: new Date().toISOString() };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  // Update last login
  user.lastLogin = session.issuedAt;
  setCollection('users', users.map(u => u.id === user.id ? user : u));
  window.dispatchEvent(new Event('erp:session'));
  return { ok: true, user };
}

export function signInAsRole(role: MockRole): { ok: boolean; user?: MockUser; error?: string } {
  const user = getCollection<MockUser>('users').find(u => u.role === role && u.status === 'active');
  if (!user) return { ok: false, error: `No active ${role} user` };
  return signIn(user.username, user.password);
}

export function signOut() {
  localStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new Event('erp:session'));
}

export function resetPassword(userId: string, newPassword: string) {
  const users = getCollection<MockUser>('users');
  const next = users.map(u => u.id === userId ? { ...u, password: newPassword } : u);
  setCollection('users', next);
}
