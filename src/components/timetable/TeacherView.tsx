import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { getCollection } from '@/mock/db';
import { WEEKDAYS, type TimetableRecord, type Weekday } from '@/lib/timetable/types';
import { listExtras } from '@/lib/timetable/extra';
import { listSubstitutes } from '@/lib/timetable/substitutes';
import { MonthlyCalendar } from './MonthlyCalendar';
import { TodaySchedule } from './TodaySchedule';

interface Props { teacherId: string; teacherName?: string; }

export function TeacherView({ teacherId, teacherName }: Props) {
  const tables = useMemo(() => getCollection<TimetableRecord>('timetables').filter(t => t.status === 'published'), []);
  const teacherNames = useMemo(() => Object.fromEntries(getCollection<any>('teachers').map((t: any) => [t.id, t.name])), []);
  const extras = useMemo(() => listExtras({ teacherId }), [teacherId]);
  const subs = useMemo(() => listSubstitutes({ teacherId }), [teacherId]);
  const exams = useMemo(() => getCollection<any>('exam_schedules').filter(e => e.status === 'published'), []);

  const myPeriods = useMemo(() => tables.flatMap(t => t.periods
    .filter(p => p.teacherId === teacherId && p.kind === 'class')
    .map(p => ({ ...p, class: `${t.className}-${t.section}` }))), [tables, teacherId]);

  const byDay: Record<Weekday, typeof myPeriods> = {} as any;
  WEEKDAYS.forEach(d => (byDay[d] = []));
  myPeriods.forEach(p => byDay[p.day].push(p));
  WEEKDAYS.forEach(d => byDay[d].sort((a, b) => a.start.localeCompare(b.start)));

  const invDuties = exams.flatMap(e => (e.slots ?? []).filter((s: any) => (s.invigilatorIds ?? []).includes(teacherId)));
  const totalWeekly = myPeriods.length;
  const workingDays = WEEKDAYS.filter(d => byDay[d].length > 0).length;
  const avgPerDay = workingDays ? Math.round((totalWeekly / workingDays) * 10) / 10 : 0;
  const maxPerDay = 8;
  const freeSlots = WEEKDAYS.reduce((n, d) => n + Math.max(0, maxPerDay - byDay[d].length), 0);

  const fakeTT: TimetableRecord = {
    id: 'tv', kind: 'academic', status: 'published', version: 1,
    academicYear: '', className: teacherName ?? teacherId, section: '',
    workingDays: WEEKDAYS.slice(0, 6),
    startTime: '08:00', endTime: '15:00', periodDuration: 45, breakDuration: 15, breakCount: 0,
    periods: myPeriods.map(p => ({ ...p, subject: `${p.subject} (${p.class})` })),
    createdAt: '', updatedAt: '',
  };

  return (
    <Tabs defaultValue="today">
      <div className="flex items-center justify-between mb-3">
        <TabsList>
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="week">Week</TabsTrigger>
          <TabsTrigger value="month">Month</TabsTrigger>
          <TabsTrigger value="exam">Exam Duties</TabsTrigger>
          <TabsTrigger value="extras">Extra & Sub</TabsTrigger>
        </TabsList>
        <Button size="sm" variant="outline" onClick={() => window.print()}><Printer className="h-3 w-3 mr-1" />Print</Button>
      </div>

      <div className="grid grid-cols-4 gap-2 mb-3">
        <Card><CardContent className="p-3"><p className="text-xs text-muted-foreground">Weekly Periods</p><p className="text-xl font-bold">{totalWeekly}</p></CardContent></Card>
        <Card><CardContent className="p-3"><p className="text-xs text-muted-foreground">Avg / Day</p><p className="text-xl font-bold">{avgPerDay}</p></CardContent></Card>
        <Card><CardContent className="p-3"><p className="text-xs text-muted-foreground">Free Slots</p><p className="text-xl font-bold">{freeSlots}</p></CardContent></Card>
        <Card><CardContent className="p-3"><p className="text-xs text-muted-foreground">Extras / Subs</p><p className="text-xl font-bold">{extras.length + subs.length}</p></CardContent></Card>
      </div>

      <TabsContent value="today"><TodaySchedule timetable={fakeTT} teacherNames={teacherNames} title="Today's Classes" /></TabsContent>

      <TabsContent value="week">
        <Card><CardContent className="p-3 overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead><tr className="bg-muted/50"><th className="p-2 text-left">Day</th><th className="p-2 text-left">Schedule</th></tr></thead>
            <tbody>{WEEKDAYS.slice(0, 6).map(d => (
              <tr key={d} className="border-t">
                <td className="p-2 font-medium align-top w-16">{d}</td>
                <td className="p-2">
                  {byDay[d].length === 0 && <span className="text-muted-foreground">Free</span>}
                  <div className="flex flex-wrap gap-1">
                    {byDay[d].map(p => (
                      <Badge key={p.id} variant="secondary" className="text-[10px]">{p.start} · {p.subject} · {p.class}{p.room ? ` · ${p.room}` : ''}</Badge>
                    ))}
                  </div>
                </td>
              </tr>
            ))}</tbody>
          </table>
        </CardContent></Card>
      </TabsContent>

      <TabsContent value="month"><MonthlyCalendar teacherId={teacherId} /></TabsContent>

      <TabsContent value="exam">
        <Card><CardContent className="p-3 space-y-1">
          {invDuties.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No invigilation duties.</p>}
          {invDuties.map((s: any) => (
            <div key={s.id} className="border rounded p-2 text-xs flex justify-between">
              <span>{s.date} · {s.start}–{s.end} · {s.subject}</span>
              <Badge variant="outline">Class {s.className}-{s.section}</Badge>
            </div>
          ))}
        </CardContent></Card>
      </TabsContent>

      <TabsContent value="extras">
        <div className="space-y-3">
          <Card><CardContent className="p-3 space-y-1">
            <h4 className="font-semibold text-sm mb-1">Extra Classes</h4>
            {extras.length === 0 && <p className="text-xs text-muted-foreground">None scheduled.</p>}
            {extras.map(e => <div key={e.id} className="text-xs border rounded p-2"><Badge className="mr-2">{e.kind}</Badge>{e.date} {e.start}–{e.end} · {e.subject} · {e.className}-{e.section}</div>)}
          </CardContent></Card>
          <Card><CardContent className="p-3 space-y-1">
            <h4 className="font-semibold text-sm mb-1">Substitute History</h4>
            {subs.length === 0 && <p className="text-xs text-muted-foreground">No substitute records.</p>}
            {subs.map(s => <div key={s.id} className="text-xs border rounded p-2">{s.date} · Original: {s.originalTeacherId} → Sub: {s.substituteTeacherId} {s.reason && <span className="text-muted-foreground">· {s.reason}</span>}</div>)}
          </CardContent></Card>
        </div>
      </TabsContent>
    </Tabs>
  );
}
