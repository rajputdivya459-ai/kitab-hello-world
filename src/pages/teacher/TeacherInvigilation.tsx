import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExamScheduleView } from '@/components/exam/ExamScheduleView';
import { schedulesWithInvigilator, listSchedules, listRooms, listInvigilators } from '@/lib/exam/api';
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">My Invigilation Duties</h2>
        <Badge variant="secondary">{total} slot{total === 1 ? '' : 's'}</Badge>
      </div>
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
