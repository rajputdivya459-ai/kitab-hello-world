import { useNavigate } from 'react-router-dom';
import { GraduationCap, ShieldCheck, School, Wallet, BookOpen, Briefcase, Users, UserCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSession } from '@/auth/SessionProvider';
import { getCollection } from '@/mock/db';
import type { MockRole, MockUser } from '@/mock/users';
import { roleHome } from '@/lib/roleRoutes';
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

const ORDER: MockRole[] = ['admin', 'principal', 'accountant', 'teacher', 'staff', 'parent', 'student'];

export default function AdminLogin() {
  const { signIn } = useSession();
  const navigate = useNavigate();
  const users = getCollection<MockUser>('users').filter(u => u.status === 'active');

  const loginAs = (u: MockUser) => {
    const res = signIn(u.username, u.password);
    if (!res.ok) { toast.error(res.error ?? 'Cannot sign in'); return; }
    toast.success(`Signed in as ${u.name}`);
    navigate(roleHome(u.role));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-4">
      <div className="w-full max-w-4xl bg-card rounded-2xl shadow-college-xl p-6 sm:p-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-3">
            <GraduationCap className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="font-display text-2xl font-bold">MGCM Portal</h1>
          <p className="text-muted-foreground text-sm mt-1">Authentication is disabled — pick a role to enter.</p>
          <Badge variant="outline" className="mt-2 border-amber-400 text-amber-700 bg-amber-50">DEMO MODE</Badge>
        </div>

        <div className="space-y-4">
          {ORDER.map(role => {
            const roleUsers = users.filter(u => u.role === role);
            if (!roleUsers.length) return null;
            const M = ROLE_META[role];
            return (
              <div key={role}>
                <div className="flex items-center gap-2 mb-2">
                  <M.icon className="h-4 w-4 text-muted-foreground" />
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{M.label}</p>
                  <span className="text-[10px] text-muted-foreground">({roleUsers.length})</span>
                </div>
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {roleUsers.map(u => (
                    <Button key={u.id} variant="outline" onClick={() => loginAs(u)}
                      className={`justify-start h-auto py-2 px-3 bg-gradient-to-br ${M.color} text-white border-0 hover:opacity-90 hover:text-white`}>
                      <div className="text-left overflow-hidden">
                        <p className="font-semibold text-sm truncate">Login as {u.name}</p>
                        {u.context && <p className="text-[10px] text-white/80 truncate">{u.context}</p>}
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
