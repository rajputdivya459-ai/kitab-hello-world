import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { CalendarDays, Bell, ClipboardList, UserPlus, Inbox } from 'lucide-react';
import { listWorkflows } from '@/lib/workflow';

export function DashboardWidgets() {
  const [events, setEvents] = useState<any[]>([]);
  const [reminders, setReminders] = useState<any[]>([]);
  const [pendingLeaves, setPendingLeaves] = useState(0);
  const [followUps, setFollowUps] = useState<any[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    (supabase as any).from('calendar_events').select('id,title,start_date,event_type').gte('end_date', today).order('start_date').limit(5).then(({ data }: any) => setEvents(data ?? []));
    (supabase as any).from('reminders').select('id,title,due_date,priority').eq('status', 'pending').order('due_date').limit(5).then(({ data }: any) => setReminders(data ?? []));
    (supabase as any).from('student_leaves').select('id', { count: 'exact', head: true }).eq('status', 'pending').then(({ count }: any) => setPendingLeaves(count ?? 0));
    (supabase as any).from('admission_inquiries').select('id,student_name,next_follow_up_date').lte('next_follow_up_date', today).neq('status', 'admitted').neq('status', 'closed').order('next_follow_up_date').limit(5).then(({ data }: any) => setFollowUps(data ?? []));
    setPendingApprovals(listWorkflows().filter(w => w.status === 'pending').slice(0, 5));
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
      <Widget title="Pending Approvals" icon={Inbox} href="/admin/approvals">
        {pendingApprovals.length === 0 ? <Empty /> : pendingApprovals.map(w => (
          <Row key={w.id} primary={w.title} secondary={`${w.module} · ${w.submittedBy ?? 'system'}`} />
        ))}
      </Widget>
      <Widget title="Upcoming Events" icon={CalendarDays} href="/admin/calendar">
        {events.length === 0 ? <Empty /> : events.map(e => (
          <Row key={e.id} primary={e.title} secondary={`${e.event_type} · ${e.start_date}`} />
        ))}
      </Widget>
      <Widget title="Upcoming Reminders" icon={Bell} href="/admin/reminders">
        {reminders.length === 0 ? <Empty /> : reminders.map(r => (
          <Row key={r.id} primary={r.title} secondary={`Due ${r.due_date} · ${r.priority}`} />
        ))}
      </Widget>
      <Widget title="Pending Leave Requests" icon={ClipboardList} href="/admin/leaves">
        <p className="text-3xl font-bold text-amber-600">{pendingLeaves}</p>
        <p className="text-xs text-muted-foreground mt-1">Awaiting review</p>
      </Widget>
      <Widget title="Admission Follow-ups" icon={UserPlus} href="/admin/inquiries">
        {followUps.length === 0 ? <Empty /> : followUps.map(f => (
          <Row key={f.id} primary={f.student_name} secondary={`Due ${f.next_follow_up_date}`} />
        ))}
      </Widget>
    </div>
  );
}

function Widget({ title, icon: Icon, href, children }: any) {
  return (
    <Card><CardHeader className="pb-2 flex flex-row items-center justify-between">
      <CardTitle className="text-sm flex items-center gap-2"><Icon className="h-4 w-4 text-primary" />{title}</CardTitle>
      <Link to={href} className="text-xs text-primary hover:underline">View</Link>
    </CardHeader><CardContent className="space-y-1.5">{children}</CardContent></Card>
  );
}
function Row({ primary, secondary }: any) {
  return <div className="border-l-2 border-primary/30 pl-2 py-0.5"><p className="text-sm font-medium truncate">{primary}</p><p className="text-[11px] text-muted-foreground">{secondary}</p></div>;
}
function Empty() { return <p className="text-xs text-muted-foreground">None.</p>; }
