import { useMemo, useState } from 'react';
import type { Period, TimetableRecord, Weekday } from '@/lib/timetable/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Coffee, ArrowRightLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  timetable: TimetableRecord;
  teacherNames?: Record<string, string>;
  editable?: boolean;
  onSwap?: (aId: string, bId: string) => void;
  onPeriodClick?: (period: Period) => void;
  highlightTeacherId?: string;
}

/** Weekly grid view: rows = time slots, columns = weekdays. */
export function TimetableGrid({ timetable, teacherNames = {}, editable, onSwap, onPeriodClick, highlightTeacherId }: Props) {
  const [swapPick, setSwapPick] = useState<string | null>(null);
  const days = timetable.workingDays;

  // Aggregate unique time rows across the week
  const rows = useMemo(() => {
    const map = new Map<string, { start: string; end: string; kind: Period['kind'] }>();
    for (const p of timetable.periods) {
      const key = `${p.start}-${p.end}`;
      if (!map.has(key)) map.set(key, { start: p.start, end: p.end, kind: p.kind });
    }
    return [...map.values()].sort((a, b) => a.start.localeCompare(b.start));
  }, [timetable]);

  const cell = (day: Weekday, start: string, end: string): Period | undefined =>
    timetable.periods.find(p => p.day === day && p.start === start && p.end === end);

  const handleClick = (p: Period) => {
    if (!editable) { onPeriodClick?.(p); return; }
    if (p.kind === 'break') return;
    if (!swapPick) { setSwapPick(p.id); return; }
    if (swapPick === p.id) { setSwapPick(null); return; }
    onSwap?.(swapPick, p.id);
    setSwapPick(null);
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse text-xs sm:text-sm">
        <thead>
          <tr className="bg-muted/50">
            <th className="border p-2 text-left font-semibold w-24">Time</th>
            {days.map(d => (
              <th key={d} className="border p-2 text-left font-semibold min-w-[110px]">{d}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className={row.kind === 'break' ? 'bg-amber-50/40' : ''}>
              <td className="border p-2 align-top font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                {row.start}<br /><span className="opacity-60">{row.end}</span>
              </td>
              {days.map(d => {
                const p = cell(d, row.start, row.end);
                if (!p) return <td key={d} className="border p-2 text-muted-foreground/40">—</td>;
                const isBreak = p.kind === 'break';
                const isFree = p.kind === 'free';
                const isHighlighted = highlightTeacherId && p.teacherId === highlightTeacherId;
                const isPicked = swapPick === p.id;
                return (
                  <td
                    key={d}
                    onClick={() => handleClick(p)}
                    className={cn(
                      'border p-2 align-top transition-colors',
                      editable && !isBreak && 'cursor-pointer hover:bg-primary/5',
                      isBreak && 'text-amber-700',
                      isFree && 'text-muted-foreground',
                      isHighlighted && 'bg-teal-50 ring-2 ring-teal-300',
                      isPicked && 'bg-primary/10 ring-2 ring-primary',
                    )}
                  >
                    {isBreak ? (
                      <div className="flex items-center gap-1"><Coffee className="h-3 w-3" />{p.subject}</div>
                    ) : (
                      <div className="space-y-0.5">
                        <div className="font-medium leading-tight">{p.subject ?? '—'}</div>
                        {p.teacherId && (
                          <div className="text-[10px] text-muted-foreground truncate">{teacherNames[p.teacherId] ?? p.teacherId}</div>
                        )}
                        {p.room && <Badge variant="outline" className="text-[9px] px-1 py-0">{p.room}</Badge>}
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {editable && (
        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
          <ArrowRightLeft className="h-3 w-3" /> Click a period, then another to swap them.
          {swapPick && <span className="ml-2 text-primary font-medium">Selected — pick target</span>}
        </p>
      )}
    </div>
  );
}
