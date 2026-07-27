import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTeacherCtx } from '@/contexts/TeacherContext';
import { PortalSkeleton } from '@/components/portal/PortalSkeleton';
import { EmptyState } from '@/components/portal/EmptyState';
import { CalendarCheck } from 'lucide-react';
import { notifyAttendanceMarked, notifyStudentAbsent } from '@/lib/notify';

type Status = 'present' | 'absent' | 'leave' | 'half_day';
const COLORS: Record<Status, string> = {
  present: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  absent: 'bg-rose-100 text-rose-700 border-rose-300',
  leave: 'bg-amber-100 text-amber-700 border-amber-300',
  half_day: 'bg-sky-100 text-sky-700 border-sky-300',
};

export default function TeacherAttendance() {
  const { loading: tLoad, assignments, classMap, sectionMap } = useTeacherCtx();
  const { toast } = useToast();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [selKey, setSelKey] = useState<string>('');
  const [students, setStudents] = useState<any[]>([]);
  const [marks, setMarks] = useState<Record<string, Status>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  const classChoices = useMemo(() => {
    const m = new Map<string, { class_id: string; section_id: string | null; label: string }>();
    for (const a of assignments) {
      const key = `${a.class_id}|${a.section_id ?? ''}`;
      const label = `${classMap[a.class_id] ?? 'Class'}${a.section_id ? ` · ${sectionMap[a.section_id]}` : ''}`;
      m.set(key, { class_id: a.class_id, section_id: a.section_id, label });
    }
    return Array.from(m.values()).map(v => ({ ...v, key: `${v.class_id}|${v.section_id ?? ''}` }));
  }, [assignments, classMap, sectionMap]);

  useEffect(() => { if (!selKey && classChoices.length) setSelKey(classChoices[0].key); }, [classChoices, selKey]);

  const selected = classChoices.find(c => c.key === selKey);

  useEffect(() => {
    if (!selected) return;
    (async () => {
      setLoading(true);
      let q = supabase.from('students').select('id,name,admission_number').eq('class_id', selected.class_id);
      if (selected.section_id) q = q.eq('section_id', selected.section_id);
      const { data: studs } = await q.order('name');
      setStudents(studs ?? []);
      const ids = (studs ?? []).map((s: any) => s.id);
      const { data: existing } = ids.length
        ? await supabase.from('attendance').select('student_id,status').eq('date', date).in('student_id', ids)
        : { data: [] as any[] };
      const init: Record<string, Status> = {};
      (studs ?? []).forEach((s: any) => { init[s.id] = 'present'; });
      (existing ?? []).forEach((e: any) => { init[e.student_id] = e.status as Status; });
      setMarks(init);
      setLoading(false);
    })();
  }, [selected, date]);

  const setAll = (s: Status) => {
    const m: Record<string, Status> = {};
    students.forEach(st => { m[st.id] = s; });
    setMarks(m);
  };

  const save = async () => {
    if (!selected) return;
    setSaving(true);
    const rows = students.map(st => ({
      student_id: st.id, date, status: marks[st.id] ?? 'present',
      class_id: selected.class_id, section_id: selected.section_id,
    }));
    const { error } = await supabase.from('attendance').upsert(rows, { onConflict: 'student_id,date' });
    setSaving(false);
    if (error) { toast({ title: 'Save failed', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Attendance saved', description: `${rows.length} students updated.` });
    if (selected.section_id) void notifyAttendanceMarked(selected.section_id, date).catch(() => {});
    rows.filter(r => r.status === 'absent').forEach(r => { void notifyStudentAbsent(r.student_id, date).catch(() => {}); });
  };

  if (tLoad) return <PortalSkeleton />;
  if (!classChoices.length)
    return <EmptyState icon={CalendarCheck} title="No classes" description="You have no assigned classes yet." />;

  return (
    <div className="space-y-3">
      <h2 className="font-display text-lg font-semibold">Mark Attendance</h2>
      <Card><CardContent className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-muted-foreground">Class</label>
            <Select value={selKey} onValueChange={setSelKey}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{classChoices.map(c => <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Date</label>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          {(['present', 'absent', 'leave', 'half_day'] as Status[]).map(s => (
            <Button key={s} size="sm" variant="outline" onClick={() => setAll(s)}>Mark all {s.replace('_', ' ')}</Button>
          ))}
        </div>
      </CardContent></Card>

      {loading ? <PortalSkeleton /> : (
        <Card><CardContent className="p-2 divide-y">
          {students.map(s => (
            <div key={s.id} className="flex items-center justify-between py-2 px-2 gap-2">
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{s.name}</p>
                <p className="text-[11px] text-muted-foreground">{s.admission_number}</p>
              </div>
              <div className="flex gap-1">
                {(['present', 'absent', 'leave', 'half_day'] as Status[]).map(st => (
                  <button
                    key={st}
                    onClick={() => setMarks(m => ({ ...m, [s.id]: st }))}
                    className={`text-[10px] px-2 py-1 rounded border ${marks[s.id] === st ? COLORS[st] : 'bg-background text-muted-foreground border-input'}`}
                  >
                    {st === 'half_day' ? 'Half' : st[0].toUpperCase() + st.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          ))}
          {students.length === 0 && <p className="text-sm text-muted-foreground p-4 text-center">No students in this class.</p>}
        </CardContent></Card>
      )}

      <Button onClick={save} disabled={saving || students.length === 0} className="w-full bg-teal-600 hover:bg-teal-700">
        {saving ? 'Saving…' : 'Save Attendance'}
      </Button>
    </div>
  );
}
