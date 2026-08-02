import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { DataToolbar } from '@/components/shared/DataToolbar';
import { exportCSV } from '@/lib/export';
import { listAudit, type AuditEntry } from '@/lib/audit';

const LABEL: Record<string, string> = {
  'result.generated': 'Result generated',
  'result.submitted': 'Submitted for approval',
  'result.approved': 'Approved',
  'result.returned': 'Returned to draft',
  'result.published': 'Published',
  'result.republished': 'Republished',
  'result.archived': 'Archived',
  'result.rollback': 'Publication rollback',
  'result.publish.blocked': 'Publication blocked (validation)',
  'result.remarks.updated': 'Remarks updated',
  'result.rules.updated': 'Result rules updated',
  'result.gradescale.changed': 'Grade scale changed',
  'result.config.activated': 'Config activated',
  'reportcard.generated': 'Report card generated',
  'reportcard.downloaded': 'Report card downloaded',
  'reportcard.printed': 'Report cards printed',
  'reportcard.bulk_export': 'Report cards bulk exported',
  'meritlist.generated': 'Merit list generated',
};

export function ResultHistoryPanel({ recordId }: { recordId?: string }) {
  const rows = useMemo(() => listAudit({ module: 'results', recordId }), [recordId]);
  const cols: Column<AuditEntry>[] = [
    { key: 'ts', header: 'When', cell: r => <span className="text-xs">{new Date(r.ts).toLocaleString()}</span> },
    { key: 'action', header: 'Action', cell: r => <Badge variant="outline">{LABEL[r.action] ?? r.action}</Badge> },
    { key: 'by', header: 'By', cell: r => <div><p className="text-sm">{r.userName}</p><p className="text-[11px] text-muted-foreground capitalize">{r.role}</p></div> },
    { key: 'meta', header: 'Details', cell: r => <span className="text-xs text-muted-foreground">{r.meta ? Object.entries(r.meta).map(([k, v]) => `${k}: ${v}`).join(' · ') : '—'}</span> },
  ];
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm">Result History & Audit Trail</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        <DataToolbar onExportCSV={() => exportCSV('result-audit', rows, [
          { key: 'ts', label: 'Timestamp' }, { key: 'action', label: 'Action' },
          { key: 'userName', label: 'User' }, { key: 'role', label: 'Role' }, { key: 'recordId', label: 'Record' },
        ])} />
        <DataTable columns={cols} rows={rows} rowKey={r => r.id} emptyTitle="No result activity yet" />
      </CardContent>
    </Card>
  );
}
