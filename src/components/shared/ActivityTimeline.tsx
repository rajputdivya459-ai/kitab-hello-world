import { listAudit, type AuditEntry } from '@/lib/audit';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { Activity } from 'lucide-react';

interface Props {
  module?: string;
  recordId?: string;
  userId?: string;
  limit?: number;
  title?: string;
  emptyText?: string;
}

/** Renders an audit-log-backed timeline for any entity. Pure read. */
export function ActivityTimeline({ module, recordId, userId, limit = 20, title = 'Activity Timeline', emptyText = 'No recent activity' }: Props) {
  const rows: AuditEntry[] = listAudit({ module, recordId, userId }).slice(0, limit);
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <Activity className="h-4 w-4 text-primary" />
        <h3 className="font-semibold text-sm">{title}</h3>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">{emptyText}</p>
      ) : (
        <ol className="relative border-l ml-2 space-y-4">
          {rows.map(r => (
            <li key={r.id} className="ml-4">
              <div className="absolute -left-1.5 h-3 w-3 rounded-full bg-primary" />
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium">{r.action}</span>
                <Badge variant="outline" className="text-[10px]">{r.module}</Badge>
                <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(r.ts), { addSuffix: true })}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                by <span className="font-medium">{r.userName}</span> ({r.role})
                {r.meta?.title ? ` — ${r.meta.title}` : ''}
                {r.meta?.remarks ? ` · ${r.meta.remarks}` : ''}
              </p>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}
