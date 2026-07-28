import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExamScheduleView } from '@/components/exam/ExamScheduleView';
import { publishedSchedulesFor, listRooms, listInvigilators } from '@/lib/exam/api';
import { useStudentCtx } from '@/contexts/StudentContext';

export default function StudentExams() {
  const { student, classMap, sectionMap } = useStudentCtx();
  const className = student?.class_id ? classMap[student.class_id] : '10';
  const section = student?.section_id ? sectionMap[student.section_id] : 'A';
  const schedules = useMemo(() => publishedSchedulesFor(className ?? '10', section ?? 'A'), [className, section]);
  const rooms = listRooms();
  const invigilators = listInvigilators();

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">My Examinations</h2>
      {schedules.length === 0 && <Card><CardContent className="p-6 text-center text-sm text-muted-foreground">No published exam schedules yet.</CardContent></Card>}
      {schedules.map(s => (
        <Card key={s.id}>
          <CardHeader><CardTitle className="text-base">{s.title}</CardTitle></CardHeader>
          <CardContent>
            <ExamScheduleView schedule={{ ...s, slots: s.slots.filter(sl => sl.className === className && sl.section === section) }} rooms={rooms} invigilators={invigilators} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
