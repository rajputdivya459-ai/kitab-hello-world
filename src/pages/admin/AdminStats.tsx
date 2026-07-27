import { useEffect, useState } from 'react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Skeleton } from '@/components/common/Skeleton';
import { Plus, Pencil, Trash2, Users, GraduationCap, BookOpen, Award } from 'lucide-react';
import type { Stat } from '@/types/database';

const iconOptions = [
  { value: 'users', label: 'Users', icon: Users },
  { value: 'graduation-cap', label: 'Graduation Cap', icon: GraduationCap },
  { value: 'book-open', label: 'Book', icon: BookOpen },
  { value: 'award', label: 'Award', icon: Award },
];

const emptyForm = { label: '', value: '', icon: 'award', order_index: 0, is_active: true };

export default function AdminStats() {
  const [stats, setStats] = useState<Stat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchStats = () => {
    supabase
      .from('stats')
      .select('*')
      .order('order_index')
      .then(({ data, error }) => {
        if (!error && data) setStats(data as Stat[]);
        setIsLoading(false);
      });
  };

  useEffect(() => { fetchStats(); }, []);

  const handleSubmit = async () => {
    if (!form.label || !form.value) { toast.error('Label and Value are required'); return; }
    try {
      const payload = {
        label: String(form.label).trim(),
        value: String(form.value).trim(),
        icon: form.icon || 'award',
        order_index: Number(form.order_index) || 0,
        is_active: form.is_active === true || form.is_active !== false,
      };
      if (editId) {
        await supabase.from('stats').update(payload as any).eq('id', editId);
        toast.success('Stat updated');
      } else {
        await supabase.from('stats').insert([payload as any]);
        toast.success('Stat added');
      }
      setDialogOpen(false);
      setForm(emptyForm);
      setEditId(null);
      fetchStats();
    } catch { toast.error('Failed to save'); }
  };

  const handleEdit = (stat: Stat) => {
    setForm({
      label: String(stat.label ?? ''),
      value: String(stat.value ?? ''),
      icon: stat.icon || 'award',
      order_index: Number(stat.order_index) ?? 0,
      is_active: stat.is_active !== false,
    });
    setEditId(stat.id);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this stat?')) return;
    await supabase.from('stats').delete().eq('id', id);
    toast.success('Stat deleted');
    fetchStats();
  };

  const IconForValue = (val: string) => iconOptions.find(o => o.value === val)?.icon || Award;

  if (isLoading) {
    return <AdminLayout><div className="space-y-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20" />)}</div></AdminLayout>;
  }

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Statistics</h1>
            <p className="text-muted-foreground text-sm">Manage homepage statistics counters.</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setForm(emptyForm); setEditId(null); } }}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Add Stat</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editId ? 'Edit' : 'Add'} Stat</DialogTitle></DialogHeader>
              <div className="grid gap-4 py-4">
                <div><Label>Label</Label><Input value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} placeholder="e.g. Total Students" /></div>
                <div><Label>Value</Label><Input value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} placeholder="e.g. 2500+" /></div>
                <div>
                  <Label>Icon</Label>
                  <Select value={form.icon} onValueChange={v => setForm(f => ({ ...f, icon: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {iconOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Order</Label><Input type="number" value={form.order_index} onChange={e => setForm(f => ({ ...f, order_index: parseInt(e.target.value) || 0 }))} /></div>
                <Button onClick={handleSubmit}>{editId ? 'Update' : 'Create'}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4">
          {stats.map((stat) => {
            const Icon = IconForValue(stat.icon || 'award');
            return (
              <div key={stat.id} className="flex items-center gap-4 bg-card rounded-xl border border-border p-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(stat)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(stat.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            );
          })}
          {stats.length === 0 && <p className="text-center text-muted-foreground py-8">No stats yet. Add your first one!</p>}
        </div>
      </div>
    </AdminLayout>
  );
}
