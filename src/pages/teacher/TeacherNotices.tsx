import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTeacherCtx } from '@/contexts/TeacherContext';
import { PortalSkeleton } from '@/components/portal/PortalSkeleton';
import { Trash2 } from 'lucide-react';

export default function TeacherNotices() {
  const { loading, assignments, classMap, sectionMap } = useTeacherCtx();
  const { toast } = useToast();
  const [classKey, setClassKey] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  const choices = useMemo(() => {
    const m = new Map<string, { key: string; class_id: string; section_id: string | null; label: string }>();
    for (const a of assignments) {
      const key = `${a.class_id}|${a.section_id ?? ''}`;
      m.set(key, {
        key, class_id: a.class_id, section_id: a.section_id,
        label: `${classMap[a.class_id]}${a.section_id ? ` · ${sectionMap[a.section_id]}` : ''}`,
      });
    }
    return Array.from(m.values());
  }, [assignments, classMap, sectionMap]);

  useEffect(() => { if (choices.length && !classKey) setClassKey(choices[0].key); }, [choices, classKey]);

  const reload = async () => {
    const classIds = Array.from(new Set(assignments.map(a => a.class_id)));
    if (!classIds.length) return;
    const { data } = await supabase.from('notices').select('*').in('class_id', classIds).order('publish_date', { ascending: false }).limit(30);
    setItems(data ?? []);
  };
  useEffect(() => { reload(); /* eslint-disable-next-line */ }, [assignments]);

  const create = async () => {
    const c = choices.find(x => x.key === classKey);
    if (!c || !title || !message) return;
    setSaving(true);
    const payload = c.section_id
      ? { title, message, target_type: 'section', class_id: c.class_id, section_id: c.section_id }
      : { title, message, target_type: 'class', class_id: c.class_id };
    const { error } = await supabase.from('notices').insert(payload);
    setSaving(false);
    if (error) return toast({ title: 'Failed', description: error.message, variant: 'destructive' });
    setTitle(''); setMessage('');
    toast({ title: 'Notice posted' });
    reload();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this notice?')) return;
    await supabase.from('notices').delete().eq('id', id);
    reload();
  };

  if (loading) return <PortalSkeleton />;

  return (
    <div className="space-y-3">
      <h2 className="font-display text-lg font-semibold">Class Notices</h2>
      <Card><CardContent className="p-4 space-y-3">
        <Select value={classKey} onValueChange={setClassKey}>
          <SelectTrigger><SelectValue placeholder="Audience" /></SelectTrigger>
          <SelectContent>{choices.map(c => <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>)}</SelectContent>
        </Select>
        <Input placeholder="Notice title" value={title} onChange={e => setTitle(e.target.value)} />
        <Textarea placeholder="Message" rows={4} value={message} onChange={e => setMessage(e.target.value)} />
        <Button onClick={create} disabled={saving || !title || !message} className="w-full bg-teal-600 hover:bg-teal-700">
          {saving ? 'Posting…' : 'Post Notice'}
        </Button>
      </CardContent></Card>

      <Card><CardContent className="p-2 divide-y">
        {items.length === 0 && <p className="text-sm text-muted-foreground p-4 text-center">No notices yet.</p>}
        {items.map(n => (
          <div key={n.id} className="py-3 px-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium text-sm">{n.title}</p>
                <p className="text-[11px] text-muted-foreground">{new Date(n.publish_date).toLocaleDateString()} · {n.target_type}</p>
                <p className="text-xs mt-1 text-muted-foreground line-clamp-2">{n.message}</p>
              </div>
              <button onClick={() => remove(n.id)} className="text-muted-foreground hover:text-destructive p-1">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </CardContent></Card>
    </div>
  );
}
