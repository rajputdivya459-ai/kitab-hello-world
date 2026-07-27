import { useEffect, useState } from 'react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { CalendarRange, Check, X } from 'lucide-react';
import { notifyLeaveDecision } from '@/lib/notify';

type Status = 'pending' | 'approved' | 'rejected';
const TONE: Record<Status, string> = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-rose-100 text-rose-700',
};

export default function AdminLeaves() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [tab, setTab] = useState('student');
  const [status, setStatus] = useState<Status | 'all'>('pending');
  const [studentLeaves, setStudentLeaves] = useState<any[]>([]);
  const [staffLeaves, setStaffLeaves] = useState<any[]>([]);

  const load = async () => {
    let sq = (supabase as any).from('student_leaves').select('*, students(id,name,admission_number)').order('created_at', { ascending: false });
    if (status !== 'all') sq = sq.eq('status', status);
    const { data: sl } = await sq;
    setStudentLeaves(sl ?? []);

    let stq = (supabase as any).from('staff_leaves').select('*, staff(id,full_name,staff_code)').order('created_at', { ascending: false });
    if (status !== 'all') stq = stq.eq('status', status);
    const { data: stl } = await stq;
    setStaffLeaves(stl ?? []);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [status]);

  const review = async (table: 'student_leaves' | 'staff_leaves', id: string, newStatus: Status) => {
    const { error } = await (supabase as any).from(table).update({ status: newStatus, reviewed_by: user?.id, reviewed_at: new Date().toISOString() }).eq('id', id);
    if (error) toast({ title: 'Failed', description: error.message, variant: 'destructive' });
    else {
      if (table === 'student_leaves' && (newStatus === 'approved' || newStatus === 'rejected')) {
        const row = studentLeaves.find(r => r.id === id);
        if (row?.student_id) notifyLeaveDecision(row.student_id, newStatus, row.from_date, row.to_date);
      }
      toast({ title: `Leave ${newStatus}` }); load();
    }
  };

  const counts = (rows: any[]) => ({
    pending: rows.filter(r => r.status === 'pending').length,
    approved: rows.filter(r => r.status === 'approved').length,
    rejected: rows.filter(r => r.status === 'rejected').length,
  });
  const sc = counts(studentLeaves);
  const stc = counts(staffLeaves);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Leave Management</h1>
          <p className="text-muted-foreground">Review and approve student & staff leave requests.</p>
        </div>

        <Card><CardContent className="p-4 flex flex-wrap gap-3 items-end">
          <div>
            <label className="text-xs text-muted-foreground">Status filter</label>
            <Select value={status} onValueChange={v => setStatus(v as any)}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent></Card>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="student">Student Leaves ({sc.pending})</TabsTrigger>
            <TabsTrigger value="staff">Staff Leaves ({stc.pending})</TabsTrigger>
          </TabsList>

          <TabsContent value="student" className="space-y-3">
            <Summary c={sc} />
            {studentLeaves.length === 0 ? <Empty /> : studentLeaves.map(l => (
              <LeaveRow key={l.id} title={l.students?.name ?? 'Student'} subtitle={l.students?.admission_number} from={l.from_date} to={l.to_date}
                reason={l.reason} status={l.status} onApprove={() => review('student_leaves', l.id, 'approved')}
                onReject={() => review('student_leaves', l.id, 'rejected')} />
            ))}
          </TabsContent>

          <TabsContent value="staff" className="space-y-3">
            <Summary c={stc} />
            {staffLeaves.length === 0 ? <Empty /> : staffLeaves.map(l => (
              <LeaveRow key={l.id} title={l.staff?.full_name ?? 'Staff'} subtitle={`${l.staff?.staff_code ?? ''} · ${l.leave_type}`} from={l.from_date} to={l.to_date}
                reason={l.reason} status={l.status} onApprove={() => review('staff_leaves', l.id, 'approved')}
                onReject={() => review('staff_leaves', l.id, 'rejected')} />
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}

function Summary({ c }: { c: { pending: number; approved: number; rejected: number } }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Pending</p><p className="text-2xl font-bold text-amber-600">{c.pending}</p></CardContent></Card>
      <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Approved</p><p className="text-2xl font-bold text-emerald-600">{c.approved}</p></CardContent></Card>
      <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Rejected</p><p className="text-2xl font-bold text-rose-600">{c.rejected}</p></CardContent></Card>
    </div>
  );
}

function Empty() {
  return <Card><CardContent className="p-8 text-center text-muted-foreground"><CalendarRange className="h-8 w-8 mx-auto mb-2 opacity-40" />No leave requests.</CardContent></Card>;
}

function LeaveRow({ title, subtitle, from, to, reason, status, onApprove, onReject }: any) {
  return (
    <Card><CardContent className="p-4 flex flex-wrap gap-3 items-start justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-semibold">{title}</p>
          <Badge className={TONE[status as Status]}>{status}</Badge>
        </div>
        <p className="text-xs text-muted-foreground mb-1">{subtitle}</p>
        <p className="text-xs"><span className="font-medium">{from}</span> → <span className="font-medium">{to}</span></p>
        <p className="text-sm mt-1">{reason}</p>
      </div>
      {status === 'pending' && (
        <div className="flex gap-2">
          <Button size="sm" onClick={onApprove}><Check className="h-4 w-4 mr-1" />Approve</Button>
          <Button size="sm" variant="outline" onClick={onReject}><X className="h-4 w-4 mr-1" />Reject</Button>
        </div>
      )}
    </CardContent></Card>
  );
}
