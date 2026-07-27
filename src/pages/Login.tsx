import { useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { GraduationCap, ShieldCheck, School, Wallet, Users, Briefcase, UserCircle, BookOpen, LogIn, Copy } from 'lucide-react';
import { useSession } from '@/auth/SessionProvider';
import { roleHome } from '@/lib/roleRoutes';
import type { MockRole, MockUser } from '@/mock/users';
import { getCollection } from '@/mock/db';
import { toast } from 'sonner';

const ROLE_META: Record<MockRole, { icon: any; label: string; color: string }> = {
  admin:      { icon: ShieldCheck, label: 'Admin',      color: 'from-slate-700 to-slate-900' },
  principal:  { icon: School,      label: 'Principal',  color: 'from-blue-700 to-indigo-800' },
  accountant: { icon: Wallet,      label: 'Accountant', color: 'from-emerald-700 to-teal-800' },
  teacher:    { icon: BookOpen,    label: 'Teacher',    color: 'from-teal-600 to-cyan-700' },
  staff:      { icon: Briefcase,   label: 'Staff',      color: 'from-amber-600 to-orange-700' },
  parent:     { icon: Users,       label: 'Parent',     color: 'from-rose-600 to-pink-700' },
  student:    { icon: UserCircle,  label: 'Student',    color: 'from-violet-600 to-purple-700' },
};

const ROLE_ORDER: MockRole[] = ['admin', 'principal', 'accountant', 'teacher', 'staff', 'parent', 'student'];

export default function Login() {
  const { signIn } = useSession();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const grouped = useMemo(() => {
    const users = getCollection<MockUser>('users').filter(u => u.status === 'active');
    return ROLE_ORDER.map(r => ({ role: r, users: users.filter(u => u.role === r) }));
  }, []);

  const quick = (u: MockUser) => {
    const res = signIn(u.username, u.password);
    if (!res.ok) { toast.error(res.error ?? 'Cannot sign in'); return; }
    toast.success(`Signed in as ${u.name}`);
    navigate(roleHome(u.role));
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const res = signIn(username.trim(), password);
    setBusy(false);
    if (!res.ok) { toast.error(res.error ?? 'Sign-in failed'); return; }
    const user = getCollection<MockUser>('users').find(u => u.username.toLowerCase() === username.trim().toLowerCase());
    toast.success('Welcome back');
    navigate(roleHome(user?.role ?? 'admin'));
  };

  const copy = (u: MockUser) => {
    navigator.clipboard.writeText(`${u.username} / ${u.password}`).then(() => toast.success('Credentials copied'));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid md:grid-cols-5 gap-6">
        {/* Left: credentials form (2/5) */}
        <Card className="p-8 shadow-xl border-primary/10 md:col-span-2">
          <Link to="/" className="flex items-center gap-3 mb-6">
            <div className="bg-primary p-2.5 rounded-xl">
              <GraduationCap className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display font-bold text-lg leading-tight">MGCM ERP</h1>
              <p className="text-xs text-muted-foreground">Sign in to your workspace</p>
            </div>
          </Link>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="u">Username</Label>
              <Input id="u" autoFocus value={username} onChange={e => setUsername(e.target.value)} placeholder="admin" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p">Password</Label>
              <Input id="p" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              <LogIn className="h-4 w-4 mr-2" />Sign In
            </Button>
          </form>

          <Separator className="my-6" />
          <p className="text-xs text-muted-foreground text-center">
            Or use a role-specific login: {' '}
            <Link to="/admin" className="underline">Admin</Link> · {' '}
            <Link to="/teacher/login" className="underline">Teacher</Link> · {' '}
            <Link to="/parent/login" className="underline">Parent</Link> · {' '}
            <Link to="/student/login" className="underline">Student</Link>
          </p>
        </Card>

        {/* Right: developer quick access (3/5, scrollable, grouped) */}
        <Card className="p-6 shadow-xl bg-gradient-to-br from-slate-900 to-slate-800 text-white border-0 md:col-span-3 flex flex-col max-h-[85vh]">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="font-display font-bold text-lg">Developer Quick Access</h2>
              <p className="text-xs text-white/60">One-click sign-in with seeded demo accounts.</p>
            </div>
            <Badge variant="outline" className="border-amber-400 text-amber-300 bg-amber-400/10">DEV MODE</Badge>
          </div>
          <p className="text-[11px] text-white/50 mb-4">
            Remove this panel before enabling real authentication.
          </p>

          <ScrollArea className="flex-1 pr-3 -mr-3">
            <div className="space-y-5">
              {grouped.map(({ role, users }) => {
                if (!users.length) return null;
                const M = ROLE_META[role];
                return (
                  <div key={role}>
                    <div className="flex items-center gap-2 mb-2">
                      <M.icon className="h-4 w-4 text-white/80" />
                      <p className="text-xs font-semibold uppercase tracking-wider text-white/70">{M.label}</p>
                      <span className="text-[10px] text-white/40">({users.length})</span>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {users.map(u => (
                        <div key={u.id} className={`bg-gradient-to-br ${M.color} p-3 rounded-lg shadow-md group relative`}>
                          <button onClick={() => quick(u)} className="w-full text-left">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-sm truncate">{u.name}</span>
                            </div>
                            {u.context && <p className="text-[10px] text-white/70 truncate">{u.context}</p>}
                            <p className="text-[10px] font-mono text-white/85 mt-1 truncate">{u.username} · {u.password}</p>
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); copy(u); }}
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-white/10"
                            title="Copy credentials"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </Card>
      </div>
    </div>
  );
}
