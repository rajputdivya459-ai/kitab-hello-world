import { useEffect, useMemo, useState } from 'react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, LogOut as ExitIcon, Trash2, UserCircle } from 'lucide-react';
import { DataToolbar } from '@/components/shared/DataToolbar';
import { DataTable, Column } from '@/components/shared/DataTable';
import { Pagination } from '@/components/shared/Pagination';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { exportCSV, exportPDF } from '@/lib/export';
import { handleError } from '@/lib/errors';

export default function AdminVisitors() {
  const { toast } = useToast();
  const today = new Date().toISOString().slice(0, 10);
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [q, setQ] = useState('');
  const debouncedQ = useDebouncedValue(q, 250);
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ visitor_name: '', phone: '', purpose: '', remarks: '' });

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const { data, error } = await (supabase as any).from('visitors').select('*, students(name,admission_number)')
        .gte('entry_time', `${from}T00:00:00`).lte('entry_time', `${to}T23:59:59`)
        .order('entry_time', { ascending: false });
      if (error) throw error;
      setRows(data ?? []);
    } catch (e) { setError(e); } finally { setLoading(false); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [from, to]);

  const filtered = useMemo(() => rows.filter(r => {
    if (!debouncedQ) return true;
    const s = debouncedQ.toLowerCase();
    return r.visitor_name?.toLowerCase().includes(s) || r.phone?.includes(s) || r.purpose?.toLowerCase().includes(s);
  }), [rows, debouncedQ]);

  useEffect(() => { setPage(1); }, [debouncedQ, from, to, pageSize]);

  const view = filtered.slice((page - 1) * pageSize, page * pageSize);
  const inside = rows.filter(r => !r.exit_time).length;

  const create = async () => {
    if (!form.visitor_name) { toast({ title: 'Name required', variant: 'destructive' }); return; }
    try {
      const { error } = await (supabase as any).from('visitors').insert([{ ...form, entry_time: new Date().toISOString() }]);
      if (error) throw error;
      toast({ title: 'Visitor checked in' });
      setOpen(false); setForm({ visitor_name: '', phone: '', purpose: '', remarks: '' });
      load();
    } catch (e) { handleError(e, 'Check-in failed'); }
  };
  const checkout = async (id: string) => {
    try { await (supabase as any).from('visitors').update({ exit_time: new Date().toISOString() }).eq('id', id); load(); }
    catch (e) { handleError(e); }
  };
  const del = async (id: string) => {
    try { await (supabase as any).from('visitors').delete().eq('id', id); load(); }
    catch (e) { handleError(e); }
  };

  const columns: Column<any>[] = [
    { key: 'name', header: 'Visitor', cell: r => (
      <div className="flex items-center gap-2">
        <UserCircle className="h-7 w-7 text-muted-foreground shrink-0" />
        <div><p className="font-medium">{r.visitor_name}</p><p className="text-[11px] text-muted-foreground">{r.phone || '—'}</p></div>
      </div>
    )},
    { key: 'purpose', header: 'Purpose', cell: r => r.purpose || '—' },
    { key: 'in', header: 'In', cell: r => new Date(r.entry_time).toLocaleString() },
    { key: 'out', header: 'Out', cell: r => r.exit_time ? new Date(r.exit_time).toLocaleString() : <span className="text-emerald-600 text-xs font-medium">Inside</span> },
    { key: 'actions', header: '', className: 'text-right', cell: r => (
      <div className="flex gap-1 justify-end">
        {!r.exit_time && <Button size="sm" variant="outline" onClick={() => checkout(r.id)}><ExitIcon className="h-3.5 w-3.5 mr-1" />Out</Button>}
        <Button size="icon" variant="ghost" onClick={() => del(r.id)}><Trash2 className="h-4 w-4 text-rose-500" /></Button>
      </div>
    )},
  ];

  const exportCols = [
    { key: 'visitor_name', label: 'Name' },
    { key: 'phone', label: 'Phone' },
    { key: 'purpose', label: 'Purpose' },
    { key: 'entry_time', label: 'Entry', get: (r: any) => new Date(r.entry_time).toLocaleString() },
    { key: 'exit_time', label: 'Exit', get: (r: any) => r.exit_time ? new Date(r.exit_time).toLocaleString() : 'Inside' },
    { key: 'remarks', label: 'Remarks' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">Visitors</h1>
            <p className="text-muted-foreground">Visitor log book with entry & exit times.</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" />Check In</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New Visitor</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Name *</Label><Input value={form.visitor_name} onChange={e => setForm({ ...form, visitor_name: e.target.value })} /></div>
                <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
                <div><Label>Purpose</Label><Input value={form.purpose} onChange={e => setForm({ ...form, purpose: e.target.value })} /></div>
                <div><Label>Remarks</Label><Textarea value={form.remarks} onChange={e => setForm({ ...form, remarks: e.target.value })} /></div>
                <Button onClick={create} className="w-full">Check In</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total</p><p className="text-2xl font-bold">{rows.length}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Currently inside</p><p className="text-2xl font-bold text-emerald-600">{inside}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Checked out</p><p className="text-2xl font-bold text-muted-foreground">{rows.length - inside}</p></CardContent></Card>
        </div>

        <DataToolbar
          search={q} onSearchChange={setQ} searchPlaceholder="Search name, phone, purpose"
          filters={
            <>
              <div className="flex items-center gap-1.5"><Label className="text-xs">From</Label><Input type="date" value={from} onChange={e => setFrom(e.target.value)} className="h-9 w-[140px]" /></div>
              <div className="flex items-center gap-1.5"><Label className="text-xs">To</Label><Input type="date" value={to} onChange={e => setTo(e.target.value)} className="h-9 w-[140px]" /></div>
            </>
          }
          onExportCSV={() => exportCSV(`visitors-${from}-to-${to}`, filtered, exportCols)}
          onExportPDF={() => exportPDF(`visitors-${from}-to-${to}`, 'Visitor Log', filtered, exportCols)}
        />

        <DataTable
          columns={columns}
          rows={view}
          loading={loading}
          error={error}
          onRetry={load}
          rowKey={r => r.id}
          emptyIcon={UserCircle}
          emptyTitle="No visitors in this range"
          emptyDescription="Try a different date range or add a new check-in."
          emptyAction={{ label: 'Check In Visitor', onClick: () => setOpen(true) }}
        />

        <Pagination
          page={page} pageSize={pageSize} total={filtered.length}
          onPageChange={setPage} onPageSizeChange={setPageSize}
        />
      </div>
    </AdminLayout>
  );
}
