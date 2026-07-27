import { useEffect, useMemo, useState } from 'react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { useCourseStructure } from '@/hooks/useCourseStructure';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, Pencil, Trash2, Save, BookOpen, FileText, ClipboardEdit, Loader2 } from 'lucide-react';
import { notifyResultPublished } from '@/lib/notify';

interface ExamRow {
  id: string; name: string; exam_type: string; class_id: string; section_id: string | null;
  start_date: string | null; end_date: string | null; academic_year: string; is_published: boolean;
}
interface SubjectRow { id: string; name: string; class_id: string }
interface ExamSubjectRow { id: string; exam_id: string; subject_id: string; max_marks: number; passing_marks: number }

const EXAM_TYPES = [
  { value: 'unit_test', label: 'Unit Test' },
  { value: 'mid_term', label: 'Mid Term' },
  { value: 'final', label: 'Final Exam' },
  { value: 'pre_board', label: 'Pre-Board' },
  { value: 'practical', label: 'Practical' },
];

export default function AdminExams() {
  return (
    <AdminLayout>
      <Tabs defaultValue="exams" className="space-y-4">
        <TabsList>
          <TabsTrigger value="exams"><FileText className="h-4 w-4 mr-1" />Exams</TabsTrigger>
          <TabsTrigger value="subjects"><BookOpen className="h-4 w-4 mr-1" />Subjects</TabsTrigger>
          <TabsTrigger value="marks"><ClipboardEdit className="h-4 w-4 mr-1" />Marks Entry</TabsTrigger>
        </TabsList>
        <TabsContent value="exams"><ExamsTab /></TabsContent>
        <TabsContent value="subjects"><SubjectsTab /></TabsContent>
        <TabsContent value="marks"><MarksTab /></TabsContent>
      </Tabs>
    </AdminLayout>
  );
}

// ---------------- Exams Tab ----------------
function ExamsTab() {
  const { classes, sections, getSectionsForClass, getClassName, getSectionName } = useCourseStructure();
  const { toast } = useToast();
  const [exams, setExams] = useState<ExamRow[]>([]);
  const [filterClass, setFilterClass] = useState<string>('all');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ExamRow | null>(null);
  const [assignExam, setAssignExam] = useState<ExamRow | null>(null);

  const load = async () => {
    const { data } = await supabase.from('exams').select('*').order('start_date', { ascending: false });
    setExams((data ?? []) as ExamRow[]);
  };
  useEffect(() => { load(); }, []);

  const filtered = filterClass === 'all' ? exams : exams.filter(e => e.class_id === filterClass);

  const remove = async (id: string) => {
    if (!confirm('Delete this exam and all its marks?')) return;
    const { error } = await supabase.from('exams').delete().eq('id', id);
    if (error) toast({ title: 'Delete failed', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Exam deleted' }); load(); }
  };

  const togglePublish = async (e: ExamRow) => {
    const { error } = await supabase.from('exams').update({ is_published: !e.is_published }).eq('id', e.id);
    if (error) toast({ title: 'Failed', description: error.message, variant: 'destructive' });
    else {
      toast({ title: e.is_published ? 'Unpublished' : 'Published', description: e.name });
      if (!e.is_published) void notifyResultPublished(e.class_id, e.name).catch(() => {});
      load();
    }
  };

  return (
    <div className="space-y-3">
      <Card>
        <CardContent className="p-4 flex flex-wrap gap-3 items-end justify-between">
          <div className="flex-1 min-w-[180px]">
            <label className="text-xs text-muted-foreground">Filter by class</label>
            <Select value={filterClass} onValueChange={setFilterClass}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All classes</SelectItem>
                {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => { setEditing(null); setOpen(true); }}><Plus className="h-4 w-4 mr-1" />New Exam</Button>
        </CardContent>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Class</TableHead>
              <TableHead className="hidden md:table-cell">Section</TableHead>
              <TableHead className="hidden md:table-cell">Dates</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No exams yet.</TableCell></TableRow>
            )}
            {filtered.map(e => (
              <TableRow key={e.id}>
                <TableCell className="font-medium">{e.name}</TableCell>
                <TableCell className="capitalize text-sm text-muted-foreground">{e.exam_type.replace('_',' ')}</TableCell>
                <TableCell>{getClassName(e.class_id)}</TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground text-sm">{e.section_id ? getSectionName(e.section_id) : 'All'}</TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground text-xs">{e.start_date} → {e.end_date}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Switch checked={e.is_published} onCheckedChange={() => togglePublish(e)} />
                    <Badge variant={e.is_published ? 'default' : 'secondary'}>{e.is_published ? 'Published' : 'Draft'}</Badge>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="ghost" onClick={() => setAssignExam(e)}><BookOpen className="h-4 w-4" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => { setEditing(e); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(e.id)}><Trash2 className="h-4 w-4 text-rose-600" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <ExamDialog open={open} onClose={() => setOpen(false)} editing={editing} onSaved={load} />
      {assignExam && (
        <AssignSubjectsDialog
          exam={assignExam}
          onClose={() => setAssignExam(null)}
        />
      )}
    </div>
  );
}

function ExamDialog({ open, onClose, editing, onSaved }: { open: boolean; onClose: () => void; editing: ExamRow | null; onSaved: () => void }) {
  const { classes, getSectionsForClass } = useCourseStructure();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [examType, setExamType] = useState('unit_test');
  const [classId, setClassId] = useState('');
  const [sectionId, setSectionId] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [academicYear, setAcademicYear] = useState(new Date().getFullYear().toString());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editing) {
      setName(editing.name); setExamType(editing.exam_type); setClassId(editing.class_id);
      setSectionId(editing.section_id ?? 'all'); setStartDate(editing.start_date ?? '');
      setEndDate(editing.end_date ?? ''); setAcademicYear(editing.academic_year);
    } else {
      setName(''); setExamType('unit_test'); setClassId(''); setSectionId('all');
      setStartDate(''); setEndDate(''); setAcademicYear(new Date().getFullYear().toString());
    }
  }, [editing, open]);

  const save = async () => {
    if (!name || !classId) { toast({ title: 'Name and class required', variant: 'destructive' }); return; }
    setSaving(true);
    const payload = {
      name, exam_type: examType, class_id: classId,
      section_id: sectionId === 'all' ? null : sectionId,
      start_date: startDate || null, end_date: endDate || null,
      academic_year: academicYear,
    };
    const { error } = editing
      ? await supabase.from('exams').update(payload).eq('id', editing.id)
      : await supabase.from('exams').insert(payload);
    setSaving(false);
    if (error) toast({ title: 'Save failed', description: error.message, variant: 'destructive' });
    else { toast({ title: editing ? 'Exam updated' : 'Exam created' }); onSaved(); onClose(); }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>{editing ? 'Edit Exam' : 'Create Exam'}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><label className="text-xs text-muted-foreground">Name</label><Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Mid Term 2026" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-muted-foreground">Type</label>
              <Select value={examType} onValueChange={setExamType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{EXAM_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><label className="text-xs text-muted-foreground">Academic Year</label><Input value={academicYear} onChange={e => setAcademicYear(e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-muted-foreground">Class</label>
              <Select value={classId} onValueChange={(v) => { setClassId(v); setSectionId('all'); }}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><label className="text-xs text-muted-foreground">Section (optional)</label>
              <Select value={sectionId} onValueChange={setSectionId} disabled={!classId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All sections</SelectItem>
                  {getSectionsForClass(classId).map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-muted-foreground">Start Date</label><Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} /></div>
            <div><label className="text-xs text-muted-foreground">End Date</label><Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} /></div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AssignSubjectsDialog({ exam, onClose }: { exam: ExamRow; onClose: () => void }) {
  const { toast } = useToast();
  const [subjects, setSubjects] = useState<SubjectRow[]>([]);
  const [es, setEs] = useState<Record<string, { selected: boolean; max: number; pass: number }>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const [{ data: subs }, { data: links }] = await Promise.all([
        supabase.from('subjects').select('*').eq('class_id', exam.class_id).order('name'),
        supabase.from('exam_subjects').select('*').eq('exam_id', exam.id),
      ]);
      setSubjects((subs ?? []) as SubjectRow[]);
      const linkMap = new Map((links ?? []).map((l: any) => [l.subject_id, l]));
      const state: typeof es = {};
      (subs ?? []).forEach((s: any) => {
        const l = linkMap.get(s.id);
        state[s.id] = { selected: !!l, max: Number(l?.max_marks ?? 100), pass: Number(l?.passing_marks ?? 33) };
      });
      setEs(state);
    })();
  }, [exam.id, exam.class_id]);

  const save = async () => {
    setSaving(true);
    const toKeep = Object.entries(es).filter(([_, v]) => v.selected);
    // Wipe and re-insert is simplest given small dataset
    await supabase.from('exam_subjects').delete().eq('exam_id', exam.id);
    if (toKeep.length) {
      const rows = toKeep.map(([subject_id, v]) => ({
        exam_id: exam.id, subject_id, max_marks: v.max, passing_marks: v.pass,
      }));
      const { error } = await supabase.from('exam_subjects').insert(rows);
      if (error) { toast({ title: 'Failed', description: error.message, variant: 'destructive' }); setSaving(false); return; }
    }
    setSaving(false);
    toast({ title: 'Subjects assigned', description: `${toKeep.length} subjects` });
    onClose();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>Assign Subjects — {exam.name}</DialogTitle></DialogHeader>
        {subjects.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No subjects defined for this class. Add subjects from the Subjects tab first.</p>
        ) : (
          <div className="max-h-[400px] overflow-y-auto">
            <Table>
              <TableHeader><TableRow><TableHead></TableHead><TableHead>Subject</TableHead><TableHead>Max</TableHead><TableHead>Pass</TableHead></TableRow></TableHeader>
              <TableBody>
                {subjects.map(s => (
                  <TableRow key={s.id}>
                    <TableCell><Switch checked={!!es[s.id]?.selected} onCheckedChange={(v) => setEs(p => ({ ...p, [s.id]: { ...p[s.id], selected: v } }))} /></TableCell>
                    <TableCell>{s.name}</TableCell>
                    <TableCell><Input type="number" className="h-8 w-20" value={es[s.id]?.max ?? 100} onChange={e => setEs(p => ({ ...p, [s.id]: { ...p[s.id], max: Number(e.target.value) } }))} /></TableCell>
                    <TableCell><Input type="number" className="h-8 w-20" value={es[s.id]?.pass ?? 33} onChange={e => setEs(p => ({ ...p, [s.id]: { ...p[s.id], pass: Number(e.target.value) } }))} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------- Subjects Tab ----------------
function SubjectsTab() {
  const { classes } = useCourseStructure();
  const { toast } = useToast();
  const [classId, setClassId] = useState('');
  const [subjects, setSubjects] = useState<SubjectRow[]>([]);
  const [newName, setNewName] = useState('');

  useEffect(() => { if (!classId && classes[0]) setClassId(classes[0].id); }, [classes, classId]);
  useEffect(() => {
    if (!classId) return;
    (async () => {
      const { data } = await supabase.from('subjects').select('*').eq('class_id', classId).order('name');
      setSubjects((data ?? []) as SubjectRow[]);
    })();
  }, [classId]);

  const add = async () => {
    if (!newName.trim() || !classId) return;
    const { error } = await supabase.from('subjects').insert({ name: newName.trim(), class_id: classId });
    if (error) toast({ title: 'Failed', description: error.message, variant: 'destructive' });
    else {
      setNewName('');
      const { data } = await supabase.from('subjects').select('*').eq('class_id', classId).order('name');
      setSubjects((data ?? []) as SubjectRow[]);
    }
  };
  const remove = async (id: string) => {
    if (!confirm('Delete this subject? Linked marks will be removed.')) return;
    const { error } = await supabase.from('subjects').delete().eq('id', id);
    if (error) toast({ title: 'Failed', description: error.message, variant: 'destructive' });
    else setSubjects(p => p.filter(s => s.id !== id));
  };

  return (
    <div className="space-y-3">
      <Card>
        <CardContent className="p-4 flex flex-wrap gap-3 items-end">
          <div className="min-w-[180px]">
            <label className="text-xs text-muted-foreground">Class</label>
            <Select value={classId} onValueChange={setClassId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 flex-1 min-w-[240px]">
            <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="New subject name" onKeyDown={e => e.key === 'Enter' && add()} />
            <Button onClick={add}><Plus className="h-4 w-4 mr-1" />Add</Button>
          </div>
        </CardContent>
      </Card>
      <Card>
        <Table>
          <TableHeader><TableRow><TableHead>Subject</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
          <TableBody>
            {subjects.length === 0 ? (
              <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground py-6">No subjects yet for this class.</TableCell></TableRow>
            ) : subjects.map(s => (
              <TableRow key={s.id}>
                <TableCell>{s.name}</TableCell>
                <TableCell className="text-right"><Button size="sm" variant="ghost" onClick={() => remove(s.id)}><Trash2 className="h-4 w-4 text-rose-600" /></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

// ---------------- Marks Entry Tab ----------------
function MarksTab() {
  const { classes, getSectionsForClass } = useCourseStructure();
  const { toast } = useToast();
  const [exams, setExams] = useState<ExamRow[]>([]);
  const [examId, setExamId] = useState('');
  const [examSubjects, setExamSubjects] = useState<{ subject_id: string; name: string; max_marks: number; passing_marks: number }[]>([]);
  const [subjectId, setSubjectId] = useState('');
  const [sectionId, setSectionId] = useState<string>('all');
  const [students, setStudents] = useState<{ id: string; name: string; admission_number: string | null }[]>([]);
  const [draft, setDraft] = useState<Record<string, { marks_obtained: number; remarks: string }>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => { (async () => {
    const { data } = await supabase.from('exams').select('*').order('start_date', { ascending: false });
    setExams((data ?? []) as ExamRow[]);
  })(); }, []);

  const exam = exams.find(e => e.id === examId);

  useEffect(() => {
    setExamSubjects([]); setSubjectId(''); setStudents([]); setDraft({});
    if (!exam) return;
    (async () => {
      const { data } = await supabase.from('exam_subjects').select('subject_id, max_marks, passing_marks, subjects(name)').eq('exam_id', exam.id);
      const list = (data ?? []).map((r: any) => ({ subject_id: r.subject_id, name: r.subjects?.name ?? 'Subject', max_marks: Number(r.max_marks), passing_marks: Number(r.passing_marks) }));
      setExamSubjects(list);
      if (list[0]) setSubjectId(list[0].subject_id);
    })();
  }, [examId]);

  useEffect(() => {
    if (!exam || !subjectId) return;
    (async () => {
      let q = supabase.from('students').select('id,name,admission_number').eq('class_id', exam.class_id).order('name');
      const secId = exam.section_id ?? (sectionId !== 'all' ? sectionId : null);
      if (secId) q = q.eq('section_id', secId);
      const { data: srows } = await q;
      const list = (srows ?? []) as any[];
      setStudents(list);
      const { data: mrows } = await supabase.from('marks').select('*').eq('exam_id', exam.id).eq('subject_id', subjectId).in('student_id', list.map(s => s.id));
      const map: typeof draft = {};
      list.forEach(s => { map[s.id] = { marks_obtained: 0, remarks: '' }; });
      (mrows ?? []).forEach((m: any) => { map[m.student_id] = { marks_obtained: Number(m.marks_obtained), remarks: m.remarks ?? '' }; });
      setDraft(map);
    })();
  }, [exam, subjectId, sectionId]);

  const subj = examSubjects.find(s => s.subject_id === subjectId);

  const save = async () => {
    if (!exam || !subjectId || !subj) return;
    setSaving(true);
    const rows = students.map(s => ({
      exam_id: exam.id, subject_id: subjectId, student_id: s.id,
      marks_obtained: Math.min(Math.max(0, draft[s.id]?.marks_obtained ?? 0), subj.max_marks),
      remarks: draft[s.id]?.remarks || null,
    }));
    const { error } = await supabase.from('marks').upsert(rows, { onConflict: 'exam_id,subject_id,student_id' });
    setSaving(false);
    if (error) toast({ title: 'Save failed', description: error.message, variant: 'destructive' });
    else toast({ title: 'Marks saved', description: `${rows.length} students · ${subj.name}` });
  };

  return (
    <div className="space-y-3">
      <Card>
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <div>
            <label className="text-xs text-muted-foreground">Exam</label>
            <Select value={examId} onValueChange={setExamId}>
              <SelectTrigger><SelectValue placeholder="Select exam" /></SelectTrigger>
              <SelectContent>{exams.map(e => <SelectItem key={e.id} value={e.id}>{e.name} · {e.academic_year}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Subject</label>
            <Select value={subjectId} onValueChange={setSubjectId} disabled={!examSubjects.length}>
              <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
              <SelectContent>{examSubjects.map(s => <SelectItem key={s.subject_id} value={s.subject_id}>{s.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Section</label>
            <Select value={sectionId} onValueChange={setSectionId} disabled={!exam || !!exam.section_id}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {exam && getSectionsForClass(exam.class_id).map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={save} disabled={saving || students.length === 0}><Save className="h-4 w-4 mr-1" />Save Marks</Button>
        </CardContent>
      </Card>

      {!exam ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">Select an exam to begin.</CardContent></Card>
      ) : !subj ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">No subjects assigned to this exam. Use the "Assign Subjects" button on the Exams tab.</CardContent></Card>
      ) : students.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">No students for this class/section.</CardContent></Card>
      ) : (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">{subj.name} — Max {subj.max_marks}, Passing {subj.passing_marks}</CardTitle></CardHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead className="hidden md:table-cell">Adm #</TableHead>
                <TableHead className="w-32">Marks</TableHead>
                <TableHead>Remarks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map(s => {
                const v = draft[s.id]?.marks_obtained ?? 0;
                const over = v > subj.max_marks;
                const fail = v < subj.passing_marks;
                return (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell className="hidden md:table-cell text-xs text-muted-foreground">{s.admission_number ?? '-'}</TableCell>
                    <TableCell>
                      <Input type="number" min={0} max={subj.max_marks} value={v}
                        onChange={e => setDraft(p => ({ ...p, [s.id]: { ...(p[s.id] ?? { remarks: '' }), marks_obtained: Number(e.target.value) } }))}
                        className={`h-8 w-24 ${over ? 'border-rose-500' : fail ? 'border-amber-500' : ''}`} />
                    </TableCell>
                    <TableCell>
                      <Input value={draft[s.id]?.remarks ?? ''}
                        onChange={e => setDraft(p => ({ ...p, [s.id]: { ...(p[s.id] ?? { marks_obtained: 0 }), remarks: e.target.value } }))}
                        placeholder="Optional" className="h-8" />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
