import { AdminLayout } from '@/layouts/AdminLayout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { IndianRupee, AlertTriangle, BellRing, FileText, Wallet, Landmark, Receipt, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

const kpis = [
  { label: "Today's Collection", value: '₹ 48,200', trend: '+12%',   icon: IndianRupee, tone: 'text-emerald-600' },
  { label: 'Pending Fees',       value: '₹ 3.2 L',  trend: '86 stu.',icon: AlertTriangle, tone: 'text-rose-600' },
  { label: 'Monthly Expenses',   value: '₹ 1.1 L',  trend: 'MTD',    icon: Wallet, tone: 'text-amber-600' },
  { label: 'Salary Payout',      value: '₹ 6.4 L',  trend: 'this mo',icon: Landmark, tone: 'text-blue-600' },
];

const shortcuts = [
  { label: 'Fee Collection',  icon: IndianRupee,   to: '/admin/finance' },
  { label: 'Expenses',        icon: Wallet,        to: '/admin/finance' },
  { label: 'Salaries',        icon: Landmark,      to: '/admin/finance' },
  { label: 'Receipts',        icon: Receipt,       to: '/admin/finance' },
  { label: 'Defaulters',      icon: AlertTriangle, to: '/admin/defaulters' },
  { label: 'Reminders',       icon: BellRing,      to: '/admin/reminders' },
  { label: 'Finance Reports', icon: FileText,      to: '/admin/analytics' },
];

export default function AccountantDashboard() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-display font-semibold">Accounts Desk</h2>
          <p className="text-sm text-muted-foreground">Finance, fees, expenses and salaries.</p>
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
              <Link key={t.label} to={t.to}>
                <Card className="p-3 hover:shadow-md hover:border-primary/30 transition-all">
                  <t.icon className="h-5 w-5 text-primary mb-2" />
                  <p className="text-xs font-medium">{t.label}</p>
                </Card>
              </Link>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold mb-3 text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />Salary Summary
          </h3>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div><p className="text-lg font-bold">32</p><p className="text-xs text-muted-foreground">Paid</p></div>
            <div><p className="text-lg font-bold text-amber-600">4</p><p className="text-xs text-muted-foreground">Pending</p></div>
            <div><p className="text-lg font-bold text-rose-600">1</p><p className="text-xs text-muted-foreground">On Hold</p></div>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}
