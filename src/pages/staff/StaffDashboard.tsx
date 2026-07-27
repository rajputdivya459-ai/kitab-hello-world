import { AdminLayout } from '@/layouts/AdminLayout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, UserPlus, UserCircle, Calendar, Bus, FileCheck, CalendarRange, ClipboardList } from 'lucide-react';
import { Link } from 'react-router-dom';

const kpis = [
  { label: 'Assigned Tasks',    value: '5',  trend: '2 due',   icon: ClipboardList, tone: 'text-blue-600' },
  { label: "Today's Visitors",  value: '18', trend: '+4',      icon: UserCircle,    tone: 'text-emerald-600' },
  { label: 'Pending Admissions',value: '9',  trend: '3 new',   icon: UserPlus,      tone: 'text-violet-600' },
  { label: 'Recent Notices',    value: '3',  trend: 'this wk', icon: Bell,          tone: 'text-amber-600' },
];

const shortcuts = [
  { label: 'Visitors',     icon: UserCircle,    to: '/admin/visitors' },
  { label: 'Admissions',   icon: UserPlus,      to: '/admin/inquiries' },
  { label: 'Transport',    icon: Bus,           to: '/admin/transport' },
  { label: 'Certificates', icon: FileCheck,     to: '/admin/certificates' },
  { label: 'Notices',      icon: Bell,          to: '/admin/notices' },
  { label: 'Calendar',     icon: Calendar,      to: '/admin/calendar' },
  { label: 'Leave',        icon: CalendarRange, to: '/admin/leaves' },
];

export default function StaffDashboard() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-display font-semibold">Staff Workspace</h2>
          <p className="text-sm text-muted-foreground">Front-desk operations and admin support.</p>
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

        <Card className="p-4">
          <h3 className="font-semibold mb-3 text-sm">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
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
      </div>
    </AdminLayout>
  );
}
