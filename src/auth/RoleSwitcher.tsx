import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { UserCog, X, RefreshCw, Trash2, Database } from 'lucide-react';
import { useSession } from './SessionProvider';
import { resetAll, clearAll } from '@/mock/db';
import { SEEDS } from '@/mock/seeds';
import { roleHome } from '@/lib/roleRoutes';
import type { MockRole } from '@/mock/users';
import { toast } from 'sonner';

const ROLES: MockRole[] = ['admin', 'principal', 'accountant', 'teacher', 'staff', 'parent', 'student'];

export function RoleSwitcher() {
  const [open, setOpen] = useState(false);
  const { user, role, signInAsRole, signOut } = useSession();
  const navigate = useNavigate();

  if (!import.meta.env.DEV) return null;

  const switchTo = (r: MockRole) => {
    const res = signInAsRole(r);
    if (!res.ok) { toast.error(res.error ?? 'Cannot switch role'); return; }
    toast.success(`Signed in as ${r}`);
    navigate(roleHome(r as any));
  };

  return (
    <div className="fixed bottom-4 right-4 z-[100]">
      {open ? (
        <Card className="w-72 p-4 shadow-2xl border-primary/20">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold">Dev Role Switcher</p>
              <p className="text-xs text-muted-foreground">{user ? `${user.name} · ${role}` : 'Not signed in'}</p>
            </div>
            <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-secondary">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-1.5 mb-3">
            {ROLES.map(r => (
              <Button
                key={r}
                size="sm"
                variant={role === r ? 'default' : 'outline'}
                className="capitalize text-xs h-8"
                onClick={() => switchTo(r)}
              >
                {r}
              </Button>
            ))}
          </div>
          <div className="border-t pt-3 space-y-1.5">
            <Button size="sm" variant="ghost" className="w-full justify-start text-xs h-8"
              onClick={() => { resetAll(SEEDS); toast.success('Runtime DB reset'); }}>
              <Database className="h-3.5 w-3.5 mr-2" />Reset Runtime DB
            </Button>
            <Button size="sm" variant="ghost" className="w-full justify-start text-xs h-8"
              onClick={() => { clearAll(); toast.success('Runtime data cleared'); location.reload(); }}>
              <Trash2 className="h-3.5 w-3.5 mr-2" />Clear Runtime Data
            </Button>
            <Button size="sm" variant="ghost" className="w-full justify-start text-xs h-8"
              onClick={() => { signOut(); navigate('/'); toast.success('Signed out'); }}>
              <RefreshCw className="h-3.5 w-3.5 mr-2" />Sign Out
            </Button>
          </div>
        </Card>
      ) : (
        <Button size="sm" className="shadow-lg" onClick={() => setOpen(true)}>
          <UserCog className="h-4 w-4 mr-2" />Dev
        </Button>
      )}
    </div>
  );
}
