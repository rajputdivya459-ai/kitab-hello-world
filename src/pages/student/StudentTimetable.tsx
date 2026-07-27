import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TodaySchedule } from '@/components/timetable/TodaySchedule';
import { TimetableGrid } from '@/components/timetable/TimetableGrid';
import { useStudentCtx } from '@/contexts/StudentContext';
import { publishedFor } from '@/lib/timetable/api';
import { getCollection } from '@/mock/db';

export default function StudentTimetable() {
  const { student, classMap, sectionMap } = useStudentCtx();
  const teacherNames = useMemo(() => Object.fromEntries(getCollection<any>('teachers').map((t: any) => [t.id, t.name])), []);
  const className = student?.class_id ? classMap[student.class_id] : '10';
  const section = student?.section_id ? sectionMap[student.section_id] : 'A';
  const tt = publishedFor(className ?? '10', section ?? 'A');

  return (
    <div className="space-y-4">
      <Tabs defaultValue="today">
        <TabsList className="w-full">
          <TabsTrigger value="today" className="flex-1">Today</TabsTrigger>
          <TabsTrigger value="week" className="flex-1">Weekly</TabsTrigger>
        </TabsList>
        <TabsContent value="today"><TodaySchedule timetable={tt} teacherNames={teacherNames} /></TabsContent>
        <TabsContent value="week">
          <Card><CardContent className="p-3">
            {tt ? <TimetableGrid timetable={tt} teacherNames={teacherNames} /> : <p className="text-sm text-muted-foreground text-center py-6">No published timetable for your class yet.</p>}
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
