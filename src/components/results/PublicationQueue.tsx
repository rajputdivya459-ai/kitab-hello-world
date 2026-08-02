import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { toast } from '@/hooks/use-toast';
import { Upload, Clock, ShieldAlert, CheckCircle2 } from 'lucide-react';
import * as bulk from '@/lib/results/bulk';
import { validateSet } from '@/lib/results/validation';
import { StatusBadge } from './ResultSetList';
import type { ResultSet } from '@/lib/results/types';

export function PublicationQueue({ sets, onChanged, canPublish }: { sets: ResultSet[]; onChanged: () => void; canPublish?: boolean }) {
  const q = useMemo(() => bulk.publicationQueue(sets), [sets]);
  const [scope, setScope] = useState('exam');
  const [examId, setExamId] = useState(sets[0]?.examId ?? '');
  const [classId, setClassId] = useState('');
  const [section, setSection] = useState('');

  const exams = Array.from(new Map(sets.map(s => [s.examId, s.examName])).entries());
  const classes = Array.from(new Set(sets.filter(s => s.examId === examId).map(s => s.classId)));
  const sections = Array.from(new Set(sets.filter(s => s.examId === examId && s.classId === classId).map(s => s.section)));

  const report = (label: string, r: bulk.BulkOutcome) => {
    toast({
      title: `${label}: ${r.ok.length} published`,
      description: r.skipped.length ? r.skipped.map(s => `${s.title} — ${s.reason}`).join(' · ') : undefined,
      variant: r.ok.length ? 'default' : 'destructive',
    });
    onChanged();
  };

  const runScoped = () => {
    if (!examId) return toast({ title: 'Select an examination' });
    if (scope === 'exam') return report('Examination publish', bulk.publishByExam(examId));
    if (scope === 'class') return classId ? report('Class publish', bulk.publishByClass(examId, classId)) : toast({ title: 'Select a class' });
    return classId && section ? report('Section publish', bulk.publishBySection(examId, classId, section)) : toast({ title: 'Select class and section' });
  };

  const cols = (showReason?: boolean): Column<ResultSet>[] => [
    { key: 'exam', header: 'Exam', cell: r => <div><p className="font-medium">{r.examName}</p><p className="text-[11px] text-muted-foreground">{r.classId}-{r.section} · {r.students.length} students</p></div> },
    { key: 'status', header: 'Status', cell: r => <StatusBadge status={r.status} /> },
    ...(showReason ? [{ key: 'why', header: 'Blocking issues', cell: (r: ResultSet) => <span className="text-xs text-rose-600">{validateSet(r).issues.filter(i => i.severity === 'error').map(i => i.label).join(', ') || '—'}</span> } as Column<ResultSet>] : []),
    ...(canPublish ? [{
      key: 'act', header: '', cell: (r: ResultSet) => (
        <Button size="sm" variant="outline" disabled={r.status !== 'approved'} onClick={() => report('Publish', bulk.bulkPublish([r.id]))}>
          <Upload className="h-3.5 w-3.5 mr-1" />Publish
        </Button>
      ),
    } as Column<ResultSet>] : []),
  ];

  const Section = ({ title, icon: Icon, rows, showReason }: any) => (
    <Card>
      <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm flex items-center gap-2"><Icon className="h-4 w-4" />{title}</CardTitle>
        <Badge variant="outline">{rows.length}</Badge>
      </CardHeader>
      <CardContent><DataTable columns={cols(showReason)} rows={rows} rowKey={(r: ResultSet) => r.id} emptyTitle="Nothing here" /></CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      {canPublish && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Scheduled / Scoped Publication</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap items-center gap-2">
            <Select value={scope} onValueChange={setScope}>
              <SelectTrigger className="h-9 w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="exam">Entire examination</SelectItem>
                <SelectItem value="class">By class</SelectItem>
                <SelectItem value="section">By section</SelectItem>
              </SelectContent>
            </Select>
            <Select value={examId} onValueChange={setExamId}>
              <SelectTrigger className="h-9 w-[240px]"><SelectValue placeholder="Examination" /></SelectTrigger>
              <SelectContent>{exams.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
            </Select>
            {scope !== 'exam' && (
              <Select value={classId} onValueChange={setClassId}>
                <SelectTrigger className="h-9 w-[140px]"><SelectValue placeholder="Class" /></SelectTrigger>
                <SelectContent>{classes.map(c => <SelectItem key={c} value={c}>Class {c}</SelectItem>)}</SelectContent>
              </Select>
            )}
            {scope === 'section' && (
              <Select value={section} onValueChange={setSection}>
                <SelectTrigger className="h-9 w-[140px]"><SelectValue placeholder="Section" /></SelectTrigger>
                <SelectContent>{sections.map(s => <SelectItem key={s} value={s}>Section {s}</SelectItem>)}</SelectContent>
              </Select>
            )}
            <Button onClick={runScoped}><Upload className="h-4 w-4 mr-1" />Publish selected scope</Button>
            <p className="text-[11px] text-muted-foreground w-full">Publication is blocked automatically when marks are unapproved, incomplete, or validation errors exist.</p>
          </CardContent>
        </Card>
      )}

      <Section title="Pending approval" icon={Clock} rows={q.pending} />
      <Section title="Ready to publish" icon={CheckCircle2} rows={q.ready} />
      <Section title="Blocked by validation" icon={ShieldAlert} rows={q.blocked} showReason />
      <Section title="Published" icon={Upload} rows={q.published} />
    </div>
  );
}
