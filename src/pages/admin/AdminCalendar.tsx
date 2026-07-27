import { useEffect, useMemo, useState } from 'react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ChevronLeft, ChevronRight, Plus, Trash2, CalendarDays } from 'lucide-react';

type EventType = 'holiday' | 'exam' | 'event' | 'meeting' | 'vacation';
const TYPE_TONE: Record<EventType, string> = {
  holiday: 'bg-rose-100 text-rose-700 border-rose-300',
  exam: 'bg-amber-100 text-amber-700 border-amber-300',
  event: 'bg-sky-100 text-sky-700 border-sky-300',
  meeting: 'bg-violet-100 text-violet-700 border-violet-300',
  vacation: 'bg-emerald-100 text-emerald-700 border-emerald-300',
};

interface EventRow {
  id: string; title: string; description: string | null; event_type: EventType;
  start_date: string; end_date: string; is_public: boolean;
}

export default function AdminCalendar() {
  const { toast } = useToast();
  const [cursor, setCursor] = useState(() => { const d = new Date(); d.setDate(1); return d; });
  const [events, setEvents] = useState<EventRow[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', event_type: 'event' as EventType, start_date: '', end_date: '', is_public: true });

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startWeekday = new Date(year, month, 1).getDay();
  const monthStart = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const monthEnd = `${year}-${String(month + 1).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

  const load = async () => {
    const { data } = await (supabase as any).from('calendar_events').select('*')
      .lte('start_date', monthEnd).gte('end_date', monthStart).order('start_date');
    setEvents((data ?? []) as EventRow[]);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [year, month]);

  const eventsByDay = useMemo(() => {
    const m: Record<number, EventRow[]> = {};
    events.forEach(e => {
      const s = new Date(e.start_date), en = new Date(e.end_date);
      for (let d = 1; d <= daysInMonth; d++) {
        const day = new Date(year, month, d);
        if (day >= new Date(s.getFullYear(), s.getMonth(), s.getDate()) && day <= new Date(en.getFullYear(), en.getMonth(), en.getDate())) {
          (m[d] ||= []).push(e);
        }
      }
    });
    return m;
  }, [events, year, month, daysInMonth]);

  const save = async () => {
    if (!form.title || !form.start_date || !form.end_date) { toast({ title: 'Fill all required fields', variant: 'destructive' }); return; }
    const { error } = await (supabase as any).from('calendar_events').insert([form]);
    if (error) toast({ title: 'Failed', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Event created' }); setOpen(false); setForm({ title: '', description: '', event_type: 'event', start_date: '', end_date: '', is_public: true }); load(); }
  };
  const del = async (id: string) => {
    const { error } = await (supabase as any).from('calendar_events').delete().eq('id', id);
    if (error) toast({ title: 'Failed', variant: 'destructive' }); else load();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">Academic Calendar</h1>
            <p className="text-muted-foreground">Holidays, exams, school events and meetings.</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" />New Event</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New Calendar Event</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Title *</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
                <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
                <div><Label>Type</Label>
                  <Select value={form.event_type} onValueChange={v => setForm(f => ({ ...f, event_type: v as EventType }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{(['holiday','exam','event','meeting','vacation'] as EventType[]).map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Start date *</Label><Input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} /></div>
                  <div><Label>End date *</Label><Input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} /></div>
                </div>
                <div className="flex items-center gap-2"><Switch checked={form.is_public} onCheckedChange={v => setForm(f => ({ ...f, is_public: v }))} /><Label>Visible to parents & students</Label></div>
                <Button onClick={save} className="w-full">Create Event</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2"><CalendarDays className="h-4 w-4" /> {cursor.toLocaleString('default', { month: 'long' })} {year}</CardTitle>
            <div className="flex gap-1">
              <Button size="icon" variant="ghost" onClick={() => setCursor(new Date(year, month - 1, 1))}><ChevronLeft className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" onClick={() => setCursor(new Date(year, month + 1, 1))}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-muted-foreground mb-1">
              {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <div key={d}>{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: startWeekday }).map((_, i) => <div key={`b${i}`} />)}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => (
                <div key={d} className="aspect-square sm:aspect-[4/3] border rounded-md p-1 text-left bg-background min-h-[60px]">
                  <p className="text-[11px] font-medium">{d}</p>
                  <div className="space-y-0.5">
                    {(eventsByDay[d] ?? []).slice(0, 2).map(e => (
                      <p key={e.id} className={`text-[9px] truncate px-1 rounded ${TYPE_TONE[e.event_type]}`} title={e.title}>{e.title}</p>
                    ))}
                    {(eventsByDay[d] ?? []).length > 2 && <p className="text-[9px] text-muted-foreground">+{eventsByDay[d].length - 2}</p>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Events this month</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {events.length === 0 ? <p className="text-sm text-muted-foreground">No events.</p> :
              events.map(e => (
                <div key={e.id} className="flex items-center justify-between border rounded-lg p-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-medium text-sm">{e.title}</p>
                      <Badge className={TYPE_TONE[e.event_type]}>{e.event_type}</Badge>
                      {!e.is_public && <Badge variant="outline">internal</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">{e.start_date} → {e.end_date}</p>
                    {e.description && <p className="text-xs mt-1">{e.description}</p>}
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => del(e.id)}><Trash2 className="h-4 w-4 text-rose-500" /></Button>
                </div>
              ))}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
