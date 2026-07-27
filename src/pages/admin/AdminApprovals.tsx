import { useEffect, useMemo, useState } from 'react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Inbox, CheckCircle2, XCircle, Clock, FileText, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { listWorkflows, decide, type WorkflowRecord, type WorkflowStatus } from '@/lib/workflow';
import { formatDistanceToNow } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmptyState } from '@/components/shared/EmptyState';
import { notify } from '@/lib/notify';
import { applyApprovedWorkflow } from '@/lib/workflowApply';

const STATUS_TABS: WorkflowStatus[] = ['pending', 'approved', 'rejected', 'draft', 'published'];
const MODULES = ['all', 'finance.fee', 'finance.expense', 'finance.salary', 'student.change', 'staff.change', 'result', 'homework', 'leave', 'other'];

export default function AdminApprovals() {
  const [rows, setRows] = useState<WorkflowRecord[]>([]);
  const [tab, setTab] = useState<WorkflowStatus>('pending');
  const [module, setModule] = useState('all');
  const [decideItem, setDecideItem] = useState<{ w: WorkflowRecord; kind: 'approved' | 'rejected' } | null>(null);
  const [remarks, setRemarks] = useState('');

  const load = () => setRows(listWorkflows());
  useEffect(load, []);

  const filtered = useMemo(() => rows.filter(r =>
    r.status === tab && (module === 'all' || r.module === module)
  ), [rows, tab, module]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    STATUS_TABS.forEach(s => c[s] = rows.filter(r => r.status === s).length);
    return c;
  }, [rows]);

  const submit = () => {
    if (!decideItem) return;
    const updated = decide(decideItem.w.id, decideItem.kind, remarks);
    let summary = '';
    if (updated && decideItem.kind === 'approved') {
      summary = applyApprovedWorkflow(updated);
    }
    notify({
      title: `Request ${decideItem.kind}`,
      message: `${decideItem.w.title} was ${decideItem.kind}${remarks ? ' · ' + remarks : ''}${summary ? ' · ' + summary : ''}`,
      category: 'general',
    }).catch(() => {});
    toast.success(`Request ${decideItem.kind}${summary ? ' — ' + summary : ''}`);
    setDecideItem(null); setRemarks(''); load();
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Inbox className="h-6 w-6 text-primary" /> Approval Center</h1>
            <p className="text-sm text-muted-foreground">Review and act on pending workflow requests across the ERP.</p>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={module} onValueChange={setModule}>
              <SelectTrigger className="w-52 h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                {MODULES.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {STATUS_TABS.map(s => (
            <Card key={s} className="p-3 flex items-center gap-3">
              {s === 'pending' && <Clock className="h-5 w-5 text-amber-500" />}
              {s === 'approved' && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
              {s === 'rejected' && <XCircle className="h-5 w-5 text-rose-500" />}
              {s === 'draft' && <FileText className="h-5 w-5 text-slate-500" />}
              {s === 'published' && <CheckCircle2 className="h-5 w-5 text-blue-500" />}
              <div>
                <p className="text-xs text-muted-foreground capitalize">{s}</p>
                <p className="text-lg font-bold">{counts[s] ?? 0}</p>
              </div>
            </Card>
          ))}
        </div>

        <Tabs value={tab} onValueChange={v => setTab(v as WorkflowStatus)}>
          <TabsList>
            {STATUS_TABS.map(s => <TabsTrigger key={s} value={s} className="capitalize">{s}</TabsTrigger>)}
          </TabsList>
          {STATUS_TABS.map(s => (
            <TabsContent key={s} value={s} className="mt-4 space-y-3">
              {filtered.length === 0 ? (
                <EmptyState icon={Inbox} title={`No ${s} requests`} description="Requests will show up here as users submit them." />
              ) : filtered.map(w => (
                <Card key={w.id} className="p-4">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold">{w.title}</p>
                        <Badge variant="outline" className="text-[10px]">{w.module}</Badge>
                        <Badge className="text-[10px] capitalize">{w.status}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Submitted {w.submittedAt ? formatDistanceToNow(new Date(w.submittedAt), { addSuffix: true }) : '—'}
                        {' · '}by {w.submittedBy ?? w.createdBy}
                      </p>
                      {w.remarks && <p className="text-xs mt-1"><span className="font-medium">Remarks:</span> {w.remarks}</p>}
                      {(w.before || w.after) && (
                        <details className="mt-2 text-xs">
                          <summary className="cursor-pointer text-primary">View change diff</summary>
                          <div className="grid md:grid-cols-2 gap-2 mt-2">
                            <pre className="bg-muted p-2 rounded overflow-auto max-h-40">{JSON.stringify(w.before ?? {}, null, 2)}</pre>
                            <pre className="bg-muted p-2 rounded overflow-auto max-h-40">{JSON.stringify(w.after ?? {}, null, 2)}</pre>
                          </div>
                        </details>
                      )}
                    </div>
                    {w.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => { setDecideItem({ w, kind: 'rejected' }); setRemarks(''); }}>
                          <XCircle className="h-4 w-4 mr-1" />Reject
                        </Button>
                        <Button size="sm" onClick={() => { setDecideItem({ w, kind: 'approved' }); setRemarks(''); }}>
                          <CheckCircle2 className="h-4 w-4 mr-1" />Approve
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </TabsContent>
          ))}
        </Tabs>
      </div>

      <Dialog open={!!decideItem} onOpenChange={o => !o && setDecideItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="capitalize">{decideItem?.kind} request</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{decideItem?.w.title}</p>
            <Textarea placeholder="Add remarks (optional)" value={remarks} onChange={e => setRemarks(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDecideItem(null)}>Cancel</Button>
            <Button onClick={submit}>Confirm {decideItem?.kind}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
