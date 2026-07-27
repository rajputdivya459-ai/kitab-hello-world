import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

export function PortalSkeleton() {
  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      </Card>
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-20 rounded-lg" />
        <Skeleton className="h-20 rounded-lg" />
      </div>
      <Skeleton className="h-32 rounded-lg" />
    </div>
  );
}
