import { Card } from '@/components/ui/card';
import { CalendarCheck, AlertTriangle } from 'lucide-react';

interface Att { status: string; date?: string }
interface Props { records: Att[]; threshold?: number }

export function AttendanceSummary({ records, threshold = 75 }: Props) {
  const total = records.length || 1;
  const present = records.filter(a => a.status === 'present' || a.status === 'half_day').length;
  const absent = records.filter(a => a.status === 'absent').length;
  const leave = records.filter(a => a.status === 'leave').length;
  const pct = Math.round((present / total) * 100);
  const low = records.length > 0 && pct < threshold;

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <CalendarCheck className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">Attendance</h3>
        </div>
        <span className="text-xs text-muted-foreground">{records.length} days</span>
      </div>
      <div className="grid grid-cols-4 gap-2 text-center">
        <Cell value={present} label="Present" cls="bg-emerald-50 text-emerald-600" />
        <Cell value={absent} label="Absent" cls="bg-rose-50 text-rose-600" />
        <Cell value={leave} label="Leave" cls="bg-amber-50 text-amber-600" />
        <Cell value={`${pct}%`} label="Rate" cls="bg-primary/10 text-primary" />
      </div>
      {low && (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 text-xs text-rose-700">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>Low attendance — below {threshold}% threshold.</span>
        </div>
      )}
    </Card>
  );
}

function Cell({ value, label, cls }: { value: any; label: string; cls: string }) {
  return (
    <div className={`py-3 rounded-xl ${cls.split(' ')[0]}`}>
      <p className={`text-lg font-bold ${cls.split(' ')[1]}`}>{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}
