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
import { notifyHomeworkAdded } from '@/lib/notify';

export default function TeacherHomework() {
  const { loading, assignments, classMap, sectionMap, subjectMap } = useTeacherCtx();
  const { toast } = useToast();
  const [classKey, setClassKey] = useState('');
  const [subject, setSubject] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 86400000).toISOString().slice(0, 10));
  const [items, setItems] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  const classChoices = useMemo(() => {
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

  const subjectChoices = useMemo(() => {
    const ids = new Set(assignments.map(a => a.subject_id).filter(Boolean) as string[]);
    return Array.from(ids).map(id => subjectMap[id] ?? '—');
  }, [assignments, subjectMap]);

  useEffect(() => { if (classChoices.length && !classKey) setClassKey(classChoices[0].key); }, [classChoices, classKey]);
  useEffect(() => { if (subjectChoices.length && !subject) setSubject(subjectChoices[0]); }, [subjectChoices, subject]);

  const reload = async () => {
    const classIds = Array.from(new Set(assignments.map(a => a.class_id)));
    if (!classIds.length) return;
    const { data } = await supabase.from('homework').select('*').in('class_id', classIds).order('due_date', { ascending: false }).limit(30);
    setItems(data ?? []);
  };
  useEffect(() => { reload(); /* eslint-disable-next-line */ }, [assignments]);

  const create = async () => {
    const choice = classChoices.find(c => c.key === classKey);
    if (!choice || !title) return;
    setSaving(true);
    const { error } = await supabase.from('homework').insert({
      title, description, subject, due_date: dueDate,
      class_id: choice.class_id, section_id: choice.section_id,
    });
    setSaving(false);
    if (error) return toast({ title: 'Failed', description: error.message, variant: 'destructive' });
    setTitle(''); setDescription('');
    toast({ title: 'Homework posted' });
    if (choice.section_id) void notifyHomeworkAdded(choice.section_id, subject, dueDate).catch(() => {});
    reload();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this homework?')) return;
    await supabase.from('homework').delete().eq('id', id);
    reload();
  };

  if (loading) return <PortalSkeleton />;

  return (
    <div className="space-y-3">
      <h2 className="font-display text-lg font-semibold">Homework</h2>
      <Card><CardContent className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <Select value={classKey} onValueChange={setClassKey}>
            <SelectTrigger><SelectValue placeholder="Class" /></SelectTrigger>
            <SelectContent>{classChoices.map(c => <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={subject} onValueChange={setSubject}>
            <SelectTrigger><SelectValue placeholder="Subject" /></SelectTrigger>
            <SelectContent>{subjectChoices.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <Input placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} />
        <Textarea placeholder="Instructions (optional)" rows={3} value={description} onChange={e => setDescription(e.target.value)} />
        <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
        <Button onClick={create} disabled={saving || !title} className="w-full bg-teal-600 hover:bg-teal-700">
          {saving ? 'Posting…' : 'Post Homework'}
        </Button>
      </CardContent></Card>

      <Card><CardContent className="p-2 divide-y">
        {items.length === 0 && <p className="text-sm text-muted-foreground p-4 text-center">No homework yet.</p>}
        {items.map(h => (
          <div key={h.id} className="py-3 px-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium text-sm">{h.title}</p>
                <p className="text-[11px] text-muted-foreground">{h.subject} · Due {new Date(h.due_date).toLocaleDateString()}</p>
                {h.description && <p className="text-xs mt-1 text-muted-foreground line-clamp-2">{h.description}</p>}
              </div>
              <button onClick={() => remove(h.id)} className="text-muted-foreground hover:text-destructive p-1">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </CardContent></Card>
    </div>
  );
}
