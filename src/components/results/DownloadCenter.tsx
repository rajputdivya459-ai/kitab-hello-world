import { useMemo, useState } from 'react';
import JSZip from 'jszip';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { toast } from '@/hooks/use-toast';
import { Printer, FileArchive, FileDown, Plus, Trash2 } from 'lucide-react';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { exportCSV } from '@/lib/export';
import { logReportCard } from '@/lib/results/api';
import { logAudit } from '@/lib/audit';
import { reportCardHtml, reportDocument } from '@/lib/results/reportHtml';
import type { ResultSet, StudentResult } from '@/lib/results/types';

interface QueueItem { setId: string; studentId: string; label: string }

export function DownloadCenter({ sets }: { sets: ResultSet[] }) {
  const { getSetting } = useSiteSettings();
  const school = getSetting('site_name') || 'School';
  const [setId, setSetId] = useState(sets[0]?.id ?? '');
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const set = useMemo(() => sets.find(s => s.id === setId), [sets, setId]);

  const openPrint = (title: string, body: string, ids: Array<{ setId: string; studentId: string }>) => {
    const w = window.open('', '_blank', 'width=1000,height=1200');
    if (!w) return toast({ title: 'Allow pop-ups to print report cards', variant: 'destructive' });
    w.document.write(reportDocument(title, body));
    w.document.close();
    ids.forEach(i => logReportCard(i.setId, i.studentId, 'downloaded'));
    logAudit({ module: 'results', action: 'reportcard.printed', meta: { count: ids.length, title } });
    setTimeout(() => { w.focus(); w.print(); }, 300);
  };

  const printStudents = (s: ResultSet, students: StudentResult[], title: string) => {
    if (!students.length) return toast({ title: 'Nothing to print' });
    openPrint(title, students.map(st => reportCardHtml(s, st, school)).join(''), students.map(st => ({ setId: s.id, studentId: st.studentId })));
  };

  const zipSet = async (s: ResultSet, students: StudentResult[], name: string) => {
    const zip = new JSZip();
    students.forEach(st => zip.file(`${st.roll}-${st.name.replace(/\s+/g, '_')}.html`, reportDocument(`Report Card — ${st.name}`, reportCardHtml(s, st, school))));
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${name}.zip`; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    students.forEach(st => logReportCard(s.id, st.studentId, 'downloaded'));
    logAudit({ module: 'results', action: 'reportcard.bulk_export', recordId: s.id, meta: { count: students.length } });
    toast({ title: `Exported ${students.length} report cards` });
  };

  const classStudents = (classId: string) => sets.filter(s => s.classId === classId && s.status === 'published');

  const cols: Column<StudentResult>[] = [
    { key: 'roll', header: 'Roll', cell: r => r.roll },
    { key: 'name', header: 'Student', cell: r => <div><p className="font-medium">{r.name}</p><p className="text-[11px] text-muted-foreground">{r.reportCardNo}</p></div> },
    { key: 'pct', header: '%', cell: r => r.percentage.toFixed(2) },
    { key: 'act', header: '', cell: r => set && (
      <div className="flex gap-1.5">
        <Button size="sm" variant="outline" onClick={() => printStudents(set, [r], `Report Card — ${r.name}`)}><Printer className="h-3.5 w-3.5 mr-1" />PDF</Button>
        <Button size="sm" variant="ghost" onClick={() => setQueue(q => q.some(x => x.studentId === r.studentId && x.setId === set.id) ? q : [...q, { setId: set.id, studentId: r.studentId, label: `${r.name} · ${set.classId}-${set.section}` }])}><Plus className="h-3.5 w-3.5" /></Button>
      </div>
    ) },
  ];

  const printQueue = () => {
    const items = queue.map(q => {
      const s = sets.find(x => x.id === q.setId);
      const st = s?.students.find(x => x.studentId === q.studentId);
      return s && st ? { s, st } : null;
    }).filter(Boolean) as Array<{ s: ResultSet; st: StudentResult }>;
    if (!items.length) return toast({ title: 'Print queue is empty' });
    openPrint('Print Queue', items.map(i => reportCardHtml(i.s, i.st, school)).join(''), items.map(i => ({ setId: i.s.id, studentId: i.st.studentId })));
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Report Card Downloads</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2 items-center">
            <Select value={setId} onValueChange={setSetId}>
              <SelectTrigger className="h-9 w-full sm:w-[320px]"><SelectValue placeholder="Select a result set" /></SelectTrigger>
              <SelectContent>{sets.map(s => <SelectItem key={s.id} value={s.id}>{s.examName} · {s.classId}-{s.section} ({s.status})</SelectItem>)}</SelectContent>
            </Select>
            {set && <>
              <Button size="sm" variant="outline" onClick={() => printStudents(set, set.students, `${set.examName} — ${set.classId}-${set.section}`)}><Printer className="h-4 w-4 mr-1" />Section PDF</Button>
              <Button size="sm" variant="outline" onClick={() => {
                const rows = classStudents(set.classId);
                if (!rows.length) return toast({ title: 'No published sets for this class' });
                openPrint(`${set.examName} — Class ${set.classId}`,
                  rows.flatMap(s => s.students.map(st => reportCardHtml(s, st, school))).join(''),
                  rows.flatMap(s => s.students.map(st => ({ setId: s.id, studentId: st.studentId }))));
              }}><Printer className="h-4 w-4 mr-1" />Class PDF</Button>
              <Button size="sm" variant="outline" onClick={() => zipSet(set, set.students, `report-cards-${set.classId}${set.section}`)}><FileArchive className="h-4 w-4 mr-1" />Bulk ZIP</Button>
              <Button size="sm" variant="ghost" onClick={() => exportCSV(`results-${set.classId}${set.section}`, set.students, [
                { key: 'roll', label: 'Roll' }, { key: 'name', label: 'Student' }, { key: 'admissionNo', label: 'Admission No' },
                { key: 'total', label: 'Total' }, { key: 'outOf', label: 'Out Of' }, { key: 'percentage', label: '%' },
                { key: 'grade', label: 'Grade' }, { key: 'gpa', label: 'GPA' }, { key: 'classRank', label: 'Class Rank' },
                { key: 'promotion', label: 'Promotion' },
              ])}><FileDown className="h-4 w-4 mr-1" />CSV</Button>
            </>}
          </div>
          {set && <DataTable columns={cols} rows={set.students} rowKey={r => r.studentId} emptyTitle="No students" />}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm">Print Queue</CardTitle>
          <div className="flex gap-2">
            <Badge variant="outline">{queue.length}</Badge>
            <Button size="sm" onClick={printQueue}><Printer className="h-4 w-4 mr-1" />Print all</Button>
            <Button size="sm" variant="ghost" onClick={() => setQueue([])}><Trash2 className="h-4 w-4" /></Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-1">
          {!queue.length && <p className="text-sm text-muted-foreground">Add report cards from the table above to build a print batch.</p>}
          {queue.map(q => <p key={`${q.setId}-${q.studentId}`} className="text-sm">{q.label}</p>)}
        </CardContent>
      </Card>
    </div>
  );
}
