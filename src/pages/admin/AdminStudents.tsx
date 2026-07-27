import { useState, useMemo, useRef } from 'react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useCourseStructure } from '@/hooks/useCourseStructure';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { Plus, Pencil, Search, Eye, Users, GraduationCap, UserPlus, ChevronLeft, ChevronRight, Layers, School, Percent, Printer, MessageCircle } from 'lucide-react';
import { useInstitution } from '@/hooks/useInstitution';

type Student = {
  id: string; name: string; full_name: string | null; gender: string | null; date_of_birth: string | null;
  phone: string | null; email: string | null; address: string | null; course: string;
  course_id: string | null; year: number; year_id: string | null; semester: number; semester_id: string | null;
  class_id: string | null; section_id: string | null;
  admission_date: string; admission_number: string | null; admission_status: string;
  total_fees: number; paid_fees: number; created_at: string; updated_at: string;
};

type Discount = { id: string; student_id: string; amount: number; reason: string | null; created_at: string };

const ITEMS_PER_PAGE = 15;

const emptyForm = {
  full_name: '', gender: '', date_of_birth: '', phone: '', email: '', address: '',
  course_id: '', year_id: '', semester_id: '', class_id: '', section_id: '',
  admission_date: new Date().toISOString().split('T')[0],
  total_fees: '', paid_fees: '0', admission_status: 'active',
};


export default function AdminStudents() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { getSetting } = useSiteSettings();
  const {
    courses, years, semesters, classes, sections,
    activeCourses, collegeCourses, schoolCourses,
    getYearsForCourse, getSemestersForYear, getClassesForCourse, getSectionsForClass,
    getCourseName, getYearName, getSemesterName, getClassName, getSectionName, getCourseType,
  } = useCourseStructure();

  const { institutionType } = useInstitution();

  const [search, setSearch] = useState('');
  const [filterCourse, setFilterCourse] = useState('all');
  const [filterYear, setFilterYear] = useState('all');
  const [filterSemester, setFilterSemester] = useState('all');
  const [filterClass, setFilterClass] = useState('all');
  const [filterSection, setFilterSection] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [profileStudent, setProfileStudent] = useState<Student | null>(null);
  const [discountOpen, setDiscountOpen] = useState<Student | null>(null);
  const [discountAmount, setDiscountAmount] = useState('');
  const [discountReason, setDiscountReason] = useState('');
  const [receiptFee, setReceiptFee] = useState<any>(null);
  const [receiptStudent, setReceiptStudent] = useState<Student | null>(null);

  const { data: students = [], isLoading } = useQuery<Student[]>({
    queryKey: ['admin-students'],
    queryFn: async () => {
      const { data, error } = await supabase.from('students').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Student[];
    },
  });

  const { data: allDiscounts = [] } = useQuery<Discount[]>({
    queryKey: ['all-discounts'],
    queryFn: async () => {
      const { data, error } = await supabase.from('discounts').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Discount[];
    },
  });

  const { data: studentFees = [] } = useQuery({
    queryKey: ['student-fees', profileStudent?.id],
    enabled: !!profileStudent,
    queryFn: async () => {
      const { data, error } = await supabase.from('fees_collection').select('*').eq('student_id', profileStudent!.id).order('date', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: studentDiscounts = [] } = useQuery<Discount[]>({
    queryKey: ['student-discounts', profileStudent?.id],
    enabled: !!profileStudent,
    queryFn: async () => {
      const { data, error } = await supabase.from('discounts').select('*').eq('student_id', profileStudent!.id).order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Discount[];
    },
  });

  // Compute discount totals per student
  const discountByStudent = useMemo(() => {
    const map: Record<string, number> = {};
    allDiscounts.forEach(d => { map[d.student_id] = (map[d.student_id] || 0) + Number(d.amount); });
    return map;
  }, [allDiscounts]);

  // Filter students by global institution type
  const institutionCourseIds = useMemo(() => {
    const relevant = institutionType === 'college' ? collegeCourses : schoolCourses;
    return new Set(relevant.map(c => c.id));
  }, [institutionType, collegeCourses, schoolCourses]);

  const institutionStudents = useMemo(() => {
    return students.filter(s => s.course_id && institutionCourseIds.has(s.course_id));
  }, [students, institutionCourseIds]);

  const analytics = useMemo(() => {
    const total = institutionStudents.length;
    const active = institutionStudents.filter(s => s.admission_status === 'active').length;
    const totalPending = institutionStudents.reduce((sum, s) => {
      const disc = discountByStudent[s.id] || 0;
      return sum + Math.max(0, Number(s.total_fees) - Number(s.paid_fees) - disc);
    }, 0);
    const byCourse: Record<string, number> = {};
    const byYear: Record<string, number> = {};
    const bySemester: Record<string, number> = {};
    const byClass: Record<string, number> = {};
    const bySection: Record<string, number> = {};
    institutionStudents.forEach(s => {
      if (s.course_id) byCourse[s.course_id] = (byCourse[s.course_id] || 0) + 1;
      if (s.year_id) byYear[s.year_id] = (byYear[s.year_id] || 0) + 1;
      if (s.semester_id) bySemester[s.semester_id] = (bySemester[s.semester_id] || 0) + 1;
      if (s.class_id) byClass[s.class_id] = (byClass[s.class_id] || 0) + 1;
      if (s.section_id) bySection[s.section_id] = (bySection[s.section_id] || 0) + 1;
    });
    return { total, active, totalPending, byCourse, byYear, bySemester, byClass, bySection };
  }, [institutionStudents, discountByStudent]);

  const filtered = useMemo(() => {
    let list = institutionStudents;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(s => (s.full_name || s.name || '').toLowerCase().includes(q) || (s.phone || '').includes(q) || (s.admission_number || '').toLowerCase().includes(q));
    }
    if (filterCourse !== 'all') list = list.filter(s => s.course_id === filterCourse);
    if (filterYear !== 'all') list = list.filter(s => s.year_id === filterYear);
    if (filterSemester !== 'all') list = list.filter(s => s.semester_id === filterSemester);
    if (filterClass !== 'all') list = list.filter(s => s.class_id === filterClass);
    if (filterSection !== 'all') list = list.filter(s => s.section_id === filterSection);
    if (filterStatus !== 'all') list = list.filter(s => s.admission_status === filterStatus);
    return list;
  }, [institutionStudents, search, filterCourse, filterYear, filterSemester, filterClass, filterSection, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);


  const generateAdmissionNumber = async (): Promise<string> => {
    const { data, error } = await supabase.rpc('generate_admission_number');
    if (error) throw error;
    return data as string;
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!form.full_name || !form.course_id) throw new Error('Please fill all required fields');
      const courseType = getCourseType(form.course_id);
      const courseName = getCourseName(form.course_id);

      if (courseType === 'college' && (!form.year_id || !form.semester_id)) throw new Error('Year and Semester are required for college courses');
      if (courseType === 'school' && (!form.class_id || !form.section_id)) throw new Error('Class and Section are required for school courses');

      const payload: any = {
        full_name: form.full_name, name: form.full_name,
        gender: form.gender || null, date_of_birth: form.date_of_birth || null,
        phone: form.phone || null, email: form.email || null, address: form.address || null,
        course_id: form.course_id, course: courseName,
        admission_date: form.admission_date,
        admission_status: form.admission_status,
      };

      // Only set total_fees on new admission or if not editing
      if (!editStudent) {
        payload.total_fees = Number(form.total_fees) || 0;
        payload.paid_fees = Number(form.paid_fees) || 0;
      } else {
        // On edit, allow total_fees change but NOT paid_fees (paid_fees is read-only)
        payload.total_fees = Number(form.total_fees) || 0;
      }

      if (courseType === 'college') {
        payload.year_id = form.year_id; payload.semester_id = form.semester_id;
        payload.class_id = null; payload.section_id = null;
      } else {
        payload.class_id = form.class_id; payload.section_id = form.section_id;
        payload.year_id = null; payload.semester_id = null;
      }

      if (editStudent) {
        const { error } = await supabase.from('students').update(payload).eq('id', editStudent.id);
        if (error) throw error;
      } else {
        payload.admission_number = await generateAdmissionNumber();
        payload.year = 1; payload.semester = 1;
        const { error } = await supabase.from('students').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-students'] });
      setFormOpen(false); setEditStudent(null); setForm(emptyForm);
      toast({ title: editStudent ? 'Student updated' : 'Student admitted successfully' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const discountMutation = useMutation({
    mutationFn: async () => {
      if (!discountOpen || !discountAmount) throw new Error('Amount is required');
      const amt = Number(discountAmount);
      if (amt <= 0) throw new Error('Amount must be positive');
      const { error } = await supabase.from('discounts').insert({
        student_id: discountOpen.id,
        amount: amt,
        reason: discountReason || null,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['all-discounts'] });
      qc.invalidateQueries({ queryKey: ['student-discounts'] });
      setDiscountOpen(null); setDiscountAmount(''); setDiscountReason('');
      toast({ title: 'Discount applied successfully' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const toggleStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from('students').update({ admission_status: status === 'active' ? 'inactive' : 'active' }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-students'] }); toast({ title: 'Status updated' }); },
  });

  const openEdit = (s: Student) => {
    setEditStudent(s);
    setForm({
      full_name: s.full_name || s.name || '', gender: s.gender || '', date_of_birth: s.date_of_birth || '',
      phone: s.phone || '', email: s.email || '', address: s.address || '',
      course_id: s.course_id || '', year_id: s.year_id || '', semester_id: s.semester_id || '',
      class_id: s.class_id || '', section_id: s.section_id || '',
      admission_date: s.admission_date || '', total_fees: String(s.total_fees || 0),
      paid_fees: String(s.paid_fees || 0), admission_status: s.admission_status || 'active',
    });
    setFormOpen(true);
  };

  const openAdd = () => { setEditStudent(null); setForm(emptyForm); setFormOpen(true); };

  const selectedCourseType = filterCourse !== 'all' ? getCourseType(filterCourse) : null;

  const getStudentStructureLabel = (s: Student) => {
    const type = s.course_id ? getCourseType(s.course_id) : 'college';
    const courseName = s.course_id ? getCourseName(s.course_id) : s.course;
    if (type === 'school') {
      const cls = s.class_id ? getClassName(s.class_id) : '';
      const sec = s.section_id ? getSectionName(s.section_id) : '';
      return `${courseName}${cls ? ` - ${cls}` : ''}${sec ? ` (${sec})` : ''}`;
    }
    const yr = s.year_id ? getYearName(s.year_id) : '';
    const sem = s.semester_id ? getSemesterName(s.semester_id) : '';
    return `${courseName}${yr ? ` - ${yr}` : ''}${sem ? ` / ${sem}` : ''}`;
  };

  const institutionName = getSetting('institution_name', 'Our Institution');

  const handlePrintReceipt = (student: Student, fee: any) => {
    setReceiptStudent(student);
    setReceiptFee(fee);
  };

  const handleWhatsAppShare = (student: Student, fee: any) => {
    const structureLabel = getStudentStructureLabel(student);
    const msg = `📄 *Fee Receipt*
Student: ${student.full_name || student.name}
${structureLabel}
Admission No: ${student.admission_number || '-'}
Amount Paid: ₹${Number(fee.amount).toLocaleString('en-IN')}
Date: ${fee.date}
Thank you.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // School: get all classes and sections for current institution
  const instClasses = useMemo(() => {
    return classes.filter(cl => cl.is_active && institutionCourseIds.has(cl.course_id))
      .sort((a, b) => {
        const numA = parseInt(a.name.replace(/\D/g, '')) || 0;
        const numB = parseInt(b.name.replace(/\D/g, '')) || 0;
        return numA - numB;
      });
  }, [classes, institutionCourseIds]);

  const instYears = useMemo(() => {
    return years.filter(y => y.is_active && institutionCourseIds.has(y.course_id));
  }, [years, institutionCourseIds]);

  const instSemesters = useMemo(() => {
    return semesters.filter(s => {
      if (!s.is_active) return false;
      const yr = years.find(y => y.id === s.year_id);
      return yr && institutionCourseIds.has(yr.course_id);
    });
  }, [semesters, years, institutionCourseIds]);

  const instSections = useMemo(() => {
    const classIds = new Set(instClasses.map(c => c.id));
    return sections.filter(s => s.is_active && classIds.has(s.class_id));
  }, [sections, instClasses]);

  // Sections for selected class
  const selectedClassSections = useMemo(() => {
    if (filterClass === 'all') return [];
    return instSections.filter(s => s.class_id === filterClass);
  }, [filterClass, instSections]);

  // Semesters for selected year
  const selectedYearSemesters = useMemo(() => {
    if (filterYear === 'all') return [];
    return instSemesters.filter(s => s.year_id === filterYear);
  }, [filterYear, instSemesters]);

  // Distribution data
  const classDistribution = useMemo(() => {
    return instClasses.map(cl => ({
      ...cl,
      count: institutionStudents.filter(s => s.class_id === cl.id).length,
    }));
  }, [instClasses, institutionStudents]);

  const sectionDistribution = useMemo(() => {
    if (filterClass === 'all') return [];
    return selectedClassSections.map(s => ({
      ...s,
      count: institutionStudents.filter(st => st.section_id === s.id).length,
    }));
  }, [filterClass, selectedClassSections, institutionStudents]);

  const yearDistribution = useMemo(() => {
    return instYears.map(y => ({
      ...y,
      count: institutionStudents.filter(s => s.year_id === y.id).length,
    }));
  }, [instYears, institutionStudents]);

  const semesterDistribution = useMemo(() => {
    if (filterYear === 'all') return [];
    return selectedYearSemesters.map(s => ({
      ...s,
      count: institutionStudents.filter(st => st.semester_id === s.id).length,
    }));
  }, [filterYear, selectedYearSemesters, institutionStudents]);

  return (
    <AdminLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Students</h1>
            <p className="text-sm text-muted-foreground">
              {institutionType === 'college' ? 'College' : 'School'} · {filtered.length} students
            </p>
          </div>
          <Button onClick={openAdd}><Plus className="h-4 w-4 mr-1" />New Admission</Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="p-2.5 rounded-lg bg-primary/10 text-primary"><Users className="h-5 w-5" /></div>
              <div><p className="text-xs text-muted-foreground">Total</p><p className="text-xl font-bold">{analytics.total}</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="p-2.5 rounded-lg bg-green-500/10 text-green-600"><GraduationCap className="h-5 w-5" /></div>
              <div><p className="text-xs text-muted-foreground">Active</p><p className="text-xl font-bold">{analytics.active}</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="p-2.5 rounded-lg bg-orange-500/10 text-orange-600"><UserPlus className="h-5 w-5" /></div>
              <div><p className="text-xs text-muted-foreground">Inactive</p><p className="text-xl font-bold">{analytics.total - analytics.active}</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="p-2.5 rounded-lg bg-destructive/10 text-destructive"><Layers className="h-5 w-5" /></div>
              <div><p className="text-xs text-muted-foreground">Pending</p><p className="text-xl font-bold">₹{analytics.totalPending.toLocaleString('en-IN')}</p></div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Toggles */}
        <Card>
          <CardContent className="p-4 space-y-3">
            {institutionType === 'school' && (
              <>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Class</p>
                  <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                    <Button
                      variant={filterClass === 'all' ? 'default' : 'outline'}
                      size="sm"
                      className="shrink-0 text-xs h-8"
                      onClick={() => { setFilterClass('all'); setFilterSection('all'); setPage(1); }}
                    >
                      All ({institutionStudents.length})
                    </Button>
                    {classDistribution.map(cl => (
                      <Button
                        key={cl.id}
                        variant={filterClass === cl.id ? 'default' : 'outline'}
                        size="sm"
                        className="shrink-0 text-xs h-8"
                        onClick={() => { setFilterClass(cl.id); setFilterSection('all'); setPage(1); }}
                      >
                        {cl.name} ({cl.count})
                      </Button>
                    ))}
                  </div>
                </div>
                {filterClass !== 'all' && selectedClassSections.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Section</p>
                    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                      <Button
                        variant={filterSection === 'all' ? 'default' : 'outline'}
                        size="sm"
                        className="shrink-0 text-xs h-8"
                        onClick={() => { setFilterSection('all'); setPage(1); }}
                      >
                        All ({institutionStudents.filter(s => s.class_id === filterClass).length})
                      </Button>
                      {sectionDistribution.map(s => (
                        <Button
                          key={s.id}
                          variant={filterSection === s.id ? 'default' : 'outline'}
                          size="sm"
                          className="shrink-0 text-xs h-8"
                          onClick={() => { setFilterSection(s.id); setPage(1); }}
                        >
                          {s.name} ({s.count})
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {institutionType === 'college' && (
              <>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Year</p>
                  <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                    <Button
                      variant={filterYear === 'all' ? 'default' : 'outline'}
                      size="sm"
                      className="shrink-0 text-xs h-8"
                      onClick={() => { setFilterYear('all'); setFilterSemester('all'); setPage(1); }}
                    >
                      All ({institutionStudents.length})
                    </Button>
                    {yearDistribution.map(y => (
                      <Button
                        key={y.id}
                        variant={filterYear === y.id ? 'default' : 'outline'}
                        size="sm"
                        className="shrink-0 text-xs h-8"
                        onClick={() => { setFilterYear(y.id); setFilterSemester('all'); setPage(1); }}
                      >
                        {y.name} ({y.count})
                      </Button>
                    ))}
                  </div>
                </div>
                {filterYear !== 'all' && selectedYearSemesters.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Semester</p>
                    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                      <Button
                        variant={filterSemester === 'all' ? 'default' : 'outline'}
                        size="sm"
                        className="shrink-0 text-xs h-8"
                        onClick={() => { setFilterSemester('all'); setPage(1); }}
                      >
                        All ({institutionStudents.filter(s => s.year_id === filterYear).length})
                      </Button>
                      {semesterDistribution.map(s => (
                        <Button
                          key={s.id}
                          variant={filterSemester === s.id ? 'default' : 'outline'}
                          size="sm"
                          className="shrink-0 text-xs h-8"
                          onClick={() => { setFilterSemester(s.id); setPage(1); }}
                        >
                          {s.name} ({s.count})
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Distribution Summary */}
        {institutionType === 'school' && filterClass !== 'all' && sectionDistribution.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
            {sectionDistribution.map(s => (
              <Card key={s.id} className={`cursor-pointer transition-all ${filterSection === s.id ? 'border-primary shadow-sm' : 'hover:border-primary/40'}`}
                onClick={() => { setFilterSection(s.id); setPage(1); }}>
                <CardContent className="p-3 text-center">
                  <p className="text-xs text-muted-foreground">{s.name}</p>
                  <p className="text-lg font-bold text-primary">{s.count}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {institutionType === 'college' && filterYear !== 'all' && semesterDistribution.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
            {semesterDistribution.map(s => (
              <Card key={s.id} className={`cursor-pointer transition-all ${filterSemester === s.id ? 'border-primary shadow-sm' : 'hover:border-primary/40'}`}
                onClick={() => { setFilterSemester(s.id); setPage(1); }}>
                <CardContent className="p-3 text-center">
                  <p className="text-xs text-muted-foreground">{s.name}</p>
                  <p className="text-lg font-bold text-primary">{s.count}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Search & Status Filter */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by name, phone, admission no..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="pl-10" />
          </div>
          <Select value={filterStatus} onValueChange={v => { setFilterStatus(v); setPage(1); }}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent>
          </Select>
        </div>

        {/* Student Table */}
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Adm. No</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>{institutionType === 'school' ? 'Class' : 'Year'}</TableHead>
                  <TableHead>{institutionType === 'school' ? 'Section' : 'Semester'}</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map(s => {
                  const type = s.course_id ? getCourseType(s.course_id) : 'college';
                  const disc = discountByStudent[s.id] || 0;
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono text-xs">{s.admission_number || '-'}</TableCell>
                      <TableCell>
                        <div className="font-medium">{s.full_name || s.name}</div>
                        {disc > 0 && <Badge variant="outline" className="text-xs mt-0.5 text-orange-600 border-orange-300"><Percent className="h-3 w-3 mr-0.5" />Discount Applied</Badge>}
                      </TableCell>
                      <TableCell>{s.course_id ? getCourseName(s.course_id) : s.course}</TableCell>
                      <TableCell>{type === 'school' ? (s.class_id ? getClassName(s.class_id) : '-') : (s.year_id ? getYearName(s.year_id) : s.year)}</TableCell>
                      <TableCell>{type === 'school' ? (s.section_id ? getSectionName(s.section_id) : '-') : (s.semester_id ? getSemesterName(s.semester_id) : s.semester)}</TableCell>
                      <TableCell>{s.phone || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={s.admission_status === 'active' ? 'default' : 'secondary'} className="cursor-pointer" onClick={() => toggleStatus.mutate({ id: s.id, status: s.admission_status })}>
                          {s.admission_status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => setProfileStudent(s)} title="View"><Eye className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => openEdit(s)} title="Edit"><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => { setDiscountOpen(s); setDiscountAmount(''); setDiscountReason(''); }} title="Give Discount"><Percent className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {paginated.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">{isLoading ? 'Loading...' : 'No students found'}</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{filtered.length} students</p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
              <span className="text-sm">Page {page} of {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
        )}
        {/* Edit/Add Dialog */}
        <Dialog open={formOpen} onOpenChange={v => { if (!v) { setFormOpen(false); setEditStudent(null); } }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editStudent ? 'Edit Student' : 'New Admission'}</DialogTitle></DialogHeader>
            <StudentForm
              form={form} setForm={setForm}
              courses={activeCourses}
              formYears={form.course_id ? getYearsForCourse(form.course_id) : []}
              formSemesters={form.year_id ? getSemestersForYear(form.year_id) : []}
              formClasses={form.course_id ? getClassesForCourse(form.course_id) : []}
              formSections={form.class_id ? getSectionsForClass(form.class_id) : []}
              getCourseType={getCourseType}
              onSubmit={() => saveMutation.mutate()}
              isPending={saveMutation.isPending}
              isEdit={!!editStudent}
            />
          </DialogContent>
        </Dialog>

        {/* Discount Dialog */}
        <Dialog open={!!discountOpen} onOpenChange={v => { if (!v) setDiscountOpen(null); }}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Give Discount</DialogTitle></DialogHeader>
            {discountOpen && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Student: <span className="font-medium text-foreground">{discountOpen.full_name || discountOpen.name}</span></p>
                <div>
                  <Label>Discount Amount (₹) *</Label>
                  <Input type="number" value={discountAmount} onChange={e => setDiscountAmount(e.target.value)} placeholder="Enter amount" />
                </div>
                <div>
                  <Label>Reason (optional)</Label>
                  <Textarea value={discountReason} onChange={e => setDiscountReason(e.target.value)} placeholder="Scholarship, merit, etc." rows={2} />
                </div>
                <Button className="w-full" onClick={() => discountMutation.mutate()} disabled={!discountAmount || discountMutation.isPending}>
                  {discountMutation.isPending ? 'Applying...' : 'Apply Discount'}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Profile Dialog */}
        <Dialog open={!!profileStudent} onOpenChange={v => { if (!v) { setProfileStudent(null); setReceiptFee(null); setReceiptStudent(null); } }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Student Profile</DialogTitle></DialogHeader>
            {profileStudent && (
              <StudentProfile
                student={profileStudent}
                getCourseName={getCourseName} getYearName={getYearName} getSemesterName={getSemesterName}
                getClassName={getClassName} getSectionName={getSectionName} getCourseType={getCourseType}
                fees={studentFees} discounts={studentDiscounts}
                discountTotal={discountByStudent[profileStudent.id] || 0}
                onPrintReceipt={(fee) => handlePrintReceipt(profileStudent, fee)}
                onShareReceipt={(fee) => handleWhatsAppShare(profileStudent, fee)}
                institutionName={institutionName}
                getStudentStructureLabel={getStudentStructureLabel}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Receipt Print Dialog */}
        <Dialog open={!!receiptFee} onOpenChange={v => { if (!v) { setReceiptFee(null); setReceiptStudent(null); } }}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Fee Receipt</DialogTitle></DialogHeader>
            {receiptFee && receiptStudent && (
              <ReceiptView
                student={receiptStudent}
                fee={receiptFee}
                institutionName={institutionName}
                structureLabel={getStudentStructureLabel(receiptStudent)}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}

// --- Student Form ---
function StudentForm({
  form, setForm, courses, formYears, formSemesters, formClasses, formSections, getCourseType, onSubmit, isPending, isEdit,
}: {
  form: typeof emptyForm;
  setForm: React.Dispatch<React.SetStateAction<typeof emptyForm>>;
  courses: { id: string; name: string }[];
  formYears: { id: string; name: string }[];
  formSemesters: { id: string; name: string }[];
  formClasses: { id: string; name: string }[];
  formSections: { id: string; name: string }[];
  getCourseType: (id: string | null) => string;
  onSubmit: () => void;
  isPending: boolean;
  isEdit: boolean;
}) {
  const courseType = form.course_id ? getCourseType(form.course_id) : null;
  const isValid = form.full_name && form.course_id && (
    courseType === 'college' ? form.year_id && form.semester_id :
    courseType === 'school' ? form.class_id && form.section_id : false
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-sm text-muted-foreground mb-3">Personal Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><Label>Full Name *</Label><Input value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} /></div>
          <div>
            <Label>Gender</Label>
            <Select value={form.gender} onValueChange={v => setForm(p => ({ ...p, gender: v }))}>
              <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
              <SelectContent><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent>
            </Select>
          </div>
          <div><Label>Date of Birth</Label><Input type="date" value={form.date_of_birth} onChange={e => setForm(p => ({ ...p, date_of_birth: e.target.value }))} /></div>
          <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} /></div>
          <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} /></div>
          <div className="md:col-span-2"><Label>Address</Label><Textarea value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} rows={2} /></div>
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-sm text-muted-foreground mb-3">Academic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Course *</Label>
            <Select value={form.course_id} onValueChange={v => setForm(p => ({ ...p, course_id: v, year_id: '', semester_id: '', class_id: '', section_id: '' }))}>
              <SelectTrigger><SelectValue placeholder="Select course" /></SelectTrigger>
              <SelectContent>{courses.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          {courseType === 'college' && (
            <>
              <div>
                <Label>Year *</Label>
                <Select value={form.year_id} onValueChange={v => setForm(p => ({ ...p, year_id: v, semester_id: '' }))} disabled={!form.course_id}>
                  <SelectTrigger><SelectValue placeholder="Select year" /></SelectTrigger>
                  <SelectContent>{formYears.map(y => <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Semester *</Label>
                <Select value={form.semester_id} onValueChange={v => setForm(p => ({ ...p, semester_id: v }))} disabled={!form.year_id}>
                  <SelectTrigger><SelectValue placeholder="Select semester" /></SelectTrigger>
                  <SelectContent>{formSemesters.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </>
          )}
          {courseType === 'school' && (
            <>
              <div>
                <Label>Class *</Label>
                <Select value={form.class_id} onValueChange={v => setForm(p => ({ ...p, class_id: v, section_id: '' }))} disabled={!form.course_id}>
                  <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                  <SelectContent>{formClasses.map(cl => <SelectItem key={cl.id} value={cl.id}>{cl.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Section *</Label>
                <Select value={form.section_id} onValueChange={v => setForm(p => ({ ...p, section_id: v }))} disabled={!form.class_id}>
                  <SelectTrigger><SelectValue placeholder="Select section" /></SelectTrigger>
                  <SelectContent>{formSections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </>
          )}
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-sm text-muted-foreground mb-3">Admission & Fees</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div><Label>Admission Date *</Label><Input type="date" value={form.admission_date} onChange={e => setForm(p => ({ ...p, admission_date: e.target.value }))} /></div>
          <div>
            <Label>Total Fees (₹)</Label>
            <Input type="number" value={form.total_fees} onChange={e => setForm(p => ({ ...p, total_fees: e.target.value }))} />
          </div>
          <div>
            <Label>Paid Fees (₹) {isEdit && <span className="text-xs text-muted-foreground">(read-only)</span>}</Label>
            <Input type="number" value={form.paid_fees} onChange={e => !isEdit && setForm(p => ({ ...p, paid_fees: e.target.value }))} disabled={isEdit} className={isEdit ? 'bg-muted cursor-not-allowed' : ''} />
          </div>
        </div>
        {isEdit && (
          <div className="mt-4 w-48">
            <Label>Status</Label>
            <Select value={form.admission_status} onValueChange={v => setForm(p => ({ ...p, admission_status: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent>
            </Select>
          </div>
        )}
      </div>

      <Button className="w-full" onClick={onSubmit} disabled={!isValid || isPending}>
        {isPending ? 'Saving...' : isEdit ? 'Update Student' : 'Admit Student'}
      </Button>
    </div>
  );
}

// --- Student Profile ---
function StudentProfile({
  student, getCourseName, getYearName, getSemesterName, getClassName, getSectionName, getCourseType, fees, discounts, discountTotal,
  onPrintReceipt, onShareReceipt, institutionName, getStudentStructureLabel,
}: {
  student: Student;
  getCourseName: (id: string | null) => string;
  getYearName: (id: string | null) => string;
  getSemesterName: (id: string | null) => string;
  getClassName: (id: string | null) => string;
  getSectionName: (id: string | null) => string;
  getCourseType: (id: string | null) => string;
  fees: any[];
  discounts: Discount[];
  discountTotal: number;
  onPrintReceipt: (fee: any) => void;
  onShareReceipt: (fee: any) => void;
  institutionName: string;
  getStudentStructureLabel: (s: Student) => string;
}) {
  const totalPaid = Number(student.paid_fees) + discountTotal;
  const pending = Math.max(0, Number(student.total_fees) - totalPaid);
  const type = getCourseType(student.course_id);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-sm text-muted-foreground mb-2">Personal Information</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><span className="text-muted-foreground">Name:</span> <span className="font-medium">{student.full_name || student.name}</span></div>
          <div><span className="text-muted-foreground">Gender:</span> <span className="font-medium capitalize">{student.gender || '-'}</span></div>
          <div><span className="text-muted-foreground">DOB:</span> <span className="font-medium">{student.date_of_birth || '-'}</span></div>
          <div><span className="text-muted-foreground">Phone:</span> <span className="font-medium">{student.phone || '-'}</span></div>
          <div><span className="text-muted-foreground">Email:</span> <span className="font-medium">{student.email || '-'}</span></div>
          <div className="col-span-2"><span className="text-muted-foreground">Address:</span> <span className="font-medium">{student.address || '-'}</span></div>
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-sm text-muted-foreground mb-2">Academic Information</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><span className="text-muted-foreground">Type:</span> <Badge variant="outline" className="capitalize">{type}</Badge></div>
          <div><span className="text-muted-foreground">Course:</span> <span className="font-medium">{student.course_id ? getCourseName(student.course_id) : student.course}</span></div>
          {type === 'college' ? (
            <>
              <div><span className="text-muted-foreground">Year:</span> <span className="font-medium">{student.year_id ? getYearName(student.year_id) : student.year}</span></div>
              <div><span className="text-muted-foreground">Semester:</span> <span className="font-medium">{student.semester_id ? getSemesterName(student.semester_id) : student.semester}</span></div>
            </>
          ) : (
            <>
              <div><span className="text-muted-foreground">Class:</span> <span className="font-medium">{student.class_id ? getClassName(student.class_id) : '-'}</span></div>
              <div><span className="text-muted-foreground">Section:</span> <span className="font-medium">{student.section_id ? getSectionName(student.section_id) : '-'}</span></div>
            </>
          )}
          <div><span className="text-muted-foreground">Status:</span> <Badge variant={student.admission_status === 'active' ? 'default' : 'secondary'}>{student.admission_status}</Badge></div>
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-sm text-muted-foreground mb-2">Admission Details</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><span className="text-muted-foreground">Admission No:</span> <span className="font-medium font-mono">{student.admission_number || '-'}</span></div>
          <div><span className="text-muted-foreground">Admission Date:</span> <span className="font-medium">{student.admission_date}</span></div>
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-sm text-muted-foreground mb-2">Fee Information</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Total</p><p className="text-lg font-bold">₹{Number(student.total_fees).toLocaleString('en-IN')}</p></CardContent></Card>
          <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Paid</p><p className="text-lg font-bold text-green-600">₹{Number(student.paid_fees).toLocaleString('en-IN')}</p></CardContent></Card>
          <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Discount</p><p className="text-lg font-bold text-orange-600">₹{discountTotal.toLocaleString('en-IN')}</p></CardContent></Card>
          <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Pending</p><p className={`text-lg font-bold ${pending > 0 ? 'text-destructive' : 'text-green-600'}`}>₹{pending.toLocaleString('en-IN')}</p></CardContent></Card>
        </div>
        {discountTotal > 0 && (
          <p className="text-xs text-muted-foreground mt-2">
            Effective Paid: ₹{Number(student.paid_fees).toLocaleString('en-IN')} (paid) + ₹{discountTotal.toLocaleString('en-IN')} (discount) = ₹{totalPaid.toLocaleString('en-IN')}
          </p>
        )}
      </div>

      {fees.length > 0 && (
        <div>
          <h3 className="font-semibold text-sm text-muted-foreground mb-2">Fee Transactions</h3>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Receipt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fees.map((f: any) => (
                  <TableRow key={f.id}>
                    <TableCell>{f.date}</TableCell>
                    <TableCell className="text-right">₹{Number(f.amount).toLocaleString('en-IN')}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onPrintReceipt(f)} title="Print Receipt"><Printer className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onShareReceipt(f)} title="Share on WhatsApp"><MessageCircle className="h-4 w-4 text-green-600" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {discounts.length > 0 && (
        <div>
          <h3 className="font-semibold text-sm text-muted-foreground mb-2">Discount History</h3>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Reason</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
              <TableBody>
                {discounts.map(d => (
                  <TableRow key={d.id}>
                    <TableCell>{new Date(d.created_at).toLocaleDateString('en-IN')}</TableCell>
                    <TableCell>{d.reason || '-'}</TableCell>
                    <TableCell className="text-right text-orange-600">₹{Number(d.amount).toLocaleString('en-IN')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Receipt View ---
function ReceiptView({ student, fee, institutionName, structureLabel }: {
  student: Student; fee: any; institutionName: string; structureLabel: string;
}) {
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const content = receiptRef.current;
    if (!content) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>Fee Receipt</title><style>
      body { font-family: system-ui, sans-serif; margin: 0; padding: 20px; color: #333; }
      .receipt { max-width: 600px; margin: 0 auto; border: 2px solid #1a365d; padding: 30px; }
      .header { text-align: center; border-bottom: 2px solid #1a365d; padding-bottom: 16px; margin-bottom: 20px; }
      .header h1 { font-size: 22px; margin: 0 0 4px; color: #1a365d; }
      .header p { margin: 0; font-size: 12px; color: #666; }
      .row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; }
      .row .label { color: #666; }
      .row .value { font-weight: 600; }
      .divider { border-top: 1px dashed #ccc; margin: 12px 0; }
      .amount-box { background: #f0f4f8; padding: 16px; text-align: center; border-radius: 8px; margin-top: 16px; }
      .amount-box .amt { font-size: 28px; font-weight: 700; color: #1a365d; }
      .footer { text-align: center; margin-top: 20px; font-size: 11px; color: #999; }
      @media print { body { padding: 0; } .receipt { border: none; } }
    </style></head><body>${content.innerHTML}</body></html>`);
    win.document.close();
    setTimeout(() => { win.print(); win.close(); }, 300);
  };

  const handleWhatsApp = () => {
    const msg = `📄 *Fee Receipt*
${institutionName}
Student: ${student.full_name || student.name}
${structureLabel}
Admission No: ${student.admission_number || '-'}
Amount Paid: ₹${Number(fee.amount).toLocaleString('en-IN')}
Date: ${fee.date}
Thank you.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="space-y-4">
      <div ref={receiptRef}>
        <div className="receipt">
          <div className="header" style={{ textAlign: 'center', borderBottom: '2px solid hsl(var(--primary))', paddingBottom: '16px', marginBottom: '20px' }}>
            <h1 style={{ fontSize: '20px', margin: '0 0 4px', color: 'hsl(var(--primary))' }}>{institutionName}</h1>
            <p style={{ margin: 0, fontSize: '12px', color: 'hsl(var(--muted-foreground))' }}>Fee Receipt</p>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Student Name</span><span className="font-semibold">{student.full_name || student.name}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Course / Structure</span><span className="font-semibold">{structureLabel}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Admission No</span><span className="font-semibold font-mono">{student.admission_number || '-'}</span></div>
            <div className="border-t border-dashed my-3" />
            <div className="flex justify-between"><span className="text-muted-foreground">Payment Date</span><span className="font-semibold">{fee.date}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Transaction ID</span><span className="font-semibold font-mono text-xs">{fee.id?.slice(0, 8).toUpperCase()}</span></div>
          </div>
          <div className="mt-4 bg-secondary/50 rounded-lg p-4 text-center">
            <p className="text-xs text-muted-foreground">Amount Paid</p>
            <p className="text-3xl font-bold text-primary">₹{Number(fee.amount).toLocaleString('en-IN')}</p>
          </div>
          <p className="text-center text-xs text-muted-foreground mt-4">This is a computer-generated receipt.</p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button className="flex-1" onClick={handlePrint}><Printer className="h-4 w-4 mr-2" />Print Receipt</Button>
        <Button variant="outline" className="flex-1" onClick={handleWhatsApp}><MessageCircle className="h-4 w-4 mr-2 text-green-600" />Share on WhatsApp</Button>
      </div>
    </div>
  );
}
