import { Card, CardContent } from '@/components/ui/card';
import { Clock, Coffee } from 'lucide-react';
import { WEEKDAYS, type TimetableRecord, type Weekday } from '@/lib/timetable/types';

function todayLabel(): Weekday {
  const idx = (new Date().getDay() + 6) % 7; // Mon = 0
  return WEEKDAYS[idx];
}

interface Props {
  timetable?: TimetableRecord;
  teacherNames?: Record<string, string>;
  title?: string;
}

export function TodaySchedule({ timetable, teacherNames = {}, title = "Today's Timetable" }: Props) {
  const today = todayLabel();
  const periods = timetable?.periods
    .filter(p => p.day === today)
    .sort((a, b) => a.index - b.index) ?? [];

  return (
    <Card>
      <CardContent className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">{title}</h3>
          <span className="text-xs text-muted-foreground">{today}</span>
        </div>
        {!timetable && <p className="text-xs text-muted-foreground text-center py-4">No published timetable yet.</p>}
        {timetable && periods.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No classes scheduled today.</p>}
        <div className="divide-y">
          {periods.map(p => (
            <div key={p.id} className="py-2 flex items-center gap-3">
              <div className="text-[11px] font-mono text-muted-foreground w-20 shrink-0">
                {p.start}<br /><span className="opacity-60">{p.end}</span>
              </div>
              <div className="flex-1 min-w-0">
                {p.kind === 'break' ? (
                  <p className="text-sm text-amber-700 flex items-center gap-1"><Coffee className="h-3 w-3" />{p.subject}</p>
                ) : (
                  <>
                    <p className="text-sm font-medium truncate">{p.subject}</p>
                    {p.teacherId && <p className="text-[11px] text-muted-foreground truncate">{teacherNames[p.teacherId] ?? p.teacherId}{p.room ? ` · ${p.room}` : ''}</p>}
                  </>
                )}
              </div>
              {p.kind === 'class' && <Clock className="h-3 w-3 text-muted-foreground shrink-0" />}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
