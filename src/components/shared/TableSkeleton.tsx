import { Skeleton } from '@/components/ui/skeleton';

export function TableSkeleton({ rows = 8, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-2">
      {[...Array(rows)].map((_, r) => (
        <div key={r} className="flex gap-3">
          {[...Array(cols)].map((_, c) => (
            <Skeleton key={c} className="h-10 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}
