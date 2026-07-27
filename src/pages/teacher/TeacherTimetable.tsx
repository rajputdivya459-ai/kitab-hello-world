import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTeacherCtx } from '@/contexts/TeacherContext';
import { listTimetables, publishedFor, swapPeriods } from '@/lib/timetable/api';
import { TimetableGrid } from '@/components/timetable/TimetableGrid';
import { getCollection } from '@/mock/db';
import { toast } from 'sonner';

export default function TeacherTimetable() {
  const { teacher, assignments, classMap, sectionMap } = useTeacherCtx();
  const teacherNames = useMemo(() => Object.fromEntries(getCollection<any>('teachers').map((t: any) => [t.id, t.name])), []);
  // Map ERP teacher.profile_id (t_x) — fall back to first mock teacher for demo
  const myMockId = teacher?.staff_code?.startsWith('t_') ? teacher.staff_code : 't_1';
  const [selected, setSelected] = useState<{ cls: string; sec: string } | null>(null);

  const myClasses = useMemo(() => {
    const seen = new Set<string>();
    const out: { cls: string; sec: string; isClassTeacher: boolean }[] = [];
    for (const a of assignments) {
      const c = a.class_id ? classMap[a.class_id] : null;
      const s = a.section_id ? sectionMap[a.section_id] : null;
      if (!c || !s) continue;
      const k = `${c}-${s}`;
      if (seen.has(k)) continue;
      seen.add(k);
      out.push({ cls: c, sec: s, isClassTeacher: !!a.is_class_teacher });
    }
    // Also expose all published ones so teacher can inspect their assignments
    listTimetables().filter(t => t.status === 'published').forEach(t => {
      const k = `${t.className}-${t.section}`;
      if (!seen.has(k)) { seen.add(k); out.push({ cls: t.className, sec: t.section, isClassTeacher: false }); }
    });
    return out;
  }, [assignments, classMap, sectionMap]);

  const active = selected ?? myClasses[0] ?? null;
  const tt = active ? publishedFor(active.cls, active.sec) : undefined;
  const isMine = tt && myClasses.some(c => c.cls === tt.className && c.sec === tt.section && c.isClassTeacher);

  const handleSwap = (a: string, b: string) => {
    if (!tt) return;
    if (!isMine) { toast.error('Only class teachers can edit this timetable.'); return; }
    swapPeriods(tt.id, a, b);
    toast.success('Periods swapped');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {myClasses.map(c => (
          <button
            key={`${c.cls}-${c.sec}`}
            onClick={() => setSelected(c)}
            className={`px-3 py-1.5 rounded-md text-xs border transition-colors ${active?.cls === c.cls && active?.sec === c.sec ? 'border-primary bg-primary/5' : 'hover:bg-muted/40'}`}
          >
            Class {c.cls}-{c.sec} {c.isClassTeacher && <Badge variant="secondary" className="ml-1 text-[9px]">CT</Badge>}
          </button>
        ))}
      </div>
      <Card><CardContent className="p-3">
        {tt ? (
          <TimetableGrid timetable={tt} teacherNames={teacherNames} editable={isMine} onSwap={handleSwap} highlightTeacherId={myMockId} />
        ) : (
          <p className="text-sm text-muted-foreground text-center py-6">No published timetable for the selected class.</p>
        )}
      </CardContent></Card>
      {!isMine && tt && (
        <p className="text-xs text-muted-foreground text-center">You have read-only access. Class teachers can swap periods.</p>
      )}
    </div>
  );
}
