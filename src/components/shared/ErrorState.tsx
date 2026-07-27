import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toFriendlyError } from '@/lib/errors';

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <Card className="p-8 text-center border-dashed">
      <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-3">
        <AlertTriangle className="h-6 w-6 text-destructive" />
      </div>
      <p className="font-semibold">Something went wrong</p>
      <p className="text-sm text-muted-foreground mt-1">{toFriendlyError(error)}</p>
      {onRetry && <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>Try again</Button>}
    </Card>
  );
}
