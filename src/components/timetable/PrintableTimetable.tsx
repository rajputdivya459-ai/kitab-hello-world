import { forwardRef } from 'react';
import { WEEKDAYS, type TimetableRecord, type Weekday } from '@/lib/timetable/types';

interface Props {
  timetable: TimetableRecord;
  teacherNames?: Record<string, string>;
  variant?: 'student' | 'teacher' | 'classroom' | 'room' | 'exam';
  schoolName?: string;
}

/** Print-oriented layout — clean, no shadcn dependencies, works with window.print. */
export const PrintableTimetable = forwardRef<HTMLDivElement, Props>(function PrintableTimetable(
  { timetable, teacherNames = {}, variant = 'student', schoolName = 'School' }, ref
) {
  const t = timetable;
  const days = t.workingDays as Weekday[];
  const rows = Array.from(new Map(t.periods.map(p => [`${p.start}-${p.end}`, { start: p.start, end: p.end }])).values())
    .sort((a, b) => a.start.localeCompare(b.start));
  const cell = (d: Weekday, s: string, e: string) => t.periods.find(p => p.day === d && p.start === s && p.end === e);

  return (
    <div ref={ref} className="p-6 bg-white text-black" style={{ minWidth: 700 }}>
      <div className="text-center mb-3">
        <h1 className="text-xl font-bold">{schoolName}</h1>
        <p className="text-sm">Class {t.className}-{t.section} · {t.academicYear} · {variant.toUpperCase()} COPY</p>
        <p className="text-xs">Version {t.version} · {t.status}</p>
      </div>
      <table className="w-full border border-black text-[10px]">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-black p-1">Time</th>
            {days.map(d => <th key={d} className="border border-black p-1">{d}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td className="border border-black p-1 font-mono">{r.start}–{r.end}</td>
              {days.map(d => {
                const p = cell(d, r.start, r.end);
                if (!p) return <td key={d} className="border border-black p-1">—</td>;
                if (p.kind === 'break') return <td key={d} className="border border-black p-1 bg-gray-50 italic">{p.subject}</td>;
                return (
                  <td key={d} className="border border-black p-1">
                    <div className="font-semibold">{p.subject ?? '—'}</div>
                    {variant !== 'student' && p.teacherId && <div className="text-[9px]">{teacherNames[p.teacherId] ?? p.teacherId}</div>}
                    {p.room && <div className="text-[9px]">Room {p.room}</div>}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-[9px] text-right mt-2 text-gray-500">Generated {new Date().toLocaleString()}</p>
    </div>
  );
});
