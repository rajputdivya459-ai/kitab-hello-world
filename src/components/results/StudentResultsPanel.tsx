import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState } from '@/components/shared/EmptyState';
import { Award, FileText, TrendingUp } from 'lucide-react';
import { resultsForStudent } from '@/lib/results/api';
import { ReportCardDoc } from '@/components/results/ReportCardDoc';
import { ProgressReport } from '@/components/results/ProgressReport';
import type { StudentResultView } from '@/lib/results/api';

/** Read-only results experience shared by the Student and Parent portals. */
export function StudentResultsPanel({ studentId, title }: { studentId: string; title?: string }) {
  const views = useMemo(() => resultsForStudent(studentId), [studentId]);
  const [openCard, setOpenCard] = useState<StudentResultView | null>(null);
  const [selected, setSelected] = useState(0);

  if (!views.length) {
    return <EmptyState icon={Award} title="No published results yet" description="Results appear here as soon as the school publishes them." />;
  }

  const view = views[Math.min(selected, views.length - 1)];
  const r = view.result;

  const Metric = ({ label, value, hint }: { label: string; value: string; hint?: string }) => (
    <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="text-xl font-semibold tabular-nums">{value}</p>{hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}</CardContent></Card>
  );

  return (
    <div className="space-y-3">
      {title && <h2 className="font-display text-lg font-semibold">{title}</h2>}

      <div className="flex flex-wrap gap-2">
        {views.map((v, i) => (
          <Button key={v.set.id} size="sm" variant={i === selected ? 'default' : 'outline'} onClick={() => setSelected(i)}>
            {v.set.examName}
          </Button>
        ))}
      </div>

      <Tabs defaultValue="result">
        <TabsList className="w-full">
          <TabsTrigger value="result" className="flex-1">Result</TabsTrigger>
          <TabsTrigger value="progress" className="flex-1">Progress</TabsTrigger>
          <TabsTrigger value="history" className="flex-1">History</TabsTrigger>
        </TabsList>

        <TabsContent value="result" className="mt-3 space-y-3">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Metric label="Percentage" value={`${r.percentage.toFixed(2)}%`} hint={`${r.total} / ${r.outOf}`} />
            <Metric label="Grade / GPA" value={`${r.grade} · ${r.gpa.toFixed(2)}`} hint={r.division} />
            <Metric label="Merit Position" value={`#${r.classRank}`} hint={`Section #${r.sectionRank} · School #${r.schoolRank}`} />
            <Metric label="Attendance" value={`${r.attendancePct}%`} hint={`Promotion: ${r.promotion}`} />
          </div>

          <Card>
            <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm">{view.set.examName} · Class {view.set.classId}-{view.set.section}</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={r.passed ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}>{r.passed ? 'PASS' : 'FAIL'}</Badge>
                <Button size="sm" variant="outline" onClick={() => setOpenCard(view)}><FileText className="h-3.5 w-3.5 mr-1" />Report Card</Button>
              </div>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead>Subject</TableHead><TableHead>Marks</TableHead><TableHead>%</TableHead><TableHead>Grade</TableHead><TableHead>Result</TableHead></TableRow></TableHeader>
                <TableBody>
                  {r.subjects.map(s => (
                    <TableRow key={s.subjectName}>
                      <TableCell className="font-medium">{s.subjectName}</TableCell>
                      <TableCell className="tabular-nums">{s.attendance === 'present' ? `${s.obtained} / ${s.max}` : s.attendance.toUpperCase()}</TableCell>
                      <TableCell className="tabular-nums">{s.percentage.toFixed(1)}</TableCell>
                      <TableCell><Badge variant="outline">{s.grade}</Badge></TableCell>
                      <TableCell className={s.passed ? '' : 'text-rose-600 font-medium'}>{s.passed ? 'Pass' : 'Fail'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Remarks</CardTitle></CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p><span className="text-muted-foreground">Class Teacher:</span> {r.teacherRemarks ?? '—'}</p>
              <p><span className="text-muted-foreground">Principal:</span> {r.principalRemarks ?? '—'}</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress" className="mt-3"><ProgressReport studentId={studentId} /></TabsContent>

        <TabsContent value="history" className="mt-3">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4" />Historical Results</CardTitle></CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead>Exam</TableHead><TableHead>Year</TableHead><TableHead>%</TableHead><TableHead>Grade</TableHead><TableHead>Rank</TableHead><TableHead>Promotion</TableHead><TableHead /></TableRow></TableHeader>
                <TableBody>
                  {views.map(v => (
                    <TableRow key={v.set.id}>
                      <TableCell className="font-medium">{v.set.examName}</TableCell>
                      <TableCell>{v.set.academicYear}</TableCell>
                      <TableCell className="tabular-nums">{v.result.percentage.toFixed(2)}</TableCell>
                      <TableCell>{v.result.grade}</TableCell>
                      <TableCell className="tabular-nums">#{v.result.classRank}</TableCell>
                      <TableCell className="capitalize text-xs">{v.result.promotion}</TableCell>
                      <TableCell><Button size="sm" variant="ghost" onClick={() => setOpenCard(v)}><FileText className="h-3.5 w-3.5" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!openCard} onOpenChange={o => !o && setOpenCard(null)}>
        <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Report Card</DialogTitle></DialogHeader>
          {openCard && <ReportCardDoc set={openCard.set} student={openCard.result} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
