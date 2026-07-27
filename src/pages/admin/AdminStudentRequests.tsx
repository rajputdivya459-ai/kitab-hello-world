import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPen, Send, Save, ArrowRight, Inbox, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { submit, saveDraft, submitDraft, listWorkflows, type WorkflowRecord, type WorkflowStatus } from '@/lib/workflow';
import { getCollection } from '@/mock/db';
import { formatDistanceToNow } from 'date-fns';
import { EmptyState } from '@/components/shared/EmptyState';

const SENSITIVE_FIELDS: Array<{ key: string; label: string }> = [
  { key: 'name', label: 'Name' },
  { key: 'parentName', label: 'Parent Name' },
  { key: 'mobile', label: 'Mobile' },
  { key: 'email', label: 'Email' },
  { key: 'address', label: 'Address' },
  { key: 'class', label: 'Class' },
  { key: 'section', label: 'Section' },
  { key: 'roll', label: 'Roll No.' },
  { key: 'admissionDate', label: 'Admission Date' },
  { key: 'transportRoute', label: 'Transport Route' },
  { key: 'feeStructure', label: 'Fee Structure' },
  { key: 'discount', label: 'Discount (₹)' },
];

const STATUSES: WorkflowStatus[] = ['pending', 'approved', 'rejected', 'draft'];

export default function AdminStudentRequests() {
  const [students, setStudents] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [form, setForm] = useState<Record<string, string>>({});
  const [rows, setRows] = useState<WorkflowRecord[]>([]);
  const [tab, setTab] = useState<WorkflowStatus>('pending');
  const [classFilter, setClassFilter] = useState('all');

  const load = () => {
    setStudents(getCollection<any>('students'));
    setRows(listWorkflows().filter(w => w.module === 'student.change'));
  };
  useEffect(load, []);

  const selected = useMemo(() => students.find(s => s.id === selectedId), [students, selectedId]);

  useEffect(() => {
    if (!selected) { setForm({}); return; }
    const seeded: Record<string, string> = {};
    SENSITIVE_FIELDS.forEach(f => { seeded[f.key] = (selected as any)[f.key] ?? ''; });
    setForm(seeded);
  }, [selected]);

  const buildDiff = () => {
    if (!selected) return { before: {}, after: {} };
    const before: Record<string, any> = {}; const after: Record<string, any> = {};
    SENSITIVE_FIELDS.forEach(f => {
      const curr = (selected as any)[f.key] ?? '';
      const next = form[f.key] ?? '';
      if (String(curr) !== String(next)) { before[f.key] = curr; after[f.key] = next; }
    });
    return { before, after };
  };

  const submitRequest = (draft = false) => {
    if (!selected) { toast.error('Select a student first'); return; }
    const { before, after } = buildDiff();
    if (Object.keys(after).length === 0) { toast.error('No changes to submit'); return; }
    const fn = draft ? saveDraft : submit;
    fn({
      module: 'student.change',
      recordId: selected.id,
      title: `${selected.name} — ${Object.keys(after).join(', ')}`,
      before, after,
      meta: { studentId: selected.id, class: selected.class, section: selected.section },
    });
    toast.success(draft ? 'Draft saved' : 'Submitted for approval');
    load();
  };

  const filtered = useMemo(() => rows.filter(r =>
    r.status === tab && (classFilter === 'all' || r.meta?.class === classFilter)
  ), [rows, tab, classFilter]);

  const classes = Array.from(new Set(students.map(s => s.class))).filter(Boolean);

  return (
    <AdminLayout>
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><UserPen className="h-6 w-6 text-primary" /> Student Change Requests</h1>
            <p className="text-sm text-muted-foreground">Sensitive student fields update only after approval. Non-sensitive notes stay direct.</p>
          </div>
          <Link to="/admin/approvals" className="text-sm text-primary hover:underline flex items-center gap-1">
            Approval Center <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <Card className="p-4 space-y-4">
          <div className="grid md:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Student</Label>
              <Select value={selectedId} onValueChange={setSelectedId}>
                <SelectTrigger><SelectValue placeholder="Select a student" /></SelectTrigger>
                <SelectContent>
                  {students.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name} — Class {s.class}{s.section ? '-' + s.section : ''}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selected && (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                {SENSITIVE_FIELDS.map(f => (
                  <div key={f.key}>
                    <Label className="text-xs">{f.label}</Label>
                    <Input value={form[f.key] ?? ''} onChange={e => setForm({ ...form, [f.key]: e.target.value })} />
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button variant="outline" size="sm" onClick={() => submitRequest(true)}><Save className="h-4 w-4 mr-1" />Save Draft</Button>
                <Button size="sm" onClick={() => submitRequest(false)}><Send className="h-4 w-4 mr-1" />Submit for Approval</Button>
              </div>
            </>
          )}
        </Card>

        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="text-lg font-semibold flex-1">History</h2>
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={classFilter} onValueChange={setClassFilter}>
            <SelectTrigger className="w-40 h-9"><SelectValue placeholder="Class" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All classes</SelectItem>
              {classes.map(c => <SelectItem key={c} value={c}>Class {c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <Tabs value={tab} onValueChange={v => setTab(v as WorkflowStatus)}>
          <TabsList>
            {STATUSES.map(s => <TabsTrigger key={s} value={s} className="capitalize">{s}</TabsTrigger>)}
          </TabsList>
          {STATUSES.map(s => (
            <TabsContent key={s} value={s} className="mt-3 space-y-2">
              {filtered.length === 0 ? (
                <EmptyState icon={Inbox} title={`No ${s} requests`} description="Submitted requests will appear here." />
              ) : filtered.map(w => (
                <Card key={w.id} className="p-3">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <p className="font-medium text-sm">{w.title}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {w.submittedAt ? formatDistanceToNow(new Date(w.submittedAt), { addSuffix: true }) : 'draft'} · by {w.submittedBy ?? w.createdBy}
                      </p>
                      {(w.before || w.after) && (
                        <details className="mt-2 text-xs">
                          <summary className="cursor-pointer text-primary">Compare before / after</summary>
                          <div className="grid md:grid-cols-2 gap-2 mt-1">
                            <pre className="bg-muted p-2 rounded max-h-40 overflow-auto">{JSON.stringify(w.before ?? {}, null, 2)}</pre>
                            <pre className="bg-muted p-2 rounded max-h-40 overflow-auto">{JSON.stringify(w.after ?? {}, null, 2)}</pre>
                          </div>
                        </details>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="capitalize text-[10px]">{w.status}</Badge>
                      {w.status === 'draft' && (
                        <Button size="sm" variant="outline" onClick={() => { submitDraft(w.id); toast.success('Submitted'); load(); }}>Submit</Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </AdminLayout>
  );
}
