import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { getCollection } from '@/mock/db';
import { teacherWorkload, subjectDistribution, roomUtilization, freePeriodAnalysis, classLoad, extraClassSummary } from '@/lib/timetable/analytics';
import { exportCSV } from '@/lib/export';

export function AnalyticsPanel() {
  const teacherNames = useMemo(() => Object.fromEntries(getCollection<any>('teachers').map((t: any) => [t.id, t.name])), []);
  const load = teacherWorkload();
  const subs = subjectDistribution();
  const rooms = roomUtilization();
  const free = freePeriodAnalysis();
  const classes = classLoad();
  const extras = extraClassSummary();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-3"><p className="text-xs text-muted-foreground">Total teachers</p><p className="text-xl font-bold">{load.length}</p></CardContent></Card>
        <Card><CardContent className="p-3"><p className="text-xs text-muted-foreground">Subjects</p><p className="text-xl font-bold">{subs.length}</p></CardContent></Card>
        <Card><CardContent className="p-3"><p className="text-xs text-muted-foreground">Rooms used</p><p className="text-xl font-bold">{rooms.length}</p></CardContent></Card>
        <Card><CardContent className="p-3"><p className="text-xs text-muted-foreground">Free periods</p><p className="text-xl font-bold">{free.free}<span className="text-xs text-muted-foreground"> / {free.total} ({free.pct}%)</span></p></CardContent></Card>
      </div>

      <Card><CardContent className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Teacher Workload</h3>
          <Button size="sm" variant="outline" onClick={() => exportCSV('teacher-workload', load.map(l => ({ teacher: teacherNames[l.teacherId] ?? l.teacherId, periods: l.periods, subjects: [...l.subjects].join(';'), classes: [...l.classes].join(';') })), [{ key: 'teacher', label: 'Teacher' }, { key: 'periods', label: 'Periods' }, { key: 'subjects', label: 'Subjects' }, { key: 'classes', label: 'Classes' }])}><Download className="h-3 w-3 mr-1" />CSV</Button>
        </div>
        {load.map(l => (
          <div key={l.teacherId} className="flex items-center gap-2 text-xs">
            <span className="w-32 truncate">{teacherNames[l.teacherId] ?? l.teacherId}</span>
            <div className="flex-1 h-2 bg-muted rounded overflow-hidden">
              <div className="h-full bg-primary" style={{ width: `${Math.min(100, (l.periods / 40) * 100)}%` }} />
            </div>
            <span className="w-20 text-right">{l.periods} periods</span>
          </div>
        ))}
      </CardContent></Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card><CardContent className="p-3 space-y-1">
          <h3 className="font-semibold mb-2">Subject Distribution</h3>
          {subs.map(s => <div key={s.subject} className="flex justify-between text-xs"><span>{s.subject}</span><Badge variant="secondary">{s.periods}</Badge></div>)}
        </CardContent></Card>
        <Card><CardContent className="p-3 space-y-1">
          <h3 className="font-semibold mb-2">Room Utilization</h3>
          {rooms.map(r => <div key={r.room} className="flex justify-between text-xs"><span>{r.room}</span><Badge>{r.used} · {r.pct}%</Badge></div>)}
          {rooms.length === 0 && <p className="text-xs text-muted-foreground">No room data.</p>}
        </CardContent></Card>
        <Card><CardContent className="p-3 space-y-1">
          <h3 className="font-semibold mb-2">Class Load</h3>
          {classes.map(c => <div key={c.label} className="flex justify-between text-xs"><span>{c.label}</span><span>{c.periods} classes · {c.free} free</span></div>)}
        </CardContent></Card>
        <Card><CardContent className="p-3 space-y-1">
          <h3 className="font-semibold mb-2">Extra Classes</h3>
          <p className="text-xs">Total: <b>{extras.total}</b></p>
          {extras.byKind.map(k => <div key={k.kind} className="flex justify-between text-xs"><span className="capitalize">{k.kind}</span><Badge variant="secondary">{k.count}</Badge></div>)}
        </CardContent></Card>
      </div>
    </div>
  );
}
