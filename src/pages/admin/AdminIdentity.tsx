import { useEffect, useMemo, useState } from 'react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { DataToolbar } from '@/components/shared/DataToolbar';
import { Pagination } from '@/components/shared/Pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ShieldCheck, KeyRound, Pencil, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { exportCSV } from '@/lib/export';
import { getCollection, setCollection, upsert, remove, uid } from '@/mock/db';
import type { MockUser, MockRole } from '@/mock/users';

const ROLES: MockRole[] = ['admin', 'principal', 'accountant', 'teacher', 'staff', 'parent', 'student'];
const PAGE_SIZE = 10;

const emptyUser = (): MockUser => ({
  id: uid('u'),
  name: '', username: '', password: '', email: '', mobile: '',
  role: 'staff', status: 'active', createdAt: new Date().toISOString(),
});

export default function AdminIdentity() {
  const [rows, setRows] = useState<MockUser[]>([]);
  const [q, setQ] = useState('');
  const [role, setRole] = useState<string>('all');
  const [status, setStatus] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<MockUser | null>(null);
  const [pwUser, setPwUser] = useState<MockUser | null>(null);
  const [newPw, setNewPw] = useState('');
  const debounced = useDebouncedValue(q, 200);

  const load = () => setRows(getCollection<MockUser>('users'));
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const s = debounced.toLowerCase();
    return rows.filter(u => {
      if (role !== 'all' && u.role !== role) return false;
      if (status !== 'all' && u.status !== status) return false;
      if (!s) return true;
      return [u.name, u.username, u.email, u.mobile].some(v => v?.toLowerCase().includes(s));
    });
  }, [rows, debounced, role, status]);

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const save = (u: MockUser) => {
    if (!u.name || !u.username || !u.password || !u.email) {
      toast.error('Name, username, password, email required'); return;
    }
    upsert('users', u);
    setEditing(null);
    load();
    toast.success('User saved');
  };

  const toggleStatus = (u: MockUser) => {
    const next = { ...u, status: u.status === 'active' ? 'inactive' as const : 'active' as const };
    upsert('users', next); load();
    toast.success(`${next.status === 'active' ? 'Activated' : 'Deactivated'} ${u.name}`);
  };

  const del = (u: MockUser) => {
    if (!confirm(`Delete user ${u.name}?`)) return;
    remove('users', u.id); load();
    toast.success('User deleted');
  };

  const resetPw = () => {
    if (!pwUser || newPw.length < 4) { toast.error('Password too short'); return; }
    const users = getCollection<MockUser>('users');
    setCollection('users', users.map(x => x.id === pwUser.id ? { ...x, password: newPw } : x));
    setPwUser(null); setNewPw(''); load();
    toast.success('Password reset');
  };

  const columns: Column<MockUser>[] = [
    { key: 'name', header: 'Name', cell: r => <div><p className="font-medium">{r.name}</p><p className="text-xs text-muted-foreground">@{r.username}</p></div> },
    { key: 'email', header: 'Email', cell: r => <span className="text-sm">{r.email}</span> },
    { key: 'mobile', header: 'Mobile', cell: r => <span className="text-sm">{r.mobile}</span> },
    { key: 'role', header: 'Role', cell: r => <Badge variant="secondary" className="capitalize">{r.role}</Badge> },
    { key: 'status', header: 'Status', cell: r => <Badge variant={r.status === 'active' ? 'default' : 'outline'}>{r.status}</Badge> },
    { key: 'lastLogin', header: 'Last Login', cell: r => <span className="text-xs text-muted-foreground">{r.lastLogin ? new Date(r.lastLogin).toLocaleString() : '—'}</span> },
    {
      key: 'actions', header: '', className: 'text-right',
      cell: r => (
        <div className="flex justify-end gap-1">
          <Button size="sm" variant="ghost" onClick={() => setEditing(r)}><Pencil className="h-3.5 w-3.5" /></Button>
          <Button size="sm" variant="ghost" onClick={() => setPwUser(r)}><KeyRound className="h-3.5 w-3.5" /></Button>
          <Switch checked={r.status === 'active'} onCheckedChange={() => toggleStatus(r)} />
          <Button size="sm" variant="ghost" onClick={() => del(r)}><Trash2 className="h-3.5 w-3.5" /></Button>
        </div>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-2xl font-display font-semibold">Identity & Access</h2>
            <p className="text-sm text-muted-foreground">Central directory of all system users. Mock runtime — replaces with Supabase Auth in Phase 8.</p>
          </div>
        </div>

        <DataToolbar
          search={q}
          onSearchChange={setQ}
          searchPlaceholder="Search name, username, email, mobile…"
          filters={
            <>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="w-36 h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All roles</SelectItem>
                  {ROLES.map(r => <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-32 h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </>
          }
          onExportCSV={() => exportCSV('users', filtered, [
            { key: 'name', label: 'Name' }, { key: 'username', label: 'Username' },
            { key: 'email', label: 'Email' }, { key: 'mobile', label: 'Mobile' },
            { key: 'role', label: 'Role' }, { key: 'status', label: 'Status' },
            { key: 'lastLogin', label: 'Last Login' }, { key: 'createdAt', label: 'Created' },
          ])}
          actions={
            <Button size="sm" onClick={() => setEditing(emptyUser())}><Plus className="h-4 w-4 mr-1" />New User</Button>
          }
        />

        <DataTable columns={columns} rows={paged} rowKey={r => r.id}
          emptyTitle="No users" emptyDescription="Create your first user or seed the runtime DB via the dev switcher." />

        <Pagination page={page} pageSize={PAGE_SIZE} total={filtered.length} onPageChange={setPage} />
      </div>

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={o => !o && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing?.name ? 'Edit user' : 'New user'}</DialogTitle></DialogHeader>
          {editing && (
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><Label>Full name</Label><Input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} /></div>
              <div><Label>Username</Label><Input value={editing.username} onChange={e => setEditing({ ...editing, username: e.target.value })} /></div>
              <div><Label>Password</Label><Input value={editing.password} onChange={e => setEditing({ ...editing, password: e.target.value })} /></div>
              <div><Label>Email</Label><Input type="email" value={editing.email} onChange={e => setEditing({ ...editing, email: e.target.value })} /></div>
              <div><Label>Mobile</Label><Input value={editing.mobile} onChange={e => setEditing({ ...editing, mobile: e.target.value })} /></div>
              <div>
                <Label>Role</Label>
                <Select value={editing.role} onValueChange={v => setEditing({ ...editing, role: v as MockRole })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ROLES.map(r => <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={editing.status} onValueChange={v => setEditing({ ...editing, status: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={() => editing && save(editing)}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset password */}
      <Dialog open={!!pwUser} onOpenChange={o => { if (!o) { setPwUser(null); setNewPw(''); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Reset password</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Set a new password for <span className="font-medium text-foreground">{pwUser?.name}</span></p>
          <Input type="text" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="New password" />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setPwUser(null); setNewPw(''); }}>Cancel</Button>
            <Button onClick={resetPw}>Reset</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
