import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface Props {
  page: number; // 1-based
  pageSize: number;
  total: number;
  onPageChange: (p: number) => void;
  onPageSizeChange?: (s: number) => void;
  pageSizeOptions?: number[];
}

export function Pagination({
  page, pageSize, total, onPageChange, onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
}: Props) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-2">
      <p className="text-xs text-muted-foreground">
        Showing <span className="font-medium text-foreground">{from}–{to}</span> of <span className="font-medium text-foreground">{total}</span>
      </p>
      <div className="flex items-center gap-2">
        {onPageSizeChange && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground hidden sm:inline">Rows</span>
            <Select value={String(pageSize)} onValueChange={v => onPageSizeChange(Number(v))}>
              <SelectTrigger className="h-8 w-[72px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map(o => <SelectItem key={o} value={String(o)}>{o}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
        <Button size="icon" variant="outline" className="h-8 w-8" disabled={page <= 1} onClick={() => onPageChange(1)}><ChevronsLeft className="h-4 w-4" /></Button>
        <Button size="icon" variant="outline" className="h-8 w-8" disabled={page <= 1} onClick={() => onPageChange(page - 1)}><ChevronLeft className="h-4 w-4" /></Button>
        <span className="text-xs px-2 min-w-[64px] text-center">{page} / {totalPages}</span>
        <Button size="icon" variant="outline" className="h-8 w-8" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}><ChevronRight className="h-4 w-4" /></Button>
        <Button size="icon" variant="outline" className="h-8 w-8" disabled={page >= totalPages} onClick={() => onPageChange(totalPages)}><ChevronsRight className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}
