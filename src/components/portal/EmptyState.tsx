import { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface Props {
  icon: LucideIcon;
  title: string;
  description?: string;
}

export function EmptyState({ icon: Icon, title, description }: Props) {
  return (
    <Card className="p-8 text-center border-dashed">
      <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="font-medium">{title}</p>
      {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
    </Card>
  );
}
