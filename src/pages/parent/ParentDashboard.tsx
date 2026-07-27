import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useParentCtx } from '@/contexts/ParentContext';
import { StudentProfileCard } from '@/components/portal/StudentProfileCard';
import { FeeSummaryCards } from '@/components/portal/FeeSummaryCards';
import { AttendanceSummary } from '@/components/portal/AttendanceSummary';
import { ChildSwitcher } from '@/components/portal/ChildSwitcher';
import { PortalSkeleton } from '@/components/portal/PortalSkeleton';
import { EmptyState } from '@/components/portal/EmptyState';
import { Card } from '@/components/ui/card';
import { Users, Bell, ChevronRight, Receipt, BookOpen, Megaphone, Bus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function ParentDashboard() {
  const { loading, children, selected, selectedId, setSelectedId, classMap, sectionMap } = useParentCtx();
  const [attendance, setAttendance] = useState<{ status: string }[]>([]);
  const [recentFees, setRecentFees] = useState<{ id: string; amount: number; date: string }[]>([]);
  const [unreadNotices, setUnreadNotices] = useState(0);
  const [latestNotice, setLatestNotice] = useState<{ title: string; created_at: string } | null>(null);
  const [upcomingHw, setUpcomingHw] = useState<{ title: string; subject: string; due_date: string } | null>(null);
  const [latestAnnouncement, setLatestAnnouncement] = useState<{ title: string } | null>(null);
  const [transport, setTransport] = useState<{ route_name: string; pickup_point: string | null } | null>(null);

  useEffect(() => {
    if (!selectedId || !selected) return;
    (async () => {
      const today = new Date().toISOString().slice(0, 10);
      const [{ data: a }, { data: f }, { data: n }, { data: r }, { data: hw }, { data: ann }] = await Promise.all([
        supabase.from('attendance').select('status').eq('student_id', selectedId).order('date', { ascending: false }).limit(60),
        supabase.from('fees_collection').select('id,amount,date').eq('student_id', selectedId).order('date', { ascending: false }).limit(3),
        supabase.from('notices').select('id,title,publish_date').order('publish_date', { ascending: false }).limit(10),
        supabase.from('notification_reads').select('notification_id'),
        supabase.from('homework').select('title,subject,due_date').gte('due_date', today).order('due_date', { ascending: true }).limit(1),
        supabase.from('announcements').select('title').order('publish_date', { ascending: false }).limit(1),
      ]);
      setAttendance((a ?? []) as any);
      setRecentFees((f ?? []) as any);
      const notices = n ?? [];
      const readSet = new Set((r ?? []).map((x: any) => x.notification_id));
      setUnreadNotices(notices.filter((x: any) => !readSet.has(x.id)).length);
      setLatestNotice(notices[0] ? { title: notices[0].title, created_at: notices[0].publish_date } : null);
      setUpcomingHw(hw?.[0] ?? null);
      setLatestAnnouncement(ann?.[0] ?? null);
      const { data: t } = await supabase
        .from('student_transport')
        .select('pickup_point, transport_routes(route_name)')
        .eq('student_id', selectedId)
        .maybeSingle();
      setTransport(t ? { route_name: (t as any).transport_routes?.route_name ?? '—', pickup_point: (t as any).pickup_point } : null);
    })();
  }, [selectedId, selected]);

  if (loading) return <PortalSkeleton />;
  if (children.length === 0) {
    return <EmptyState icon={Users} title="No child linked yet" description="Please contact the school office to link your child's profile." />;
  }
  if (!selected) return null;

  return (
    <>
      <ChildSwitcher children={children} selectedId={selectedId} onSelect={setSelectedId} />
      <StudentProfileCard
        name={selected.name}
        course={selected.course}
        admissionNumber={selected.admission_number}
        className={selected.class_id ? classMap[selected.class_id] : null}
        section={selected.section_id ? sectionMap[selected.section_id] : null}
        imageUrl={selected.profile_image_url}
      />
      <FeeSummaryCards paid={Number(selected.paid_fees)} pending={Math.max(0, Number(selected.total_fees) - Number(selected.paid_fees))} />
      <AttendanceSummary records={attendance} />

      <Link to="/parent/receipts" className="block">
        <Card className="p-4 flex items-center gap-3 active:bg-muted transition-colors">
          <div className="p-2 rounded-lg bg-primary/10"><Receipt className="h-4 w-4 text-primary" /></div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm">Recent Payments</p>
            <p className="text-xs text-muted-foreground">{recentFees.length} payment{recentFees.length !== 1 ? 's' : ''} • view receipts</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Card>
      </Link>

      <Link to="/parent/notices" className="block">
        <Card className="p-4 flex items-center gap-3 active:bg-muted transition-colors">
          <div className="p-2 rounded-lg bg-accent/30"><Bell className="h-4 w-4 text-accent-foreground" /></div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium text-sm">Notices</p>
              {unreadNotices > 0 && <Badge variant="destructive" className="h-4 px-1.5 text-[10px]">{unreadNotices}</Badge>}
            </div>
            <p className="text-xs text-muted-foreground truncate">{latestNotice ? latestNotice.title : 'No notices yet'}</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Card>
      </Link>

      <Link to="/parent/notices" className="block">
        <Card className="p-4 flex items-center gap-3 active:bg-muted transition-colors">
          <div className="p-2 rounded-lg bg-emerald-100"><BookOpen className="h-4 w-4 text-emerald-700" /></div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm">Upcoming Homework</p>
            <p className="text-xs text-muted-foreground truncate">
              {upcomingHw ? `${upcomingHw.subject} • ${upcomingHw.title} (due ${new Date(upcomingHw.due_date).toLocaleDateString()})` : 'No pending homework'}
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Card>
      </Link>

      {transport && (
        <Link to="/parent/transport" className="block">
          <Card className="p-4 flex items-center gap-3 active:bg-muted transition-colors">
            <div className="p-2 rounded-lg bg-sky-100"><Bus className="h-4 w-4 text-sky-700" /></div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">School Transport</p>
              <p className="text-xs text-muted-foreground truncate">{transport.route_name} · {transport.pickup_point ?? '—'}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Card>
        </Link>
      )}

      {latestAnnouncement && (
        <Link to="/parent/notices" className="block">
          <Card className="p-4 flex items-center gap-3 active:bg-muted transition-colors">
            <div className="p-2 rounded-lg bg-amber-100"><Megaphone className="h-4 w-4 text-amber-700" /></div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">Latest Announcement</p>
              <p className="text-xs text-muted-foreground truncate">{latestAnnouncement.title}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Card>
        </Link>
      )}
    </>
  );
}
