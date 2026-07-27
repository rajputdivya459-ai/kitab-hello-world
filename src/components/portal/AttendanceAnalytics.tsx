import { Card, CardContent } from '@/components/ui/card';
import { CalendarCheck, UserX, Coffee, Sun, Percent } from 'lucide-react';

interface Rec { date: string; status: string }
interface Props { records: Rec[]; month?: number; year?: number }

export function AttendanceAnalytics({ records, month, year }: Props) {
  const filtered = month != null && year != null
    ? records.filter(r => { const d = new Date(r.date); return d.getMonth() === month && d.getFullYear() === year; })
    : records;
  const total = filtered.length;
  const present = filtered.filter(r => r.status === 'present').length;
  const absent = filtered.filter(r => r.status === 'absent').length;
  const leave = filtered.filter(r => r.status === 'leave').length;
  const half = filtered.filter(r => r.status === 'half_day').length;
  const pct = total ? Math.round(((present + half * 0.5) / total) * 100) : 0;

  const items = [
    { icon: CalendarCheck, label: 'Present', value: present, tone: 'bg-emerald-50 text-emerald-700' },
    { icon: UserX, label: 'Absent', value: absent, tone: 'bg-rose-50 text-rose-700' },
    { icon: Coffee, label: 'Leave', value: leave, tone: 'bg-amber-50 text-amber-700' },
    { icon: Sun, label: 'Half Day', value: half, tone: 'bg-sky-50 text-sky-700' },
    { icon: Percent, label: 'Attendance', value: `${pct}%`, tone: 'bg-primary/10 text-primary' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
      {items.map(it => (
        <Card key={it.label}><CardContent className="p-3">
          <div className={`h-8 w-8 rounded-md flex items-center justify-center mb-1.5 ${it.tone}`}><it.icon className="h-4 w-4" /></div>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{it.label}</p>
          <p className="text-lg font-bold">{it.value}</p>
        </CardContent></Card>
      ))}
    </div>
  );
}
