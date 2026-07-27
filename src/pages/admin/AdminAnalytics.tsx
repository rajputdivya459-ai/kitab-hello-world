import { AdminLayout } from '@/layouts/AdminLayout';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, GraduationCap, AlertTriangle, TrendingUp } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useCourseStructure } from '@/hooks/useCourseStructure';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', '#6366f1', '#f59e0b', '#10b981', '#ef4444'];

export default function AdminAnalytics() {
  const navigate = useNavigate();
  const { classes, schoolCourses, getCourseName, getClassName } = useCourseStructure();

  const [filterCourse, setFilterCourse] = useState<string>('all');
  const [filterClass, setFilterClass] = useState<string>('all');
  const [academicYear, setAcademicYear] = useState<string>(String(new Date().getFullYear()));

  const { data: students = [] } = useQuery({
    queryKey: ['analytics-students'],
    queryFn: async () => {
      const { data, error } = await supabase.from('students').select('*');
      if (error) throw error;
      return data;
    },
  });

  const { data: fees = [] } = useQuery({
    queryKey: ['analytics-fees'],
    queryFn: async () => {
      const { data, error } = await supabase.from('fees_collection').select('*');
      if (error) throw error;
      return data;
    },
  });

  const { data: discounts = [] } = useQuery({
    queryKey: ['analytics-discounts'],
    queryFn: async () => {
      const { data, error } = await supabase.from('discounts').select('*');
      if (error) throw error;
      return data;
    },
  });

  const availableYears = useMemo(() => {
    const yearSet = new Set<number>();
    students.forEach(s => { if (s.admission_date) yearSet.add(new Date(s.admission_date).getFullYear()); });
    fees.forEach(f => { if (f.date) yearSet.add(new Date(f.date).getFullYear()); });
    const sorted = Array.from(yearSet).sort((a, b) => b - a);
    if (sorted.length === 0) sorted.push(new Date().getFullYear());
    return sorted;
  }, [students, fees]);

  const classItems = useMemo(() => {
    if (filterCourse === 'all') return [];
    return classes.filter(cl => cl.course_id === filterCourse);
  }, [filterCourse, classes]);

  const filtered = useMemo(() => {
    let list = students;
    const yr = Number(academicYear);
    list = list.filter(s => !s.admission_date || new Date(s.admission_date).getFullYear() <= yr);
    const courseIds = new Set(schoolCourses.map(c => c.id));
    list = list.filter(s => s.course_id && courseIds.has(s.course_id));
    if (filterCourse !== 'all') list = list.filter(s => s.course_id === filterCourse);
    if (filterClass !== 'all') list = list.filter(s => s.class_id === filterClass);
    return list;
  }, [students, schoolCourses, filterCourse, filterClass, academicYear]);

  const filteredStudentIds = useMemo(() => new Set(filtered.map(s => s.id)), [filtered]);

  const filteredFees = useMemo(() => {
    const yr = Number(academicYear);
    return fees.filter(f => {
      const matchYear = f.date ? new Date(f.date).getFullYear() === yr : true;
      const matchStudent = f.student_id ? filteredStudentIds.has(f.student_id) : true;
      return matchYear && matchStudent;
    });
  }, [fees, academicYear, filteredStudentIds]);

  const filteredDiscounts = useMemo(
    () => discounts.filter(d => filteredStudentIds.has(d.student_id)),
    [discounts, filteredStudentIds],
  );

  const discountByStudent = useMemo(() => {
    const map: Record<string, number> = {};
    filteredDiscounts.forEach(d => { map[d.student_id] = (map[d.student_id] || 0) + Number(d.amount); });
    return map;
  }, [filteredDiscounts]);

  const totalStudents = filtered.length;
  const totalDefaulters = filtered.filter(s => {
    const disc = discountByStudent[s.id] || 0;
    return Number(s.total_fees) - Number(s.paid_fees) - disc > 0;
  }).length;
  const totalPending = filtered.reduce((sum, s) => {
    const disc = discountByStudent[s.id] || 0;
    return sum + Math.max(0, Number(s.total_fees) - Number(s.paid_fees) - disc);
  }, 0);
  const totalCollected = filteredFees.reduce((sum, f) => sum + Number(f.amount), 0);

  const feesByCourseData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredFees.forEach(f => { const key = f.course || 'Other'; map[key] = (map[key] || 0) + Number(f.amount); });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filteredFees]);

  const admissionTrendData = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach(s => {
      if (!s.admission_date) return;
      const month = format(parseISO(s.admission_date), 'yyyy-MM');
      map[month] = (map[month] || 0) + 1;
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b))
      .map(([month, count]) => ({ month: format(parseISO(month + '-01'), 'MMM yyyy'), count }));
  }, [filtered]);

  const courseDistData = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach(s => { const name = s.course_id ? getCourseName(s.course_id) : s.course; map[name] = (map[name] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filtered, getCourseName]);

  const classDistData = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach(s => {
      const name = s.class_id ? getClassName(s.class_id) : '-';
      map[name] = (map[name] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filtered, getClassName]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <Select value={filterCourse} onValueChange={v => { setFilterCourse(v); setFilterClass('all'); }}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Courses" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Courses</SelectItem>
              {schoolCourses.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          {filterCourse !== 'all' && classItems.length > 0 && (
            <Select value={filterClass} onValueChange={setFilterClass}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Classes" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classItems.map(i => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          <Select value={academicYear} onValueChange={setAcademicYear}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Academic Year" /></SelectTrigger>
            <SelectContent>
              {availableYears.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <p className="text-sm text-muted-foreground">Academic Year: {academicYear}</p>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard icon={Users} label="Total Students" value={totalStudents} />
          <SummaryCard icon={TrendingUp} label="Fees Collected" value={`₹${totalCollected.toLocaleString('en-IN')}`} />
          <SummaryCard icon={AlertTriangle} label="Defaulters" value={totalDefaulters} variant="destructive" onClick={() => navigate('/admin/defaulters')} />
          <SummaryCard icon={GraduationCap} label="Pending Fees" value={`₹${totalPending.toLocaleString('en-IN')}`} />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Fees Collected Per Course</CardTitle></CardHeader>
            <CardContent>
              {feesByCourseData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={feesByCourseData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" fontSize={12} /><YAxis fontSize={12} /><Tooltip formatter={(v: number) => `₹${v.toLocaleString('en-IN')}`} /><Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} /></BarChart>
                </ResponsiveContainer>
              ) : <p className="text-sm text-muted-foreground text-center py-10">No fees data yet.</p>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Monthly Admission Trends</CardTitle></CardHeader>
            <CardContent>
              {admissionTrendData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={admissionTrendData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" fontSize={12} /><YAxis fontSize={12} allowDecimals={false} /><Tooltip /><Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} /></LineChart>
                </ResponsiveContainer>
              ) : <p className="text-sm text-muted-foreground text-center py-10">No admission data yet.</p>}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Students by Course</CardTitle></CardHeader>
            <CardContent>
              {courseDistData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart><Pie data={courseDistData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>{courseDistData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /></PieChart>
                </ResponsiveContainer>
              ) : <p className="text-sm text-muted-foreground text-center py-10">No student data yet.</p>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Students by Class</CardTitle></CardHeader>
            <CardContent>
              {classDistData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={classDistData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" fontSize={12} /><YAxis fontSize={12} allowDecimals={false} /><Tooltip /><Bar dataKey="value" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} /></BarChart>
                </ResponsiveContainer>
              ) : <p className="text-sm text-muted-foreground text-center py-10">No student data yet.</p>}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="font-semibold">Fee Defaulters</p>
              <p className="text-sm text-muted-foreground">{totalDefaulters} students with pending fees</p>
            </div>
            <Button onClick={() => navigate('/admin/defaulters')}>View Defaulters →</Button>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

function SummaryCard({ icon: Icon, label, value, variant, onClick }: { icon: any; label: string; value: string | number; variant?: string; onClick?: () => void }) {
  return (
    <Card className={onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''} onClick={onClick}>
      <CardContent className="flex items-center gap-4 p-5">
        <div className={`p-3 rounded-lg ${variant === 'destructive' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div><p className="text-sm text-muted-foreground">{label}</p><p className="text-xl font-bold">{value}</p></div>
      </CardContent>
    </Card>
  );
}
