import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Notification {
  id: string;
  title: string;
  message: string;
  created_at: string;
  target_type: string;
}

export function NotificationsList({ userId }: { userId: string }) {
  const [items, setItems] = useState<Notification[]>([]);
  const [reads, setReads] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [{ data: notifs }, { data: readRows }] = await Promise.all([
      supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(20),
      supabase.from('notification_reads').select('notification_id').eq('user_id', userId),
    ]);
    setItems((notifs ?? []) as Notification[]);
    setReads(new Set((readRows ?? []).map((r: any) => r.notification_id)));
    setLoading(false);
  };

  useEffect(() => { load(); }, [userId]);

  const markRead = async (id: string) => {
    if (reads.has(id)) return;
    setReads(prev => new Set(prev).add(id));
    await supabase.from('notification_reads').insert({ notification_id: id, user_id: userId });
  };

  const unreadCount = items.filter(i => !reads.has(i.id)).length;

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary" />
          <h2 className="font-semibold">Notifications</h2>
        </div>
        {unreadCount > 0 && <Badge variant="destructive">{unreadCount} new</Badge>}
      </div>
      {loading ? <p className="text-sm text-muted-foreground">Loading…</p> :
        items.length === 0 ? <p className="text-sm text-muted-foreground">No notifications yet.</p> : (
          <div className="space-y-2">
            {items.map(n => {
              const unread = !reads.has(n.id);
              return (
                <button
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${unread ? 'bg-primary/5 border-primary/30' : 'bg-background border-border'}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-sm">{n.title}</p>
                    {unread && <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{n.message}</p>
                  <p className="text-xs text-muted-foreground mt-1.5">{new Date(n.created_at).toLocaleString()}</p>
                </button>
              );
            })}
          </div>
        )}
    </Card>
  );
}
