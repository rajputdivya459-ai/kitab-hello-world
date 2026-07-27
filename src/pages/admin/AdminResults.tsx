import { useEffect, useMemo, useState } from 'react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { useCourseStructure } from '@/hooks/useCourseStructure';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Award, FileText, TrendingDown, Users, Eye } from 'lucide-react';
import { summarize, getGrade, GRADE_BANDS, type SubjectMark } from '@/lib/grading';
import { ReportCard } from '@/components/portal/ReportCard';

interface ExamRow {
  id: string; name: string; exam_type: string; class_id: string; section_id: string | null;
  academic_year: string; is_published: boolean; start_date: string | null; end_date: string | null;
}

interface RawMark { student_id: string; subject_id: string; marks_obtained: number; remarks: string | null }
interface SubjLink { subject_id: string; max_marks: number; passing_marks: number; subjects: { name: string } }
interface Student { id: string; name: string; admission_number: string | null; class_id: string | null; section_id: string | null; parent_name: string | null }

export default function AdminResults() {
  const { classes, getClassName, getSectionName } = useCourseStructure();
  const [exams, setExams] = useState<ExamRow[]>([]);
  const [examId, setExamId] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [subjLinks, setSubjLinks] = useState<SubjLink[]>([]);
  const [marks, setMarks] = useState<RawMark[]>([]);
  const [previewStudent, setPreviewStudent] = useState<Student | null>(null);

  useEffect(() => { (async () => {
    const { data } = await supabase.from('exams').select('*').order('start_date', { ascending: false });
    setExams((data ?? []) as ExamRow[]);
  })(); }, []);

  const exam = exams.find(e => e.id === examId);

  useEffect(() => {
    if (!exam) { setStudents([]); setSubjLinks([]); setMarks([]); return; }
    (async () => {
      let sq = supabase.from('students').select('id,name,admission_number,class_id,section_id,parent_name').eq('class_id', exam.class_id);
      if (exam.section_id) sq = sq.eq('section_id', exam.section_id);
      const [{ data: sr }, { data: lr }] = await Promise.all([
        sq.order('name'),
        supabase.from('exam_subjects').select('subject_id, max_marks, passing_marks, subjects(name)').eq('exam_id', exam.id),
      ]);
      const slist = (sr ?? []) as Student[];
      setStudents(slist);
      setSubjLinks((lr ?? []) as any);
      if (slist.length) {
        const { data: mr } = await supabase.from('marks').select('student_id,subject_id,marks_obtained,remarks').eq('exam_id', exam.id).in('student_id', slist.map(s => s.id));
        setMarks((mr ?? []) as RawMark[]);
      } else setMarks([]);
    })();
  }, [exam?.id]);

  const perStudent = useMemo(() => {
    const subjMap = new Map(subjLinks.map(s => [s.subject_id, s]));
    const byStu = new Map<string, RawMark[]>();
    marks.forEach(m => { const a = byStu.get(m.student_id) ?? []; a.push(m); byStu.set(m.student_id, a); });
    return students.map(s => {
      const rows: SubjectMark[] = subjLinks.map(sl => {
        const m = (byStu.get(s.id) ?? []).find(x => x.subject_id === sl.subject_id);
        return {
          subject_id: sl.subject_id, subject_name: sl.subjects?.name ?? '',
          marks_obtained: Number(m?.marks_obtained ?? 0),
          max_marks: Number(sl.max_marks), passing_marks: Number(sl.passing_marks),
          remarks: m?.remarks ?? null,
        };
      });
      const summary = summarize(rows);
      return { student: s, rows, summary };
    }).sort((a, b) => b.summary.percentage - a.summary.percentage);
  }, [students, subjLinks, marks]);

  // Class analytics
  const analytics = useMemo(() => {
    if (perStudent.length === 0) return null;
    const passCount = perStudent.filter(p => p.summary.passed).length;
    const failCount = perStudent.length - passCount;
    const avg = Math.round((perStudent.reduce((s, p) => s + p.summary.percentage, 0) / perStudent.length) * 100) / 100;
    const top = perStudent.slice(0, 3);
    const gradeDist: Record<string, number> = {};
    GRADE_BANDS.forEach(b => gradeDist[b.grade] = 0);
    perStudent.forEach(p => { gradeDist[p.summary.grade.grade] = (gradeDist[p.summary.grade.grade] ?? 0) + 1; });
    // Subject averages
    const subjStats = subjLinks.map(sl => {
      const ms = marks.filter(m => m.subject_id === sl.subject_id);
      const total = ms.reduce((s, m) => s + Number(m.marks_obtained), 0);
      const avgM = ms.length ? Math.round((total / ms.length) * 100) / 100 : 0;
      const pctAvg = sl.max_marks ? Math.round((avgM / Number(sl.max_marks)) * 10000) / 100 : 0;
      return { name: sl.subjects?.name ?? '', avg: avgM, max: Number(sl.max_marks), pctAvg };
    });
    return { passCount, failCount, avg, top, gradeDist, subjStats };
  }, [perStudent, subjLinks, marks]);

  const lowPerformers = perStudent.filter(p => !p.summary.passed || p.summary.percentage < 40);

  return (
    <AdminLayout>
      <div className="space-y-4">
        <Card>
          <CardContent className="p-4 flex flex-wrap gap-3 items-end">
            <div className="min-w-[260px]">
              <label className="text-xs text-muted-foreground">Exam</label>
              <Select value={examId} onValueChange={setExamId}>
                <SelectTrigger><SelectValue placeholder="Select exam to view results" /></SelectTrigger>
                <SelectContent>
                  {exams.map(e => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.name} · {getClassName(e.class_id)}{e.section_id ? ` · ${getSectionName(e.section_id)}` : ''} · {e.academic_year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {exam && <Badge variant={exam.is_published ? 'default' : 'secondary'}>{exam.is_published ? 'Published' : 'Draft'}</Badge>}
          </CardContent>
        </Card>

        {!exam ? (
          <Card><CardContent className="p-10 text-center text-muted-foreground">Select an exam to load results.</CardContent></Card>
        ) : (
          <Tabs defaultValue="results">
            <TabsList>
              <TabsTrigger value="results"><FileText className="h-4 w-4 mr-1" />Results</TabsTrigger>
              <TabsTrigger value="analytics"><Award className="h-4 w-4 mr-1" />Analytics</TabsTrigger>
              <TabsTrigger value="low"><TrendingDown className="h-4 w-4 mr-1" />Low Performers</TabsTrigger>
            </TabsList>

            <TabsContent value="results" className="space-y-3">
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead className="hidden md:table-cell">Adm #</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>%</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Result</TableHead>
                      <TableHead className="text-right">Report</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {perStudent.length === 0 && <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No students/marks.</TableCell></TableRow>}
                    {perStudent.map((p, i) => (
                      <TableRow key={p.student.id}>
                        <TableCell className="font-semibold">{i + 1}</TableCell>
                        <TableCell className="font-medium">{p.student.name}</TableCell>
                        <TableCell className="hidden md:table-cell text-xs text-muted-foreground">{p.student.admission_number ?? '-'}</TableCell>
                        <TableCell>{p.summary.total}/{p.summary.outOf}</TableCell>
                        <TableCell className="font-semibold">{p.summary.percentage}%</TableCell>
                        <TableCell><Badge variant="outline" className={p.summary.grade.color}>{p.summary.grade.grade}</Badge></TableCell>
                        <TableCell>
                          {p.summary.passed
                            ? <Badge className="bg-emerald-600">PASS</Badge>
                            : <Badge variant="destructive">FAIL</Badge>}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="ghost" onClick={() => setPreviewStudent(p.student)}><Eye className="h-4 w-4" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              {!analytics ? <Card><CardContent className="p-8 text-center text-muted-foreground">No data.</CardContent></Card> : (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Stat label="Students" value={perStudent.length} icon={Users} tone="bg-primary/10 text-primary" />
                    <Stat label="Passed" value={analytics.passCount} icon={Award} tone="bg-emerald-100 text-emerald-700" />
                    <Stat label="Failed" value={analytics.failCount} icon={TrendingDown} tone="bg-rose-100 text-rose-700" />
                    <Stat label="Class Avg" value={`${analytics.avg}%`} icon={Award} tone="bg-sky-100 text-sky-700" />
                  </div>
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-base">Top Performers</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                      {analytics.top.map((p, i) => (
                        <div key={p.student.id} className="flex items-center justify-between p-2 rounded bg-muted/40">
                          <span className="flex items-center gap-2"><Badge>{i + 1}</Badge>{p.student.name}</span>
                          <span className="font-semibold">{p.summary.percentage}% · {p.summary.grade.grade}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-base">Subject Averages</CardTitle></CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader><TableRow><TableHead>Subject</TableHead><TableHead>Avg Marks</TableHead><TableHead>Avg %</TableHead></TableRow></TableHeader>
                        <TableBody>
                          {analytics.subjStats.map(s => (
                            <TableRow key={s.name}><TableCell>{s.name}</TableCell><TableCell>{s.avg} / {s.max}</TableCell><TableCell>{s.pctAvg}%</TableCell></TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-base">Grade Distribution</CardTitle></CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-6 gap-2">
                        {GRADE_BANDS.map(b => (
                          <div key={b.grade} className={`rounded p-3 text-center border ${b.color}`}>
                            <div className="text-2xl font-bold">{analytics.gradeDist[b.grade] ?? 0}</div>
                            <div className="text-xs font-semibold">{b.grade}</div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>

            <TabsContent value="low" className="space-y-3">
              <Card>
                <Table>
                  <TableHeader><TableRow><TableHead>Student</TableHead><TableHead>%</TableHead><TableHead>Failed Subjects</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {lowPerformers.length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No low performers — great class!</TableCell></TableRow>}
                    {lowPerformers.map(p => (
                      <TableRow key={p.student.id} className="bg-rose-50/50">
                        <TableCell className="font-medium">{p.student.name}</TableCell>
                        <TableCell>{p.summary.percentage}%</TableCell>
                        <TableCell>{p.summary.failedSubjects}</TableCell>
                        <TableCell><Badge variant="destructive">Needs attention</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        <Dialog open={!!previewStudent} onOpenChange={(o) => !o && setPreviewStudent(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Report Card</DialogTitle></DialogHeader>
            {previewStudent && exam && (
              <ReportCard
                student={previewStudent as any}
                exam={exam}
                className={getClassName(previewStudent.class_id ?? '')}
                sectionName={previewStudent.section_id ? getSectionName(previewStudent.section_id) : undefined}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}

function Stat({ label, value, icon: Icon, tone }: any) {
  return (
    <Card><CardContent className="p-4 flex items-center gap-3">
      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${tone}`}><Icon className="h-5 w-5" /></div>
      <div><p className="text-xs text-muted-foreground">{label}</p><p className="text-xl font-bold">{value}</p></div>
    </CardContent></Card>
  );
}
