import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExamScheduleView } from '@/components/exam/ExamScheduleView';
import { ExamInstructionsCard, ExamSummaryHeader } from '@/components/exam/ExamInstructionsCard';
import { schedulesWithInvigilator, listRooms, listInvigilators } from '@/lib/exam/api';
import { listExams, examsForCoordinator } from '@/lib/exam/master';
import { useTeacherCtx } from '@/contexts/TeacherContext';

export default function TeacherInvigilation() {
  const { teacher } = useTeacherCtx() as any;
  const teacherId = teacher?.id ?? teacher?.profile_id ?? 't_1';
  const schedules = useMemo(() => {
    const mine = schedulesWithInvigilator(teacherId);
    return mine.map(s => ({ ...s, slots: s.slots.filter(sl => sl.invigilatorIds.includes(teacherId)) }));
  }, [teacherId]);
  const total = schedules.reduce((n, s) => n + s.slots.length, 0);
  const rooms = listRooms();
  const invigilators = listInvigilators();

  const assignedExams = useMemo(() => {
    const scheduleIds = new Set(schedules.map(s => s.id));
    const coordinated = examsForCoordinator(teacherId);
    const byDuty = listExams().filter(e => e.scheduleId && scheduleIds.has(e.scheduleId));
    const map = new Map([...coordinated, ...byDuty].map(e => [e.id, e]));
    return [...map.values()];
  }, [schedules, teacherId]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">My Invigilation Duties</h2>
        <Badge variant="secondary">{total} slot{total === 1 ? '' : 's'}</Badge>
      </div>

      {assignedExams.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Assigned Examinations</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {assignedExams.map(e => (
              <div key={e.id} className="space-y-2">
                <ExamSummaryHeader exam={e} />
                {e.coordinatorId === teacherId && <Badge variant="outline">You are the Exam Coordinator</Badge>}
                <ExamInstructionsCard exam={e} />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {schedules.length === 0 && <Card><CardContent className="p-6 text-center text-sm text-muted-foreground">No invigilation duties assigned.</CardContent></Card>}
      {schedules.map(s => (
        <Card key={s.id}>
          <CardHeader><CardTitle className="text-base">{s.title}</CardTitle></CardHeader>
          <CardContent>
            <ExamScheduleView schedule={s} rooms={rooms} invigilators={invigilators} highlightInvigilatorId={teacherId} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
