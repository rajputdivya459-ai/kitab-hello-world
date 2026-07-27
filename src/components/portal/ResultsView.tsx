import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EmptyState } from '@/components/portal/EmptyState';
import { PortalSkeleton } from '@/components/portal/PortalSkeleton';
import { ReportCard } from '@/components/portal/ReportCard';
import { Award, FileText, ChevronRight } from 'lucide-react';
import { summarize, type SubjectMark } from '@/lib/grading';

interface Props {
  studentId: string;
  studentName: string;
  classId: string | null;
  sectionId: string | null;
  parentName?: string | null;
  admissionNumber?: string | null;
  classMap: Record<string, string>;
  sectionMap: Record<string, string>;
}

interface Exam {
  id: string; name: string; exam_type: string; academic_year: string;
  start_date: string | null; end_date: string | null; is_published: boolean;
}

export function ResultsView({ studentId, studentName, classId, sectionId, parentName, admissionNumber, classMap, sectionMap }: Props) {
  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState<Exam[]>([]);
  const [summaries, setSummaries] = useState<Record<string, { percentage: number; grade: string; passed: boolean; total: number; outOf: number; gradeColor: string }>>({});
  const [openExam, setOpenExam] = useState<Exam | null>(null);

  useEffect(() => {
    if (!classId) { setLoading(false); return; }
    (async () => {
      setLoading(true);
      // RLS already restricts to published exams for non-admins
      const { data: er } = await supabase.from('exams').select('*').eq('class_id', classId).eq('is_published', true).order('start_date', { ascending: false });
      const list = (er ?? []) as Exam[];
      setExams(list);

      if (list.length) {
        const ids = list.map(e => e.id);
        const [{ data: links }, { data: marks }] = await Promise.all([
          supabase.from('exam_subjects').select('exam_id, subject_id, max_marks, passing_marks').in('exam_id', ids),
          supabase.from('marks').select('exam_id, subject_id, marks_obtained').in('exam_id', ids).eq('student_id', studentId),
        ]);
        const sumMap: typeof summaries = {};
        list.forEach(e => {
          const eLinks = (links ?? []).filter((l: any) => l.exam_id === e.id);
          const eMarks = (marks ?? []).filter((m: any) => m.exam_id === e.id);
          const rows: SubjectMark[] = eLinks.map((sl: any) => {
            const m = eMarks.find((x: any) => x.subject_id === sl.subject_id);
            return {
              subject_id: sl.subject_id, subject_name: '',
              marks_obtained: Number(m?.marks_obtained ?? 0),
              max_marks: Number(sl.max_marks), passing_marks: Number(sl.passing_marks),
            };
          });
          const s = summarize(rows);
          sumMap[e.id] = { percentage: s.percentage, grade: s.grade.grade, passed: s.passed, total: s.total, outOf: s.outOf, gradeColor: s.grade.color };
        });
        setSummaries(sumMap);
      }
      setLoading(false);
    })();
  }, [studentId, classId]);

  if (loading) return <PortalSkeleton />;
  if (exams.length === 0) return <EmptyState icon={FileText} title="No results yet" description="Published exam results will appear here." />;

  return (
    <div className="space-y-3">
      {exams.map(e => {
        const s = summaries[e.id];
        return (
          <Card key={e.id} className="active:scale-[0.99] transition">
            <button onClick={() => setOpenExam(e)} className="w-full text-left">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Award className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold leading-tight">{e.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{e.exam_type.replace('_',' ')} · {e.academic_year}</p>
                  {s && (
                    <div className="mt-1 flex items-center gap-2 text-sm">
                      <span className="font-semibold">{s.percentage}%</span>
                      <Badge variant="outline" className={s.gradeColor}>{s.grade}</Badge>
                      <Badge className={s.passed ? 'bg-emerald-600' : 'bg-rose-600'}>{s.passed ? 'PASS' : 'FAIL'}</Badge>
                    </div>
                  )}
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </button>
          </Card>
        );
      })}

      <Dialog open={!!openExam} onOpenChange={(o) => !o && setOpenExam(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Report Card</DialogTitle></DialogHeader>
          {openExam && (
            <ReportCard
              student={{ id: studentId, name: studentName, admission_number: admissionNumber ?? null, class_id: classId, section_id: sectionId, parent_name: parentName ?? null }}
              exam={openExam}
              className={classId ? classMap[classId] : undefined}
              sectionName={sectionId ? sectionMap[sectionId] : undefined}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
