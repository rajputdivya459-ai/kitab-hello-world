import { useEffect, useState } from 'react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Megaphone, Send, Trash2, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AdminAnnouncements() {
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [banner, setBanner] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const { data } = await supabase.from('announcements').select('*').order('publish_date', { ascending: false }).limit(100);
    setItems(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;
    setLoading(true);
    const { error } = await supabase.from('announcements').insert({
      title: title.trim(),
      message: message.trim(),
      banner_image_url: banner.trim() || null,
    });
    setLoading(false);
    if (error) return toast({ title: 'Failed', description: error.message, variant: 'destructive' });
    toast({ title: 'Announcement published' });
    setTitle(''); setMessage(''); setBanner('');
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this announcement?')) return;
    await supabase.from('announcements').delete().eq('id', id);
    load();
  };

  const filtered = items.filter(a => !q.trim() || a.title.toLowerCase().includes(q.toLowerCase()) || a.message.toLowerCase().includes(q.toLowerCase()));

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-4xl">
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Megaphone className="h-5 w-5 text-primary" />
            <h2 className="font-display text-lg font-semibold">Create Announcement</h2>
          </div>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="t">Title</Label>
              <Input id="t" value={title} onChange={e => setTitle(e.target.value)} required maxLength={140} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="m">Message</Label>
              <Textarea id="m" value={message} onChange={e => setMessage(e.target.value)} required rows={4} maxLength={2000} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="b">Banner image URL (optional)</Label>
              <Input id="b" value={banner} onChange={e => setBanner(e.target.value)} placeholder="https://…" />
            </div>
            <Button type="submit" disabled={loading}><Send className="h-4 w-4 mr-2" />{loading ? 'Publishing…' : 'Publish'}</Button>
          </form>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <h2 className="font-display text-lg font-semibold">Announcements</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search" className="pl-9 h-9 w-[220px]" />
            </div>
          </div>
          {filtered.length === 0 ? <p className="text-sm text-muted-foreground">No announcements.</p> : (
            <div className="space-y-3">
              {filtered.map(a => (
                <div key={a.id} className="rounded-lg border bg-background overflow-hidden">
                  {a.banner_image_url && <img src={a.banner_image_url} alt={a.title} className="w-full h-32 object-cover" />}
                  <div className="p-4 flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{a.title}</p>
                      <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{a.message}</p>
                      <p className="text-xs text-muted-foreground mt-2">{new Date(a.publish_date).toLocaleString()}</p>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => remove(a.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
}
