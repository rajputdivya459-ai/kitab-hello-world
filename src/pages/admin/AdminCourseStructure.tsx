import { useState } from 'react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, ChevronRight, School } from 'lucide-react';

type Course = { id: string; name: string; description: string | null; is_active: boolean; institution_type: string; created_at: string };
type Year = { id: string; name: string; course_id: string; is_active: boolean; created_at: string };
type Semester = { id: string; name: string; year_id: string; is_active: boolean; created_at: string };
type ClassItem = { id: string; name: string; course_id: string; is_active: boolean; created_at: string };
type SectionItem = { id: string; name: string; class_id: string; is_active: boolean; created_at: string };

export default function AdminCourseStructure() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: courses = [] } = useQuery<Course[]>({
    queryKey: ['courses'],
    queryFn: async () => {
      const { data, error } = await supabase.from('courses').select('*').order('name');
      if (error) throw error;
      return data as Course[];
    },
  });

  const { data: classes = [] } = useQuery<ClassItem[]>({
    queryKey: ['classes'],
    queryFn: async () => {
      const { data, error } = await supabase.from('classes').select('*').order('name');
      if (error) throw error;
      return data as ClassItem[];
    },
  });

  const { data: sections = [] } = useQuery<SectionItem[]>({
    queryKey: ['sections'],
    queryFn: async () => {
      const { data, error } = await supabase.from('sections').select('*').order('name');
      if (error) throw error;
      return data as SectionItem[];
    },
  });

  const filteredCourses = courses.filter(c => c.institution_type === 'school');

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Course Structure</h1>
            <p className="text-sm text-muted-foreground">Manage school courses, classes &amp; sections</p>
          </div>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Course → Class → Section Hierarchy</CardTitle></CardHeader>
          <CardContent>
            {filteredCourses.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No school courses yet. Add one below.</p>
            ) : (
              <div className="space-y-2">
                {filteredCourses.filter(c => c.is_active).map(course => {
                  const courseClasses = classes.filter(cl => cl.course_id === course.id && cl.is_active);
                  return (
                    <div key={course.id} className="border rounded-lg p-3">
                      <p className="font-semibold text-sm flex items-center gap-1"><School className="h-4 w-4 text-primary" />{course.name}</p>
                      {courseClasses.length > 0 && (
                        <div className="ml-4 mt-2 space-y-1">
                          {courseClasses.map(cl => {
                            const clSections = sections.filter(s => s.class_id === cl.id && s.is_active);
                            return (
                              <div key={cl.id}>
                                <p className="text-sm text-muted-foreground flex items-center gap-1"><ChevronRight className="h-3 w-3" />{cl.name}</p>
                                {clSections.length > 0 && (
                                  <div className="ml-5 flex flex-wrap gap-1 mt-1">
                                    {clSections.map(sec => <Badge key={sec.id} variant="secondary" className="text-xs">{sec.name}</Badge>)}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Tabs defaultValue="courses" className="space-y-4">
          <TabsList className="w-full flex flex-wrap h-auto gap-1">
            <TabsTrigger value="courses" className="flex-1 min-w-[100px]">Courses</TabsTrigger>
            <TabsTrigger value="classes" className="flex-1 min-w-[100px]">Classes</TabsTrigger>
            <TabsTrigger value="sections" className="flex-1 min-w-[100px]">Sections</TabsTrigger>
          </TabsList>
          <TabsContent value="courses"><CoursesTab courses={filteredCourses} institutionType="school" /></TabsContent>
          <TabsContent value="classes"><ClassesTab classes={classes} courses={filteredCourses} /></TabsContent>
          <TabsContent value="sections"><SectionsTab sections={sections} classes={classes} courses={filteredCourses} /></TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}

/* ============ COURSES TAB ============ */
function CoursesTab({ courses, institutionType }: { courses: Course[]; institutionType: string }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<Course | null>(null);
  const [form, setForm] = useState({ name: '', description: '' });

  const save = useMutation({
    mutationFn: async () => {
      const payload = { name: form.name, description: form.description || null, institution_type: institutionType };
      if (editItem) {
        const { error } = await supabase.from('courses').update(payload).eq('id', editItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('courses').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['courses'] }); setOpen(false); setEditItem(null); toast({ title: 'Saved' }); },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('courses').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['courses'] }); toast({ title: 'Deleted' }); },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const toggle = useMutation({
    mutationFn: async (c: Course) => { const { error } = await supabase.from('courses').update({ is_active: !c.is_active }).eq('id', c.id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['courses'] }); toast({ title: 'Updated' }); },
  });

  const openAdd = () => { setEditItem(null); setForm({ name: '', description: '' }); setOpen(true); };
  const openEdit = (c: Course) => { setEditItem(c); setForm({ name: c.name, description: c.description ?? '' }); setOpen(true); };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">{institutionType === 'college' ? 'College' : 'School'} Courses</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm" onClick={openAdd}><Plus className="h-4 w-4 mr-1" />Add Course</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editItem ? 'Edit' : 'Add'} Course</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Name*</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder={institutionType === 'college' ? 'e.g. BBA, BCA, BSc' : 'e.g. High School, Primary School'} /></div>
              <div><Label>Description</Label><Input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></div>
              <Button className="w-full" onClick={() => save.mutate()} disabled={!form.name || save.isPending}>Save</Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Description</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {courses.map(c => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell>{c.description || '-'}</TableCell>
                <TableCell>
                  <Badge className="cursor-pointer" variant={c.is_active ? 'default' : 'secondary'} onClick={() => toggle.mutate(c)}>
                    {c.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right space-x-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => del.mutate(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
            {courses.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No courses yet</TableCell></TableRow>}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

/* ============ YEARS TAB (College) ============ */
function YearsTab({ years, courses }: { years: Year[]; courses: Course[] }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<Year | null>(null);
  const [form, setForm] = useState({ name: '', course_id: '' });

  const collegeCourseIds = new Set(courses.map(c => c.id));
  const filteredYears = years.filter(y => collegeCourseIds.has(y.course_id));

  const save = useMutation({
    mutationFn: async () => {
      const payload = { name: form.name, course_id: form.course_id };
      if (editItem) {
        const { error } = await supabase.from('years').update(payload).eq('id', editItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('years').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['years'] }); setOpen(false); setEditItem(null); toast({ title: 'Saved' }); },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('years').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['years'] }); toast({ title: 'Deleted' }); },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const toggle = useMutation({
    mutationFn: async (y: Year) => { const { error } = await supabase.from('years').update({ is_active: !y.is_active }).eq('id', y.id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['years'] }); toast({ title: 'Updated' }); },
  });

  const openAdd = () => { setEditItem(null); setForm({ name: '', course_id: '' }); setOpen(true); };
  const openEdit = (y: Year) => { setEditItem(y); setForm({ name: y.name, course_id: y.course_id }); setOpen(true); };

  const activeCourses = courses.filter(c => c.is_active);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Years</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm" onClick={openAdd}><Plus className="h-4 w-4 mr-1" />Add Year</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editItem ? 'Edit' : 'Add'} Year</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Name*</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. 1st Year" /></div>
              <div>
                <Label>Course*</Label>
                <Select value={form.course_id} onValueChange={v => setForm(p => ({ ...p, course_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select course" /></SelectTrigger>
                  <SelectContent>{activeCourses.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Button className="w-full" onClick={() => save.mutate()} disabled={!form.name || !form.course_id || save.isPending}>Save</Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Course</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {filteredYears.map(y => (
              <TableRow key={y.id}>
                <TableCell className="font-medium">{y.name}</TableCell>
                <TableCell>{courses.find(c => c.id === y.course_id)?.name || '-'}</TableCell>
                <TableCell>
                  <Badge className="cursor-pointer" variant={y.is_active ? 'default' : 'secondary'} onClick={() => toggle.mutate(y)}>
                    {y.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right space-x-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(y)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => del.mutate(y.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
            {filteredYears.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No years yet</TableCell></TableRow>}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

/* ============ SEMESTERS TAB (College) ============ */
function SemestersTab({ semesters, years, courses }: { semesters: Semester[]; years: Year[]; courses: Course[] }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<Semester | null>(null);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [form, setForm] = useState({ name: '', year_id: '' });

  const collegeCourseIds = new Set(courses.map(c => c.id));
  const collegeYearIds = new Set(years.filter(y => collegeCourseIds.has(y.course_id)).map(y => y.id));
  const filteredSemesters = semesters.filter(s => collegeYearIds.has(s.year_id));

  const save = useMutation({
    mutationFn: async () => {
      const payload = { name: form.name, year_id: form.year_id };
      if (editItem) {
        const { error } = await supabase.from('semesters').update(payload).eq('id', editItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('semesters').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['semesters'] }); setOpen(false); setEditItem(null); toast({ title: 'Saved' }); },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('semesters').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['semesters'] }); toast({ title: 'Deleted' }); },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const toggle = useMutation({
    mutationFn: async (s: Semester) => { const { error } = await supabase.from('semesters').update({ is_active: !s.is_active }).eq('id', s.id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['semesters'] }); toast({ title: 'Updated' }); },
  });

  const openAdd = () => { setEditItem(null); setSelectedCourse(''); setForm({ name: '', year_id: '' }); setOpen(true); };
  const openEdit = (s: Semester) => {
    setEditItem(s);
    const year = years.find(y => y.id === s.year_id);
    setSelectedCourse(year?.course_id ?? '');
    setForm({ name: s.name, year_id: s.year_id });
    setOpen(true);
  };

  const activeCourses = courses.filter(c => c.is_active);
  const filteredYears = years.filter(y => y.course_id === selectedCourse && y.is_active);

  const getYearName = (yearId: string) => years.find(y => y.id === yearId)?.name || '-';
  const getCourseName = (yearId: string) => {
    const year = years.find(y => y.id === yearId);
    return year ? courses.find(c => c.id === year.course_id)?.name || '-' : '-';
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Semesters</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm" onClick={openAdd}><Plus className="h-4 w-4 mr-1" />Add Semester</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editItem ? 'Edit' : 'Add'} Semester</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Name*</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Semester 1" /></div>
              <div>
                <Label>Course*</Label>
                <Select value={selectedCourse} onValueChange={v => { setSelectedCourse(v); setForm(p => ({ ...p, year_id: '' })); }}>
                  <SelectTrigger><SelectValue placeholder="Select course" /></SelectTrigger>
                  <SelectContent>{activeCourses.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Year*</Label>
                <Select value={form.year_id} onValueChange={v => setForm(p => ({ ...p, year_id: v }))} disabled={!selectedCourse}>
                  <SelectTrigger><SelectValue placeholder="Select year" /></SelectTrigger>
                  <SelectContent>{filteredYears.map(y => <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Button className="w-full" onClick={() => save.mutate()} disabled={!form.name || !form.year_id || save.isPending}>Save</Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Year</TableHead><TableHead>Course</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {filteredSemesters.map(s => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.name}</TableCell>
                <TableCell>{getYearName(s.year_id)}</TableCell>
                <TableCell>{getCourseName(s.year_id)}</TableCell>
                <TableCell>
                  <Badge className="cursor-pointer" variant={s.is_active ? 'default' : 'secondary'} onClick={() => toggle.mutate(s)}>
                    {s.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right space-x-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => del.mutate(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
            {filteredSemesters.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No semesters yet</TableCell></TableRow>}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

/* ============ CLASSES TAB (School) ============ */
function ClassesTab({ classes, courses }: { classes: ClassItem[]; courses: Course[] }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<ClassItem | null>(null);
  const [form, setForm] = useState({ name: '', course_id: '' });

  const schoolCourseIds = new Set(courses.map(c => c.id));
  const filteredClasses = classes.filter(cl => schoolCourseIds.has(cl.course_id));

  const save = useMutation({
    mutationFn: async () => {
      const payload = { name: form.name, course_id: form.course_id };
      if (editItem) {
        const { error } = await supabase.from('classes').update(payload).eq('id', editItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('classes').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['classes'] }); setOpen(false); setEditItem(null); toast({ title: 'Saved' }); },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('classes').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['classes'] }); toast({ title: 'Deleted' }); },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const toggle = useMutation({
    mutationFn: async (cl: ClassItem) => { const { error } = await supabase.from('classes').update({ is_active: !cl.is_active }).eq('id', cl.id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['classes'] }); toast({ title: 'Updated' }); },
  });

  const openAdd = () => { setEditItem(null); setForm({ name: '', course_id: '' }); setOpen(true); };
  const openEdit = (cl: ClassItem) => { setEditItem(cl); setForm({ name: cl.name, course_id: cl.course_id }); setOpen(true); };

  const activeCourses = courses.filter(c => c.is_active);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Classes</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm" onClick={openAdd}><Plus className="h-4 w-4 mr-1" />Add Class</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editItem ? 'Edit' : 'Add'} Class</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Name*</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Class 10, Class 9" /></div>
              <div>
                <Label>Course*</Label>
                <Select value={form.course_id} onValueChange={v => setForm(p => ({ ...p, course_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select course" /></SelectTrigger>
                  <SelectContent>{activeCourses.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Button className="w-full" onClick={() => save.mutate()} disabled={!form.name || !form.course_id || save.isPending}>Save</Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Course</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {filteredClasses.map(cl => (
              <TableRow key={cl.id}>
                <TableCell className="font-medium">{cl.name}</TableCell>
                <TableCell>{courses.find(c => c.id === cl.course_id)?.name || '-'}</TableCell>
                <TableCell>
                  <Badge className="cursor-pointer" variant={cl.is_active ? 'default' : 'secondary'} onClick={() => toggle.mutate(cl)}>
                    {cl.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right space-x-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(cl)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => del.mutate(cl.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
            {filteredClasses.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No classes yet</TableCell></TableRow>}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

/* ============ SECTIONS TAB (School) ============ */
function SectionsTab({ sections, classes, courses }: { sections: SectionItem[]; classes: ClassItem[]; courses: Course[] }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<SectionItem | null>(null);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [form, setForm] = useState({ name: '', class_id: '' });

  const schoolCourseIds = new Set(courses.map(c => c.id));
  const schoolClassIds = new Set(classes.filter(cl => schoolCourseIds.has(cl.course_id)).map(cl => cl.id));
  const filteredSections = sections.filter(s => schoolClassIds.has(s.class_id));

  const save = useMutation({
    mutationFn: async () => {
      const payload = { name: form.name, class_id: form.class_id };
      if (editItem) {
        const { error } = await supabase.from('sections').update(payload).eq('id', editItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('sections').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sections'] }); setOpen(false); setEditItem(null); toast({ title: 'Saved' }); },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('sections').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sections'] }); toast({ title: 'Deleted' }); },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const toggle = useMutation({
    mutationFn: async (s: SectionItem) => { const { error } = await supabase.from('sections').update({ is_active: !s.is_active }).eq('id', s.id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sections'] }); toast({ title: 'Updated' }); },
  });

  const openAdd = () => { setEditItem(null); setSelectedCourse(''); setForm({ name: '', class_id: '' }); setOpen(true); };
  const openEdit = (s: SectionItem) => {
    setEditItem(s);
    const cl = classes.find(c => c.id === s.class_id);
    setSelectedCourse(cl?.course_id ?? '');
    setForm({ name: s.name, class_id: s.class_id });
    setOpen(true);
  };

  const activeCourses = courses.filter(c => c.is_active);
  const filteredClasses = classes.filter(cl => cl.course_id === selectedCourse && cl.is_active);

  const getClassName = (classId: string) => classes.find(c => c.id === classId)?.name || '-';
  const getCourseName = (classId: string) => {
    const cl = classes.find(c => c.id === classId);
    return cl ? courses.find(co => co.id === cl.course_id)?.name || '-' : '-';
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Sections</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm" onClick={openAdd}><Plus className="h-4 w-4 mr-1" />Add Section</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editItem ? 'Edit' : 'Add'} Section</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Name*</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Section A" /></div>
              <div>
                <Label>Course*</Label>
                <Select value={selectedCourse} onValueChange={v => { setSelectedCourse(v); setForm(p => ({ ...p, class_id: '' })); }}>
                  <SelectTrigger><SelectValue placeholder="Select course" /></SelectTrigger>
                  <SelectContent>{activeCourses.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Class*</Label>
                <Select value={form.class_id} onValueChange={v => setForm(p => ({ ...p, class_id: v }))} disabled={!selectedCourse}>
                  <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                  <SelectContent>{filteredClasses.map(cl => <SelectItem key={cl.id} value={cl.id}>{cl.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Button className="w-full" onClick={() => save.mutate()} disabled={!form.name || !form.class_id || save.isPending}>Save</Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Class</TableHead><TableHead>Course</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {filteredSections.map(s => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.name}</TableCell>
                <TableCell>{getClassName(s.class_id)}</TableCell>
                <TableCell>{getCourseName(s.class_id)}</TableCell>
                <TableCell>
                  <Badge className="cursor-pointer" variant={s.is_active ? 'default' : 'secondary'} onClick={() => toggle.mutate(s)}>
                    {s.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right space-x-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => del.mutate(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
            {filteredSections.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No sections yet</TableCell></TableRow>}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
