import { useEffect, useState } from 'react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type Staff = {
  id: string; full_name: string; staff_code: string | null;
  staff_type: 'teaching' | 'non_teaching'; role: string;
  qualification: string | null; experience_years: number | null;
  email: string | null; phone: string | null; joining_date: string | null;
  status: string; photo_url: string | null;
};

const ROLES = ['teacher', 'principal', 'coordinator', 'accountant', 'clerk', 'receptionist', 'librarian', 'other'];

export default function AdminStaff() {
  const { toast } = useToast();
  const [list, setList] = useState<Staff[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Staff | null>(null);
  const [filter, setFilter] = useState<'all' | 'teaching' | 'non_teaching'>('all');
  const [form, setForm] = useState<any>({
    full_name: '', staff_code: '', staff_type: 'teaching', role: 'teacher',
    qualification: '', experience_years: 0, email: '', phone: '',
    joining_date: new Date().toISOString().slice(0, 10), status: 'active',
  });

  const load = async () => {
    const { data } = await (supabase as any).from('staff').select('*').order('created_at', { ascending: false });
    setList((data ?? []) as Staff[]);
  };
  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm({
      full_name: '', staff_code: '', staff_type: 'teaching', role: 'teacher',
      qualification: '', experience_years: 0, email: '', phone: '',
      joining_date: new Date().toISOString().slice(0, 10), status: 'active',
    });
    setOpen(true);
  };
  const openEdit = (s: Staff) => {
    setEditing(s);
    setForm({ ...s, experience_years: s.experience_years ?? 0 });
    setOpen(true);
  };

  const save = async () => {
    const payload = { ...form, experience_years: Number(form.experience_years) || 0 };
    const res = editing
      ? await (supabase as any).from('staff').update(payload).eq('id', editing.id)
      : await (supabase as any).from('staff').insert(payload);
    if (res.error) return toast({ title: 'Failed', description: res.error.message, variant: 'destructive' });
    toast({ title: editing ? 'Updated' : 'Added' });
    setOpen(false); load();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this staff member?')) return;
    const { error } = await (supabase as any).from('staff').delete().eq('id', id);
    if (error) toast({ title: 'Failed', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Deleted' }); load(); }
  };

  const filtered = filter === 'all' ? list : list.filter(s => s.staff_type === filter);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold">Staff Directory</h1>
            <p className="text-muted-foreground">Teachers, coordinators, accountants and office staff.</p>
          </div>
          <div className="flex gap-2">
            <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Staff</SelectItem>
                <SelectItem value="teaching">Teaching</SelectItem>
                <SelectItem value="non_teaching">Non-Teaching</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Add Staff</Button>
          </div>
        </div>

        <div className="bg-card rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(s => (
                <TableRow key={s.id}>
                  <TableCell className="font-mono text-xs">{s.staff_code}</TableCell>
                  <TableCell className="font-medium">{s.full_name}</TableCell>
                  <TableCell className="capitalize">{s.role}</TableCell>
                  <TableCell><Badge variant="secondary" className="capitalize">{s.staff_type.replace('_', ' ')}</Badge></TableCell>
                  <TableCell>{s.phone}</TableCell>
                  <TableCell>
                    <Badge className={s.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-rose-100 text-rose-700'}>
                      {s.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => remove(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No staff records.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editing ? 'Edit Staff' : 'Add Staff'}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Full Name *</Label><Input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} /></div>
                <div><Label>Staff Code</Label><Input value={form.staff_code ?? ''} onChange={e => setForm({ ...form, staff_code: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Type</Label>
                  <Select value={form.staff_type} onValueChange={v => setForm({ ...form, staff_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="teaching">Teaching</SelectItem>
                      <SelectItem value="non_teaching">Non-Teaching</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Role</Label>
                  <Select value={form.role} onValueChange={v => setForm({ ...form, role: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Qualification</Label><Input value={form.qualification ?? ''} onChange={e => setForm({ ...form, qualification: e.target.value })} /></div>
                <div><Label>Experience (yrs)</Label><Input type="number" value={form.experience_years} onChange={e => setForm({ ...form, experience_years: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Email</Label><Input type="email" value={form.email ?? ''} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
                <div><Label>Phone</Label><Input value={form.phone ?? ''} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Joining Date</Label><Input type="date" value={form.joining_date ?? ''} onChange={e => setForm({ ...form, joining_date: e.target.value })} /></div>
                <div>
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                To grant this staff a Teacher Portal login: create an auth user with the same email,
                assign role <strong>teacher</strong>, then set <code>auth_user_id</code> manually
                (a UI for this will follow in a later phase).
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={save}>{editing ? 'Update' : 'Add'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
