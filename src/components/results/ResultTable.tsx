import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { Pagination } from '@/components/shared/Pagination';
import { FileText } from 'lucide-react';
import type { ResultSet, StudentResult } from '@/lib/results/types';

interface Props {
  set: ResultSet;
  onOpenReportCard?: (student: StudentResult) => void;
  showRemarks?: boolean;
}

export function ResultTable({ set, onOpenReportCard, showRemarks }: Props) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const rows = useMemo(
    () => [...set.students].sort((a, b) => a.sectionRank - b.sectionRank || a.roll.localeCompare(b.roll, undefined, { numeric: true })),
    [set],
  );
  const paged = rows.slice((page - 1) * pageSize, page * pageSize);

  const columns: Column<StudentResult>[] = [
    { key: 'roll', header: 'Roll', cell: r => r.roll },
    { key: 'name', header: 'Student', cell: r => <div><p className="font-medium">{r.name}</p><p className="text-[11px] text-muted-foreground">{r.admissionNo}</p></div> },
    { key: 'total', header: 'Total', cell: r => <span className="tabular-nums">{r.total} / {r.outOf}</span> },
    { key: 'pct', header: '%', cell: r => <span className="tabular-nums font-medium">{r.percentage.toFixed(2)}</span> },
    { key: 'grade', header: 'Grade', cell: r => <Badge variant="outline">{r.grade}</Badge> },
    { key: 'gpa', header: 'GPA', cell: r => <span className="tabular-nums">{r.gpa.toFixed(2)}</span> },
    { key: 'div', header: 'Division', cell: r => <span className="text-xs">{r.division}</span> },
    { key: 'rank', header: 'Rank', cell: r => <span className="text-xs tabular-nums">S{r.sectionRank} · C{r.classRank} · Sch{r.schoolRank}</span> },
    { key: 'result', header: 'Result', cell: r => <Badge className={r.passed ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-rose-100 text-rose-700 border-rose-200'} variant="outline">{r.passed ? 'PASS' : 'FAIL'}</Badge> },
    { key: 'promo', header: 'Promotion', cell: r => <span className="text-xs capitalize">{r.promotion}</span> },
    ...(showRemarks ? [{ key: 'rem', header: 'Remarks', cell: (r: StudentResult) => <span className="text-xs text-muted-foreground">{r.teacherRemarks ?? '—'}</span> } as Column<StudentResult>] : []),
    ...(onOpenReportCard ? [{
      key: 'act', header: '', cell: (r: StudentResult) => (
        <Button size="sm" variant="outline" onClick={() => onOpenReportCard(r)}>
          <FileText className="h-3.5 w-3.5 mr-1" />Card
        </Button>
      ),
    } as Column<StudentResult>] : []),
  ];

  return (
    <div className="space-y-2">
      <DataTable columns={columns} rows={paged} rowKey={r => r.studentId} emptyTitle="No students in this result set" />
      <Pagination page={page} pageSize={pageSize} total={rows.length} onPageChange={setPage} onPageSizeChange={s => { setPageSize(s); setPage(1); }} />
    </div>
  );
}
