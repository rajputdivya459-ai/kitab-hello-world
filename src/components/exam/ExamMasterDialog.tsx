import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus } from 'lucide-react';
import { uid } from '@/mock/db';
import { EXAM_TYPES, type ExamMaster, type ExamSubject, type ExamTypeId, type SubjectCategory, nextExamCode, workingDayCount } from '@/lib/exam/master';

const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'] as const;
const CLASSES = ['1','2','3','4','5','6','7','8','9','10'];
const SECTIONS = ['A','B','C','D'];
const CATEGORIES: SubjectCategory[] = ['mandatory','optional','elective','practical'];

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  exam?: ExamMaster | null;
  coordinators: Array<{ id: string; name: string }>;
  onSave: (draft: any) => void;
}

const blank = (): any => ({
  name: '', type: 'unit_test' as ExamTypeId, academicYear: '2026-27', description: '',
  startDate: new Date().toISOString().slice(0, 10),
  endDate: new Date(Date.now() + 6 * 86400_000).toISOString().slice(0, 10),
  workingDays: ['Mon','Tue','Wed','Thu','Fri','Sat'], holidays: [],
  classes: [], sections: [], wholeSchool: false, subjects: [], instructions: {},
  visible: false, status: 'draft',
});

export function ExamMasterDialog({ open, onOpenChange, exam, coordinators, onSave }: Props) {
  const [d, setD] = useState<any>(blank());
  useEffect(() => { if (open) setD(exam ? { ...exam } : blank()); }, [open, exam]);
  const set = (patch: any) => setD((p: any) => ({ ...p, ...patch }));

  const toggle = (key: 'classes' | 'sections' | 'workingDays', v: string) =>
    set({ [key]: d[key]?.includes(v) ? d[key].filter((x: string) => x !== v) : [...(d[key] ?? []), v] });

  const addSubject = () => set({
    subjects: [...(d.subjects ?? []), { id: uid('sub'), name: '', code: '', maxMarks: 100, passingMarks: 35, duration: 180, isPractical: false, category: 'mandatory' } as ExamSubject],
  });
  const patchSubject = (id: string, patch: Partial<ExamSubject>) =>
    set({ subjects: d.subjects.map((s: ExamSubject) => (s.id === id ? { ...s, ...patch } : s)) });
  const removeSubject = (id: string) => set({ subjects: d.subjects.filter((s: ExamSubject) => s.id !== id) });

  const ins = d.instructions ?? {};
  const setIns = (patch: any) => set({ instructions: { ...ins, ...patch } });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{exam ? `Edit — ${exam.name}` : 'Create Examination'}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="mapping">Class & Section</TabsTrigger>
            <TabsTrigger value="subjects">Subjects</TabsTrigger>
            <TabsTrigger value="instructions">Instructions</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-3 pt-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div><Label>Exam Name</Label><Input value={d.name} onChange={e => set({ name: e.target.value })} placeholder="Quarterly Examination" /></div>
              <div>
                <Label>Examination Type</Label>
                <Select value={d.type} onValueChange={(v) => set({ type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{EXAM_TYPES.map(t => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Academic Year</Label><Input value={d.academicYear} onChange={e => set({ academicYear: e.target.value })} /></div>
              <div>
                <Label>Exam Code</Label>
                <Input value={d.code ?? nextExamCode(d.type, d.academicYear)} readOnly className="bg-muted/50" />
              </div>
              <div><Label>Start Date</Label><Input type="date" value={d.startDate} onChange={e => set({ startDate: e.target.value })} /></div>
              <div><Label>End Date</Label><Input type="date" value={d.endDate} onChange={e => set({ endDate: e.target.value })} /></div>
              <div>
                <Label>Exam Coordinator</Label>
                <Select value={d.coordinatorId ?? ''} onValueChange={(v) => set({ coordinatorId: v, coordinatorName: coordinators.find(c => c.id === v)?.name })}>
                  <SelectTrigger><SelectValue placeholder="Select coordinator" /></SelectTrigger>
                  <SelectContent>{coordinators.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="flex items-end gap-2">
                <div className="flex items-center gap-2 h-9">
                  <Switch checked={!!d.visible} onCheckedChange={(v) => set({ visible: v })} id="vis" />
                  <Label htmlFor="vis">Visible to portals</Label>
                </div>
              </div>
            </div>
            <div>
              <Label>Working Days</Label>
              <div className="flex flex-wrap gap-2 pt-1">
                {DAYS.map(day => (
                  <Badge key={day} variant={d.workingDays?.includes(day) ? 'default' : 'outline'} className="cursor-pointer" onClick={() => toggle('workingDays', day)}>{day}</Badge>
                ))}
                <span className="text-xs text-muted-foreground self-center ml-2">
                  Total working days: {workingDayCount({ startDate: d.startDate, endDate: d.endDate, workingDays: d.workingDays ?? [], holidays: d.holidays ?? [] })}
                </span>
              </div>
            </div>
            <div><Label>Description</Label><Textarea rows={2} value={d.description ?? ''} onChange={e => set({ description: e.target.value })} /></div>
          </TabsContent>

          <TabsContent value="mapping" className="space-y-3 pt-3">
            <div className="flex items-center gap-2">
              <Switch id="ws" checked={!!d.wholeSchool} onCheckedChange={(v) => set({ wholeSchool: v })} />
              <Label htmlFor="ws">Entire School</Label>
            </div>
            <div>
              <Label>Classes</Label>
              <div className="flex flex-wrap gap-2 pt-1">
                {CLASSES.map(c => <Badge key={c} variant={d.classes?.includes(c) ? 'default' : 'outline'} className="cursor-pointer" onClick={() => toggle('classes', c)}>Class {c}</Badge>)}
              </div>
            </div>
            <div>
              <Label>Sections</Label>
              <div className="flex flex-wrap gap-2 pt-1">
                {SECTIONS.map(s => <Badge key={s} variant={d.sections?.includes(s) ? 'default' : 'outline'} className="cursor-pointer" onClick={() => toggle('sections', s)}>{s}</Badge>)}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="subjects" className="space-y-3 pt-3">
            <div className="space-y-2">
              {(d.subjects ?? []).map((s: ExamSubject) => (
                <div key={s.id} className="grid gap-2 sm:grid-cols-12 items-end rounded-lg border p-2">
                  <div className="sm:col-span-3"><Label className="text-xs">Subject</Label><Input value={s.name} onChange={e => patchSubject(s.id, { name: e.target.value })} /></div>
                  <div className="sm:col-span-2"><Label className="text-xs">Code</Label><Input value={s.code} onChange={e => patchSubject(s.id, { code: e.target.value })} /></div>
                  <div className="sm:col-span-1"><Label className="text-xs">Max</Label><Input type="number" value={s.maxMarks} onChange={e => patchSubject(s.id, { maxMarks: +e.target.value })} /></div>
                  <div className="sm:col-span-1"><Label className="text-xs">Pass</Label><Input type="number" value={s.passingMarks} onChange={e => patchSubject(s.id, { passingMarks: +e.target.value })} /></div>
                  <div className="sm:col-span-1"><Label className="text-xs">Mins</Label><Input type="number" value={s.duration} onChange={e => patchSubject(s.id, { duration: +e.target.value })} /></div>
                  <div className="sm:col-span-2">
                    <Label className="text-xs">Category</Label>
                    <Select value={s.category} onValueChange={(v) => patchSubject(s.id, { category: v as SubjectCategory, isPractical: v === 'practical' })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="sm:col-span-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1 text-xs">
                      <Switch checked={s.isPractical} onCheckedChange={(v) => patchSubject(s.id, { isPractical: v })} />Practical
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => removeSubject(s.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={addSubject}><Plus className="h-4 w-4 mr-1" />Add Subject</Button>
          </TabsContent>

          <TabsContent value="instructions" className="space-y-3 pt-3">
            <div><Label>General Instructions</Label><Textarea rows={4} value={ins.general ?? ''} onChange={e => setIns({ general: e.target.value })} placeholder="One instruction per line…" /></div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div><Label>Allowed Materials</Label><Input value={ins.allowedMaterials ?? ''} onChange={e => setIns({ allowedMaterials: e.target.value })} /></div>
              <div><Label>Reporting Time</Label><Input type="time" value={ins.reportingTime ?? '08:30'} onChange={e => setIns({ reportingTime: e.target.value })} /></div>
              <div><Label>Uniform Requirements</Label><Input value={ins.uniform ?? ''} onChange={e => setIns({ uniform: e.target.value })} /></div>
              <div><Label>Calculator Rules</Label><Input value={ins.calculator ?? ''} onChange={e => setIns({ calculator: e.target.value })} /></div>
              <div><Label>Mobile Phone Policy</Label><Input value={ins.mobilePolicy ?? ''} onChange={e => setIns({ mobilePolicy: e.target.value })} /></div>
              <div><Label>Attendance Rules</Label><Input value={ins.attendanceRules ?? ''} onChange={e => setIns({ attendanceRules: e.target.value })} /></div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => { onSave(d); onOpenChange(false); }} disabled={!d.name?.trim()}>Save Exam</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
