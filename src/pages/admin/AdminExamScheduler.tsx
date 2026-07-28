import { useEffect, useMemo, useState } from 'react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { AlertTriangle, CheckCircle2, Copy, Send, Trash2, Wand2, Archive, Printer, ShieldCheck, Users, Building2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { ExamGeneratorWizard } from '@/components/exam/ExamGeneratorWizard';
import { ExamScheduleView } from '@/components/exam/ExamScheduleView';
import {
  listSchedules, getSchedule, saveSchedule, duplicateSchedule, publishSchedule,
  archiveSchedule, deleteSchedule, submitForApproval, approveSchedule,
  updateSlot, swapSlots, listRooms, saveRoom, removeRoom, listInvigilators, saveInvigilators,
} from '@/lib/exam/api';
import { generateExamSchedule, validateExamSchedule } from '@/lib/exam/generator';
import { getTimetableType } from '@/lib/timetable/types';
import type { ExamSchedule, ExamGeneratorInput, ExamConflict, Room } from '@/lib/exam/types';

export default function AdminExamScheduler() {
  const [schedules, setSchedules] = useState<ExamSchedule[]>([]);
  const [rooms, setRooms] = useState(listRooms());
  const [invigilators, setInvigilators] = useState(listInvigilators());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<'dashboard' | 'wizard' | 'preview' | 'rooms'>('dashboard');
  const [preview, setPreview] = useState<{ input: ExamGeneratorInput; slots: any[]; conflicts: ExamConflict[] } | null>(null);

  const refresh = () => { setSchedules(listSchedules()); setRooms(listRooms()); setInvigilators(listInvigilators()); };
  useEffect(() => { refresh(); }, []);

  const selected = schedules.find(s => s.id === selectedId);
  const conflicts = selected ? validateExamSchedule(selected, rooms) : [];

  const invigilatorLoad = useMemo(() => {
    const load: Record<string, number> = {};
    schedules.filter(s => s.status === 'published').forEach(s => s.slots.forEach(sl => sl.invigilatorIds.forEach(i => { load[i] = (load[i] ?? 0) + 1; })));
    return load;
  }, [schedules]);

  const handleGenerated = (input: ExamGeneratorInput) => {
    const res = generateExamSchedule(input, rooms, invigilators);
    setPreview({ input, ...res });
    setTab('preview');
  };

  const handleSaveDraft = () => {
    if (!preview) return;
    const rec = saveSchedule({
      kind: preview.input.kind, status: 'draft',
      academicYear: preview.input.academicYear, title: preview.input.title,
      classes: preview.input.classes, sections: preview.input.sections, subjects: preview.input.subjects,
      startDate: preview.input.startDate, endDate: preview.input.endDate,
      examDuration: preview.input.examDuration, breakDuration: preview.input.breakDuration,
      dailyLimit: preview.input.dailyLimit, holidays: preview.input.holidays,
      workingDays: preview.input.workingDays, preferredStart: preview.input.preferredStart,
      roomIds: rooms.map(r => r.id), invigilatorIds: invigilators.map(i => i.id),
      slots: preview.slots,
    });
    toast.success('Draft saved');
    setPreview(null); setSelectedId(rec.id); setTab('dashboard'); refresh();
  };

  const handlePublish = (id: string) => {
    const rec = schedules.find(s => s.id === id)!;
    const c = validateExamSchedule(rec, rooms);
    const blockers = c.filter(x => x.kind === 'teacher_double_booked' || x.kind === 'room_double_booked' || x.kind === 'duplicate_subject');
    if (blockers.length && !confirm(`${blockers.length} conflict(s) exist. Publish anyway?`)) return;
    publishSchedule(id);
    toast.success('Published — students, parents & invigilators notified');
    refresh();
  };

  const upcoming = schedules.filter(s => s.status === 'published' && s.endDate >= new Date().toISOString().slice(0,10)).length;
  const drafts = schedules.filter(s => s.status === 'draft').length;
  const pending = schedules.filter(s => s.status === 'pending').length;

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-2xl font-bold">Examination Scheduler</h1>
            <p className="text-sm text-muted-foreground">Auto-generate, approve and publish exam timetables with invigilator planning.</p>
          </div>
          <Button onClick={() => { setPreview(null); setTab('wizard'); }}><Wand2 className="h-4 w-4 mr-2" />New Schedule</Button>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card><CardContent className="p-3"><p className="text-xs text-muted-foreground">Upcoming</p><p className="text-2xl font-bold">{upcoming}</p></CardContent></Card>
          <Card><CardContent className="p-3"><p className="text-xs text-muted-foreground">Drafts</p><p className="text-2xl font-bold">{drafts}</p></CardContent></Card>
          <Card><CardContent className="p-3"><p className="text-xs text-muted-foreground">Pending Approval</p><p className="text-2xl font-bold">{pending}</p></CardContent></Card>
          <Card><CardContent className="p-3"><p className="text-xs text-muted-foreground">Rooms · Invigilators</p><p className="text-2xl font-bold">{rooms.length} · {invigilators.length}</p></CardContent></Card>
        </div>

        <Tabs value={tab} onValueChange={(v: any) => setTab(v)}>
          <TabsList>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="wizard">Generator</TabsTrigger>
            <TabsTrigger value="preview" disabled={!preview}>Preview</TabsTrigger>
            <TabsTrigger value="rooms">Rooms & Invigilators</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-3">
            <div className="grid lg:grid-cols-3 gap-4">
              <Card className="lg:col-span-1">
                <CardHeader><CardTitle className="text-sm">All Schedules ({schedules.length})</CardTitle></CardHeader>
                <CardContent className="space-y-1 max-h-[70vh] overflow-y-auto">
                  {schedules.length === 0 && <p className="text-xs text-muted-foreground p-3 text-center">No schedules yet. Click "New Schedule".</p>}
                  {schedules.map(s => (
                    <button key={s.id} onClick={() => setSelectedId(s.id)}
                      className={`w-full text-left p-2 rounded-md border transition-colors ${selectedId === s.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/40'}`}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-sm truncate">{s.title}</span>
                        <Badge variant={s.status === 'published' ? 'default' : s.status === 'draft' ? 'secondary' : s.status === 'pending' ? 'outline' : 'outline'} className="text-[10px] shrink-0">{s.status}</Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground">{getTimetableType(s.kind)?.label ?? s.kind} · Classes {s.classes.join(',')} · {s.slots.length} exams</p>
                    </button>
                  ))}
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                {!selected ? (
                  <CardContent className="p-8 text-center text-sm text-muted-foreground">Select a schedule to inspect.</CardContent>
                ) : (
                  <>
                    <CardHeader className="flex flex-row items-start justify-between gap-2 flex-wrap">
                      <div>
                        <CardTitle className="text-base">{selected.title}</CardTitle>
                        <p className="text-xs text-muted-foreground">{getTimetableType(selected.kind)?.label} · v{selected.version} · {selected.startDate} → {selected.endDate}</p>
                      </div>
                      <div className="flex gap-1 flex-wrap">
                        {selected.status === 'draft' && <Button size="sm" variant="outline" onClick={() => { submitForApproval(selected.id); toast.success('Submitted for approval'); refresh(); }}><Send className="h-3 w-3 mr-1" />Submit</Button>}
                        {selected.status === 'pending' && <Button size="sm" onClick={() => { approveSchedule(selected.id); toast.success('Approved'); refresh(); }}><ShieldCheck className="h-3 w-3 mr-1" />Approve</Button>}
                        {(selected.status === 'approved' || selected.status === 'draft') && <Button size="sm" onClick={() => handlePublish(selected.id)}><Send className="h-3 w-3 mr-1" />Publish</Button>}
                        <Button size="sm" variant="outline" onClick={() => { duplicateSchedule(selected.id); toast.success('Duplicated'); refresh(); }}><Copy className="h-3 w-3 mr-1" />Duplicate</Button>
                        <Button size="sm" variant="outline" onClick={() => window.print()}><Printer className="h-3 w-3 mr-1" /></Button>
                        {selected.status !== 'archived' && <Button size="sm" variant="outline" onClick={() => { archiveSchedule(selected.id); refresh(); }}><Archive className="h-3 w-3 mr-1" /></Button>}
                        <Button size="sm" variant="ghost" onClick={() => { if (confirm('Delete this schedule?')) { deleteSchedule(selected.id); setSelectedId(null); refresh(); } }}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {conflicts.length > 0 ? (
                        <div className="rounded-md bg-destructive/10 border border-destructive/30 p-3 text-xs space-y-1">
                          <p className="font-medium text-destructive flex items-center gap-1"><AlertTriangle className="h-3 w-3" />{conflicts.length} conflict(s)</p>
                          {conflicts.slice(0, 6).map((c, i) => <p key={i} className="text-destructive/90">• {c.message}</p>)}
                        </div>
                      ) : (
                        <p className="text-xs text-emerald-700 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />No conflicts.</p>
                      )}
                      <ExamScheduleView
                        schedule={selected} rooms={rooms} invigilators={invigilators}
                        editable={selected.status !== 'archived'}
                        onUpdateSlot={(slotId, patch) => { updateSlot(selected.id, slotId, patch); refresh(); toast.success('Slot updated'); }}
                        onSwapSlots={(a, b) => { swapSlots(selected.id, a, b); refresh(); toast.success('Slots swapped'); }}
                      />
                    </CardContent>
                  </>
                )}
              </Card>
            </div>

            {/* Invigilator load summary */}
            <Card>
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Users className="h-4 w-4" />Invigilator Workload (published)</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {invigilators.map(i => (
                    <Badge key={i.id} variant="outline" className="text-xs">{i.name}: {invigilatorLoad[i.id] ?? 0}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="wizard">
            <ExamGeneratorWizard onGenerate={handleGenerated} />
          </TabsContent>

          <TabsContent value="preview">
            {preview && (
              <div className="space-y-4">
                <Card><CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <h3 className="font-semibold">{preview.input.title}</h3>
                      <p className="text-xs text-muted-foreground">{preview.slots.length} exam slots · {preview.input.startDate} → {preview.input.endDate}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setTab('wizard')}>Back</Button>
                      <Button onClick={handleSaveDraft}>Save as Draft</Button>
                    </div>
                  </div>
                  {preview.conflicts.length > 0 ? (
                    <div className="rounded-md bg-amber-50 border border-amber-200 p-3 text-xs space-y-1">
                      <p className="font-medium text-amber-900 flex items-center gap-1"><AlertTriangle className="h-3 w-3" />{preview.conflicts.length} issue(s) during generation</p>
                      {preview.conflicts.map((c, i) => <p key={i} className="text-amber-800">• {c.message}</p>)}
                    </div>
                  ) : (
                    <p className="text-xs text-emerald-700 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />Generated without conflicts.</p>
                  )}
                </CardContent></Card>
                <Card><CardContent className="p-4">
                  <ExamScheduleView
                    schedule={{
                      id: 'preview', kind: preview.input.kind, status: 'draft', version: 0,
                      academicYear: preview.input.academicYear, title: preview.input.title,
                      classes: preview.input.classes, sections: preview.input.sections, subjects: preview.input.subjects,
                      startDate: preview.input.startDate, endDate: preview.input.endDate,
                      examDuration: preview.input.examDuration, breakDuration: preview.input.breakDuration,
                      dailyLimit: preview.input.dailyLimit, holidays: preview.input.holidays,
                      workingDays: preview.input.workingDays, preferredStart: preview.input.preferredStart,
                      slots: preview.slots, createdAt: '', updatedAt: '',
                    }}
                    rooms={rooms} invigilators={invigilators}
                  />
                </CardContent></Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="rooms">
            <div className="grid md:grid-cols-2 gap-4">
              <RoomsPanel rooms={rooms} onChange={refresh} />
              <InvigilatorsPanel invigilators={invigilators} onChange={refresh} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}

function RoomsPanel({ rooms, onChange }: { rooms: Room[]; onChange: () => void }) {
  const [number, setNumber] = useState('');
  const [capacity, setCapacity] = useState(40);
  const add = () => {
    if (!number.trim()) return;
    saveRoom({ id: `rm_${Date.now()}`, number: number.trim(), capacity: Number(capacity), available: true });
    setNumber(''); onChange();
  };
  return (
    <Card>
      <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Building2 className="h-4 w-4" />Rooms ({rooms.length})</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        <div className="flex gap-2">
          <Input placeholder="Room #" value={number} onChange={e => setNumber(e.target.value)} />
          <Input type="number" placeholder="Capacity" value={capacity} onChange={e => setCapacity(Number(e.target.value))} className="w-28" />
          <Button onClick={add}><Plus className="h-4 w-4" /></Button>
        </div>
        <div className="space-y-1 max-h-[400px] overflow-y-auto">
          {rooms.map(r => (
            <div key={r.id} className="flex items-center justify-between p-2 border rounded-md text-sm">
              <span>Room {r.number} · cap {r.capacity}</span>
              <Button size="sm" variant="ghost" onClick={() => { removeRoom(r.id); onChange(); }}><Trash2 className="h-3 w-3" /></Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function InvigilatorsPanel({ invigilators, onChange }: { invigilators: any[]; onChange: () => void }) {
  const toggle = (id: string, available: boolean) => {
    saveInvigilators(invigilators.map(i => i.id === id ? { ...i, available } : i));
    onChange();
  };
  return (
    <Card>
      <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Users className="h-4 w-4" />Invigilators ({invigilators.length})</CardTitle></CardHeader>
      <CardContent className="space-y-1 max-h-[460px] overflow-y-auto">
        {invigilators.map(i => (
          <div key={i.id} className="flex items-center justify-between p-2 border rounded-md text-sm">
            <div>
              <p className="font-medium">{i.name}</p>
              <p className="text-[11px] text-muted-foreground capitalize">{i.role}</p>
            </div>
            <Button size="sm" variant={i.available === false ? 'outline' : 'default'} onClick={() => toggle(i.id, !(i.available !== false))}>
              {i.available === false ? 'Unavailable' : 'Available'}
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
