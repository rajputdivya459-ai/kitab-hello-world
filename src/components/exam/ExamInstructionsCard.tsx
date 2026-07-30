import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Info } from 'lucide-react';
import type { ExamMaster } from '@/lib/exam/master';
import { examTypeLabel, examPhase } from '@/lib/exam/master';

export function ExamInstructionsCard({ exam }: { exam: ExamMaster }) {
  const i = exam.instructions ?? {};
  const rows: Array<[string, string | undefined]> = [
    ['Reporting Time', i.reportingTime],
    ['Allowed Materials', i.allowedMaterials],
    ['Uniform', i.uniform],
    ['Calculator', i.calculator],
    ['Mobile Phones', i.mobilePolicy],
    ['Attendance', i.attendanceRules],
  ];
  const general = (i.general ?? '').split('\n').filter(Boolean);
  if (!general.length && rows.every(([, v]) => !v)) return null;
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2"><Info className="h-4 w-4" />Exam Instructions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {general.length > 0 && (
          <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
            {general.map((l, n) => <li key={n}>{l}</li>)}
          </ul>
        )}
        <div className="grid gap-2 sm:grid-cols-2">
          {rows.filter(([, v]) => v).map(([k, v]) => (
            <div key={k} className="rounded-md border p-2">
              <p className="text-xs text-muted-foreground">{k}</p>
              <p className="font-medium">{v}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function ExamSummaryHeader({ exam }: { exam: ExamMaster }) {
  const phase = examPhase(exam);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="font-semibold">{exam.name}</span>
      <Badge variant="outline">{exam.code}</Badge>
      <Badge variant="secondary">{examTypeLabel(exam.type)}</Badge>
      <Badge variant={phase === 'ongoing' ? 'default' : 'outline'} className="capitalize">{phase}</Badge>
      <span className="text-xs text-muted-foreground">{exam.startDate} → {exam.endDate}</span>
    </div>
  );
}
