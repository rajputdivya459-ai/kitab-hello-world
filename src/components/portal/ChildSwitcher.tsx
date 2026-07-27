import { cn } from '@/lib/utils';

interface Child { id: string; name: string; }
interface Props { children: Child[]; selectedId: string; onSelect: (id: string) => void; }

export function ChildSwitcher({ children, selectedId, onSelect }: Props) {
  if (children.length < 2) return null;
  return (
    <div className="flex gap-2 overflow-x-auto -mx-1 px-1 pb-1">
      {children.map(c => (
        <button key={c.id} onClick={() => onSelect(c.id)}
          className={cn(
            'px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
            selectedId === c.id ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-card border hover:bg-muted'
          )}>
          {c.name}
        </button>
      ))}
    </div>
  );
}
