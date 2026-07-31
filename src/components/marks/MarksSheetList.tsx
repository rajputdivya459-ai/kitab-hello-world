import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { DataToolbar } from '@/components/shared/DataToolbar';
import { Pagination } from '@/components/shared/Pagination';
import { exportCSV, exportPDF } from '@/lib/export';
import { useToast } from '@/hooks/use-toast';
import { SHEET_STATUS_META, type MarksSheet, type MarksSheetStatus } from '@/lib/marks/types';
import { sheetTotals } from '@/lib/marks/calc';
import * as api from '@/lib/marks/api';
import { ClipboardList } from 'lucide-react';

interface Props {
  sheets: MarksSheet[];
  role: string | null;
  onOpen: (id: string) => void;
  onChanged: () => void;
}

const PAGE = 10;

export function MarksSheetList({ sheets, role, onOpen, onChanged }: Props) {
  const { toast } = useToast();
  const canModerate = role === 'admin' || role === 'principal';
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<MarksSheetStatus | 'all'>('all');
  const [examId, setExamId] = useState('all');
  const [classId, setClassId] = useState('all');
  const [teacherId, setTeacherId] = useState('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);

  const exams = useMemo(() => Array.from(new Map(sheets.map(s => [s.examId, s.examName])).entries()), [sheets]);
  const classes = useMemo(() => Array.from(new Set(sheets.map(s => `${s.classId}-${s.section}`))), [sheets]);
  const teachers = useMemo(() => Array.from(new Map(sheets.map(s => [s.teacherId, s.teacherName])).entries()), [sheets]);

  const rows = useMemo(() => api.filterSheets({
    q: q || undefined,
    status,
    examId: examId === 'all' ? undefined : examId,
    teacherId: teacherId === 'all' ? undefined : teacherId,
    classId: classId === 'all' ? undefined : classId.split('-')[0],
    section: classId === 'all' ? undefined : classId.split('-')[1],
    from: from || undefined, to: to || undefined,
  }, sheets), [sheets, q, status, examId, classId, teacherId, from, to]);

  const paged = rows.slice((page - 1) * PAGE, page * PAGE);
  const allChecked = paged.length > 0 && paged.every(r => selected.includes(r.id));

  const bulk = (op: 'submit' | 'approve' | 'reject' | 'publish' | 'lock' | 'unlock') => {
    const n = api.bulkTransition(selected, op, op === 'reject' ? 'Bulk returned by reviewer' : '');
    setSelected([]);
    onChanged();
    toast({ title: `${n} sheet(s) updated`, description: n ? `Bulk ${op} applied.` : 'No eligible sheets in selection.' });
  };

  const cols: Column<MarksSheet>[] = [
    {
      key: 'sel', header: (
        <Checkbox checked={allChecked} onCheckedChange={v => setSelected(v ? Array.from(new Set([...selected, ...paged.map(p => p.id)])) : selected.filter(id => !paged.some(p => p.id === id)))} />
      ),
      cell: r => <Checkbox checked={selected.includes(r.id)} onCheckedChange={v => setSelected(v ? [...selected, r.id] : selected.filter(i => i !== r.id))} />,
      className: 'w-10',
    },
    { key: 'exam', header: 'Examination', cell: r => <span className="font-medium">{r.examName}</span> },
    { key: 'class', header: 'Class', cell: r => `${r.classId}-${r.section}` },
    { key: 'subject', header: 'Subject', cell: r => r.subjectName },
    { key: 'teacher', header: 'Teacher', cell: r => r.teacherName },
    {
      key: 'progress', header: 'Completion', cell: r => {
        const t = sheetTotals(r);
        return <span className="text-xs tabular-nums">{t.entered}/{t.students} · {t.completion}%</span>;
      },
    },
    {
      key: 'status', header: 'Status', cell: r => (
        <Badge variant="outline" className={SHEET_STATUS_META[r.status].color}>{SHEET_STATUS_META[r.status].label}</Badge>
      ),
    },
    { key: 'updated', header: 'Updated', cell: r => <span className="text-xs text-muted-foreground">{new Date(r.updatedAt).toLocaleDateString()}</span> },
    { key: 'go', header: '', cell: r => <Button size="sm" variant="ghost" onClick={() => onOpen(r.id)}>Open</Button>, className: 'text-right' },
  ];

  const exportCols = [
    { key: 'examName', label: 'Examination' },
    { key: 'class', label: 'Class', get: (r: MarksSheet) => `${r.classId}-${r.section}` },
    { key: 'subjectName', label: 'Subject' },
    { key: 'teacherName', label: 'Teacher' },
    { key: 'status', label: 'Status' },
    { key: 'completion', label: 'Completion %', get: (r: MarksSheet) => sheetTotals(r).completion },
    { key: 'updatedAt', label: 'Updated' },
  ];

  return (
    <div className="space-y-3">
      <DataToolbar
        search={q} onSearchChange={v => { setQ(v); setPage(1); }}
        searchPlaceholder="Search exam, subject, class, teacher…"
        onExportCSV={() => exportCSV('marks-sheets', rows, exportCols)}
        onExportPDF={() => exportPDF('marks-sheets', 'Marks Sheets', rows, exportCols)}
        filters={
          <>
            <Select value={examId} onValueChange={v => { setExamId(v); setPage(1); }}>
              <SelectTrigger className="h-9 w-[190px]"><SelectValue placeholder="Examination" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All examinations</SelectItem>
                {exams.map(([id, name]) => <SelectItem key={id} value={id}>{name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={classId} onValueChange={v => { setClassId(v); setPage(1); }}>
              <SelectTrigger className="h-9 w-[130px]"><SelectValue placeholder="Class" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All classes</SelectItem>
                {classes.map(c => <SelectItem key={c} value={c}>Class {c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={teacherId} onValueChange={v => { setTeacherId(v); setPage(1); }}>
              <SelectTrigger className="h-9 w-[150px]"><SelectValue placeholder="Teacher" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All teachers</SelectItem>
                {teachers.map(([id, name]) => <SelectItem key={id} value={id}>{name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={(v: any) => { setStatus(v); setPage(1); }}>
              <SelectTrigger className="h-9 w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {(Object.keys(SHEET_STATUS_META) as MarksSheetStatus[]).map(s => (
                  <SelectItem key={s} value={s}>{SHEET_STATUS_META[s].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input type="date" value={from} onChange={e => setFrom(e.target.value)} className="h-9 w-[140px]" />
            <Input type="date" value={to} onChange={e => setTo(e.target.value)} className="h-9 w-[140px]" />
          </>
        }
      />

      {selected.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/40 p-2 text-sm">
          <span className="font-medium">{selected.length} selected</span>
          <Button size="sm" variant="outline" onClick={() => bulk('submit')}>Bulk Submit</Button>
          {canModerate && <Button size="sm" variant="outline" onClick={() => bulk('approve')}>Bulk Approve</Button>}
          {canModerate && <Button size="sm" variant="outline" onClick={() => bulk('reject')}>Bulk Reject</Button>}
          {canModerate && <Button size="sm" variant="outline" onClick={() => bulk('publish')}>Bulk Publish</Button>}
          {canModerate && <Button size="sm" variant="outline" onClick={() => bulk('lock')}>Lock</Button>}
          {canModerate && <Button size="sm" variant="outline" onClick={() => bulk('unlock')}>Unlock</Button>}
          <Button size="sm" variant="ghost" onClick={() => setSelected([])}>Clear</Button>
        </div>
      )}

      <DataTable
        columns={cols} rows={paged} rowKey={r => r.id}
        emptyIcon={ClipboardList} emptyTitle="No marks sheets"
        emptyDescription="Adjust the filters or start a new marks entry."
      />
      <Pagination page={page} total={rows.length} pageSize={PAGE} onPageChange={setPage} />
    </div>
  );
}
