import { AdminLayout } from '@/layouts/AdminLayout';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertTriangle, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCourseStructure } from '@/hooks/useCourseStructure';
import { useState, useMemo } from 'react';

type SortKey = 'name' | 'pending' | 'course' | 'className';
type SortDir = 'asc' | 'desc';

export default function AdminDefaulters() {
  const { classes, sections, schoolCourses, getCourseName, getClassName, getSectionName } = useCourseStructure();

  const [filterCourse, setFilterCourse] = useState<string>('all');
  const [filterClass, setFilterClass] = useState<string>('all');
  const [filterSection, setFilterSection] = useState<string>('all');
  const [academicYear, setAcademicYear] = useState<string>(String(new Date().getFullYear()));
  const [pendingRange, setPendingRange] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('pending');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data: students = [] } = useQuery({
    queryKey: ['defaulter-students'],
    queryFn: async () => {
      const { data, error } = await supabase.from('students').select('*');
      if (error) throw error;
      return data;
    },
  });

  const { data: discounts = [] } = useQuery({
    queryKey: ['defaulter-discounts'],
    queryFn: async () => {
      const { data, error } = await supabase.from('discounts').select('*');
      if (error) throw error;
      return data;
    },
  });

  const discountByStudent = useMemo(() => {
    const map: Record<string, number> = {};
    discounts.forEach(d => { map[d.student_id] = (map[d.student_id] || 0) + Number(d.amount); });
    return map;
  }, [discounts]);

  const availableYears = useMemo(() => {
    const yearSet = new Set<number>();
    students.forEach(s => { if (s.admission_date) yearSet.add(new Date(s.admission_date).getFullYear()); });
    const sorted = Array.from(yearSet).sort((a, b) => b - a);
    if (sorted.length === 0) sorted.push(new Date().getFullYear());
    return sorted;
  }, [students]);

  const classItems = useMemo(() => {
    if (filterCourse === 'all') return [];
    return classes.filter(cl => cl.course_id === filterCourse);
  }, [filterCourse, classes]);

  const sectionItems = useMemo(() => {
    if (filterClass === 'all') return [];
    return sections.filter(s => s.class_id === filterClass);
  }, [filterClass, sections]);

  const defaulters = useMemo(() => {
    let list = students.map(s => ({
      ...s,
      discount: discountByStudent[s.id] || 0,
      pending: Math.max(0, Number(s.total_fees) - Number(s.paid_fees) - (discountByStudent[s.id] || 0)),
    })).filter(s => s.pending > 0);

    const yr = Number(academicYear);
    list = list.filter(s => s.admission_date && new Date(s.admission_date).getFullYear() <= yr);

    const courseIds = new Set(schoolCourses.map(c => c.id));
    list = list.filter(s => s.course_id && courseIds.has(s.course_id));
    if (filterCourse !== 'all') list = list.filter(s => s.course_id === filterCourse);
    if (filterClass !== 'all') list = list.filter(s => s.class_id === filterClass);
    if (filterSection !== 'all') list = list.filter(s => s.section_id === filterSection);

    if (pendingRange === 'low') list = list.filter(s => s.pending < 5000);
    else if (pendingRange === 'medium') list = list.filter(s => s.pending >= 5000 && s.pending <= 10000);
    else if (pendingRange === 'high') list = list.filter(s => s.pending > 10000);

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(s => s.name.toLowerCase().includes(q) || (s.phone || '').includes(q) || (s.email || '').toLowerCase().includes(q));
    }

    list.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortKey === 'pending') cmp = a.pending - b.pending;
      else if (sortKey === 'course') cmp = (a.course_id ? getCourseName(a.course_id) : a.course).localeCompare(b.course_id ? getCourseName(b.course_id) : b.course);
      else if (sortKey === 'className') {
        const aLabel = a.class_id ? getClassName(a.class_id) : '';
        const bLabel = b.class_id ? getClassName(b.class_id) : '';
        cmp = aLabel.localeCompare(bLabel);
      }
      return sortDir === 'desc' ? -cmp : cmp;
    });

    return list;
  }, [students, discountByStudent, academicYear, schoolCourses, filterCourse, filterClass, filterSection, pendingRange, search, sortKey, sortDir, getCourseName, getClassName]);

  const totalPages = Math.max(1, Math.ceil(defaulters.length / pageSize));
  const paginated = defaulters.slice((page - 1) * pageSize, page * pageSize);

  const totalPending = defaulters.reduce((s, d) => s + d.pending, 0);
  const highCount = defaulters.filter(d => d.pending > 10000).length;
  const medCount = defaulters.filter(d => d.pending >= 5000 && d.pending <= 10000).length;

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir(key === 'pending' ? 'desc' : 'asc'); }
  }

  function getTag(pending: number) {
    if (pending > 10000) return <Badge variant="destructive">High</Badge>;
    if (pending >= 5000) return <Badge className="bg-yellow-500/20 text-yellow-700 border-yellow-300">Medium</Badge>;
    return <Badge variant="secondary">Low</Badge>;
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{defaulters.length}</p><p className="text-xs text-muted-foreground">Total Defaulters</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">₹{totalPending.toLocaleString('en-IN')}</p><p className="text-xs text-muted-foreground">Total Pending</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-destructive">{highCount}</p><p className="text-xs text-muted-foreground">High (&gt;₹10k)</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-yellow-600">{medCount}</p><p className="text-xs text-muted-foreground">Medium (₹5k–10k)</p></CardContent></Card>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-3 items-center">
              <Select value={filterCourse} onValueChange={v => { setFilterCourse(v); setFilterClass('all'); setFilterSection('all'); setPage(1); }}>
                <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Courses" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  {schoolCourses.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
              {filterCourse !== 'all' && classItems.length > 0 && (
                <Select value={filterClass} onValueChange={v => { setFilterClass(v); setFilterSection('all'); setPage(1); }}>
                  <SelectTrigger className="w-[140px]"><SelectValue placeholder="All Classes" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    {classItems.map(i => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
              {filterClass !== 'all' && sectionItems.length > 0 && (
                <Select value={filterSection} onValueChange={v => { setFilterSection(v); setPage(1); }}>
                  <SelectTrigger className="w-[140px]"><SelectValue placeholder="All Sections" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sections</SelectItem>
                    {sectionItems.map(i => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
              <Select value={academicYear} onValueChange={v => { setAcademicYear(v); setPage(1); }}>
                <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {availableYears.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={pendingRange} onValueChange={v => { setPendingRange(v); setPage(1); }}>
                <SelectTrigger className="w-[140px]"><SelectValue placeholder="All Ranges" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ranges</SelectItem>
                  <SelectItem value="low">&lt; ₹5,000</SelectItem>
                  <SelectItem value="medium">₹5k – ₹10k</SelectItem>
                  <SelectItem value="high">&gt; ₹10,000</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative flex-1 min-w-[180px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search name, phone, email..." className="pl-9" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Fee Defaulters ({defaulters.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {paginated.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('name')}>Name {sortKey === 'name' ? (sortDir === 'asc' ? '↑' : '↓') : ''}</TableHead>
                      <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('course')}>Course {sortKey === 'course' ? (sortDir === 'asc' ? '↑' : '↓') : ''}</TableHead>
                      <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('className')}>Class {sortKey === 'className' ? (sortDir === 'asc' ? '↑' : '↓') : ''}</TableHead>
                      <TableHead>Section</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Paid</TableHead>
                      <TableHead className="text-right cursor-pointer select-none" onClick={() => toggleSort('pending')}>Pending {sortKey === 'pending' ? (sortDir === 'asc' ? '↑' : '↓') : ''}</TableHead>
                      <TableHead>Tag</TableHead>
                      <TableHead>Contact</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginated.map(s => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.name}</TableCell>
                        <TableCell>{s.course_id ? getCourseName(s.course_id) : s.course}</TableCell>
                        <TableCell>{s.class_id ? getClassName(s.class_id) : '-'}</TableCell>
                        <TableCell>{s.section_id ? getSectionName(s.section_id) : '-'}</TableCell>
                        <TableCell className="text-right">₹{Number(s.total_fees).toLocaleString('en-IN')}</TableCell>
                        <TableCell className="text-right">₹{(Number(s.paid_fees) + s.discount).toLocaleString('en-IN')}</TableCell>
                        <TableCell className="text-right font-semibold text-destructive">₹{s.pending.toLocaleString('en-IN')}</TableCell>
                        <TableCell>{getTag(s.pending)}</TableCell>
                        <TableCell className="text-xs">{s.phone || s.email || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : <p className="text-sm text-muted-foreground text-center py-10">No defaulters found 🎉</p>}

            {defaulters.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t mt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Rows:</span>
                  <Select value={String(pageSize)} onValueChange={v => { setPageSize(Number(v)); setPage(1); }}>
                    <SelectTrigger className="w-[70px] h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                  <span>{(page - 1) * pageSize + 1}–{Math.min(page * pageSize, defaulters.length)} of {defaulters.length}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon" className="h-8 w-8" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm px-2">{page} / {totalPages}</span>
                  <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
