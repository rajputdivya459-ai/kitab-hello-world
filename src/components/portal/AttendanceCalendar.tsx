import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Rec { date: string; status: string }
const META: Record<string, { short: string; cls: string }> = {
  present:  { short: 'P', cls: 'bg-emerald-100 text-emerald-700' },
  absent:   { short: 'A', cls: 'bg-rose-100 text-rose-700' },
  leave:    { short: 'L', cls: 'bg-amber-100 text-amber-700' },
  half_day: { short: 'H', cls: 'bg-sky-100 text-sky-700' },
};

interface CalProps { records: Rec[]; month?: number; year?: number; onMonthChange?: (m: number) => void; onYearChange?: (y: number) => void }
export function AttendanceCalendar({ records, month: ctlM, year: ctlY, onMonthChange, onYearChange }: CalProps) {
  const [internal, setInternal] = useState(() => { const d = new Date(); d.setDate(1); return d; });
  const controlled = ctlM != null && ctlY != null;
  const year = controlled ? (ctlY as number) : internal.getFullYear();
  const month = controlled ? (ctlM as number) : internal.getMonth();
  const setCursor = (d: Date) => {
    if (controlled) { onMonthChange?.(d.getMonth()); onYearChange?.(d.getFullYear()); }
    else setInternal(d);
  };
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startWeekday = new Date(year, month, 1).getDay();


  const byDate = useMemo(() => {
    const m: Record<string, string> = {};
    records.forEach(r => { m[r.date] = r.status; });
    return m;
  }, [records]);

  const monthRecs = useMemo(() => records.filter(r => r.date.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`)), [records, year, month]);
  const present = monthRecs.filter(r => r.status === 'present' || r.status === 'half_day').length;
  const pct = monthRecs.length ? Math.round((present / monthRecs.length) * 100) : 0;

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-base">{new Date(year, month, 1).toLocaleString('default', { month: 'long' })} {year}</CardTitle>
        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setCursor(new Date(year, month - 1, 1))}><ChevronLeft className="h-4 w-4" /></Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setCursor(new Date(year, month + 1, 1))}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-muted-foreground mb-1">
          {['S','M','T','W','T','F','S'].map((d, i) => <div key={i}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: startWeekday }).map((_, i) => <div key={`b${i}`} />)}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => {
            const ds = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const st = byDate[ds];
            const m = st ? META[st] : null;
            return (
              <div key={d} className={`aspect-square rounded-md flex flex-col items-center justify-center text-[10px] border ${m ? m.cls + ' border-transparent' : 'bg-background text-muted-foreground border-border'}`}>
                <span className="font-medium">{d}</span>
                {m && <span className="text-[9px] font-bold leading-none">{m.short}</span>}
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex items-center justify-between text-xs">
          <div className="flex flex-wrap gap-2">
            {Object.entries(META).map(([k, v]) => (
              <span key={k} className={`px-1.5 py-0.5 rounded ${v.cls}`}>{v.short} {k.replace('_', ' ')}</span>
            ))}
          </div>
          <span className="font-semibold">{pct}%</span>
        </div>
      </CardContent>
    </Card>
  );
}
