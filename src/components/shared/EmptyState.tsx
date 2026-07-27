import { LucideIcon, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface Props {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon: Icon = Inbox, title, description, actionLabel, onAction }: Props) {
  return (
    <Card className="p-10 text-center border-dashed">
      <div className="mx-auto w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
        <Icon className="h-7 w-7 text-muted-foreground" />
      </div>
      <p className="font-semibold text-base">{title}</p>
      {description && <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">{description}</p>}
      {actionLabel && onAction && (
        <Button onClick={onAction} className="mt-4" size="sm">{actionLabel}</Button>
      )}
    </Card>
  );
}
