import { AdminLayout } from '@/layouts/AdminLayout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, UserCheck, Award, CalendarRange, UserPlus, ClipboardList, TrendingUp, Bell, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MarksDashboardWidget } from '@/components/marks/MarksDashboardWidget';

const kpis = [
  { label: 'Attendance Today', value: '92%', trend: '+1.2%', icon: UserCheck, tone: 'text-emerald-600' },
  { label: 'Academic Score',   value: '78%', trend: '+3.4%', icon: TrendingUp, tone: 'text-blue-600' },
  { label: 'Pending Leaves',   value: '4',   trend: '2 new', icon: CalendarRange, tone: 'text-amber-600' },
  { label: 'New Admissions',   value: '12',  trend: 'this week', icon: UserPlus, tone: 'text-violet-600' },
];

const shortcuts = [
  { label: 'Students',       icon: UserCheck,    to: '/admin/students' },
  { label: 'Staff',          icon: Users,        to: '/admin/staff' },
  { label: 'Attendance',     icon: ClipboardList,to: '/admin/attendance' },
  { label: 'Results',        icon: Award,        to: '/admin/results' },
  { label: 'Leave Approvals',icon: CalendarRange,to: '/admin/leaves' },
  { label: 'Admissions',     icon: UserPlus,     to: '/admin/inquiries' },
];

const activity = [
  { icon: Bell,     text: 'New notice published: Sports Day schedule',   time: '2h ago' },
  { icon: Calendar, text: 'PTA Meeting scheduled for Friday',            time: '5h ago' },
  { icon: Award,    text: 'Class 10 semester results awaiting approval', time: '1d ago' },
];

export default function PrincipalDashboard() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-display font-semibold">Principal's Desk</h2>
          <p className="text-sm text-muted-foreground">Executive overview and pending approvals.</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {kpis.map(k => (
            <Card key={k.label} className="p-4">
              <div className="flex items-start justify-between">
                <k.icon className={`h-5 w-5 ${k.tone}`} />
                <Badge variant="secondary" className="text-[10px]">{k.trend}</Badge>
              </div>
              <p className="text-2xl font-bold mt-3">{k.value}</p>
              <p className="text-xs text-muted-foreground">{k.label}</p>
            </Card>
          ))}
        </div>

        <MarksDashboardWidget role="principal" />
        <div className="grid lg:grid-cols-3 gap-4">
          <Card className="p-4 lg:col-span-2">
            <h3 className="font-semibold mb-3 text-sm">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {shortcuts.map(t => (
                <Link key={t.to} to={t.to}>
                  <Card className="p-3 hover:shadow-md hover:border-primary/30 transition-all">
                    <t.icon className="h-5 w-5 text-primary mb-2" />
                    <p className="text-xs font-medium">{t.label}</p>
                  </Card>
                </Link>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="font-semibold mb-3 text-sm">Recent Activity</h3>
            <ul className="space-y-3">
              {activity.map((a, i) => (
                <li key={i} className="flex items-start gap-2">
                  <div className="p-1.5 rounded-md bg-primary/10 shrink-0">
                    <a.icon className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs leading-snug">{a.text}</p>
                    <p className="text-[10px] text-muted-foreground">{a.time}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
