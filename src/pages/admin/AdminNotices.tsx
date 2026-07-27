import { useEffect, useState } from 'react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, Send, Trash2, AlertCircle, Paperclip, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AdminNotices() {
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [attachment, setAttachment] = useState('');
  const [important, setImportant] = useState(false);
  const [targetType, setTargetType] = useState<'all' | 'class' | 'section'>('all');
  const [classId, setClassId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const [{ data: c }, { data: s }, { data: n }] = await Promise.all([
      supabase.from('classes').select('id,name').order('name'),
      supabase.from('sections').select('id,name,class_id').order('name'),
      supabase.from('notices').select('*').order('publish_date', { ascending: false }).limit(100),
    ]);
    setClasses(c ?? []); setSections(s ?? []); setItems(n ?? []);
  };
  useEffect(() => { load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;
    setLoading(true);
    const payload: any = {
      title: title.trim(),
      message: message.trim(),
      attachment_url: attachment.trim() || null,
      target_type: targetType,
      is_important: important,
      class_id: targetType === 'class' ? classId || null : null,
      section_id: targetType === 'section' ? sectionId || null : null,
    };
    const { error } = await supabase.from('notices').insert(payload);
    setLoading(false);
    if (error) return toast({ title: 'Failed', description: error.message, variant: 'destructive' });
    toast({ title: 'Notice published' });
    setTitle(''); setMessage(''); setAttachment(''); setImportant(false); setTargetType('all'); setClassId(''); setSectionId('');
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this notice?')) return;
    await supabase.from('notices').delete().eq('id', id);
    load();
  };

  const filtered = items.filter(n => !q.trim() || n.title.toLowerCase().includes(q.toLowerCase()) || n.message.toLowerCase().includes(q.toLowerCase()));

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-4xl">
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="h-5 w-5 text-primary" />
            <h2 className="font-display text-lg font-semibold">Create Notice</h2>
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
              <Label htmlFor="a">Attachment URL (image / PDF / document)</Label>
              <Input id="a" value={attachment} onChange={e => setAttachment(e.target.value)} placeholder="https://…" />
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Audience</Label>
                <Select value={targetType} onValueChange={(v: any) => setTargetType(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Entire school</SelectItem>
                    <SelectItem value="class">Specific class</SelectItem>
                    <SelectItem value="section">Specific section</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {targetType === 'class' && (
                <div className="space-y-2">
                  <Label>Class</Label>
                  <Select value={classId} onValueChange={setClassId}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
              {targetType === 'section' && (
                <div className="space-y-2">
                  <Label>Section</Label>
                  <Select value={sectionId} onValueChange={setSectionId}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{sections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label>Mark important</Label>
                <div className="flex items-center gap-2 h-10">
                  <Switch checked={important} onCheckedChange={setImportant} />
                  <span className="text-sm text-muted-foreground">{important ? 'Yes' : 'No'}</span>
                </div>
              </div>
            </div>
            <Button type="submit" disabled={loading}><Send className="h-4 w-4 mr-2" />{loading ? 'Publishing…' : 'Publish'}</Button>
          </form>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <h2 className="font-display text-lg font-semibold">Published Notices</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search" className="pl-9 h-9 w-[220px]" />
            </div>
          </div>
          {filtered.length === 0 ? <p className="text-sm text-muted-foreground">No notices.</p> : (
            <div className="space-y-3">
              {filtered.map(n => (
                <div key={n.id} className="p-4 rounded-lg border bg-background">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {n.is_important && <AlertCircle className="h-4 w-4 text-destructive" />}
                        <p className="font-semibold">{n.title}</p>
                        <Badge variant="outline">{n.target_type}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{n.message}</p>
                      {n.attachment_url && (
                        <a href={n.attachment_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary mt-2 hover:underline">
                          <Paperclip className="h-3 w-3" /> Attachment
                        </a>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">{new Date(n.publish_date).toLocaleString()}</p>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => remove(n.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
