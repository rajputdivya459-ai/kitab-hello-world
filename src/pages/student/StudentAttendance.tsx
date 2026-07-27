import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useStudentCtx } from '@/contexts/StudentContext';
import { AttendanceAnalytics } from '@/components/portal/AttendanceAnalytics';
import { AttendanceFilterBar } from '@/components/portal/AttendanceFilterBar';
import { AttendanceCalendar } from '@/components/portal/AttendanceCalendar';
import { AttendanceList } from '@/components/portal/AttendanceList';
import { EmptyState } from '@/components/portal/EmptyState';
import { PortalSkeleton } from '@/components/portal/PortalSkeleton';
import { CalendarCheck } from 'lucide-react';

interface Att { id: string; date: string; status: string; remarks?: string | null }

export default function StudentAttendance() {
  const { loading, student } = useStudentCtx();
  const [records, setRecords] = useState<Att[]>([]);
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());

  useEffect(() => {
    if (!student) return;
    supabase.from('attendance').select('id,date,status,remarks').eq('student_id', student.id).order('date', { ascending: false }).limit(365)
      .then(({ data }) => setRecords((data ?? []) as Att[]));
  }, [student?.id]);

  if (loading) return <PortalSkeleton />;
  if (!student) return null;

  const monthRecs = records.filter(r => { const d = new Date(r.date); return d.getMonth() === month && d.getFullYear() === year; });

  return (
    <>
      <AttendanceFilterBar month={month} year={year} onMonthChange={setMonth} onYearChange={setYear} />
      <AttendanceAnalytics records={records} month={month} year={year} />
      <AttendanceCalendar records={records} month={month} year={year} onMonthChange={setMonth} onYearChange={setYear} />
      <h3 className="font-semibold text-sm px-1">Days this month</h3>
      {monthRecs.length === 0 ? (
        <EmptyState icon={CalendarCheck} title="No attendance for this month" description="Pick another month to view records." />
      ) : (
        <AttendanceList records={monthRecs.slice(0, 31)} />
      )}
    </>
  );
}
