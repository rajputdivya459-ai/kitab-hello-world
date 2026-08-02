import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { Send, CheckCheck, Upload, Archive, Undo2, X } from 'lucide-react';
import * as api from '@/lib/results/api';
import * as bulk from '@/lib/results/bulk';
import { validateSet } from '@/lib/results/validation';
import { ResultTable } from './ResultTable';
import { ReportCardDoc } from './ReportCardDoc';
import { ValidationPanel } from './ValidationPanel';
import { ResultHistoryPanel } from './ResultHistoryPanel';
import { StatusBadge } from './ResultSetList';
import { REPORT_TEMPLATES, type ResultSet, type StudentResult } from '@/lib/results/types';

interface Props {
  set: ResultSet;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onChanged: () => void;
  canApprove?: boolean;
  canPublish?: boolean;
  canRemark?: boolean;
  readOnly?: boolean;
}

export function ResultSetDetail({ set, open, onOpenChange, onChanged, canApprove, canPublish, canRemark, readOnly }: Props) {
  const [card, setCard] = useState<StudentResult | null>(null);
  const [tpl, setTpl] = useState(set.templateId);
  const locked = set.status === 'published' || set.status === 'archived';
  const report = validateSet(set);

  const act = (label: string, fn: () => void) => { fn(); toast({ title: label }); onChanged(); };

  const publish = () => {
    const r = bulk.bulkPublish([set.id]);
    toast({
      title: r.ok.length ? 'Result published' : 'Publication blocked',
      description: r.skipped[0]?.reason,
      variant: r.ok.length ? 'default' : 'destructive',
    });
    onChanged();
  };

  const saveRemark = (studentId: string, patch: { teacherRemarks?: string; principalRemarks?: string }) => {
    api.setRemarks(set.id, studentId, patch);
    onChanged();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2">
            {set.examName} · Class {set.classId}-{set.section}
            <StatusBadge status={set.status} />
            <span className="text-xs font-normal text-muted-foreground">{set.students.length} students · {set.subjects.length} subjects</span>
          </DialogTitle>
        </DialogHeader>

        {!readOnly && (
          <div className="flex flex-wrap gap-2">
            {set.status === 'draft' && <Button size="sm" onClick={() => act('Submitted for approval', () => api.submitSet(set.id))}><Send className="h-3.5 w-3.5 mr-1" />Submit</Button>}
            {set.status === 'submitted' && canApprove && <>
              <Button size="sm" onClick={() => act('Result approved', () => api.approveSet(set.id, 'Approved'))}><CheckCheck className="h-3.5 w-3.5 mr-1" />Approve</Button>
              <Button size="sm" variant="outline" onClick={() => act('Returned to draft', () => api.rejectSet(set.id, 'Returned for correction'))}><X className="h-3.5 w-3.5 mr-1" />Return</Button>
            </>}
            {set.status === 'approved' && canPublish && <Button size="sm" onClick={publish}><Upload className="h-3.5 w-3.5 mr-1" />Publish{report.canPublish ? '' : ` (${report.errors} errors)`}</Button>}
            {set.status === 'published' && canPublish && <>
              <Button size="sm" variant="outline" onClick={publish}><Upload className="h-3.5 w-3.5 mr-1" />Republish</Button>
              <Button size="sm" variant="ghost" onClick={() => act('Rolled back to draft', () => bulk.bulkRollback([set.id]))}><Undo2 className="h-3.5 w-3.5 mr-1" />Rollback</Button>
            </>}
            {set.status !== 'archived' && canPublish && <Button size="sm" variant="ghost" onClick={() => act('Archived', () => api.archiveSet(set.id))}><Archive className="h-3.5 w-3.5 mr-1" />Archive</Button>}
            <div className="ml-auto flex items-center gap-2">
              <Select value={tpl} onValueChange={v => { setTpl(v as typeof tpl); api.setTemplate(set.id, v as typeof tpl); onChanged(); }}>
                <SelectTrigger className="h-9 w-[190px]"><SelectValue /></SelectTrigger>
                <SelectContent>{REPORT_TEMPLATES.map(t => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
        )}

        <Tabs defaultValue="students">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="remarks">Remarks</TabsTrigger>
            <TabsTrigger value="validation">Validation</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="students" className="mt-3">
            <ResultTable set={set} showRemarks onOpenReportCard={s => setCard(s)} />
          </TabsContent>

          <TabsContent value="remarks" className="mt-3">
            <div className="rounded-lg border bg-card overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead>Student</TableHead><TableHead>Teacher Remarks</TableHead><TableHead>Principal Remarks</TableHead></TableRow></TableHeader>
                <TableBody>
                  {set.students.map(s => (
                    <TableRow key={s.studentId}>
                      <TableCell className="whitespace-nowrap"><p className="font-medium text-sm">{s.name}</p><p className="text-[11px] text-muted-foreground">{s.roll} · {s.grade}</p></TableCell>
                      <TableCell>
                        <Input defaultValue={s.teacherRemarks ?? ''} disabled={locked || !canRemark} className="h-9"
                          onBlur={e => e.target.value !== (s.teacherRemarks ?? '') && saveRemark(s.studentId, { teacherRemarks: e.target.value })} />
                      </TableCell>
                      <TableCell>
                        <Input defaultValue={s.principalRemarks ?? ''} disabled={locked || !canApprove} className="h-9"
                          onBlur={e => e.target.value !== (s.principalRemarks ?? '') && saveRemark(s.studentId, { principalRemarks: e.target.value })} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {locked && <p className="text-xs text-muted-foreground mt-2">Published results are locked — roll back to draft to edit remarks.</p>}
          </TabsContent>

          <TabsContent value="validation" className="mt-3"><ValidationPanel reports={[report]} /></TabsContent>
          <TabsContent value="history" className="mt-3"><ResultHistoryPanel recordId={set.id} /></TabsContent>
        </Tabs>

        <Dialog open={!!card} onOpenChange={o => !o && setCard(null)}>
          <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Report Card</DialogTitle></DialogHeader>
            {card && <ReportCardDoc set={set} student={card} templateId={tpl} />}
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}
