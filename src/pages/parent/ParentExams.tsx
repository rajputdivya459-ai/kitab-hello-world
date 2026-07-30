import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExamScheduleView } from '@/components/exam/ExamScheduleView';
import { ExamInstructionsCard, ExamSummaryHeader } from '@/components/exam/ExamInstructionsCard';
import { listRooms, listInvigilators, getSchedule } from '@/lib/exam/api';
import { publishedExamsFor, examPhase } from '@/lib/exam/master';
import { useParentCtx } from '@/contexts/ParentContext';

export default function ParentExams() {
  const { selected, classMap, sectionMap } = useParentCtx() as any;
  const className = (selected?.class_id ? classMap?.[selected.class_id] : selected?.class) ?? '10';
  const section = (selected?.section_id ? sectionMap?.[selected.section_id] : selected?.section) ?? 'A';
  const exams = useMemo(() => publishedExamsFor(className, section), [className, section]);
  const rooms = listRooms();
  const invigilators = listInvigilators();
  const upcoming = exams.filter(e => examPhase(e) !== 'completed');

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Examinations{selected?.name ? ` — ${selected.name}` : ''}</h2>

      {upcoming.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Upcoming Exams</CardTitle></CardHeader>
          <CardContent className="space-y-2">{upcoming.map(e => <ExamSummaryHeader key={e.id} exam={e} />)}</CardContent>
        </Card>
      )}

      {exams.length === 0 && <Card><CardContent className="p-6 text-center text-sm text-muted-foreground">No published examinations yet.</CardContent></Card>}

      {exams.map(e => {
        const schedule = e.scheduleId ? getSchedule(e.scheduleId) : undefined;
        return (
          <Card key={e.id}>
            <CardHeader><CardTitle className="text-base"><ExamSummaryHeader exam={e} /></CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <ExamInstructionsCard exam={e} />
              {schedule
                ? <ExamScheduleView schedule={{ ...schedule, slots: schedule.slots.filter(sl => sl.className === className && sl.section === section) }} rooms={rooms} invigilators={invigilators} />
                : <p className="text-sm text-muted-foreground">Timetable not published yet.</p>}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
