import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useTeacherCtx } from '@/contexts/TeacherContext';
import { PortalSkeleton } from '@/components/portal/PortalSkeleton';
import { AttendanceList } from '@/components/portal/AttendanceList';

export default function TeacherProfile() {
  const { loading, teacher } = useTeacherCtx();
  const [records, setRecords] = useState<any[]>([]);

  useEffect(() => {
    if (!teacher) return;
    (async () => {
      const { data } = await (supabase as any).from('staff_attendance')
        .select('id,date,status,remarks').eq('staff_id', teacher.id)
        .order('date', { ascending: false }).limit(20);
      setRecords(data ?? []);
    })();
  }, [teacher]);

  if (loading) return <PortalSkeleton />;
  if (!teacher) return <p className="text-sm text-muted-foreground">No staff profile linked to this account.</p>;

  return (
    <div className="space-y-4">
      <Card><CardContent className="p-5">
        <p className="text-xs text-muted-foreground">{teacher.staff_code}</p>
        <h2 className="font-display text-xl font-semibold">{teacher.full_name}</h2>
        <p className="text-sm text-muted-foreground capitalize mt-0.5">{teacher.role}</p>
        <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
          <div><p className="text-xs text-muted-foreground">Qualification</p><p>{teacher.qualification ?? '—'}</p></div>
          <div><p className="text-xs text-muted-foreground">Experience</p><p>{teacher.experience_years ?? 0} yrs</p></div>
          <div><p className="text-xs text-muted-foreground">Email</p><p className="truncate">{teacher.email ?? '—'}</p></div>
          <div><p className="text-xs text-muted-foreground">Phone</p><p>{teacher.phone ?? '—'}</p></div>
          <div className="col-span-2"><p className="text-xs text-muted-foreground">Joined</p><p>{teacher.joining_date ? new Date(teacher.joining_date).toLocaleDateString() : '—'}</p></div>
        </div>
      </CardContent></Card>

      <div>
        <h3 className="text-sm font-semibold text-muted-foreground mb-2 px-1">My Attendance (last 20)</h3>
        {records.length ? <AttendanceList records={records} /> :
          <Card><CardContent className="p-4 text-center text-sm text-muted-foreground">No attendance records yet.</CardContent></Card>}
      </div>
    </div>
  );
}
