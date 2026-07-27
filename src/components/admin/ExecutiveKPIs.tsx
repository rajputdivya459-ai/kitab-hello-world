import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users, UserCog, CalendarCheck, Wallet, AlertCircle, Bus,
  UserPlus, Calendar, CalendarRange,
} from 'lucide-react';
import { ReactNode } from 'react';

interface Kpi { label: string; value: string; icon: ReactNode; tone: string; sub?: string }

function KpiCard({ label, value, icon, tone, sub }: Kpi) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`p-2.5 rounded-lg ${tone}`}>{icon}</div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground truncate">{label}</p>
          <p className="text-xl font-bold leading-tight">{value}</p>
          {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

export function ExecutiveKPIs() {
  const today = new Date().toISOString().slice(0, 10);
  const monthStart = new Date(); monthStart.setDate(1);
  const monthStartStr = monthStart.toISOString().slice(0, 10);
  const in7 = new Date(Date.now() + 7 * 86400_000).toISOString().slice(0, 10);

  const { data, isLoading } = useQuery({
    queryKey: ['exec-kpis-v2'],
    staleTime: 60_000,
    queryFn: async () => {
      const [
        studentsRes, staffRes, attendanceRes,
        feesMonthRes, studentsFinanceRes, transportRes,
        inquiriesRes, eventsRes, sLeavesRes, stLeavesRes,
      ] = await Promise.all([
        (supabase as any).from('students').select('id', { count: 'exact', head: true }).eq('admission_status', 'active'),
        (supabase as any).from('staff').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        (supabase as any).from('attendance').select('status').eq('date', today),
        (supabase as any).from('fees_collection').select('amount').gte('date', monthStartStr),
        (supabase as any).from('students').select('total_fees,paid_fees'),
        (supabase as any).from('student_transport').select('id', { count: 'exact', head: true }).eq('is_active', true),
        (supabase as any).from('admission_inquiries').select('id', { count: 'exact', head: true }).gte('created_at', monthStartStr),
        (supabase as any).from('calendar_events').select('id', { count: 'exact', head: true }).gte('event_date', today).lte('event_date', in7),
        (supabase as any).from('student_leaves').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        (supabase as any).from('staff_leaves').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      ]);

      const attRows: any[] = attendanceRes.data ?? [];
      const present = attRows.filter(r => r.status === 'present' || r.status === 'half_day').length;
      const attPct = attRows.length ? Math.round((present / attRows.length) * 100) : null;

      const collected = (feesMonthRes.data ?? []).reduce((s: number, r: any) => s + Number(r.amount || 0), 0);
      const pending = (studentsFinanceRes.data ?? []).reduce((s: number, r: any) =>
        s + Math.max(0, Number(r.total_fees || 0) - Number(r.paid_fees || 0)), 0);

      return {
        students: studentsRes.count ?? 0,
        staff: staffRes.count ?? 0,
        attPct, attMarked: attRows.length,
        collected, pending,
        transport: transportRes.count ?? 0,
        inquiries: inquiriesRes.count ?? 0,
        events: eventsRes.count ?? 0,
        leaves: (sLeavesRes.count ?? 0) + (stLeavesRes.count ?? 0),
      };
    },
  });

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        {[...Array(9)].map((_, i) => <Skeleton key={i} className="h-20" />)}
      </div>
    );
  }

  const kpis: Kpi[] = [
    { label: 'Active Students', value: String(data.students), icon: <Users className="h-5 w-5" />, tone: 'bg-primary/10 text-primary' },
    { label: 'Active Staff', value: String(data.staff), icon: <UserCog className="h-5 w-5" />, tone: 'bg-violet-100 text-violet-700' },
    { label: "Today's Attendance", value: data.attPct === null ? '—' : `${data.attPct}%`, icon: <CalendarCheck className="h-5 w-5" />, tone: 'bg-emerald-100 text-emerald-700', sub: data.attMarked ? `${data.attMarked} marked` : 'Not marked yet' },
    { label: 'Fees This Month', value: inr(data.collected), icon: <Wallet className="h-5 w-5" />, tone: 'bg-sky-100 text-sky-700' },
    { label: 'Pending Fees', value: inr(data.pending), icon: <AlertCircle className="h-5 w-5" />, tone: 'bg-amber-100 text-amber-700' },
    { label: 'Transport Users', value: String(data.transport), icon: <Bus className="h-5 w-5" />, tone: 'bg-rose-100 text-rose-700' },
    { label: 'New Leads (Month)', value: String(data.inquiries), icon: <UserPlus className="h-5 w-5" />, tone: 'bg-indigo-100 text-indigo-700' },
    { label: 'Upcoming Events (7d)', value: String(data.events), icon: <Calendar className="h-5 w-5" />, tone: 'bg-teal-100 text-teal-700' },
    { label: 'Pending Leaves', value: String(data.leaves), icon: <CalendarRange className="h-5 w-5" />, tone: 'bg-orange-100 text-orange-700' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-5 gap-3">
      {kpis.map(k => <KpiCard key={k.label} {...k} />)}
    </div>
  );
}
