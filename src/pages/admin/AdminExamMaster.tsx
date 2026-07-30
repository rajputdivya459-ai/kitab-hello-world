import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { DataToolbar } from '@/components/shared/DataToolbar';
import { ExamMasterDialog } from '@/components/exam/ExamMasterDialog';
import { ExamInstructionsCard } from '@/components/exam/ExamInstructionsCard';
import { ExamScheduleView } from '@/components/exam/ExamScheduleView';
import { exportCSV } from '@/lib/export';
import { useToast } from '@/hooks/use-toast';
import { listRooms, listInvigilators } from '@/lib/exam/api';
import {
  listExams, saveExam, deleteExam, submitExam, approveExam, rejectExam, publishExam,
  completeExam, archiveExam, duplicateExam, generateForExam, scheduleOf, archiveMany,
  publishMany, examPhase, examTypeLabel, workingDayCount, EXAM_TYPES, type ExamMaster,
} from '@/lib/exam/master';
import { getCollection } from '@/mock/db';
import { CalendarPlus, Copy, Archive, Send, CheckCircle2, XCircle, Upload, Trash2, RefreshCw, Eye } from 'lucide-react';

const STATUSES = ['draft','pending','approved','scheduled','published','completed','archived'] as const;

const statusVariant = (s: string) =>
  s === 'published' ? 'default' : s === 'archived' ? 'outline' : 'secondary';

export default function AdminExamMaster() {
  const { toast } = useToast();
  const [tick, setTick] = useState(0);
  const refresh = () => setTick(t => t + 1);
  const exams = useMemo(() => listExams(), [tick]);
  const rooms = listRooms();
  const invigilators = listInvigilators();
  const coordinators = useMemo(() => {
    const teachers = getCollection<any>('teachers').map(t => ({ id: t.id, name: t.name }));
    const staff = getCollection<any>('staff').map(s => ({ id: s.id, name: `${s.name}${s.designation ? ` — ${s.designation}` : ''}` }));
    return [...staff, ...teachers];
  }, []);

  const [search, setSearch] = useState('');
  const [fYear, setFYear] = useState('all');
  const [fType, setFType] = useState('all');
  const [fStatus, setFStatus] = useState('all');
  const [fClass, setFClass] = useState('all');
  const [fCoord, setFCoord] = useState('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [editing, setEditing] = useState<ExamMaster | null | undefined>(undefined);
  const [viewing, setViewing] = useState<ExamMaster | null>(null);

  const years = Array.from(new Set(exams.map(e => e.academicYear)));

  const rows = exams.filter(e => {
    const q = search.trim().toLowerCase();
    if (q && !`${e.name} ${e.code} ${e.coordinatorName ?? ''}`.toLowerCase().includes(q)) return false;
    if (fYear !== 'all' && e.academicYear !== fYear) return false;
    if (fType !== 'all' && e.type !== fType) return false;
    if (fStatus !== 'all' && e.status !== fStatus) return false;
    if (fClass !== 'all' && !e.wholeSchool && !e.classes.includes(fClass)) return false;
    if (fCoord !== 'all' && e.coordinatorId !== fCoord) return false;
    if (from && e.endDate < from) return false;
    if (to && e.startDate > to) return false;
    return true;
  });

  const stats = {
    total: exams.length,
    draft: exams.filter(e => e.status === 'draft').length,
    scheduled: exams.filter(e => e.status === 'scheduled' || e.status === 'pending' || e.status === 'approved').length,
    published: exams.filter(e => e.status === 'published').length,
    archived: exams.filter(e => e.status === 'archived').length,
    upcoming: exams.filter(e => examPhase(e) === 'upcoming' && e.status !== 'archived').length,
    ongoing: exams.filter(e => examPhase(e) === 'ongoing' && e.status !== 'archived').length,
    completed: exams.filter(e => examPhase(e) === 'completed' || e.status === 'completed').length,
  };

  const act = (fn: () => void, msg: string) => { fn(); refresh(); toast({ title: msg }); };

  const columns: Column<ExamMaster>[] = [
    {
      key: 'sel', header: '', className: 'w-8',
      cell: (e) => (
        <Checkbox
          checked={selected.includes(e.id)}
          onCheckedChange={(v) => setSelected(s => (v ? [...s, e.id] : s.filter(x => x !== e.id)))}
        />
      ),
    },
    {
      key: 'name', header: 'Examination',
      cell: (e) => (
        <div>
          <p className="font-medium">{e.name}</p>
          <p className="text-xs text-muted-foreground">{e.code} · {examTypeLabel(e.type)} · {e.academicYear}</p>
        </div>
      ),
    },
    {
      key: 'scope', header: 'Scope',
      cell: (e) => <span className="text-xs">{e.wholeSchool ? 'Entire School' : `Class ${e.classes.join(', ') || '—'}`}{e.sections.length ? ` · ${e.sections.join('/')}` : ''}</span>,
    },
    { key: 'subjects', header: 'Subjects', cell: (e) => <span className="text-xs">{e.subjects.length}</span> },
    {
      key: 'dates', header: 'Dates',
      cell: (e) => <span className="text-xs">{e.startDate} → {e.endDate}<br /><span className="text-muted-foreground">{workingDayCount(e)} working days</span></span>,
    },
    { key: 'coord', header: 'Coordinator', cell: (e) => <span className="text-xs">{e.coordinatorName ?? '—'}</span> },
    {
      key: 'status', header: 'Status',
      cell: (e) => (
        <div className="flex flex-col gap-1">
          <Badge variant={statusVariant(e.status) as any} className="capitalize w-fit">{e.status}</Badge>
          <Badge variant="outline" className="capitalize w-fit text-[10px]">{examPhase(e)}</Badge>
        </div>
      ),
    },
    {
      key: 'actions', header: 'Actions', className: 'text-right',
      cell: (e) => (
        <div className="flex flex-wrap justify-end gap-1">
          <Button size="sm" variant="ghost" onClick={() => setViewing(e)}><Eye className="h-4 w-4" /></Button>
          <Button size="sm" variant="outline" onClick={() => setEditing(e)}>Edit</Button>
          <Button size="sm" variant="outline" onClick={() => act(() => {
            const { conflicts } = generateForExam(e.id);
            if (conflicts.length) toast({ title: `${conflicts.length} conflict(s) detected`, variant: 'destructive' });
          }, 'Schedule generated')}>
            {e.scheduleId ? <RefreshCw className="h-4 w-4 mr-1" /> : <CalendarPlus className="h-4 w-4 mr-1" />}
            {e.scheduleId ? 'Regenerate' : 'Generate'}
          </Button>
          {e.status === 'draft' && <Button size="sm" variant="outline" onClick={() => act(() => submitExam(e.id), 'Submitted for approval')}><Send className="h-4 w-4 mr-1" />Submit</Button>}
          {e.status === 'pending' && <>
            <Button size="sm" onClick={() => act(() => approveExam(e.id), 'Approved')}><CheckCircle2 className="h-4 w-4 mr-1" />Approve</Button>
            <Button size="sm" variant="outline" onClick={() => act(() => rejectExam(e.id), 'Rejected')}><XCircle className="h-4 w-4 mr-1" />Reject</Button>
          </>}
          {(e.status === 'approved' || e.status === 'scheduled') && (
            <Button size="sm" onClick={() => act(() => publishExam(e.id), 'Published')} disabled={!e.scheduleId}><Upload className="h-4 w-4 mr-1" />Publish</Button>
          )}
          {e.status === 'published' && <Button size="sm" variant="outline" onClick={() => act(() => completeExam(e.id), 'Marked completed')}>Complete</Button>}
          <Button size="sm" variant="ghost" onClick={() => act(() => { duplicateExam(e.id, { copySubjects: true }); }, 'Exam duplicated')}><Copy className="h-4 w-4" /></Button>
          {e.status !== 'archived' && <Button size="sm" variant="ghost" onClick={() => act(() => archiveExam(e.id), 'Archived')}><Archive className="h-4 w-4" /></Button>}
          <Button size="sm" variant="ghost" onClick={() => act(() => deleteExam(e.id), 'Deleted')}><Trash2 className="h-4 w-4 text-destructive" /></Button>
        </div>
      ),
    },
  ];

  const viewSchedule = viewing ? scheduleOf(viewing) : undefined;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold">Exam Master</h1>
          <p className="text-sm text-muted-foreground">Plan, schedule and publish examinations across the school.</p>
        </div>
        <Button onClick={() => setEditing(null)}><CalendarPlus className="h-4 w-4 mr-1" />Create Exam</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {([['Total Exams', stats.total], ['Draft', stats.draft], ['Scheduled', stats.scheduled], ['Published', stats.published],
           ['Archived', stats.archived], ['Upcoming', stats.upcoming], ['Ongoing', stats.ongoing], ['Completed', stats.completed]] as Array<[string, number]>).map(([label, n]) => (
          <Card key={label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-2xl font-semibold">{n}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="all">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="all">All Exams</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="ongoing">Ongoing</TabsTrigger>
          <TabsTrigger value="archived">Archived</TabsTrigger>
        </TabsList>

        {(['all','upcoming','ongoing','archived'] as const).map(tab => {
          const tabRows = rows.filter(e =>
            tab === 'all' ? true
            : tab === 'archived' ? e.status === 'archived'
            : examPhase(e) === tab && e.status !== 'archived');
          return (
            <TabsContent key={tab} value={tab} className="space-y-3 pt-3">
              <DataToolbar
                search={search}
                onSearchChange={setSearch}
                searchPlaceholder="Search by name, code or coordinator…"
                onExportCSV={() => exportCSV('exams', tabRows, [
                  { key: 'code', label: 'Code' }, { key: 'name', label: 'Name' },
                  { key: 'type', label: 'Type' }, { key: 'academicYear', label: 'Year' },
                  { key: 'startDate', label: 'Start' }, { key: 'endDate', label: 'End' },
                  { key: 'status', label: 'Status' }, { key: 'coordinatorName', label: 'Coordinator' },
                ])}
                filters={
                  <>
                    <Select value={fYear} onValueChange={setFYear}><SelectTrigger className="h-9 w-[130px]"><SelectValue placeholder="Year" /></SelectTrigger>
                      <SelectContent><SelectItem value="all">All years</SelectItem>{years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent></Select>
                    <Select value={fType} onValueChange={setFType}><SelectTrigger className="h-9 w-[150px]"><SelectValue placeholder="Type" /></SelectTrigger>
                      <SelectContent><SelectItem value="all">All types</SelectItem>{EXAM_TYPES.map(t => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}</SelectContent></Select>
                    <Select value={fStatus} onValueChange={setFStatus}><SelectTrigger className="h-9 w-[130px]"><SelectValue placeholder="Status" /></SelectTrigger>
                      <SelectContent><SelectItem value="all">All status</SelectItem>{STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent></Select>
                    <Select value={fClass} onValueChange={setFClass}><SelectTrigger className="h-9 w-[110px]"><SelectValue placeholder="Class" /></SelectTrigger>
                      <SelectContent><SelectItem value="all">All classes</SelectItem>{['1','2','3','4','5','6','7','8','9','10'].map(c => <SelectItem key={c} value={c}>Class {c}</SelectItem>)}</SelectContent></Select>
                    <Select value={fCoord} onValueChange={setFCoord}><SelectTrigger className="h-9 w-[160px]"><SelectValue placeholder="Coordinator" /></SelectTrigger>
                      <SelectContent><SelectItem value="all">All coordinators</SelectItem>{coordinators.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select>
                    <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="h-9 rounded-md border bg-background px-2 text-sm" />
                    <input type="date" value={to} onChange={e => setTo(e.target.value)} className="h-9 rounded-md border bg-background px-2 text-sm" />
                  </>
                }
              />

              {selected.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/40 p-2 text-sm">
                  <span>{selected.length} selected</span>
                  <Button size="sm" variant="outline" onClick={() => act(() => { publishMany(selected); setSelected([]); }, 'Published selected exams')}>Publish</Button>
                  <Button size="sm" variant="outline" onClick={() => act(() => { archiveMany(selected); setSelected([]); }, 'Archived selected exams')}>Archive</Button>
                  <Button size="sm" variant="outline" onClick={() => act(() => { selected.forEach(id => duplicateExam(id, { copySubjects: true })); setSelected([]); }, 'Duplicated selected exams')}>Duplicate</Button>
                  <Button size="sm" variant="ghost" onClick={() => setSelected([])}>Clear</Button>
                </div>
              )}

              <DataTable
                columns={columns}
                rows={tabRows}
                rowKey={(e) => e.id}
                emptyTitle="No examinations"
                emptyDescription="Create an exam to get started."
                emptyAction={{ label: 'Create Exam', onClick: () => setEditing(null) }}
              />
            </TabsContent>
          );
        })}
      </Tabs>

      <ExamMasterDialog
        open={editing !== undefined}
        onOpenChange={(o) => !o && setEditing(undefined)}
        exam={editing ?? null}
        coordinators={coordinators}
        onSave={(draft) => act(() => saveExam(draft), 'Exam saved')}
      />

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{viewing?.name}</DialogTitle></DialogHeader>
          {viewing && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2 text-xs">
                <Badge variant="outline">{viewing.code}</Badge>
                <Badge variant="secondary">{examTypeLabel(viewing.type)}</Badge>
                <Badge className="capitalize">{viewing.status}</Badge>
                {viewing.coordinatorName && <Badge variant="outline">Coordinator: {viewing.coordinatorName}</Badge>}
              </div>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Subject Mapping</CardTitle></CardHeader>
                <CardContent className="text-sm">
                  {viewing.subjects.length === 0 ? <p className="text-muted-foreground">No subjects mapped.</p> : (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {viewing.subjects.map(s => (
                        <div key={s.id} className="rounded-md border p-2">
                          <p className="font-medium">{s.name} <span className="text-xs text-muted-foreground">({s.code})</span></p>
                          <p className="text-xs text-muted-foreground capitalize">{s.category} · {s.maxMarks} marks · pass {s.passingMarks} · {s.duration} min {s.isPractical ? '· practical' : ''}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
              <ExamInstructionsCard exam={viewing} />
              {viewSchedule
                ? <ExamScheduleView schedule={viewSchedule} rooms={rooms} invigilators={invigilators} />
                : <p className="text-sm text-muted-foreground">No schedule generated yet.</p>}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
