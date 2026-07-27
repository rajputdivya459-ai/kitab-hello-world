import { useEffect, useState } from 'react';
import { Megaphone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { EmptyState } from './EmptyState';

interface Announcement {
  id: string;
  title: string;
  message: string;
  banner_image_url: string | null;
  publish_date: string;
}

export function AnnouncementsFeed({ limit }: { limit?: number }) {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const q = supabase.from('announcements').select('*').order('publish_date', { ascending: false });
      const { data } = await (limit ? q.limit(limit) : q.limit(30));
      setItems((data ?? []) as Announcement[]);
      setLoading(false);
    })();
  }, [limit]);

  if (loading) return <Card className="p-4"><p className="text-sm text-muted-foreground">Loading…</p></Card>;
  if (items.length === 0) return <EmptyState icon={Megaphone} title="No announcements" description="Check back later." />;

  return (
    <div className="space-y-3">
      {items.map(a => (
        <Card key={a.id} className="overflow-hidden">
          {a.banner_image_url && (
            <img src={a.banner_image_url} loading="lazy" alt={a.title} className="w-full h-32 object-cover" />
          )}
          <div className="p-4">
            <div className="flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-primary shrink-0" />
              <p className="font-semibold text-sm">{a.title}</p>
            </div>
            <p className="text-sm text-muted-foreground mt-1.5 whitespace-pre-wrap">{a.message}</p>
            <p className="text-[11px] text-muted-foreground mt-2">{new Date(a.publish_date).toLocaleDateString()}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}
