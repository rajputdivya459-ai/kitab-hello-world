import { useEffect, useState } from 'react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function AdminTeacherAssignments() {
  const { toast } = useToast();
  const [teachers, setTeachers] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);

  const [staffId, setStaffId] = useState('');
  const [classId, setClassId] = useState('');
  const [sectionId, setSectionId] = useState<string>('');
  const [subjectId, setSubjectId] = useState<string>('');
  const [isClassTeacher, setIsClassTeacher] = useState(false);

  const load = async () => {
    const sb = supabase as any;
    const [{ data: t }, { data: c }, { data: sec }, { data: sub }, { data: a }] = await Promise.all([
      sb.from('staff').select('id,full_name,staff_code').eq('staff_type', 'teaching').eq('status', 'active').order('full_name'),
      supabase.from('classes').select('id,name,course_id').order('name'),
      supabase.from('sections').select('id,name,class_id').order('name'),
      supabase.from('subjects').select('id,name,class_id').order('name'),
      sb.from('teacher_assignments').select('*'),
    ]);
    setTeachers(t ?? []); setClasses(c ?? []); setSections(sec ?? []);
    setSubjects(sub ?? []); setAssignments(a ?? []);
  };
  useEffect(() => { load(); }, []);

  const sectionsForClass = sections.filter(s => s.class_id === classId);
  const subjectsForClass = subjects.filter(s => s.class_id === classId);

  const teacherMap = Object.fromEntries(teachers.map(t => [t.id, t.full_name]));
  const classMap = Object.fromEntries(classes.map(c => [c.id, c.name]));
  const sectionMap = Object.fromEntries(sections.map(s => [s.id, s.name]));
  const subjectMap = Object.fromEntries(subjects.map(s => [s.id, s.name]));

  const add = async () => {
    if (!staffId || !classId) return toast({ title: 'Pick teacher and class', variant: 'destructive' });
    const { error } = await (supabase as any).from('teacher_assignments').insert({
      staff_id: staffId, class_id: classId,
      section_id: sectionId || null, subject_id: subjectId || null,
      is_class_teacher: isClassTeacher,
    });
    if (error) return toast({ title: 'Failed', description: error.message, variant: 'destructive' });
    toast({ title: 'Assignment added' });
    setSectionId(''); setSubjectId(''); setIsClassTeacher(false);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Remove this assignment?')) return;
    await (supabase as any).from('teacher_assignments').delete().eq('id', id);
    load();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Teacher Assignments</h1>
          <p className="text-muted-foreground">Map teachers to classes, sections and subjects.</p>
        </div>

        <Card><CardContent className="p-5 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <Select value={staffId} onValueChange={setStaffId}>
              <SelectTrigger><SelectValue placeholder="Teacher" /></SelectTrigger>
              <SelectContent>{teachers.map(t => <SelectItem key={t.id} value={t.id}>{t.full_name}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={classId} onValueChange={(v) => { setClassId(v); setSectionId(''); setSubjectId(''); }}>
              <SelectTrigger><SelectValue placeholder="Class" /></SelectTrigger>
              <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={sectionId} onValueChange={setSectionId} disabled={!classId}>
              <SelectTrigger><SelectValue placeholder="Section (any)" /></SelectTrigger>
              <SelectContent>{sectionsForClass.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={subjectId} onValueChange={setSubjectId} disabled={!classId}>
              <SelectTrigger><SelectValue placeholder="Subject (any)" /></SelectTrigger>
              <SelectContent>{subjectsForClass.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Checkbox id="ct" checked={isClassTeacher} onCheckedChange={(v) => setIsClassTeacher(!!v)} />
              <label htmlFor="ct" className="text-sm">Class Teacher</label>
            </div>
          </div>
          <Button onClick={add}><Plus className="h-4 w-4 mr-1" /> Add Assignment</Button>
        </CardContent></Card>

        <div className="bg-card rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Teacher</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Section</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Class Teacher</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.map(a => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{teacherMap[a.staff_id] ?? '—'}</TableCell>
                  <TableCell>{classMap[a.class_id] ?? '—'}</TableCell>
                  <TableCell>{a.section_id ? sectionMap[a.section_id] : <span className="text-muted-foreground">All</span>}</TableCell>
                  <TableCell>{a.subject_id ? subjectMap[a.subject_id] : <span className="text-muted-foreground">All</span>}</TableCell>
                  <TableCell>{a.is_class_teacher && <Badge className="bg-teal-100 text-teal-700">Yes</Badge>}</TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" onClick={() => remove(a.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {assignments.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No assignments yet.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminLayout>
  );
}
