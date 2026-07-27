import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTeacherCtx } from '@/contexts/TeacherContext';
import { PortalSkeleton } from '@/components/portal/PortalSkeleton';
import { EmptyState } from '@/components/portal/EmptyState';
import { ClipboardList } from 'lucide-react';

export default function TeacherMarks() {
  const { loading: tLoad, assignments, classMap, subjectMap } = useTeacherCtx();
  const { toast } = useToast();
  const [exams, setExams] = useState<any[]>([]);
  const [examId, setExamId] = useState<string>('');
  const [subjectId, setSubjectId] = useState<string>('');
  const [maxMarks, setMaxMarks] = useState<number>(100);
  const [students, setStudents] = useState<any[]>([]);
  const [scores, setScores] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const subjectChoices = useMemo(() => {
    const m = new Map<string, string>();
    assignments.forEach(a => { if (a.subject_id) m.set(a.subject_id, subjectMap[a.subject_id] ?? '—'); });
    return Array.from(m.entries()).map(([id, label]) => ({ id, label }));
  }, [assignments, subjectMap]);

  useEffect(() => {
    if (!subjectChoices.length) return;
    if (!subjectId) setSubjectId(subjectChoices[0].id);
  }, [subjectChoices, subjectId]);

  // Load exams for the class containing this subject
  useEffect(() => {
    if (!subjectId) return;
    (async () => {
      const assign = assignments.find(a => a.subject_id === subjectId);
      if (!assign) return;
      const { data } = await supabase.from('exams').select('id,name,class_id').eq('class_id', assign.class_id).order('created_at', { ascending: false });
      setExams(data ?? []);
      setExamId((data ?? [])[0]?.id ?? '');
    })();
  }, [subjectId, assignments]);

  // Load students + existing marks + max marks
  useEffect(() => {
    if (!examId || !subjectId) return;
    (async () => {
      const assign = assignments.find(a => a.subject_id === subjectId);
      if (!assign) return;
      const { data: studs } = await supabase.from('students').select('id,name,admission_number').eq('class_id', assign.class_id).order('name');
      setStudents(studs ?? []);
      const { data: es } = await supabase.from('exam_subjects').select('max_marks').eq('exam_id', examId).eq('subject_id', subjectId).maybeSingle();
      setMaxMarks(es?.max_marks ?? 100);
      const ids = (studs ?? []).map((s: any) => s.id);
      const { data: ms } = ids.length
        ? await supabase.from('marks').select('student_id,marks_obtained').eq('exam_id', examId).eq('subject_id', subjectId).in('student_id', ids)
        : { data: [] as any[] };
      const init: Record<string, string> = {};
      (ms ?? []).forEach((m: any) => { init[m.student_id] = String(m.marks_obtained); });
      setScores(init);
    })();
  }, [examId, subjectId, assignments]);

  const save = async () => {
    setSaving(true);
    const rows = students
      .filter(s => scores[s.id] !== undefined && scores[s.id] !== '')
      .map(s => ({
        exam_id: examId, subject_id: subjectId, student_id: s.id,
        marks_obtained: Math.min(Number(scores[s.id]), maxMarks),
      }));
    const { error } = await supabase.from('marks').upsert(rows, { onConflict: 'exam_id,subject_id,student_id' });
    setSaving(false);
    if (error) toast({ title: 'Save failed', description: error.message, variant: 'destructive' });
    else toast({ title: 'Marks saved', description: `${rows.length} students updated.` });
  };

  if (tLoad) return <PortalSkeleton />;
  if (!subjectChoices.length)
    return <EmptyState icon={ClipboardList} title="No subjects" description="You have no subject assignments." />;

  return (
    <div className="space-y-3">
      <h2 className="font-display text-lg font-semibold">Enter Marks</h2>
      <Card><CardContent className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-muted-foreground">Subject</label>
            <Select value={subjectId} onValueChange={setSubjectId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{subjectChoices.map(s => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Exam</label>
            <Select value={examId} onValueChange={setExamId}>
              <SelectTrigger><SelectValue placeholder="Pick exam" /></SelectTrigger>
              <SelectContent>{exams.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Max marks: <strong>{maxMarks}</strong></p>
      </CardContent></Card>

      <Card><CardContent className="p-2 divide-y">
        {students.map(s => (
          <div key={s.id} className="flex items-center justify-between py-2 px-2 gap-3">
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">{s.name}</p>
              <p className="text-[11px] text-muted-foreground">{s.admission_number}</p>
            </div>
            <Input
              type="number" min={0} max={maxMarks} className="w-20 h-8 text-sm"
              value={scores[s.id] ?? ''}
              onChange={e => setScores(p => ({ ...p, [s.id]: e.target.value }))}
            />
          </div>
        ))}
        {students.length === 0 && <p className="text-sm text-muted-foreground p-4 text-center">No students.</p>}
      </CardContent></Card>

      <Button onClick={save} disabled={saving || !examId} className="w-full bg-teal-600 hover:bg-teal-700">
        {saving ? 'Saving…' : 'Save Marks'}
      </Button>
    </div>
  );
}
