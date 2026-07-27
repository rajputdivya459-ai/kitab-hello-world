import { useEffect, useMemo, useState } from 'react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type Status = 'present' | 'absent' | 'leave' | 'half_day';
const STATUSES: Status[] = ['present', 'absent', 'leave', 'half_day'];
const COLOR: Record<Status, string> = {
  present: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  absent: 'bg-rose-100 text-rose-700 border-rose-300',
  leave: 'bg-amber-100 text-amber-700 border-amber-300',
  half_day: 'bg-sky-100 text-sky-700 border-sky-300',
};

export default function AdminStaffAttendance() {
  const { toast } = useToast();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [staff, setStaff] = useState<any[]>([]);
  const [marks, setMarks] = useState<Record<string, Status>>({});
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data: s } = await (supabase as any).from('staff').select('id,full_name,staff_code,role').eq('status', 'active').order('full_name');
    setStaff(s ?? []);
    const ids = (s ?? []).map((x: any) => x.id);
    const { data: ex } = ids.length
      ? await (supabase as any).from('staff_attendance').select('staff_id,status').eq('date', date).in('staff_id', ids)
      : { data: [] as any[] };
    const init: Record<string, Status> = {};
    (s ?? []).forEach((x: any) => { init[x.id] = 'present'; });
    (ex ?? []).forEach((e: any) => { init[e.staff_id] = e.status as Status; });
    setMarks(init);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [date]);

  const setAll = (s: Status) => {
    const m: Record<string, Status> = {};
    staff.forEach(x => { m[x.id] = s; });
    setMarks(m);
  };

  const save = async () => {
    setSaving(true);
    const rows = staff.map(x => ({ staff_id: x.id, date, status: marks[x.id] ?? 'present' }));
    const { error } = await (supabase as any).from('staff_attendance').upsert(rows, { onConflict: 'staff_id,date' });
    setSaving(false);
    if (error) toast({ title: 'Failed', description: error.message, variant: 'destructive' });
    else toast({ title: 'Saved', description: `${rows.length} staff updated.` });
  };

  const summary = useMemo(() => {
    const c: Record<Status, number> = { present: 0, absent: 0, leave: 0, half_day: 0 };
    Object.values(marks).forEach(s => { c[s] = (c[s] ?? 0) + 1; });
    return c;
  }, [marks]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Staff Attendance</h1>
          <p className="text-muted-foreground">Track daily presence for all staff members.</p>
        </div>

        <Card><CardContent className="p-4 flex flex-wrap items-end gap-3">
          <div>
            <label className="text-xs text-muted-foreground">Date</label>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-[180px]" />
          </div>
          <div className="flex flex-wrap gap-2 ml-auto">
            {STATUSES.map(s => (
              <Button key={s} variant="outline" size="sm" onClick={() => setAll(s)}>
                All {s.replace('_', ' ')}
              </Button>
            ))}
          </div>
        </CardContent></Card>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {STATUSES.map(s => (
            <Card key={s}><CardContent className="p-4">
              <p className="text-xs text-muted-foreground capitalize">{s.replace('_', ' ')}</p>
              <p className="text-2xl font-bold">{summary[s]}</p>
            </CardContent></Card>
          ))}
        </div>

        <Card><CardContent className="p-2 divide-y">
          {staff.map(x => (
            <div key={x.id} className="flex items-center justify-between py-3 px-3 gap-3">
              <div className="min-w-0">
                <p className="font-medium text-sm">{x.full_name}</p>
                <p className="text-[11px] text-muted-foreground">{x.staff_code} · <span className="capitalize">{x.role}</span></p>
              </div>
              <div className="flex gap-1">
                {STATUSES.map(s => (
                  <button key={s}
                    onClick={() => setMarks(m => ({ ...m, [x.id]: s }))}
                    className={`text-[11px] px-2 py-1 rounded border ${marks[x.id] === s ? COLOR[s] : 'bg-background text-muted-foreground border-input'}`}>
                    {s === 'half_day' ? 'Half' : s[0].toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          ))}
          {staff.length === 0 && <p className="text-sm text-muted-foreground p-6 text-center">No active staff.</p>}
        </CardContent></Card>

        <Button onClick={save} disabled={saving || staff.length === 0} className="w-full md:w-auto">
          {saving ? 'Saving…' : 'Save Attendance'}
        </Button>
      </div>
    </AdminLayout>
  );
}
