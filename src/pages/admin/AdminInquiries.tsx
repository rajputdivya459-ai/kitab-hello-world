import { useEffect, useMemo, useState } from 'react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Phone, Mail, UserPlus } from 'lucide-react';
import { DataToolbar } from '@/components/shared/DataToolbar';
import { Pagination } from '@/components/shared/Pagination';
import { EmptyState } from '@/components/shared/EmptyState';
import { TableSkeleton } from '@/components/shared/TableSkeleton';
import { ErrorState } from '@/components/shared/ErrorState';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { exportCSV, exportPDF } from '@/lib/export';
import { handleError } from '@/lib/errors';
import { notifyNewInquiry } from '@/lib/notify';

type Status = 'new' | 'contacted' | 'follow_up' | 'interested' | 'admitted' | 'closed';
const STATUSES: Status[] = ['new','contacted','follow_up','interested','admitted','closed'];
const TONE: Record<Status, string> = {
  new: 'bg-sky-100 text-sky-700',
  contacted: 'bg-violet-100 text-violet-700',
  follow_up: 'bg-amber-100 text-amber-700',
  interested: 'bg-emerald-100 text-emerald-700',
  admitted: 'bg-green-100 text-green-800',
  closed: 'bg-muted text-muted-foreground',
};

export default function AdminInquiries() {
  const { toast } = useToast();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [q, setQ] = useState('');
  const debouncedQ = useDebouncedValue(q, 250);
  const [status, setStatus] = useState<Status | 'all'>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ student_name: '', parent_name: '', phone: '', email: '', interested_class: '', source: '', notes: '', next_follow_up_date: '' });

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const { data, error } = await (supabase as any).from('admission_inquiries').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setRows(data ?? []);
    } catch (e) { setError(e); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    return rows.filter(r => {
      if (status !== 'all' && r.status !== status) return false;
      if (debouncedQ) {
        const s = debouncedQ.toLowerCase();
        return (r.student_name?.toLowerCase().includes(s) || r.parent_name?.toLowerCase().includes(s) || r.phone?.includes(s) || r.email?.toLowerCase().includes(s));
      }
      return true;
    });
  }, [rows, debouncedQ, status]);

  useEffect(() => { setPage(1); }, [debouncedQ, status, pageSize]);

  const view = filtered.slice((page - 1) * pageSize, page * pageSize);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    STATUSES.forEach(s => c[s] = 0);
    rows.forEach(r => { c[r.status] = (c[r.status] ?? 0) + 1; });
    return c;
  }, [rows]);

  const create = async () => {
    if (!form.student_name) { toast({ title: 'Student name required', variant: 'destructive' }); return; }
    try {
      const payload = { ...form, next_follow_up_date: form.next_follow_up_date || null };
      const { error } = await (supabase as any).from('admission_inquiries').insert([payload]);
      if (error) throw error;
      notifyNewInquiry(form.student_name);
      toast({ title: 'Inquiry added' });
      setOpen(false); setForm({ student_name: '', parent_name: '', phone: '', email: '', interested_class: '', source: '', notes: '', next_follow_up_date: '' });
      load();
    } catch (e) { handleError(e, 'Create failed'); }
  };
  const updateStatus = async (id: string, s: Status) => {
    try { await (supabase as any).from('admission_inquiries').update({ status: s }).eq('id', id); load(); }
    catch (e) { handleError(e); }
  };
  const del = async (id: string) => {
    try { await (supabase as any).from('admission_inquiries').delete().eq('id', id); load(); }
    catch (e) { handleError(e); }
  };

  const exportCols = [
    { key: 'student_name', label: 'Student' },
    { key: 'parent_name', label: 'Parent' },
    { key: 'phone', label: 'Phone' },
    { key: 'email', label: 'Email' },
    { key: 'interested_class', label: 'Class' },
    { key: 'source', label: 'Source' },
    { key: 'status', label: 'Status' },
    { key: 'next_follow_up_date', label: 'Follow-up' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">Admission Inquiries</h1>
            <p className="text-muted-foreground">Track and convert admission leads.</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" />New Inquiry</Button></DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>New Admission Inquiry</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Student name *</Label><Input value={form.student_name} onChange={e => setForm({ ...form, student_name: e.target.value })} /></div>
                  <div><Label>Parent name</Label><Input value={form.parent_name} onChange={e => setForm({ ...form, parent_name: e.target.value })} /></div>
                  <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
                  <div><Label>Email</Label><Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
                  <div><Label>Interested class</Label><Input value={form.interested_class} onChange={e => setForm({ ...form, interested_class: e.target.value })} /></div>
                  <div><Label>Source</Label><Input value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} placeholder="Website / Walk-in / Referral" /></div>
                </div>
                <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
                <div><Label>Next follow-up date</Label><Input type="date" value={form.next_follow_up_date} onChange={e => setForm({ ...form, next_follow_up_date: e.target.value })} /></div>
                <Button onClick={create} className="w-full">Create</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
          {STATUSES.map(s => (
            <Card key={s}><CardContent className="p-3">
              <p className="text-[11px] text-muted-foreground capitalize">{s.replace('_', ' ')}</p>
              <p className="text-xl font-bold">{counts[s] ?? 0}</p>
            </CardContent></Card>
          ))}
        </div>

        <DataToolbar
          search={q} onSearchChange={setQ} searchPlaceholder="Search name, phone, email"
          filters={
            <Select value={status} onValueChange={v => setStatus(v as any)}>
              <SelectTrigger className="w-[160px] h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace('_', ' ')}</SelectItem>)}
              </SelectContent>
            </Select>
          }
          onExportCSV={() => exportCSV('admission-inquiries', filtered, exportCols)}
          onExportPDF={() => exportPDF('admission-inquiries', 'Admission Inquiries', filtered, exportCols)}
        />

        {loading ? <TableSkeleton cols={4} /> :
         error ? <ErrorState error={error} onRetry={load} /> :
         view.length === 0 ? (
           <EmptyState
             icon={UserPlus}
             title="No inquiries"
             description="New admission leads will appear here."
             actionLabel="Add inquiry"
             onAction={() => setOpen(true)}
           />
         ) : (
          <div className="space-y-2">
            {view.map(r => (
              <Card key={r.id}><CardContent className="p-4 flex flex-wrap gap-3 items-start justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold">{r.student_name}</p>
                    <Badge className={TONE[r.status as Status]}>{r.status.replace('_', ' ')}</Badge>
                    {r.interested_class && <Badge variant="outline">{r.interested_class}</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">{r.parent_name}</p>
                  <div className="flex flex-wrap gap-3 text-xs mt-1">
                    {r.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{r.phone}</span>}
                    {r.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{r.email}</span>}
                    {r.source && <span className="text-muted-foreground">via {r.source}</span>}
                    {r.next_follow_up_date && <span className="text-amber-600">Follow-up: {r.next_follow_up_date}</span>}
                  </div>
                  {r.notes && <p className="text-xs mt-1">{r.notes}</p>}
                </div>
                <div className="flex gap-2 items-center">
                  <Select value={r.status} onValueChange={v => updateStatus(r.id, v as Status)}>
                    <SelectTrigger className="w-[140px] h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace('_', ' ')}</SelectItem>)}</SelectContent>
                  </Select>
                  <Button size="icon" variant="ghost" onClick={() => del(r.id)}><Trash2 className="h-4 w-4 text-rose-500" /></Button>
                </div>
              </CardContent></Card>
            ))}
          </div>
        )}

        <Pagination
          page={page} pageSize={pageSize} total={filtered.length}
          onPageChange={setPage} onPageSizeChange={setPageSize}
        />
      </div>
    </AdminLayout>
  );
}
