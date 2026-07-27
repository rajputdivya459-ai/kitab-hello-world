import { useEffect, useMemo, useState } from 'react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { DataToolbar } from '@/components/shared/DataToolbar';
import { Pagination } from '@/components/shared/Pagination';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Activity, Trash2 } from 'lucide-react';
import { listAudit, clearAudit, type AuditEntry } from '@/lib/audit';
import { exportCSV } from '@/lib/export';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { format } from 'date-fns';
import { toast } from 'sonner';

const PAGE_SIZE = 20;

export default function AdminAuditLog() {
  const [rows, setRows] = useState<AuditEntry[]>([]);
  const [q, setQ] = useState('');
  const [module, setModule] = useState('all');
  const [role, setRole] = useState('all');
  const [page, setPage] = useState(1);
  const debounced = useDebouncedValue(q, 200);

  useEffect(() => setRows(listAudit()), []);

  const modules = useMemo(() => Array.from(new Set(rows.map(r => r.module))).sort(), [rows]);
  const roles = useMemo(() => Array.from(new Set(rows.map(r => r.role))).sort(), [rows]);

  const filtered = useMemo(() => {
    const s = debounced.toLowerCase();
    return rows.filter(r => {
      if (module !== 'all' && r.module !== module) return false;
      if (role !== 'all' && r.role !== role) return false;
      if (!s) return true;
      return [r.action, r.userName, r.module, r.recordId, JSON.stringify(r.meta ?? {})].some(v => v?.toLowerCase().includes(s));
    });
  }, [rows, debounced, module, role]);

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const cols: Column<AuditEntry>[] = [
    { key: 'ts', header: 'When', cell: r => <span className="text-xs">{format(new Date(r.ts), 'PP p')}</span> },
    { key: 'user', header: 'User', cell: r => <div><p className="text-sm font-medium">{r.userName}</p><p className="text-[10px] text-muted-foreground capitalize">{r.role}</p></div> },
    { key: 'module', header: 'Module', cell: r => <Badge variant="outline" className="text-[10px]">{r.module}</Badge> },
    { key: 'action', header: 'Action', cell: r => <span className="text-sm">{r.action}</span> },
    { key: 'record', header: 'Record', cell: r => <span className="text-xs text-muted-foreground">{r.recordId ?? '—'}</span> },
    { key: 'status', header: 'Status', cell: r => <Badge variant={r.status === 'success' ? 'default' : 'destructive'} className="text-[10px] capitalize">{r.status}</Badge> },
  ];

  return (
    <AdminLayout>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Activity className="h-6 w-6 text-primary" /> Audit Log</h1>
            <p className="text-sm text-muted-foreground">Immutable trail of every meaningful action across the ERP.</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => { if (confirm('Clear audit log?')) { clearAudit(); setRows([]); toast.success('Log cleared'); } }}>
            <Trash2 className="h-4 w-4 mr-1" />Clear
          </Button>
        </div>

        <DataToolbar
          search={q} onSearchChange={setQ} searchPlaceholder="Search actions, users, records…"
          filters={
            <>
              <Select value={module} onValueChange={setModule}>
                <SelectTrigger className="w-44 h-9"><SelectValue placeholder="Module" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All modules</SelectItem>
                  {modules.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="w-36 h-9"><SelectValue placeholder="Role" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All roles</SelectItem>
                  {roles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </>
          }
          onExportCSV={() => exportCSV('audit-log', filtered, [
            { key: 'ts', label: 'When' },
            { key: 'userName', label: 'User' },
            { key: 'role', label: 'Role' },
            { key: 'module', label: 'Module' },
            { key: 'action', label: 'Action' },
            { key: 'recordId', label: 'Record' },
            { key: 'status', label: 'Status' },
          ])}
        />

        <DataTable columns={cols} rows={paged} emptyTitle="No audit entries" />
        <Pagination page={page} pageSize={PAGE_SIZE} total={filtered.length} onPageChange={setPage} />
      </div>
    </AdminLayout>
  );
}
