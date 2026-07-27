import { ReactNode } from 'react';
import { Search, Download, FileText } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface Props {
  search?: string;
  onSearchChange?: (s: string) => void;
  searchPlaceholder?: string;
  filters?: ReactNode;
  onExportCSV?: () => void;
  onExportPDF?: () => void;
  actions?: ReactNode;
  sticky?: boolean;
  className?: string;
}

/**
 * Reusable toolbar: search + filters + export + custom actions.
 * Search input is uncontrolled-debounce friendly when paired with `useDebouncedValue`.
 */
export function DataToolbar({
  search, onSearchChange, searchPlaceholder = 'Search…',
  filters, onExportCSV, onExportPDF, actions, sticky, className,
}: Props) {
  return (
    <div className={cn(
      'flex flex-wrap items-center gap-2 p-3 rounded-lg border bg-card',
      sticky && 'sticky top-0 z-10 backdrop-blur supports-[backdrop-filter]:bg-card/80',
      className,
    )}>
      {onSearchChange && (
        <div className="relative flex-1 min-w-[180px] max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={search ?? ''}
            onChange={e => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="pl-9 h-9"
          />
        </div>
      )}
      {filters && <div className="flex flex-wrap items-center gap-2">{filters}</div>}
      <div className="ml-auto flex items-center gap-2">
        {(onExportCSV || onExportPDF) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9"><Download className="h-4 w-4 mr-1" />Export</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onExportCSV && <DropdownMenuItem onClick={onExportCSV}><FileText className="h-4 w-4 mr-2" />CSV / Excel</DropdownMenuItem>}
              {onExportPDF && <DropdownMenuItem onClick={onExportPDF}><FileText className="h-4 w-4 mr-2" />PDF</DropdownMenuItem>}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        {actions}
      </div>
    </div>
  );
}
