import { useState, useMemo, useCallback } from 'react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Plus, Pencil, Trash2, IndianRupee, TrendingUp, TrendingDown, Wallet, CircleDollarSign, Search, ArrowUpDown, ArrowUp, ArrowDown, X, ChevronLeft, ChevronRight, Users, AlertTriangle, BarChart3, PieChart as PieChartIcon, Calendar, RotateCcw } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { useCourseStructure } from '@/hooks/useCourseStructure';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useInstitution } from '@/hooks/useInstitution';
import { notifyFeePaid } from '@/lib/notify';

const PAGE_SIZE = 10;
const PIE_COLORS = ['hsl(var(--primary))', 'hsl(0 84% 60%)', 'hsl(45 93% 47%)', 'hsl(142 76% 36%)', 'hsl(271 91% 65%)', 'hsl(199 89% 48%)', 'hsl(25 95% 53%)'];

function usePagination<T>(items: T[], pageSize = PAGE_SIZE) {
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safeP = Math.min(page, totalPages - 1);
  const paged = items.slice(safeP * pageSize, (safeP + 1) * pageSize);
  return { page: safeP, setPage, totalPages, paged, total: items.length };
}

function PaginationControls({ page, totalPages, setPage, total }: { page: number; totalPages: number; setPage: (p: number) => void; total: number }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between pt-4 flex-wrap gap-2">
      <p className="text-sm text-muted-foreground">{total} record{total !== 1 ? 's' : ''}</p>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="icon" className="h-8 w-8" disabled={page === 0} onClick={() => setPage(page - 1)}><ChevronLeft className="h-4 w-4" /></Button>
        {Array.from({ length: totalPages }, (_, i) => (
          <Button key={i} variant={i === page ? 'default' : 'outline'} size="icon" className="h-8 w-8 text-xs" onClick={() => setPage(i)}>{i + 1}</Button>
        )).slice(Math.max(0, page - 2), page + 3)}
        <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}><ChevronRight className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}

function SortIcon({ active, dir }: { active: boolean; dir: 'asc' | 'desc' }) {
  if (!active) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />;
  return dir === 'asc' ? <ArrowUp className="h-3 w-3 ml-1" /> : <ArrowDown className="h-3 w-3 ml-1" />;
}

function SortableHead({ children, sortKey, currentKey, dir, onSort }: { children: React.ReactNode; sortKey: string; currentKey: string; dir: 'asc' | 'desc'; onSort: (k: string) => void; className?: string }) {
  return (
    <TableHead className="cursor-pointer select-none whitespace-nowrap" onClick={() => onSort(sortKey)}>
      <span className="inline-flex items-center">{children}<SortIcon active={currentKey === sortKey} dir={dir} /></span>
    </TableHead>
  );
}

function StatCard({ title, value, icon, subtitle, variant = 'default' }: { title: string; value: number; icon: React.ReactNode; subtitle?: string; variant?: string }) {
  const colors: Record<string, string> = { default: 'text-primary', warning: 'text-yellow-600', destructive: 'text-destructive', success: 'text-green-600' };
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className={`text-2xl font-bold ${colors[variant] || colors.default}`}>₹{value.toLocaleString('en-IN')}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <div className={`p-3 rounded-full bg-secondary ${colors[variant] || colors.default}`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

type Fee = { id: string; amount: number; date: string; student_name: string | null; student_id: string | null; course: string | null; created_at: string };
type Expense = { id: string; title: string; amount: number; date: string; category: string; created_at: string };
type Salary = { id: string; staff_name: string; designation: string | null; salary_amount: number; payment_date: string; status: string; created_at: string };
type Student = { id: string; name: string; course: string; year: number; semester: number; total_fees: number; paid_fees: number; phone: string | null; course_id: string | null };

const EXPENSE_CATEGORIES = ['General', 'Infrastructure', 'Utilities', 'Supplies', 'Maintenance', 'Events', 'Other'];

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function getLast6Months() {
  const now = new Date();
  const months: { name: string; ms: string; me: string }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      name: format(d, 'MMM'),
      ms: startOfMonth(d).toISOString().split('T')[0],
      me: endOfMonth(d).toISOString().split('T')[0],
    });
  }
  return months;
}

function getMonthsForYear(year: number) {
  const months: { name: string; ms: string; me: string }[] = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(year, i, 1);
    months.push({
      name: format(d, 'MMM'),
      ms: startOfMonth(d).toISOString().split('T')[0],
      me: endOfMonth(d).toISOString().split('T')[0],
    });
  }
  return months;
}

type TimeFilter = { type: 'all' | 'year' | 'month'; year: number; month: number };

function filterByTime<T extends Record<string, any>>(items: T[], filter: TimeFilter, dateField: string): T[] {
  if (filter.type === 'all') return items;
  return items.filter(item => {
    const d = item[dateField] as string;
    if (!d) return false;
    const date = new Date(d);
    if (filter.type === 'year') return date.getFullYear() === filter.year;
    // month filter: match both year and month
    return date.getFullYear() === filter.year && date.getMonth() === filter.month;
  });
}

export default function AdminFinance() {
  const now = new Date();
  const { activeCourses, collegeCourses, schoolCourses } = useCourseStructure();
  const { institutionType } = useInstitution();

  const institutionCourseIds = useMemo(() => {
    const relevant = institutionType === 'college' ? collegeCourses : schoolCourses;
    return new Set(relevant.map(c => c.id));
  }, [institutionType, collegeCourses, schoolCourses]);

  // ─── GLOBAL TIME FILTER STATE ───
  const [timeFilter, setTimeFilter] = useState<TimeFilter>({ type: 'all', year: now.getFullYear(), month: now.getMonth() });

  const { data: fees = [] } = useQuery<Fee[]>({
    queryKey: ['fees_collection'],
    queryFn: async () => {
      const { data, error } = await supabase.from('fees_collection').select('*').order('date', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Fee[];
    },
  });

  const { data: expenses = [] } = useQuery<Expense[]>({
    queryKey: ['expenses'],
    queryFn: async () => {
      const { data, error } = await supabase.from('expenses').select('*').order('date', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Expense[];
    },
  });

  const { data: salaries = [] } = useQuery<Salary[]>({
    queryKey: ['salaries'],
    queryFn: async () => {
      const { data, error } = await supabase.from('salaries').select('*').order('payment_date', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Salary[];
    },
  });

  const { data: students = [] } = useQuery<Student[]>({
    queryKey: ['students_for_pending'],
    queryFn: async () => {
      const { data, error } = await supabase.from('students').select('id, name, course, year, semester, total_fees, paid_fees, phone, course_id');
      if (error) throw error;
      return (data ?? []) as Student[];
    },
  });

  const { data: allDiscounts = [] } = useQuery<{ student_id: string; amount: number }[]>({
    queryKey: ['finance-discounts'],
    queryFn: async () => {
      const { data, error } = await supabase.from('discounts').select('student_id, amount');
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  const discountByStudent = useMemo(() => {
    const map: Record<string, number> = {};
    allDiscounts.forEach(d => { map[d.student_id] = (map[d.student_id] || 0) + Number(d.amount); });
    return map;
  }, [allDiscounts]);
  const totalDiscounts = useMemo(() => allDiscounts.reduce((s, d) => s + Number(d.amount), 0), [allDiscounts]);

  // ─── EXTRACT UNIQUE YEARS FROM ALL DATA ───
  const availableYears = useMemo(() => {
    const yearSet = new Set<number>();
    fees.forEach(f => f.date && yearSet.add(new Date(f.date).getFullYear()));
    expenses.forEach(e => e.date && yearSet.add(new Date(e.date).getFullYear()));
    salaries.forEach(s => s.payment_date && yearSet.add(new Date(s.payment_date).getFullYear()));
    const years = Array.from(yearSet).sort((a, b) => b - a);
    if (years.length === 0) years.push(now.getFullYear());
    return years;
  }, [fees, expenses, salaries]);

  // ─── INSTITUTION-FILTERED STUDENTS & FEES ───
  const instStudents = useMemo(() => students.filter(s => s.course_id && institutionCourseIds.has(s.course_id)), [students, institutionCourseIds]);
  const instStudentIds = useMemo(() => new Set(instStudents.map(s => s.id)), [instStudents]);

  // ─── FILTERED DATA ───
  const filteredFees = useMemo(() => {
    const timeFilt = filterByTime(fees, timeFilter, 'date');
    return timeFilt.filter(f => !f.student_id || instStudentIds.has(f.student_id));
  }, [fees, timeFilter, instStudentIds]);
  const filteredExpenses = useMemo(() => filterByTime(expenses, timeFilter, 'date'), [expenses, timeFilter]);
  const filteredSalaries = useMemo(() => filterByTime(salaries, timeFilter, 'payment_date'), [salaries, timeFilter]);

  // ─── CHART MONTHS (context-aware) ───
  const chartMonths = useMemo(() => {
    if (timeFilter.type === 'year') return getMonthsForYear(timeFilter.year);
    if (timeFilter.type === 'month') return getMonthsForYear(timeFilter.year);
    return getLast6Months();
  }, [timeFilter]);

  // Global computed values from FILTERED data
  const totalIncome = useMemo(() => filteredFees.reduce((s, f) => s + Number(f.amount), 0), [filteredFees]);
  const totalExpenses_val = useMemo(() => filteredExpenses.reduce((s, e) => s + Number(e.amount), 0), [filteredExpenses]);
  const totalSalariesPaid = useMemo(() => filteredSalaries.filter(s => s.status === 'paid').reduce((a, s) => a + Number(s.salary_amount), 0), [filteredSalaries]);
  const totalPendingFees = useMemo(() => instStudents.reduce((s, st) => {
    const disc = discountByStudent[st.id] || 0;
    return s + Math.max(0, Number(st.total_fees) - Number(st.paid_fees) - disc);
  }, 0), [instStudents, discountByStudent]);
  const netBalance = totalIncome - totalExpenses_val - totalSalariesPaid;

  const overviewChartData = useMemo(() => {
    return chartMonths.map(m => ({
      name: m.name,
      income: filteredFees.filter(f => f.date >= m.ms && f.date <= m.me).reduce((s, f) => s + Number(f.amount), 0),
      expenses: filteredExpenses.filter(e => e.date >= m.ms && e.date <= m.me).reduce((s, e) => s + Number(e.amount), 0)
        + filteredSalaries.filter(s => s.status === 'paid' && s.payment_date >= m.ms && s.payment_date <= m.me).reduce((a, s) => a + Number(s.salary_amount), 0),
    }));
  }, [filteredFees, filteredExpenses, filteredSalaries, chartMonths]);

  const expenseBreakdown = useMemo(() => {
    return [
      { name: 'Expenses', value: totalExpenses_val },
      { name: 'Salaries', value: totalSalariesPaid },
    ].filter(d => d.value > 0);
  }, [totalExpenses_val, totalSalariesPaid]);

  const overviewConfig = {
    income: { label: 'Income', color: 'hsl(var(--primary))' },
    expenses: { label: 'Expenses', color: 'hsl(0 84% 60%)' },
  };
  const pieConfig = {
    Expenses: { label: 'Expenses', color: 'hsl(0 84% 60%)' },
    Salaries: { label: 'Salaries', color: 'hsl(45 93% 47%)' },
  };

  // ─── FILTER LABEL ───
  const filterLabel = timeFilter.type === 'all' ? 'All Time' : timeFilter.type === 'year' ? `Year ${timeFilter.year}` : `${MONTH_NAMES[timeFilter.month]} ${timeFilter.year}`;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* ─── GLOBAL TIME FILTER BAR ─── */}
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Filter:</span>
              </div>
              <ToggleGroup
                type="single"
                value={timeFilter.type}
                onValueChange={(v) => {
                  if (v) setTimeFilter(prev => ({ ...prev, type: v as TimeFilter['type'] }));
                }}
                className="bg-muted rounded-lg p-0.5"
              >
                <ToggleGroupItem value="all" className="text-xs px-3 h-8 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground rounded-md">All</ToggleGroupItem>
                <ToggleGroupItem value="year" className="text-xs px-3 h-8 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground rounded-md">Yearly</ToggleGroupItem>
                <ToggleGroupItem value="month" className="text-xs px-3 h-8 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground rounded-md">Monthly</ToggleGroupItem>
              </ToggleGroup>

              {timeFilter.type !== 'all' && (
                <Select value={String(timeFilter.year)} onValueChange={v => setTimeFilter(prev => ({ ...prev, year: Number(v) }))}>
                  <SelectTrigger className="w-[110px] h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {availableYears.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}

              {timeFilter.type === 'month' && (
                <Select value={String(timeFilter.month)} onValueChange={v => setTimeFilter(prev => ({ ...prev, month: Number(v) }))}>
                  <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MONTH_NAMES.map((m, i) => <SelectItem key={i} value={String(i)}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}

              <div className="flex items-center gap-2 ml-auto">
                <Badge variant="secondary" className="text-xs font-normal">Showing: {filterLabel}</Badge>
                {timeFilter.type !== 'all' && (
                  <Button variant="ghost" size="sm" className="h-8 text-xs gap-1" onClick={() => setTimeFilter({ type: 'all', year: now.getFullYear(), month: now.getMonth() })}>
                    <RotateCcw className="h-3 w-3" /> Reset
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-muted p-1">
            <TabsTrigger value="overview" className="flex-1 min-w-[90px]">Overview</TabsTrigger>
            <TabsTrigger value="fees" className="flex-1 min-w-[90px]">Fees Collection</TabsTrigger>
            <TabsTrigger value="expenses" className="flex-1 min-w-[90px]">Expenses</TabsTrigger>
            <TabsTrigger value="salaries" className="flex-1 min-w-[90px]">Salaries</TabsTrigger>
            <TabsTrigger value="pending" className="flex-1 min-w-[90px]">Pending Fees</TabsTrigger>
          </TabsList>

          {/* ─── OVERVIEW TAB ─── */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title="Total Income" value={totalIncome} icon={<IndianRupee className="h-5 w-5" />} />
              <StatCard title="Total Expenses" value={totalExpenses_val + totalSalariesPaid} icon={<TrendingDown className="h-5 w-5" />} variant="destructive" subtitle="Expenses + Salaries" />
              <StatCard title="Net Balance" value={netBalance} icon={<Wallet className="h-5 w-5" />} variant={netBalance >= 0 ? 'success' : 'destructive'} />
              <StatCard title="Pending Fees" value={totalPendingFees} icon={<AlertTriangle className="h-5 w-5" />} variant="warning" subtitle={`${instStudents.filter(s => Math.max(0, Number(s.total_fees) - Number(s.paid_fees) - (discountByStudent[s.id] || 0)) > 0).length} defaulters`} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><BarChart3 className="h-4 w-4" />Income vs Expenses</CardTitle></CardHeader>
                <CardContent>
                  <ChartContainer config={overviewConfig} className="h-[280px] w-full">
                    <BarChart data={overviewChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="income" fill="var(--color-income)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="expenses" fill="var(--color-expenses)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4" />Income Trend</CardTitle></CardHeader>
                <CardContent>
                  <ChartContainer config={overviewConfig} className="h-[280px] w-full">
                    <LineChart data={overviewChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line type="monotone" dataKey="income" stroke="var(--color-income)" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>
            {expenseBreakdown.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><PieChartIcon className="h-4 w-4" />Expense Breakdown</CardTitle></CardHeader>
                <CardContent className="flex items-center justify-center">
                  <ChartContainer config={pieConfig} className="h-[280px] w-full max-w-md">
                    <PieChart>
                      <Pie data={expenseBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {expenseBreakdown.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ─── FEES TAB ─── */}
          <TabsContent value="fees">
            <FeesTab fees={filteredFees} courses={institutionType === 'college' ? collegeCourses : schoolCourses} months6={chartMonths} />
          </TabsContent>

          {/* ─── EXPENSES TAB ─── */}
          <TabsContent value="expenses">
            <ExpensesTab expenses={filteredExpenses} months6={chartMonths} />
          </TabsContent>

          {/* ─── SALARIES TAB ─── */}
          <TabsContent value="salaries">
            <SalariesTab salaries={filteredSalaries} months6={chartMonths} />
          </TabsContent>

          {/* ─── PENDING FEES TAB ─── */}
          <TabsContent value="pending">
            <PendingFeesTab students={instStudents} courses={institutionType === 'college' ? collegeCourses : schoolCourses} discountByStudent={discountByStudent} />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}

// ═══════════════════════════════════════════
// FEES TAB
// ═══════════════════════════════════════════
function FeesTab({ fees, courses, months6 }: { fees: Fee[]; courses: { id: string; name: string }[]; months6: { name: string; ms: string; me: string }[] }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<Fee | null>(null);
  const [form, setForm] = useState({ amount: '', date: new Date().toISOString().split('T')[0], student_name: '', course: '' });
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortKey, setSortKey] = useState('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const toggleSort = (k: string) => { if (sortKey === k) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortKey(k); setSortDir('desc'); } };

  const totalCollected = useMemo(() => fees.reduce((s, f) => s + Number(f.amount), 0), [fees]);
  const now = new Date();
  const ms = startOfMonth(now).toISOString().split('T')[0];
  const me = endOfMonth(now).toISOString().split('T')[0];
  const ys = startOfYear(now).toISOString().split('T')[0];
  const ye = endOfYear(now).toISOString().split('T')[0];
  const monthlyCollection = useMemo(() => fees.filter(f => f.date >= ms && f.date <= me).reduce((s, f) => s + Number(f.amount), 0), [fees, ms, me]);
  const yearlyCollection = useMemo(() => fees.filter(f => f.date >= ys && f.date <= ye).reduce((s, f) => s + Number(f.amount), 0), [fees, ys, ye]);

  const feesChartData = useMemo(() => months6.map(m => ({
    name: m.name,
    collected: fees.filter(f => f.date >= m.ms && f.date <= m.me).reduce((s, f) => s + Number(f.amount), 0),
  })), [fees, months6]);

  const feesConfig = { collected: { label: 'Collected', color: 'hsl(var(--primary))' } };

  const filtered = useMemo(() => {
    let d = [...fees];
    const q = search.toLowerCase();
    if (q) d = d.filter(f => (f.student_name || '').toLowerCase().includes(q) || (f.course || '').toLowerCase().includes(q));
    if (dateFrom) d = d.filter(f => f.date >= dateFrom);
    if (dateTo) d = d.filter(f => f.date <= dateTo);
    d.sort((a, b) => {
      const va = sortKey === 'amount' ? Number(a.amount) : a.date;
      const vb = sortKey === 'amount' ? Number(b.amount) : b.date;
      return sortDir === 'asc' ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
    });
    return d;
  }, [fees, search, dateFrom, dateTo, sortKey, sortDir]);

  const { page, setPage, totalPages, paged, total } = usePagination(filtered);
  const hasFilters = search || dateFrom || dateTo;
  const clearFilters = () => { setSearch(''); setDateFrom(''); setDateTo(''); };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: any = { amount: Number(form.amount), date: form.date, student_name: form.student_name || null, course: form.course || null };
      if (editItem) { const { error } = await supabase.from('fees_collection').update(payload).eq('id', editItem.id); if (error) throw error; return null; }
      const { data, error } = await supabase.from('fees_collection').insert(payload).select('id,student_id,amount').single();
      if (error) throw error;
      return data;
    },
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: ['fees_collection'] }); setOpen(false); setEditItem(null); toast({ title: 'Saved' });
      if (created?.student_id) { void notifyFeePaid(created.student_id, Number(created.amount)).catch(() => {}); }
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('fees_collection').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['fees_collection'] }); toast({ title: 'Deleted' }); },
  });
  const openAdd = () => { setEditItem(null); setForm({ amount: '', date: new Date().toISOString().split('T')[0], student_name: '', course: '' }); setOpen(true); };
  const openEdit = (f: Fee) => { setEditItem(f); setForm({ amount: String(f.amount), date: f.date, student_name: f.student_name ?? '', course: f.course ?? '' }); setOpen(true); };

  return (
    <div className="space-y-6">
      {/* Analytics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total Collected" value={totalCollected} icon={<IndianRupee className="h-5 w-5" />} />
        <StatCard title="This Month" value={monthlyCollection} icon={<TrendingUp className="h-5 w-5" />} variant="success" />
        <StatCard title="This Year" value={yearlyCollection} icon={<CircleDollarSign className="h-5 w-5" />} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Monthly Collection Trend</CardTitle></CardHeader>
          <CardContent>
            <ChartContainer config={feesConfig} className="h-[240px] w-full">
              <LineChart data={feesChartData}>
                <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="collected" stroke="var(--color-collected)" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Monthly Collection</CardTitle></CardHeader>
          <CardContent>
            <ChartContainer config={feesConfig} className="h-[240px] w-full">
              <BarChart data={feesChartData}>
                <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="collected" fill="var(--color-collected)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base">Fees Collection Records</CardTitle>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm" onClick={openAdd}><Plus className="h-4 w-4 mr-1" />Add Fee</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editItem ? 'Edit' : 'Add'} Fee Record</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Amount (₹)*</Label><Input type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} /></div>
                <div><Label>Date*</Label><Input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} /></div>
                <div><Label>Student Name</Label><Input value={form.student_name} onChange={e => setForm(p => ({ ...p, student_name: e.target.value }))} /></div>
                <div>
                  <Label>Course</Label>
                  <Select value={form.course} onValueChange={v => setForm(p => ({ ...p, course: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select course" /></SelectTrigger>
                    <SelectContent>{courses.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <Button className="w-full" onClick={() => saveMutation.mutate()} disabled={!form.amount || saveMutation.isPending}>Save</Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search student or course..." value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} className="pl-9" />
            </div>
            <Input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(0); }} className="w-auto" />
            <Input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(0); }} className="w-auto" />
            {hasFilters && <Button variant="ghost" size="icon" onClick={clearFilters}><X className="h-4 w-4" /></Button>}
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHead sortKey="date" currentKey={sortKey} dir={sortDir} onSort={toggleSort}>Date</SortableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Course</TableHead>
                  <SortableHead sortKey="amount" currentKey={sortKey} dir={sortDir} onSort={toggleSort}>Amount</SortableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map(f => (
                  <TableRow key={f.id}>
                    <TableCell>{f.date}</TableCell>
                    <TableCell>{f.student_name || '-'}</TableCell>
                    <TableCell>{f.course || '-'}</TableCell>
                    <TableCell>₹{Number(f.amount).toLocaleString('en-IN')}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(f)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(f.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
                {paged.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No fee records found</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
          <PaginationControls page={page} totalPages={totalPages} setPage={setPage} total={total} />
        </CardContent>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════
// EXPENSES TAB
// ═══════════════════════════════════════════
function ExpensesTab({ expenses, months6 }: { expenses: Expense[]; months6: { name: string; ms: string; me: string }[] }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<Expense | null>(null);
  const [form, setForm] = useState({ title: '', amount: '', date: new Date().toISOString().split('T')[0], category: 'General' });
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortKey, setSortKey] = useState('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const toggleSort = (k: string) => { if (sortKey === k) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortKey(k); setSortDir('desc'); } };

  const totalExp = useMemo(() => expenses.reduce((s, e) => s + Number(e.amount), 0), [expenses]);

  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach(e => { map[e.category] = (map[e.category] || 0) + Number(e.amount); });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [expenses]);

  const monthlyExpData = useMemo(() => months6.map(m => ({
    name: m.name,
    amount: expenses.filter(e => e.date >= m.ms && e.date <= m.me).reduce((s, e) => s + Number(e.amount), 0),
  })), [expenses, months6]);

  const expBarConfig = { amount: { label: 'Expenses', color: 'hsl(0 84% 60%)' } };
  const expPieConfig = Object.fromEntries(categoryData.map((c, i) => [c.name, { label: c.name, color: PIE_COLORS[i % PIE_COLORS.length] }]));

  const filtered = useMemo(() => {
    let d = [...expenses];
    const q = search.toLowerCase();
    if (q) d = d.filter(e => e.title.toLowerCase().includes(q) || e.category.toLowerCase().includes(q));
    if (catFilter !== 'all') d = d.filter(e => e.category === catFilter);
    if (dateFrom) d = d.filter(e => e.date >= dateFrom);
    if (dateTo) d = d.filter(e => e.date <= dateTo);
    d.sort((a, b) => {
      const va = sortKey === 'amount' ? Number(a.amount) : a.date;
      const vb = sortKey === 'amount' ? Number(b.amount) : b.date;
      return sortDir === 'asc' ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
    });
    return d;
  }, [expenses, search, catFilter, dateFrom, dateTo, sortKey, sortDir]);

  const { page, setPage, totalPages, paged, total } = usePagination(filtered);
  const hasFilters = search || catFilter !== 'all' || dateFrom || dateTo;
  const clearFilters = () => { setSearch(''); setCatFilter('all'); setDateFrom(''); setDateTo(''); };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { title: form.title, amount: Number(form.amount), date: form.date, category: form.category };
      if (editItem) { const { error } = await supabase.from('expenses').update(payload).eq('id', editItem.id); if (error) throw error; }
      else { const { error } = await supabase.from('expenses').insert(payload); if (error) throw error; }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['expenses'] }); setOpen(false); setEditItem(null); toast({ title: 'Saved' }); },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('expenses').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['expenses'] }); toast({ title: 'Deleted' }); },
  });
  const openAdd = () => { setEditItem(null); setForm({ title: '', amount: '', date: new Date().toISOString().split('T')[0], category: 'General' }); setOpen(true); };
  const openEdit = (e: Expense) => { setEditItem(e); setForm({ title: e.title, amount: String(e.amount), date: e.date, category: e.category }); setOpen(true); };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard title="Total Expenses" value={totalExp} icon={<TrendingDown className="h-5 w-5" />} variant="destructive" />
        <StatCard title="Categories" value={categoryData.length} icon={<BarChart3 className="h-5 w-5" />} subtitle={`Across ${categoryData.length} categories`} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Category Distribution</CardTitle></CardHeader>
          <CardContent className="flex items-center justify-center">
            <ChartContainer config={expPieConfig} className="h-[260px] w-full max-w-md">
              <PieChart>
                <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {categoryData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Monthly Expenses</CardTitle></CardHeader>
          <CardContent>
            <ChartContainer config={expBarConfig} className="h-[260px] w-full">
              <BarChart data={monthlyExpData}>
                <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="amount" fill="var(--color-amount)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base">Expense Records</CardTitle>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm" onClick={openAdd}><Plus className="h-4 w-4 mr-1" />Add Expense</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editItem ? 'Edit' : 'Add'} Expense</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Title*</Label><Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} /></div>
                <div><Label>Amount (₹)*</Label><Input type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} /></div>
                <div><Label>Date*</Label><Input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} /></div>
                <div>
                  <Label>Category*</Label>
                  <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{EXPENSE_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <Button className="w-full" onClick={() => saveMutation.mutate()} disabled={!form.title || !form.amount || saveMutation.isPending}>Save</Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search title or category..." value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} className="pl-9" />
            </div>
            <Select value={catFilter} onValueChange={v => { setCatFilter(v); setPage(0); }}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {EXPENSE_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(0); }} className="w-auto" />
            <Input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(0); }} className="w-auto" />
            {hasFilters && <Button variant="ghost" size="icon" onClick={clearFilters}><X className="h-4 w-4" /></Button>}
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHead sortKey="date" currentKey={sortKey} dir={sortDir} onSort={toggleSort}>Date</SortableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <SortableHead sortKey="amount" currentKey={sortKey} dir={sortDir} onSort={toggleSort}>Amount</SortableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map(e => (
                  <TableRow key={e.id}>
                    <TableCell>{e.date}</TableCell>
                    <TableCell>{e.title}</TableCell>
                    <TableCell><Badge variant="secondary">{e.category}</Badge></TableCell>
                    <TableCell>₹{Number(e.amount).toLocaleString('en-IN')}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(e)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(e.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
                {paged.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No expenses found</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
          <PaginationControls page={page} totalPages={totalPages} setPage={setPage} total={total} />
        </CardContent>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════
// SALARIES TAB
// ═══════════════════════════════════════════
function SalariesTab({ salaries, months6 }: { salaries: Salary[]; months6: { name: string; ms: string; me: string }[] }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<Salary | null>(null);
  const [form, setForm] = useState({ staff_name: '', designation: '', salary_amount: '', payment_date: new Date().toISOString().split('T')[0], status: 'unpaid' });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortKey, setSortKey] = useState('payment_date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const toggleSort = (k: string) => { if (sortKey === k) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortKey(k); setSortDir('desc'); } };

  const totalPaid = useMemo(() => salaries.filter(s => s.status === 'paid').reduce((a, s) => a + Number(s.salary_amount), 0), [salaries]);
  const totalPending = useMemo(() => salaries.filter(s => s.status === 'unpaid').reduce((a, s) => a + Number(s.salary_amount), 0), [salaries]);

  const salaryChartData = useMemo(() => months6.map(m => ({
    name: m.name,
    paid: salaries.filter(s => s.status === 'paid' && s.payment_date >= m.ms && s.payment_date <= m.me).reduce((a, s) => a + Number(s.salary_amount), 0),
    unpaid: salaries.filter(s => s.status === 'unpaid' && s.payment_date >= m.ms && s.payment_date <= m.me).reduce((a, s) => a + Number(s.salary_amount), 0),
  })), [salaries, months6]);

  const salaryConfig = { paid: { label: 'Paid', color: 'hsl(142 76% 36%)' }, unpaid: { label: 'Unpaid', color: 'hsl(0 84% 60%)' } };

  const filtered = useMemo(() => {
    let d = [...salaries];
    const q = search.toLowerCase();
    if (q) d = d.filter(s => s.staff_name.toLowerCase().includes(q) || (s.designation || '').toLowerCase().includes(q));
    if (statusFilter !== 'all') d = d.filter(s => s.status === statusFilter);
    d.sort((a, b) => {
      const va = sortKey === 'salary_amount' ? Number(a.salary_amount) : a.payment_date;
      const vb = sortKey === 'salary_amount' ? Number(b.salary_amount) : b.payment_date;
      return sortDir === 'asc' ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
    });
    return d;
  }, [salaries, search, statusFilter, sortKey, sortDir]);

  const { page, setPage, totalPages, paged, total } = usePagination(filtered);
  const hasFilters = search || statusFilter !== 'all';
  const clearFilters = () => { setSearch(''); setStatusFilter('all'); };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { staff_name: form.staff_name, designation: form.designation || null, salary_amount: Number(form.salary_amount), payment_date: form.payment_date, status: form.status };
      if (editItem) { const { error } = await supabase.from('salaries').update(payload).eq('id', editItem.id); if (error) throw error; }
      else { const { error } = await supabase.from('salaries').insert(payload); if (error) throw error; }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['salaries'] }); setOpen(false); setEditItem(null); toast({ title: 'Saved' }); },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('salaries').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['salaries'] }); toast({ title: 'Deleted' }); },
  });
  const toggleStatus = useMutation({
    mutationFn: async (s: Salary) => { const { error } = await supabase.from('salaries').update({ status: s.status === 'paid' ? 'unpaid' : 'paid' }).eq('id', s.id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['salaries'] }); toast({ title: 'Updated' }); },
  });
  const openAdd = () => { setEditItem(null); setForm({ staff_name: '', designation: '', salary_amount: '', payment_date: new Date().toISOString().split('T')[0], status: 'unpaid' }); setOpen(true); };
  const openEdit = (s: Salary) => { setEditItem(s); setForm({ staff_name: s.staff_name, designation: s.designation ?? '', salary_amount: String(s.salary_amount), payment_date: s.payment_date, status: s.status }); setOpen(true); };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard title="Total Paid" value={totalPaid} icon={<TrendingUp className="h-5 w-5" />} variant="success" />
        <StatCard title="Pending Salaries" value={totalPending} icon={<TrendingDown className="h-5 w-5" />} variant="warning" />
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Paid vs Unpaid (6 Months)</CardTitle></CardHeader>
        <CardContent>
          <ChartContainer config={salaryConfig} className="h-[260px] w-full">
            <BarChart data={salaryChartData}>
              <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="paid" fill="var(--color-paid)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="unpaid" fill="var(--color-unpaid)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base">Salary Records</CardTitle>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm" onClick={openAdd}><Plus className="h-4 w-4 mr-1" />Add Salary</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editItem ? 'Edit' : 'Add'} Salary Record</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Staff Name*</Label><Input value={form.staff_name} onChange={e => setForm(p => ({ ...p, staff_name: e.target.value }))} /></div>
                <div><Label>Designation</Label><Input value={form.designation} onChange={e => setForm(p => ({ ...p, designation: e.target.value }))} /></div>
                <div><Label>Salary Amount (₹)*</Label><Input type="number" value={form.salary_amount} onChange={e => setForm(p => ({ ...p, salary_amount: e.target.value }))} /></div>
                <div><Label>Payment Date*</Label><Input type="date" value={form.payment_date} onChange={e => setForm(p => ({ ...p, payment_date: e.target.value }))} /></div>
                <div>
                  <Label>Status*</Label>
                  <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="unpaid">Unpaid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full" onClick={() => saveMutation.mutate()} disabled={!form.staff_name || !form.salary_amount || saveMutation.isPending}>Save</Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search staff or designation..." value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(0); }}>
              <SelectTrigger className="w-[130px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
              </SelectContent>
            </Select>
            {hasFilters && <Button variant="ghost" size="icon" onClick={clearFilters}><X className="h-4 w-4" /></Button>}
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHead sortKey="payment_date" currentKey={sortKey} dir={sortDir} onSort={toggleSort}>Date</SortableHead>
                  <TableHead>Staff</TableHead>
                  <TableHead>Designation</TableHead>
                  <SortableHead sortKey="salary_amount" currentKey={sortKey} dir={sortDir} onSort={toggleSort}>Amount</SortableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map(s => (
                  <TableRow key={s.id}>
                    <TableCell>{s.payment_date}</TableCell>
                    <TableCell>{s.staff_name}</TableCell>
                    <TableCell>{s.designation || '-'}</TableCell>
                    <TableCell>₹{Number(s.salary_amount).toLocaleString('en-IN')}</TableCell>
                    <TableCell>
                      <Badge className="cursor-pointer" variant={s.status === 'paid' ? 'default' : 'destructive'} onClick={() => toggleStatus.mutate(s)}>{s.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
                {paged.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No salary records found</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
          <PaginationControls page={page} totalPages={totalPages} setPage={setPage} total={total} />
        </CardContent>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════
// PENDING FEES TAB
// ═══════════════════════════════════════════
function PendingFeesTab({ students, courses, discountByStudent = {} }: { students: Student[]; courses: { id: string; name: string }[]; discountByStudent?: Record<string, number> }) {
  const [search, setSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');
  const [sortKey, setSortKey] = useState('pending');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const toggleSort = (k: string) => { if (sortKey === k) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortKey(k); setSortDir('desc'); } };

  const defaulters = useMemo(() => students.filter(s => {
    const disc = discountByStudent[s.id] || 0;
    return Number(s.total_fees) - Number(s.paid_fees) - disc > 0;
  }).map(s => {
    const disc = discountByStudent[s.id] || 0;
    return { ...s, pending: Number(s.total_fees) - Number(s.paid_fees) - disc, discount: disc };
  }), [students, discountByStudent]);

  const totalPending = useMemo(() => defaulters.reduce((s, d) => s + d.pending, 0), [defaulters]);

  const byCourse = useMemo(() => {
    const map: Record<string, number> = {};
    defaulters.forEach(d => { map[d.course] = (map[d.course] || 0) + d.pending; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [defaulters]);

  const pendingConfig = Object.fromEntries(byCourse.map((c, i) => [c.name, { label: c.name, color: PIE_COLORS[i % PIE_COLORS.length] }]));

  const filtered = useMemo(() => {
    let d = [...defaulters];
    const q = search.toLowerCase();
    if (q) d = d.filter(s => s.name.toLowerCase().includes(q) || s.course.toLowerCase().includes(q));
    if (courseFilter !== 'all') d = d.filter(s => s.course === courseFilter);
    d.sort((a, b) => {
      const va = sortKey === 'pending' ? a.pending : sortKey === 'name' ? a.name : a.course;
      const vb = sortKey === 'pending' ? b.pending : sortKey === 'name' ? b.name : b.course;
      if (typeof va === 'number' && typeof vb === 'number') return sortDir === 'asc' ? va - vb : vb - va;
      return sortDir === 'asc' ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
    });
    return d;
  }, [defaulters, search, courseFilter, sortKey, sortDir]);

  const { page, setPage, totalPages, paged, total } = usePagination(filtered);
  const hasFilters = search || courseFilter !== 'all';
  const clearFilters = () => { setSearch(''); setCourseFilter('all'); };

  const uniqueCourses = useMemo(() => [...new Set(defaulters.map(d => d.course))], [defaulters]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard title="Total Pending" value={totalPending} icon={<AlertTriangle className="h-5 w-5" />} variant="warning" />
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Number of Defaulters</p>
                <p className="text-2xl font-bold text-destructive">{defaulters.length}</p>
                <p className="text-xs text-muted-foreground mt-1">out of {students.length} students</p>
              </div>
              <div className="p-3 rounded-full bg-secondary text-destructive"><Users className="h-5 w-5" /></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {byCourse.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Pending by Course</CardTitle></CardHeader>
          <CardContent>
            <ChartContainer config={pendingConfig} className="h-[260px] w-full">
              <BarChart data={byCourse}>
                <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {byCourse.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Defaulters List</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search name or course..." value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} className="pl-9" />
            </div>
            <Select value={courseFilter} onValueChange={v => { setCourseFilter(v); setPage(0); }}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Course" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                {uniqueCourses.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            {hasFilters && <Button variant="ghost" size="icon" onClick={clearFilters}><X className="h-4 w-4" /></Button>}
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHead sortKey="name" currentKey={sortKey} dir={sortDir} onSort={toggleSort}>Student</SortableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Total Fees</TableHead>
                  <TableHead>Paid</TableHead>
                  <SortableHead sortKey="pending" currentKey={sortKey} dir={sortDir} onSort={toggleSort}>Pending</SortableHead>
                  <TableHead>Phone</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map(s => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>{s.course}</TableCell>
                    <TableCell>Year {s.year}</TableCell>
                    <TableCell>₹{Number(s.total_fees).toLocaleString('en-IN')}</TableCell>
                    <TableCell>₹{Number(s.paid_fees).toLocaleString('en-IN')}</TableCell>
                    <TableCell><Badge variant="destructive">₹{s.pending.toLocaleString('en-IN')}</Badge></TableCell>
                    <TableCell>{s.phone || '-'}</TableCell>
                  </TableRow>
                ))}
                {paged.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No defaulters found</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
          <PaginationControls page={page} totalPages={totalPages} setPage={setPage} total={total} />
        </CardContent>
      </Card>
    </div>
  );
}
