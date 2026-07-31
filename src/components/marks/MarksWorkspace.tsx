import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Save, Send, Check, X, Upload, Download, Lock, Unlock, History, AlertTriangle } from 'lucide-react';
import { MarksGrid } from './MarksGrid';
import { BulkImportDialog } from './BulkImportDialog';
import { MARKING_SCHEMES, componentsFromScheme } from '@/lib/marks/schemes';
import { ASSESSMENT_COMPONENTS, SHEET_STATUS_META, type MarksSheet, type MarksRow } from '@/lib/marks/types';
import { sheetTotals } from '@/lib/marks/calc';
import { canSaveDraft, canSubmit, validateSheet } from '@/lib/marks/validation';
import * as api from '@/lib/marks/api';
import { exportCSV } from '@/lib/export';
import { EmptyState } from '@/components/shared/EmptyState';
import { ClipboardList } from 'lucide-react';

interface Props {
  role: string | null;
  userId: string;
  userName: string;
  teacherId?: string;         // set for teachers → restricts selectors
  sheetId?: string;           // open a specific sheet directly
  onChanged?: () => void;
}

export function MarksWorkspace({ role, userId, userName, teacherId, sheetId, onChanged }: Props) {
  const { toast } = useToast();
  const isTeacher = role === 'teacher';
  const canModerate = role === 'admin' || role === 'principal';
  const canLock = role === 'admin' || role === 'principal';

  const exams = useMemo(() => api.visibleExams(role, teacherId), [role, teacherId]);
  const assignments = useMemo(
    () => (isTeacher && teacherId ? api.assignmentsForTeacher(teacherId) : api.listAssignments()),
    [isTeacher, teacherId],
  );

  const [examId, setExamId] = useState('');
  const [classId, setClassId] = useState('');
  const [section, setSection] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [schemeId, setSchemeId] = useState('split_80_20');
  const [sheet, setSheet] = useState<MarksSheet | null>(null);
  const [dirty, setDirty] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [decisionOpen, setDecisionOpen] = useState<'return' | 'reject' | null>(null);
  const [remarks, setRemarks] = useState('');

  const exam = exams.find(e => e.id === examId);

  const classChoices = useMemo(() => {
    if (!exam) return [];
    const pool = isTeacher ? Array.from(new Set(assignments.map(a => a.classId))) : exam.classes;
    return exam.classes.filter(c => pool.includes(c));
  }, [exam, assignments, isTeacher]);

  const sectionChoices = useMemo(() => {
    if (!exam || !classId) return [];
    const pool = isTeacher
      ? Array.from(new Set(assignments.filter(a => a.classId === classId).map(a => a.section)))
      : exam.sections;
    return exam.sections.filter(s => pool.includes(s));
  }, [exam, classId, assignments, isTeacher]);

  const subjectChoices = useMemo(() => {
    if (!exam) return [];
    const names = exam.subjects.map(s => s.name);
    if (!isTeacher) return names;
    const mine = assignments.filter(a => a.classId === classId && a.section === section).map(a => a.subjectName);
    return names.filter(n => mine.includes(n));
  }, [exam, assignments, classId, section, isTeacher]);

  // Load a specific sheet by id (from list drill-in)
  useEffect(() => {
    if (!sheetId) return;
    const s = api.getSheet(sheetId);
    if (s) {
      setSheet(s); setExamId(s.examId); setClassId(s.classId);
      setSection(s.section); setSubjectName(s.subjectName); setSchemeId(s.schemeId); setDirty(false);
    }
  }, [sheetId]);

  useEffect(() => { if (!examId && exams.length) setExamId(exams[0].id); }, [exams, examId]);
  useEffect(() => { if (classChoices.length && !classChoices.includes(classId)) setClassId(classChoices[0]); }, [classChoices, classId]);
  useEffect(() => { if (sectionChoices.length && !sectionChoices.includes(section)) setSection(sectionChoices[0]); }, [sectionChoices, section]);
  useEffect(() => { if (subjectChoices.length && !subjectChoices.includes(subjectName)) setSubjectName(subjectChoices[0]); }, [subjectChoices, subjectName]);

  const load = () => {
    if (!exam || !classId || !section || !subjectName) return;
    const s = api.ensureSheet({
      exam, classId, section, subjectName, schemeId,
      teacherId: teacherId ?? userId, teacherName: userName,
    });
    setSheet(s); setSchemeId(s.schemeId); setDirty(false);
  };

  useEffect(() => {
    if (sheetId) return;
    if (exam && classId && section && subjectName) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examId, classId, section, subjectName]);

  const validation = sheet ? validateSheet(sheet) : null;
  const totals = sheet ? sheetTotals(sheet) : null;
  const editable = !!sheet && !sheet.locked &&
    (['draft', 'returned'].includes(sheet.status) ? (isTeacher || canModerate) : canModerate && sheet.status !== 'published');

  const update = (rows: MarksRow[]) => { if (sheet) { setSheet({ ...sheet, rows }); setDirty(true); } };

  const applyScheme = (id: string) => {
    setSchemeId(id);
    if (sheet) { setSheet({ ...sheet, schemeId: id, components: componentsFromScheme(id) }); setDirty(true); }
  };

  const toggleComponent = (compId: string) => {
    if (!sheet) return;
    const exists = sheet.components.find(c => c.id === compId);
    const meta = ASSESSMENT_COMPONENTS.find(c => c.id === compId)!;
    const components = exists
      ? sheet.components.map(c => (c.id === compId ? { ...c, enabled: !c.enabled } : c))
      : [...sheet.components, { id: meta.id, label: meta.label, max: 20, required: false, decimals: 0, enabled: true }];
    setSheet({ ...sheet, components, schemeId: 'custom' });
    setDirty(true);
  };

  const setComponentMax = (compId: string, max: number) => {
    if (!sheet) return;
    setSheet({ ...sheet, components: sheet.components.map(c => (c.id === compId ? { ...c, max } : c)), schemeId: 'custom' });
    setDirty(true);
  };

  const refresh = (s: MarksSheet) => { setSheet(s); setDirty(false); onChanged?.(); };

  const doSave = () => {
    if (!sheet) return;
    const check = canSaveDraft(sheet);
    if (!check.ok) { toast({ title: 'Cannot save', description: check.reason, variant: 'destructive' }); return; }
    refresh(api.saveDraft(sheet));
    toast({ title: 'Draft saved', description: 'Marks stored with full history.' });
  };

  const doSubmit = () => {
    if (!sheet) return;
    const check = canSubmit(sheet);
    if (!check.ok) { toast({ title: 'Fix validation errors', description: check.reason, variant: 'destructive' }); return; }
    const saved = api.saveDraft(sheet);
    refresh(api.submitSheet(saved));
    toast({ title: 'Submitted for review', description: 'The principal has been notified.' });
  };

  const doApprove = () => { if (sheet) { refresh(api.approveSheet(sheet)); toast({ title: 'Marks approved' }); } };
  const doPublish = () => { if (sheet) { refresh(api.publishSheet(sheet)); toast({ title: 'Marks published', description: 'Sheet is now read-only.' }); } };
  const doDecision = () => {
    if (!sheet || !remarks.trim()) return;
    refresh(decisionOpen === 'reject' ? api.rejectSheet(sheet, remarks) : api.returnSheet(sheet, remarks));
    toast({ title: decisionOpen === 'reject' ? 'Marks rejected' : 'Returned for correction' });
    setRemarks(''); setDecisionOpen(null);
  };
  const doLock = (locked: boolean) => { if (sheet) { refresh(api.setLocked(sheet, locked)); toast({ title: locked ? 'Marks locked' : 'Marks unlocked' }); } };

  const doExport = () => {
    if (!sheet) return;
    const active = sheet.components.filter(c => c.enabled);
    exportCSV(`marks-${sheet.examName}-${sheet.classId}${sheet.section}-${sheet.subjectName}`, sheet.rows, [
      { key: 'roll', label: 'Roll No' },
      { key: 'name', label: 'Student' },
      { key: 'admissionNo', label: 'Admission No' },
      { key: 'status', label: 'Status' },
      ...active.map(c => ({ key: c.id, label: `${c.label} (${c.max})`, get: (r: MarksRow) => r.marks?.[c.id] ?? '' })),
      { key: 'remarks', label: 'Remarks' },
    ]);
  };

  if (!exams.length) {
    return <EmptyState icon={ClipboardList} title="No published exams" description="Marks entry unlocks once an exam is published in Exam Master." />;
  }

  const statusMeta = sheet ? SHEET_STATUS_META[sheet.status] : null;

  return (
    <div className="space-y-3">
      <Card><CardContent className="p-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        <Field label="Examination">
          <Select value={examId} onValueChange={setExamId}>
            <SelectTrigger className="h-9"><SelectValue placeholder="Select exam" /></SelectTrigger>
            <SelectContent>{exams.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Class">
          <Select value={classId} onValueChange={setClassId}>
            <SelectTrigger className="h-9"><SelectValue placeholder="Class" /></SelectTrigger>
            <SelectContent>{classChoices.map(c => <SelectItem key={c} value={c}>Class {c}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Section">
          <Select value={section} onValueChange={setSection}>
            <SelectTrigger className="h-9"><SelectValue placeholder="Section" /></SelectTrigger>
            <SelectContent>{sectionChoices.map(s => <SelectItem key={s} value={s}>Section {s}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Subject">
          <Select value={subjectName} onValueChange={setSubjectName}>
            <SelectTrigger className="h-9"><SelectValue placeholder="Subject" /></SelectTrigger>
            <SelectContent>{subjectChoices.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Marking Scheme">
          <Select value={schemeId} onValueChange={applyScheme} disabled={!editable}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>{MARKING_SCHEMES.map(s => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
      </CardContent></Card>

      {!sheet && <EmptyState icon={ClipboardList} title="Pick a class & subject" description="Select an examination, class, section and subject to load the marks sheet." />}

      {sheet && (
        <>
          <Card><CardContent className="p-3 flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={statusMeta!.color}>{statusMeta!.label}</Badge>
            {sheet.locked && <Badge variant="outline" className="bg-slate-100 text-slate-700"><Lock className="h-3 w-3 mr-1" />Locked</Badge>}
            <span className="text-xs text-muted-foreground">
              {totals!.entered}/{totals!.students} entered · {totals!.completion}% complete · avg {totals!.average}/{totals!.outOf} · high {totals!.highest} · low {totals!.lowest}
            </span>
            {validation!.errorCount > 0 && (
              <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200">
                <AlertTriangle className="h-3 w-3 mr-1" />{validation!.errorCount} issue(s)
              </Badge>
            )}
            <div className="ml-auto flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => setHistoryOpen(true)}><History className="h-4 w-4 mr-1" />History</Button>
              <Button size="sm" variant="outline" onClick={doExport}><Download className="h-4 w-4 mr-1" />Export</Button>
              {editable && <Button size="sm" variant="outline" onClick={() => setImportOpen(true)}><Upload className="h-4 w-4 mr-1" />Import</Button>}
              {editable && <Button size="sm" onClick={doSave} disabled={!dirty}><Save className="h-4 w-4 mr-1" />Save Draft</Button>}
              {editable && ['draft', 'returned'].includes(sheet.status) && (
                <Button size="sm" onClick={doSubmit}><Send className="h-4 w-4 mr-1" />Submit</Button>
              )}
              {canModerate && sheet.status === 'submitted' && (
                <>
                  <Button size="sm" onClick={doApprove}><Check className="h-4 w-4 mr-1" />Approve</Button>
                  <Button size="sm" variant="outline" onClick={() => setDecisionOpen('return')}>Return</Button>
                  <Button size="sm" variant="destructive" onClick={() => setDecisionOpen('reject')}><X className="h-4 w-4 mr-1" />Reject</Button>
                </>
              )}
              {canModerate && sheet.status === 'approved' && (
                <Button size="sm" onClick={doPublish}><Check className="h-4 w-4 mr-1" />Publish</Button>
              )}
              {canLock && (
                <Button size="sm" variant="outline" onClick={() => doLock(!sheet.locked)}>
                  {sheet.locked ? <><Unlock className="h-4 w-4 mr-1" />Unlock</> : <><Lock className="h-4 w-4 mr-1" />Lock</>}
                </Button>
              )}
            </div>
          </CardContent></Card>

          {sheet.reviewerRemarks && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              <strong>Reviewer remarks{sheet.reviewedBy ? ` — ${sheet.reviewedBy}` : ''}:</strong> {sheet.reviewerRemarks}
            </div>
          )}

          {canModerate && editable && (
            <Card><CardContent className="p-3 space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Assessment components for this sheet</p>
              <div className="flex flex-wrap gap-2">
                {ASSESSMENT_COMPONENTS.map(meta => {
                  const c = sheet.components.find(x => x.id === meta.id);
                  const on = !!c?.enabled;
                  return (
                    <div key={meta.id} className="flex items-center gap-1 rounded-md border px-2 py-1">
                      <button type="button" onClick={() => toggleComponent(meta.id)} className={`text-xs font-medium ${on ? 'text-primary' : 'text-muted-foreground'}`}>
                        {on ? '✓ ' : '+ '}{meta.label}
                      </button>
                      {on && (
                        <input
                          type="number" min={1} value={c!.max}
                          onChange={e => setComponentMax(meta.id, Number(e.target.value))}
                          className="w-14 h-6 text-xs text-center rounded border bg-background"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent></Card>
          )}

          <MarksGrid sheet={sheet} readOnly={!editable} onChange={update} />

          <BulkImportDialog
            open={importOpen} onOpenChange={setImportOpen} sheet={sheet}
            onApply={(rows, summary) => { update(rows); toast({ title: 'Import applied', description: summary }); }}
          />

          <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>Marks History</DialogTitle></DialogHeader>
              <div className="max-h-[60vh] overflow-y-auto space-y-2">
                {api.listHistory(sheet.id).map(h => (
                  <div key={h.id} className="rounded border p-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{h.action}</span>
                      <span className="text-muted-foreground">{new Date(h.ts).toLocaleString()}</span>
                    </div>
                    <p className="text-muted-foreground">{h.userName} · status {h.status}{h.reason ? ` · ${h.reason}` : ''}</p>
                    {h.before && h.after && (
                      <p className="mt-1 font-mono text-[11px]">
                        {JSON.stringify(h.before)} → {JSON.stringify(h.after)}
                      </p>
                    )}
                  </div>
                ))}
                {!api.listHistory(sheet.id).length && <p className="text-sm text-muted-foreground">No history yet.</p>}
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={!!decisionOpen} onOpenChange={v => !v && setDecisionOpen(null)}>
            <DialogContent>
              <DialogHeader><DialogTitle>{decisionOpen === 'reject' ? 'Reject marks' : 'Return for correction'}</DialogTitle></DialogHeader>
              <Textarea rows={4} value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Remarks for the teacher…" />
              <DialogFooter>
                <Button variant="outline" onClick={() => setDecisionOpen(null)}>Cancel</Button>
                <Button onClick={doDecision} disabled={!remarks.trim()}>Confirm</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="text-[11px] text-muted-foreground">{label}</label>{children}</div>;
}
