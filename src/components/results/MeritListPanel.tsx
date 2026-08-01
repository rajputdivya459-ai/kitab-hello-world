import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { DataToolbar } from '@/components/shared/DataToolbar';
import { Badge } from '@/components/ui/badge';
import { exportCSV, exportPDF } from '@/lib/export';
import { meritList, subjectToppers, classToppers, sectionToppers, type MeritEntry } from '@/lib/results/rank';
import type { ResultSet } from '@/lib/results/types';

export function MeritListPanel({ sets, topN = 10 }: { sets: ResultSet[]; topN?: number }) {
  const [tab, setTab] = useState('top10');
  const merit = useMemo(() => meritList(sets, Math.max(topN, 10)), [sets, topN]);
  const toppers = useMemo(() => subjectToppers(sets), [sets]);
  const classTop = useMemo(() => classToppers(sets), [sets]);
  const sectionTop = useMemo(() => sectionToppers(sets), [sets]);

  const cols: Column<MeritEntry>[] = [
    { key: 'rank', header: 'Rank', cell: r => <Badge variant="outline">#{r.rank}</Badge> },
    { key: 'name', header: 'Student', cell: r => <div><p className="font-medium">{r.name}</p><p className="text-[11px] text-muted-foreground">{r.admissionNo}</p></div> },
    { key: 'class', header: 'Class', cell: r => `${r.classId}-${r.section}` },
    { key: 'total', header: 'Total', cell: r => `${r.total} / ${r.outOf}` },
    { key: 'pct', header: '%', cell: r => r.percentage.toFixed(2) },
    { key: 'gpa', header: 'GPA', cell: r => r.gpa.toFixed(2) },
    { key: 'grade', header: 'Grade', cell: r => r.grade },
  ];
  const meritExportCols = [
    { key: 'rank', label: 'Rank' }, { key: 'name', label: 'Student' }, { key: 'admissionNo', label: 'Admission No' },
    { key: 'classId', label: 'Class' }, { key: 'section', label: 'Section' },
    { key: 'total', label: 'Total' }, { key: 'outOf', label: 'Out Of' },
    { key: 'percentage', label: 'Percentage' }, { key: 'gpa', label: 'GPA' }, { key: 'grade', label: 'Grade' },
  ];

  const current = tab === 'top3' ? merit.slice(0, 3) : tab === 'top10' ? merit.slice(0, 10) : tab === 'class' ? classTop : sectionTop;

  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm">Merit Lists & Toppers</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="top3">Top 3</TabsTrigger>
            <TabsTrigger value="top10">Top 10</TabsTrigger>
            <TabsTrigger value="class">Class Toppers</TabsTrigger>
            <TabsTrigger value="section">Section Toppers</TabsTrigger>
            <TabsTrigger value="subject">Subject Toppers</TabsTrigger>
          </TabsList>

          {['top3', 'top10', 'class', 'section'].map(t => (
            <TabsContent key={t} value={t} className="space-y-2">
              <DataToolbar
                onExportCSV={() => exportCSV(`merit-${t}`, current, meritExportCols)}
                onExportPDF={() => exportPDF(`merit-${t}`, `Merit List — ${t}`, current, meritExportCols)}
              />
              <DataTable columns={cols} rows={current} rowKey={r => `${r.studentId}-${r.classId}`} emptyTitle="No merit data yet" />
            </TabsContent>
          ))}

          <TabsContent value="subject" className="space-y-2">
            <DataToolbar
              onExportCSV={() => exportCSV('subject-toppers', toppers, [
                { key: 'subject', label: 'Subject' }, { key: 'name', label: 'Student' },
                { key: 'classId', label: 'Class' }, { key: 'section', label: 'Section' },
                { key: 'marks', label: 'Marks' }, { key: 'max', label: 'Max' }, { key: 'percentage', label: '%' },
              ])}
            />
            <DataTable
              columns={[
                { key: 'subject', header: 'Subject', cell: r => <span className="font-medium">{r.subject}</span> },
                { key: 'name', header: 'Topper', cell: r => r.name },
                { key: 'class', header: 'Class', cell: r => `${r.classId}-${r.section}` },
                { key: 'marks', header: 'Marks', cell: r => `${r.marks} / ${r.max}` },
                { key: 'pct', header: '%', cell: r => r.percentage.toFixed(2) },
              ]}
              rows={toppers}
              rowKey={r => r.subject}
              emptyTitle="No subject toppers yet"
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
