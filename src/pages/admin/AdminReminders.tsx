import { useEffect, useMemo, useState } from 'react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Check, Trash2, Bell } from 'lucide-react';

type Cat = 'fee' | 'admission' | 'staff_doc' | 'transport' | 'exam' | 'general';
type Prio = 'low' | 'medium' | 'high';
const CATS: Cat[] = ['fee','admission','staff_doc','transport','exam','general'];
const PRIO_TONE: Record<Prio, string> = {
  high: 'bg-rose-100 text-rose-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-sky-100 text-sky-700',
};

export default function AdminReminders() {
  const { toast } = useToast();
  const [rows, setRows] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ title: '', description: '', category: 'general' as Cat, due_date: '', priority: 'medium' as Prio });

  const load = async () => {
    const { data } = await (supabase as any).from('reminders').select('*').order('due_date');
    setRows(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const today = new Date().toISOString().slice(0, 10);
  const grouped = useMemo(() => {
    const overdue: any[] = [], todayList: any[] = [], upcoming: any[] = [], completed: any[] = [];
    rows.forEach(r => {
      if (r.status === 'completed') completed.push(r);
      else if (r.due_date < today) overdue.push(r);
      else if (r.due_date === today) todayList.push(r);
      else upcoming.push(r);
    });
    return { overdue, today: todayList, upcoming, completed };
  }, [rows, today]);

  const create = async () => {
    if (!form.title || !form.due_date) { toast({ title: 'Title & date required', variant: 'destructive' }); return; }
    const { error } = await (supabase as any).from('reminders').insert([form]);
    if (error) toast({ title: 'Failed', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Reminder added' }); setOpen(false); setForm({ title: '', description: '', category: 'general', due_date: '', priority: 'medium' }); load(); }
  };
  const complete = async (id: string) => { await (supabase as any).from('reminders').update({ status: 'completed' }).eq('id', id); load(); };
  const del = async (id: string) => { await (supabase as any).from('reminders').delete().eq('id', id); load(); };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">Reminders</h1>
            <p className="text-muted-foreground">Track follow-ups, renewals and tasks.</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" />New Reminder</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New Reminder</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Title *</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
                <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Category</Label>
                    <Select value={form.category} onValueChange={v => setForm({ ...form, category: v as Cat })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{CATS.map(c => <SelectItem key={c} value={c} className="capitalize">{c.replace('_', ' ')}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Priority</Label>
                    <Select value={form.priority} onValueChange={v => setForm({ ...form, priority: v as Prio })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{(['low','medium','high'] as Prio[]).map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div><Label>Due date *</Label><Input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} /></div>
                <Button onClick={create} className="w-full">Create</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatBox label="Overdue" value={grouped.overdue.length} tone="text-rose-600" />
          <StatBox label="Today" value={grouped.today.length} tone="text-amber-600" />
          <StatBox label="Upcoming" value={grouped.upcoming.length} tone="text-sky-600" />
          <StatBox label="Completed" value={grouped.completed.length} tone="text-emerald-600" />
        </div>

        <Section title="Overdue" items={grouped.overdue} onComplete={complete} onDelete={del} />
        <Section title="Today" items={grouped.today} onComplete={complete} onDelete={del} />
        <Section title="Upcoming" items={grouped.upcoming} onComplete={complete} onDelete={del} />
        <Section title="Completed" items={grouped.completed} onComplete={complete} onDelete={del} muted />
      </div>
    </AdminLayout>
  );
}

function StatBox({ label, value, tone }: { label: string; value: number; tone: string }) {
  return <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">{label}</p><p className={`text-2xl font-bold ${tone}`}>{value}</p></CardContent></Card>;
}

function Section({ title, items, onComplete, onDelete, muted = false }: any) {
  if (items.length === 0) return null;
  return (
    <div>
      <h2 className="font-semibold mb-2">{title}</h2>
      <div className="space-y-2">
        {items.map((r: any) => (
          <Card key={r.id} className={muted ? 'opacity-70' : ''}><CardContent className="p-4 flex flex-wrap gap-3 items-start justify-between">
            <div className="flex gap-3 min-w-0">
              <Bell className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <p className={`font-medium ${r.status === 'completed' ? 'line-through' : ''}`}>{r.title}</p>
                  <Badge className={PRIO_TONE[r.priority as Prio]}>{r.priority}</Badge>
                  <Badge variant="outline" className="capitalize">{r.category.replace('_', ' ')}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">Due {r.due_date}</p>
                {r.description && <p className="text-xs mt-1">{r.description}</p>}
              </div>
            </div>
            <div className="flex gap-2">
              {r.status !== 'completed' && <Button size="sm" variant="outline" onClick={() => onComplete(r.id)}><Check className="h-4 w-4 mr-1" />Done</Button>}
              <Button size="icon" variant="ghost" onClick={() => onDelete(r.id)}><Trash2 className="h-4 w-4 text-rose-500" /></Button>
            </div>
          </CardContent></Card>
        ))}
      </div>
    </div>
  );
}
