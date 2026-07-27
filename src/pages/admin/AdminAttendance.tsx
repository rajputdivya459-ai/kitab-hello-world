import { useEffect, useMemo, useState } from 'react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { useCourseStructure } from '@/hooks/useCourseStructure';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { CalendarCheck, Users, Percent, Download, Save, UserX, CalendarDays } from 'lucide-react';
import { notifyAttendanceMarked, notifyStudentAbsent } from '@/lib/notify';

type Status = 'present' | 'absent' | 'leave' | 'half_day';
const STATUS_META: Record<Status, { label: string; short: string; cls: string }> = {
  present:  { label: 'Present',  short: 'P', cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  absent:   { label: 'Absent',   short: 'A', cls: 'bg-rose-100 text-rose-700 border-rose-200' },
  leave:    { label: 'Leave',    short: 'L', cls: 'bg-amber-100 text-amber-700 border-amber-200' },
  half_day: { label: 'Half Day', short: 'H', cls: 'bg-sky-100 text-sky-700 border-sky-200' },
};

interface StudentRow { id: string; name: string; admission_number: string | null; class_id: string | null; section_id: string | null }
interface AttRec { id?: string; student_id: string; status: Status; remarks: string | null }

const todayStr = () => new Date().toISOString().slice(0, 10);

export default function AdminAttendance() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { classes, sections, getSectionsForClass, getClassName, getSectionName } = useCourseStructure();

  const [date, setDate] = useState(todayStr());
  const [classId, setClassId] = useState<string>('');
  const [sectionId, setSectionId] = useState<string>('all');
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [draft, setDraft] = useState<Record<string, AttRec>>({});
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('mark');

  const activeClasses = useMemo(() => classes.filter(c => c.is_active), [classes]);
  const sectionOptions = useMemo(() => (classId ? getSectionsForClass(classId) : []), [classId, sections]);

  // Default to first class
  useEffect(() => { if (!classId && activeClasses[0]) setClassId(activeClasses[0].id); }, [activeClasses, classId]);

  // Load students and existing attendance when filters change
  useEffect(() => {
    if (!classId) return;
    (async () => {
      let q = supabase.from('students').select('id,name,admission_number,class_id,section_id').eq('class_id', classId).order('name');
      if (sectionId !== 'all') q = q.eq('section_id', sectionId);
      const { data: srows } = await q;
      const list = (srows ?? []) as StudentRow[];
      setStudents(list);

      if (list.length === 0) { setDraft({}); return; }
      const ids = list.map(s => s.id);
      const { data: arecs } = await supabase.from('attendance').select('id,student_id,status,remarks').in('student_id', ids).eq('date', date);
      const map: Record<string, AttRec> = {};
      list.forEach(s => { map[s.id] = { student_id: s.id, status: 'present', remarks: null }; });
      (arecs ?? []).forEach((r: any) => { map[r.student_id] = { id: r.id, student_id: r.student_id, status: r.status as Status, remarks: r.remarks }; });
      setDraft(map);
    })();
  }, [classId, sectionId, date]);

  const counts = useMemo(() => {
    const c = { present: 0, absent: 0, leave: 0, half_day: 0 };
    Object.values(draft).forEach(r => { c[r.status] += 1; });
    return c;
  }, [draft]);
  const total = students.length;
  const pct = total ? Math.round(((counts.present + counts.half_day * 0.5) / total) * 100) : 0;

  const setAll = (status: Status) => {
    setDraft(prev => {
      const next: Record<string, AttRec> = {};
      students.forEach(s => { next[s.id] = { ...(prev[s.id] ?? { student_id: s.id, remarks: null }), status }; });
      return next;
    });
  };
  const setOne = (id: string, status: Status) => setDraft(p => ({ ...p, [id]: { ...(p[id] ?? { student_id: id, remarks: null }), status } }));
  const setRemark = (id: string, remarks: string) => setDraft(p => ({ ...p, [id]: { ...(p[id] ?? { student_id: id, status: 'present', remarks: null }), remarks } }));

  const save = async () => {
    if (!classId || students.length === 0) return;
    setSaving(true);
    const rows = students.map(s => ({
      student_id: s.id,
      class_id: s.class_id,
      section_id: s.section_id,
      date,
      status: draft[s.id]?.status ?? 'present',
      remarks: draft[s.id]?.remarks ?? null,
      marked_by: user?.id ?? null,
    }));
    const { error } = await supabase.from('attendance').upsert(rows, { onConflict: 'student_id,date' });
    setSaving(false);
    if (error) { toast({ title: 'Save failed', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Attendance saved', description: `${rows.length} records for ${date}` });
    // Fire-and-forget notifications
    const sectionForNotify = sectionId !== 'all' ? sectionId : (students[0]?.section_id ?? null);
    if (sectionForNotify) void notifyAttendanceMarked(sectionForNotify, date).catch(() => {});
    rows.filter(r => r.status === 'absent').forEach(r => { void notifyStudentAbsent(r.student_id, date).catch(() => {}); });
  };

  const exportCsv = () => {
    const header = ['Roll/Admission No', 'Name', 'Status', 'Remarks'];
    const lines = students.map(s => [s.admission_number ?? '', s.name, STATUS_META[draft[s.id]?.status ?? 'present'].label, draft[s.id]?.remarks ?? '']
      .map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
    const csv = [header.join(','), ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `attendance-${getClassName(classId)}-${sectionId !== 'all' ? getSectionName(sectionId) + '-' : ''}${date}.csv`;
    a.click();
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        {/* Sticky filter bar */}
        <Card className="sticky top-16 z-20">
          <CardContent className="p-4 grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
            <div>
              <label className="text-xs text-muted-foreground">Date</label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Class</label>
              <Select value={classId} onValueChange={(v) => { setClassId(v); setSectionId('all'); }}>
                <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                <SelectContent>{activeClasses.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Section</label>
              <Select value={sectionId} onValueChange={setSectionId} disabled={!classId}>
                <SelectTrigger><SelectValue placeholder="All sections" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All sections</SelectItem>
                  {sectionOptions.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button onClick={save} disabled={saving || students.length === 0} className="flex-1"><Save className="h-4 w-4 mr-1" />Save</Button>
              <Button variant="outline" onClick={exportCsv} disabled={students.length === 0}><Download className="h-4 w-4" /></Button>
            </div>
          </CardContent>
        </Card>

        {/* Analytics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard icon={Users} label="Total" value={total} tone="bg-primary/10 text-primary" />
          <StatCard icon={CalendarCheck} label="Present" value={counts.present} tone="bg-emerald-100 text-emerald-700" />
          <StatCard icon={UserX} label="Absent" value={counts.absent} tone="bg-rose-100 text-rose-700" />
          <StatCard icon={Percent} label="Attendance" value={`${pct}%`} tone="bg-sky-100 text-sky-700" />
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="mark">Mark Attendance</TabsTrigger>
            <TabsTrigger value="monthly">Monthly View</TabsTrigger>
          </TabsList>

          <TabsContent value="mark" className="space-y-3">
            {/* Bulk actions */}
            <Card>
              <CardContent className="p-3 flex flex-wrap gap-2 items-center">
                <span className="text-sm font-medium text-muted-foreground mr-2">Mark all:</span>
                {(['present','absent','leave','half_day'] as Status[]).map(s => (
                  <Button key={s} size="sm" variant="outline" onClick={() => setAll(s)} className={STATUS_META[s].cls}>{STATUS_META[s].label}</Button>
                ))}
              </CardContent>
            </Card>

            {students.length === 0 ? (
              <Card><CardContent className="p-8 text-center text-muted-foreground">No students found for the selected filters.</CardContent></Card>
            ) : (
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead className="hidden md:table-cell">Admission #</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden md:table-cell">Remarks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map(s => {
                      const cur = draft[s.id]?.status ?? 'present';
                      return (
                        <TableRow key={s.id}>
                          <TableCell className="font-medium">{s.name}</TableCell>
                          <TableCell className="hidden md:table-cell text-muted-foreground text-xs">{s.admission_number ?? '-'}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {(['present','absent','leave','half_day'] as Status[]).map(st => (
                                <button
                                  key={st}
                                  onClick={() => setOne(s.id, st)}
                                  className={`px-2 py-1 text-xs rounded border transition ${cur === st ? STATUS_META[st].cls + ' font-semibold' : 'bg-background text-muted-foreground border-border hover:bg-muted'}`}
                                  title={STATUS_META[st].label}
                                >{STATUS_META[st].short}</button>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <Input value={draft[s.id]?.remarks ?? ''} onChange={e => setRemark(s.id, e.target.value)} placeholder="Optional note" className="h-8" />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="monthly">
            <MonthlyView classId={classId} sectionId={sectionId} students={students} anchorDate={date} />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}

function StatCard({ icon: Icon, label, value, tone }: { icon: any; label: string; value: any; tone: string }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${tone}`}><Icon className="h-5 w-5" /></div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function MonthlyView({ classId, sectionId, students, anchorDate }: { classId: string; sectionId: string; students: StudentRow[]; anchorDate: string }) {
  const [records, setRecords] = useState<{ student_id: string; date: string; status: Status }[]>([]);
  const base = new Date(anchorDate);
  const year = base.getFullYear();
  const month = base.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const monthStart = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const monthEnd = `${year}-${String(month + 1).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

  useEffect(() => {
    if (students.length === 0) { setRecords([]); return; }
    (async () => {
      const ids = students.map(s => s.id);
      const { data } = await supabase.from('attendance').select('student_id,date,status').in('student_id', ids).gte('date', monthStart).lte('date', monthEnd);
      setRecords((data ?? []) as any);
    })();
  }, [classId, sectionId, monthStart, monthEnd, students.length]);

  const byStudent: Record<string, Record<string, Status>> = {};
  records.forEach(r => { (byStudent[r.student_id] ||= {})[r.date] = r.status; });

  if (students.length === 0) return <Card><CardContent className="p-8 text-center text-muted-foreground">Select a class with students to view the monthly grid.</CardContent></Card>;

  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><CalendarDays className="h-4 w-4" /> {base.toLocaleString('default', { month: 'long' })} {year}</CardTitle></CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="text-xs border-collapse">
          <thead>
            <tr>
              <th className="sticky left-0 bg-background text-left px-2 py-1 border-b">Student</th>
              {days.map(d => <th key={d} className="px-1 py-1 border-b text-center w-7">{d}</th>)}
              <th className="px-2 py-1 border-b text-center">%</th>
            </tr>
          </thead>
          <tbody>
            {students.map(s => {
              const row = byStudent[s.id] ?? {};
              const present = Object.values(row).filter(v => v === 'present' || v === 'half_day').length;
              const totalDays = Object.values(row).length || 1;
              const p = Math.round((present / totalDays) * 100);
              return (
                <tr key={s.id} className="hover:bg-muted/40">
                  <td className="sticky left-0 bg-background px-2 py-1 border-b whitespace-nowrap font-medium">{s.name}</td>
                  {days.map(d => {
                    const ds = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                    const st = row[ds];
                    return (
                      <td key={d} className="border-b text-center">
                        {st ? <span className={`inline-block w-5 h-5 rounded text-[10px] leading-5 font-semibold ${STATUS_META[st].cls}`}>{STATUS_META[st].short}</span> : <span className="text-muted-foreground">·</span>}
                      </td>
                    );
                  })}
                  <td className="px-2 py-1 border-b text-center font-semibold">
                    <span className={p < 75 ? 'text-rose-600' : 'text-emerald-600'}>{p}%</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
