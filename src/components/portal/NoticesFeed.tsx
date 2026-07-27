import { useEffect, useState } from 'react';
import { Bell, Paperclip, AlertCircle, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { EmptyState } from './EmptyState';

interface Notice {
  id: string;
  title: string;
  message: string;
  attachment_url: string | null;
  publish_date: string;
  is_important: boolean;
  target_type: string;
}

export function NoticesFeed() {
  const [items, setItems] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('notices')
        .select('*')
        .order('publish_date', { ascending: false })
        .limit(50);
      setItems((data ?? []) as Notice[]);
      setLoading(false);
    })();
  }, []);

  const filtered = items.filter(n =>
    !q.trim() ||
    n.title.toLowerCase().includes(q.toLowerCase()) ||
    n.message.toLowerCase().includes(q.toLowerCase())
  );

  if (loading) return <Card className="p-4"><p className="text-sm text-muted-foreground">Loading notices…</p></Card>;

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search notices" className="pl-9 h-10" />
      </div>
      {filtered.length === 0 ? (
        <EmptyState icon={Bell} title="No notices" description="You're all caught up." />
      ) : filtered.map(n => (
        <Card key={n.id} className={`p-4 ${n.is_important ? 'border-destructive/40 bg-destructive/5' : ''}`}>
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {n.is_important && <AlertCircle className="h-4 w-4 text-destructive shrink-0" />}
              <p className="font-semibold text-sm truncate">{n.title}</p>
            </div>
            <Badge variant="outline" className="text-[10px] shrink-0">{n.target_type}</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1.5 whitespace-pre-wrap">{n.message}</p>
          {n.attachment_url && (
            <a href={n.attachment_url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-primary mt-2 hover:underline">
              <Paperclip className="h-3 w-3" /> Attachment
            </a>
          )}
          <p className="text-[11px] text-muted-foreground mt-2">{new Date(n.publish_date).toLocaleString()}</p>
        </Card>
      ))}
    </div>
  );
}
