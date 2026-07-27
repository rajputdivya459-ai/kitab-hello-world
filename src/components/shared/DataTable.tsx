import { ReactNode } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TableSkeleton } from './TableSkeleton';
import { EmptyState } from './EmptyState';
import { ErrorState } from './ErrorState';
import { LucideIcon, Inbox } from 'lucide-react';

export interface Column<T> {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  className?: string;
}

interface Props<T> {
  columns: Column<T>[];
  rows: T[];
  loading?: boolean;
  error?: unknown;
  onRetry?: () => void;
  emptyIcon?: LucideIcon;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: { label: string; onClick: () => void };
  rowKey?: (row: T) => string;
}

export function DataTable<T>({
  columns, rows, loading, error, onRetry,
  emptyIcon = Inbox, emptyTitle = 'No records', emptyDescription, emptyAction,
  rowKey,
}: Props<T>) {
  if (loading) return <TableSkeleton cols={columns.length} />;
  if (error) return <ErrorState error={error} onRetry={onRetry} />;
  if (!rows.length) {
    return (
      <EmptyState
        icon={emptyIcon}
        title={emptyTitle}
        description={emptyDescription}
        actionLabel={emptyAction?.label}
        onAction={emptyAction?.onClick}
      />
    );
  }
  return (
    <div className="rounded-lg border overflow-x-auto bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map(c => <TableHead key={c.key} className={c.className}>{c.header}</TableHead>)}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r, i) => (
            <TableRow key={rowKey ? rowKey(r) : i}>
              {columns.map(c => <TableCell key={c.key} className={c.className}>{c.cell(r)}</TableCell>)}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
