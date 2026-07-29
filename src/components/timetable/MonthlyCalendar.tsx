import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { listHolidays } from '@/lib/timetable/holidays';
import { listExtras } from '@/lib/timetable/extra';
import { getCollection } from '@/mock/db';
import type { TimetableRecord, Weekday } from '@/lib/timetable/types';

const WD: Weekday[] = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const weekdayOf = (d: Date): Weekday => WD[(d.getDay() + 6) % 7];

interface Props {
  className?: string;
  section?: string;
  teacherId?: string;
}

/** Monthly overview: regular classes (count), extras, exams, holidays, events. */
export function MonthlyCalendar({ className, section, teacherId }: Props) {
  const [cursor, setCursor] = useState(() => { const d = new Date(); d.setDate(1); return d; });
  const holidays = useMemo(() => listHolidays(), [cursor]);
  const extras = useMemo(() => listExtras({ className, section, teacherId }), [cursor, className, section, teacherId]);
  const exams = useMemo(() => getCollection<any>('exam_schedules').filter(e => e.status === 'published'), [cursor]);
  const tables = useMemo(() => getCollection<TimetableRecord>('timetables').filter(t => t.status === 'published'
    && (!className || t.className === className) && (!section || t.section === section)), [className, section]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIdx = (new Date(year, month, 1).getDay() + 6) % 7; // Mon=0
  const cells: Array<{ date?: Date; iso?: string }> = [];
  for (let i = 0; i < firstDayIdx; i++) cells.push({});
  for (let d = 1; d <= daysInMonth; d++) {
    const dt = new Date(year, month, d);
    cells.push({ date: dt, iso: dt.toISOString().slice(0, 10) });
  }

  const monthLabel = cursor.toLocaleString(undefined, { month: 'long', year: 'numeric' });

  return (
    <Card><CardContent className="p-3 space-y-3">
      <div className="flex items-center justify-between">
        <Button size="sm" variant="ghost" onClick={() => setCursor(new Date(year, month - 1, 1))}><ChevronLeft className="h-4 w-4" /></Button>
        <h3 className="font-semibold text-sm">{monthLabel}</h3>
        <Button size="sm" variant="ghost" onClick={() => setCursor(new Date(year, month + 1, 1))}><ChevronRight className="h-4 w-4" /></Button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-[10px] font-medium text-muted-foreground">
        {WD.map(d => <div key={d} className="text-center p-1">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((c, i) => {
          if (!c.date) return <div key={i} className="min-h-[70px] rounded-md bg-muted/20" />;
          const hol = holidays.find(h => h.date === c.iso);
          const dayExtras = extras.filter(e => e.date === c.iso);
          const dayExams = exams.flatMap(e => (e.slots ?? []).filter((s: any) => s.date === c.iso
            && (!className || s.className === className) && (!section || s.section === section)));
          const wd = weekdayOf(c.date);
          const regularCount = hol ? 0 : tables.reduce((n, t) => n + t.periods.filter(p => p.day === wd && p.kind === 'class').length, 0);
          const isToday = c.iso === new Date().toISOString().slice(0, 10);
          return (
            <div key={i} className={cn(
              'min-h-[70px] rounded-md border p-1 text-[10px] space-y-0.5 overflow-hidden',
              hol && 'bg-rose-50 border-rose-200',
              isToday && 'ring-2 ring-primary',
            )}>
              <div className="font-semibold">{c.date.getDate()}</div>
              {hol && <Badge variant="destructive" className="text-[8px] px-1 py-0">{hol.name.slice(0, 12)}</Badge>}
              {!hol && regularCount > 0 && <div className="text-muted-foreground">{regularCount} cls</div>}
              {dayExtras.map(e => <div key={e.id} className="text-emerald-700 truncate">+{e.subject}</div>)}
              {dayExams.slice(0, 2).map((s: any) => <div key={s.id} className="text-purple-700 truncate">Ex: {s.subject}</div>)}
            </div>
          );
        })}
      </div>
      <div className="flex gap-3 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-rose-100 border border-rose-200" />Holiday</span>
        <span className="flex items-center gap-1"><span className="text-emerald-700">+</span>Extra</span>
        <span className="flex items-center gap-1"><span className="text-purple-700">Ex</span> Exam</span>
      </div>
    </CardContent></Card>
  );
}
