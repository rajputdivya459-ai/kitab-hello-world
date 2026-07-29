import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { AlertTriangle, CheckCircle2, Copy, Printer, Send, Trash2, Wand2, Archive, Plus, CalendarPlus } from 'lucide-react';
import { toast } from 'sonner';
import { getCollection } from '@/mock/db';
import { listTimetables, saveTimetable, publishTimetable, duplicateAsDraft, deleteTimetable, swapPeriods, archiveTimetable } from '@/lib/timetable/api';
import { generateTimetable, validateTimetable } from '@/lib/timetable/generator';
import type { GeneratorInput, TimetableRecord, Conflict, Period } from '@/lib/timetable/types';
import { getTimetableType, listTimetableTypes } from '@/lib/timetable/types';
import { GeneratorWizard } from '@/components/timetable/GeneratorWizard';
import { TimetableGrid } from '@/components/timetable/TimetableGrid';
import { TimetableCompare } from '@/components/timetable/TimetableCompare';
import { RoomView } from '@/components/timetable/RoomView';
import { TeacherView } from '@/components/timetable/TeacherView';
import { AnalyticsPanel } from '@/components/timetable/AnalyticsPanel';
import { MonthlyCalendar } from '@/components/timetable/MonthlyCalendar';
import { BulkOpsPanel } from '@/components/timetable/BulkOpsPanel';
import { SubstituteDialog } from '@/components/timetable/SubstituteDialog';
import { ExtraClassDialog } from '@/components/timetable/ExtraClassDialog';
import { listHolidays, addHoliday, removeHoliday } from '@/lib/timetable/holidays';

function useTeacherNames(): Record<string, string> {
  return useMemo(() => {
    const t = getCollection<any>('teachers');
    return Object.fromEntries(t.map((x: any) => [x.id, x.name]));
  }, []);
}

export default function AdminTimetable() {
  const teacherNames = useTeacherNames();
  const teachers = useMemo(() => getCollection<any>('teachers'), []);
  const [tables, setTables] = useState<TimetableRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<string>('library');
  const [teacherId, setTeacherId] = useState<string>('t_1');
  const [preview, setPreview] = useState<{ input: GeneratorInput; periods: Period[]; conflicts: Conflict[] } | null>(null);
  const [filterKind, setFilterKind] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [subFor, setSubFor] = useState<Period | null>(null);
  const [extraOpen, setExtraOpen] = useState(false);
  const [holName, setHolName] = useState(''); const [holDate, setHolDate] = useState('');
  const [holTick, setHolTick] = useState(0);

  const refresh = () => setTables(listTimetables());
  useEffect(() => { refresh(); }, []);

  const selected = tables.find(t => t.id === selectedId);
  const conflicts = selected ? validateTimetable(selected) : [];
  const holidays = useMemo(() => listHolidays(), [holTick]);

  const filtered = tables.filter(t =>
    (filterKind === 'all' || t.kind === filterKind) &&
    (filterStatus === 'all' || t.status === filterStatus)
  );

  const handleGenerated = (input: GeneratorInput, res: { periods: Period[]; conflicts: Conflict[] }) => {
    setPreview({ input, ...res });
    setTab('preview');
  };

  const handleSaveDraft = () => {
    if (!preview) return;
    const rec = saveTimetable({
      kind: preview.input.kind, status: 'draft',
      academicYear: preview.input.academicYear,
      className: preview.input.className, section: preview.input.section,
      workingDays: preview.input.workingDays,
      startTime: preview.input.startTime, endTime: preview.input.endTime,
      periodDuration: preview.input.periodDuration,
      breakDuration: preview.input.breakDuration, breakCount: preview.input.breakCount,
      periods: preview.periods, templateKey: preview.input.templateKey,
    });
    toast.success('Draft saved');
    setPreview(null); setSelectedId(rec.id); setTab('library'); refresh();
  };

  const handlePublish = (id: string) => {
    const c = validateTimetable(tables.find(t => t.id === id)!);
    if (c.some(x => x.kind === 'teacher_double_booked')) {
      toast.error('Resolve teacher conflicts before publishing.');
      return;
    }
    publishTimetable(id);
    toast.success('Published — students and parents notified');
    refresh();
  };

  const handleSwap = (a: string, b: string) => {
    if (!selectedId) return;
    swapPeriods(selectedId, a, b);
    toast.success('Periods swapped');
    refresh();
  };

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold">Timetable Studio</h1>
          <p className="text-sm text-muted-foreground">Generate, customize, compare and publish smart timetables.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setExtraOpen(true)}><CalendarPlus className="h-4 w-4 mr-2" />Extra Class</Button>
          <Button onClick={() => { setPreview(null); setTab('wizard'); }}><Wand2 className="h-4 w-4 mr-2" />New Timetable</Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="library">Library</TabsTrigger>
          <TabsTrigger value="wizard">Wizard</TabsTrigger>
          <TabsTrigger value="preview" disabled={!preview}>Preview</TabsTrigger>
          <TabsTrigger value="compare">Compare</TabsTrigger>
          <TabsTrigger value="rooms">Rooms</TabsTrigger>
          <TabsTrigger value="teachers">Teachers</TabsTrigger>
          <TabsTrigger value="month">Monthly</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Ops</TabsTrigger>
          <TabsTrigger value="holidays">Holidays</TabsTrigger>
        </TabsList>

        <TabsContent value="library" className="space-y-4">
          <Card><CardContent className="p-4 flex flex-wrap gap-2 items-center">
            <Select value={filterKind} onValueChange={setFilterKind}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {listTimetableTypes().map(t => <SelectItem key={t.key} value={t.key}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </CardContent></Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-1">
              <CardHeader><CardTitle className="text-sm">All Timetables ({filtered.length})</CardTitle></CardHeader>
              <CardContent className="space-y-1 max-h-[70vh] overflow-y-auto">
                {filtered.length === 0 && <p className="text-xs text-muted-foreground p-3 text-center">No timetables yet.</p>}
                {filtered.map(t => (
                  <button key={t.id} onClick={() => setSelectedId(t.id)}
                    className={`w-full text-left p-2 rounded-md border transition-colors ${selectedId === t.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/40'}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">Class {t.className}-{t.section}</span>
                      <Badge variant={t.status === 'published' ? 'default' : t.status === 'draft' ? 'secondary' : 'outline'} className="text-[10px]">{t.status}</Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground">{getTimetableType(t.kind)?.label ?? t.kind} · v{t.version} · {t.academicYear}</p>
                  </button>
                ))}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              {!selected ? (
                <CardContent className="p-8 text-center text-sm text-muted-foreground">Select a timetable to preview.</CardContent>
              ) : (
                <>
                  <CardHeader className="flex flex-row items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base">Class {selected.className}-{selected.section} · v{selected.version}</CardTitle>
                      <p className="text-xs text-muted-foreground">{getTimetableType(selected.kind)?.label} · {selected.academicYear}</p>
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      {selected.status === 'draft' && <Button size="sm" onClick={() => handlePublish(selected.id)}><Send className="h-3 w-3 mr-1" />Publish</Button>}
                      <Button size="sm" variant="outline" onClick={() => { duplicateAsDraft(selected.id); toast.success('Duplicated as new version'); refresh(); }}><Copy className="h-3 w-3 mr-1" />Duplicate</Button>
                      <Button size="sm" variant="outline" onClick={() => window.print()}><Printer className="h-3 w-3 mr-1" />Print</Button>
                      {selected.status !== 'archived' && <Button size="sm" variant="outline" onClick={() => { archiveTimetable(selected.id); refresh(); }}><Archive className="h-3 w-3 mr-1" />Archive</Button>}
                      <Button size="sm" variant="ghost" onClick={() => { if (confirm('Delete this timetable?')) { deleteTimetable(selected.id); setSelectedId(null); refresh(); } }}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {conflicts.length > 0 && (
                      <div className="rounded-md bg-destructive/10 border border-destructive/30 p-3 text-xs space-y-1">
                        <p className="font-medium text-destructive flex items-center gap-1"><AlertTriangle className="h-3 w-3" />{conflicts.length} real-time conflict(s)</p>
                        {conflicts.slice(0, 5).map((c, i) => <p key={i} className="text-destructive/90">• {c.message}</p>)}
                      </div>
                    )}
                    {conflicts.length === 0 && (
                      <p className="text-xs text-emerald-700 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />No conflicts.</p>
                    )}
                    <TimetableGrid timetable={selected} teacherNames={teacherNames} editable={selected.status !== 'archived'} onSwap={handleSwap}
                      onPeriodClick={(p) => { if (selected.status === 'published' && p.kind === 'class' && p.teacherId) setSubFor(p); }} />
                    {selected.status === 'published' && <p className="text-[11px] text-muted-foreground">Tip: click a period on a published timetable to assign a substitute.</p>}
                  </CardContent>
                </>
              )}
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="wizard"><GeneratorWizard onGenerated={handleGenerated} /></TabsContent>

        <TabsContent value="preview">
          {preview && (
            <div className="space-y-4">
              <Card><CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h3 className="font-semibold">Preview · Class {preview.input.className}-{preview.input.section}</h3>
                    <p className="text-xs text-muted-foreground">{preview.input.academicYear} · {getTimetableType(preview.input.kind)?.label}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setTab('wizard')}>Back</Button>
                    <Button onClick={handleSaveDraft}>Save as Draft</Button>
                  </div>
                </div>
                {preview.conflicts.length > 0 ? (
                  <div className="rounded-md bg-amber-50 border border-amber-200 p-3 text-xs space-y-1">
                    <p className="font-medium text-amber-900 flex items-center gap-1"><AlertTriangle className="h-3 w-3" />{preview.conflicts.length} scheduling issue(s)</p>
                    {preview.conflicts.map((c, i) => <p key={i} className="text-amber-800">• {c.message}</p>)}
                  </div>
                ) : (
                  <p className="text-xs text-emerald-700 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />No conflicts detected.</p>
                )}
              </CardContent></Card>
              <Card><CardContent className="p-4">
                <TimetableGrid timetable={{
                  id: 'preview', kind: preview.input.kind, status: 'draft', version: 0,
                  academicYear: preview.input.academicYear, className: preview.input.className, section: preview.input.section,
                  workingDays: preview.input.workingDays, startTime: preview.input.startTime, endTime: preview.input.endTime,
                  periodDuration: preview.input.periodDuration, breakDuration: preview.input.breakDuration, breakCount: preview.input.breakCount,
                  periods: preview.periods, createdAt: '', updatedAt: '',
                }} teacherNames={teacherNames} />
              </CardContent></Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="compare"><TimetableCompare defaultAId={selectedId ?? undefined} /></TabsContent>
        <TabsContent value="rooms"><RoomView /></TabsContent>
        <TabsContent value="teachers">
          <Card><CardContent className="p-3">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs text-muted-foreground">Teacher:</span>
              <Select value={teacherId} onValueChange={setTeacherId}>
                <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
                <SelectContent>{teachers.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <TeacherView teacherId={teacherId} teacherName={teachers.find((t: any) => t.id === teacherId)?.name} />
          </CardContent></Card>
        </TabsContent>
        <TabsContent value="month"><MonthlyCalendar className={selected?.className} section={selected?.section} /></TabsContent>
        <TabsContent value="analytics"><AnalyticsPanel /></TabsContent>
        <TabsContent value="bulk"><BulkOpsPanel onDone={refresh} /></TabsContent>

        <TabsContent value="holidays">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <Card><CardContent className="p-3 space-y-2">
              <h3 className="font-semibold text-sm">Add Holiday / Event</h3>
              <Input type="date" value={holDate} onChange={e => setHolDate(e.target.value)} />
              <Input placeholder="Name" value={holName} onChange={e => setHolName(e.target.value)} />
              <Button size="sm" onClick={() => {
                if (!holDate || !holName) { toast.error('Date and name required'); return; }
                addHoliday({ date: holDate, name: holName, kind: 'holiday' });
                setHolName(''); setHolDate(''); setHolTick(x => x + 1);
                toast.success('Holiday added');
              }}><Plus className="h-3 w-3 mr-1" />Add</Button>
            </CardContent></Card>
            <Card><CardContent className="p-3 space-y-1 max-h-96 overflow-y-auto">
              <h3 className="font-semibold text-sm mb-1">Calendar</h3>
              {holidays.length === 0 && <p className="text-xs text-muted-foreground">No holidays configured.</p>}
              {holidays.map(h => (
                <div key={h.id} className="flex items-center justify-between border rounded p-2 text-xs">
                  <span>{h.date} · {h.name} <Badge variant="secondary" className="ml-1 text-[9px]">{h.kind}</Badge></span>
                  <Button size="sm" variant="ghost" onClick={() => { removeHoliday(h.id); setHolTick(x => x + 1); }}><Trash2 className="h-3 w-3" /></Button>
                </div>
              ))}
            </CardContent></Card>
          </div>
        </TabsContent>
      </Tabs>

      {subFor && selectedId && (
        <SubstituteDialog open={!!subFor} onOpenChange={(v) => !v && setSubFor(null)}
          timetableId={selectedId} period={subFor} onDone={refresh} />
      )}
      <ExtraClassDialog open={extraOpen} onOpenChange={setExtraOpen} />
    </div>
  );
}
