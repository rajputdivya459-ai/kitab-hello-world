import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { DataToolbar } from '@/components/shared/DataToolbar';
import { Pagination } from '@/components/shared/Pagination';
import { toast } from '@/hooks/use-toast';
import { exportCSV, exportPDF } from '@/lib/export';
import { Send, CheckCheck, Upload, Archive, Undo2, Eye } from 'lucide-react';
import * as bulk from '@/lib/results/bulk';
import { RESULT_STATUS_META, type ResultSet } from '@/lib/results/types';

interface Props {
  sets: ResultSet[];
  onOpen: (set: ResultSet) => void;
  onChanged: () => void;
  canApprove?: boolean;
  canPublish?: boolean;
  readOnly?: boolean;
}

export const StatusBadge = ({ status }: { status: ResultSet['status'] }) => (
  <Badge variant="outline" className={RESULT_STATUS_META[status].color}>{RESULT_STATUS_META[status].label}</Badge>
);

const cols = [
  { key: 'examName', label: 'Exam' }, { key: 'classId', label: 'Class' }, { key: 'section', label: 'Section' },
  { key: 'academicYear', label: 'Year' }, { key: 'status', label: 'Status' },
  { key: 'students', label: 'Students', get: (s: ResultSet) => s.students.length },
  { key: 'pass', label: 'Pass %', get: (s: ResultSet) => s.students.length ? Math.round((s.students.filter(x => x.passed).length / s.students.length) * 100) : 0 },
];

export function ResultSetList({ sets, onOpen, onChanged, canApprove, canPublish, readOnly }: Props) {
  const [sel, setSel] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const paged = useMemo(() => sets.slice((page - 1) * pageSize, page * pageSize), [sets, page, pageSize]);
  const toggle = (id: string) => setSel(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const allSel = paged.length > 0 && paged.every(s => sel.includes(s.id));

  const run = (label: string, fn: () => bulk.BulkOutcome) => {
    if (!sel.length) return toast({ title: 'Select at least one result set' });
    const r = fn();
    toast({
      title: `${label}: ${r.ok.length} succeeded`,
      description: r.skipped.length ? r.skipped.map(s => `${s.title} — ${s.reason}`).join(' · ') : undefined,
      variant: r.ok.length ? 'default' : 'destructive',
    });
    setSel([]); onChanged();
  };

  const columns: Column<ResultSet>[] = [
    ...(readOnly ? [] : [{
      key: 'sel', header: <Checkbox checked={allSel} onCheckedChange={() => setSel(allSel ? [] : paged.map(s => s.id))} aria-label="Select all" />,
      cell: (r: ResultSet) => <Checkbox checked={sel.includes(r.id)} onCheckedChange={() => toggle(r.id)} aria-label={`Select ${r.examName}`} />,
    } as Column<ResultSet>]),
    { key: 'exam', header: 'Exam', cell: r => <div><p className="font-medium">{r.examName}</p><p className="text-[11px] text-muted-foreground">{r.academicYear} · {r.subjects.length} subjects</p></div> },
    { key: 'cls', header: 'Class', cell: r => <span className="text-sm">{r.classId}-{r.section}</span> },
    { key: 'students', header: 'Students', cell: r => <span className="tabular-nums">{r.students.length}</span> },
    { key: 'pass', header: 'Pass %', cell: r => <span className="tabular-nums">{r.students.length ? Math.round((r.students.filter(s => s.passed).length / r.students.length) * 100) : 0}%</span> },
    { key: 'status', header: 'Status', cell: r => <StatusBadge status={r.status} /> },
    { key: 'updated', header: 'Updated', cell: r => <span className="text-xs text-muted-foreground">{new Date(r.updatedAt).toLocaleDateString()}</span> },
    { key: 'act', header: '', cell: r => <Button size="sm" variant="outline" onClick={() => onOpen(r)}><Eye className="h-3.5 w-3.5 mr-1" />Open</Button> },
  ];

  return (
    <div className="space-y-2">
      <DataToolbar
        onExportCSV={() => exportCSV('result-sets', sets, cols)}
        onExportPDF={() => exportPDF('result-sets', 'Result Sets', sets, cols)}
        actions={readOnly ? undefined : (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => run('Submit', () => bulk.bulkSubmit(sel))}><Send className="h-3.5 w-3.5 mr-1" />Submit</Button>
            {canApprove && <Button size="sm" variant="outline" onClick={() => run('Approve', () => bulk.bulkApprove(sel, 'Bulk approved'))}><CheckCheck className="h-3.5 w-3.5 mr-1" />Approve</Button>}
            {canPublish && <Button size="sm" onClick={() => run('Publish', () => bulk.bulkPublish(sel))}><Upload className="h-3.5 w-3.5 mr-1" />Publish</Button>}
            <Button size="sm" variant="outline" onClick={() => run('Archive', () => bulk.bulkArchive(sel))}><Archive className="h-3.5 w-3.5 mr-1" />Archive</Button>
            <Button size="sm" variant="ghost" onClick={() => run('Rollback', () => bulk.bulkRollback(sel))}><Undo2 className="h-3.5 w-3.5 mr-1" />Rollback</Button>
          </div>
        )}
      />
      <DataTable columns={columns} rows={paged} rowKey={r => r.id} emptyTitle="No result sets" emptyDescription="Generate results from approved marks to get started." />
      <Pagination page={page} pageSize={pageSize} total={sets.length} onPageChange={setPage} onPageSizeChange={s => { setPageSize(s); setPage(1); }} />
    </div>
  );
}
