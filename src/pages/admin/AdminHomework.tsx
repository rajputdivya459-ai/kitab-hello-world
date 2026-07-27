import { useEffect, useMemo, useState } from 'react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, Send, Trash2, Paperclip, Search, CalendarClock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { notifyHomeworkAdded } from '@/lib/notify';

export default function AdminHomework() {
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [attachment, setAttachment] = useState('');
  const [classId, setClassId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [filterClass, setFilterClass] = useState('all');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const [{ data: c }, { data: s }, { data: h }] = await Promise.all([
      supabase.from('classes').select('id,name').order('name'),
      supabase.from('sections').select('id,name,class_id').order('name'),
      supabase.from('homework').select('*').order('due_date', { ascending: false }).limit(150),
    ]);
    setClasses(c ?? []); setSections(s ?? []); setItems(h ?? []);
  };
  useEffect(() => { load(); }, []);

  const classMap = useMemo(() => Object.fromEntries(classes.map(c => [c.id, c.name])), [classes]);
  const sectionMap = useMemo(() => Object.fromEntries(sections.map(s => [s.id, s.name])), [sections]);
  const sectionsForClass = sections.filter(s => s.class_id === classId);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !subject.trim() || !classId || !dueDate) return;
    setLoading(true);
    const { error } = await supabase.from('homework').insert({
      title: title.trim(),
      description: description.trim() || null,
      subject: subject.trim(),
      class_id: classId,
      section_id: sectionId || null,
      attachment_url: attachment.trim() || null,
      due_date: dueDate,
    });
    setLoading(false);
    if (error) return toast({ title: 'Failed', description: error.message, variant: 'destructive' });
    toast({ title: 'Homework published' });
    if (sectionId) void notifyHomeworkAdded(sectionId, subject.trim(), dueDate).catch(() => {});
    setTitle(''); setSubject(''); setDescription(''); setAttachment(''); setClassId(''); setSectionId(''); setDueDate('');
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this homework?')) return;
    await supabase.from('homework').delete().eq('id', id);
    load();
  };

  const filtered = items.filter(h =>
    (filterClass === 'all' || h.class_id === filterClass) &&
    (!q.trim() || h.title.toLowerCase().includes(q.toLowerCase()) || h.subject.toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-4xl">
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="h-5 w-5 text-primary" />
            <h2 className="font-display text-lg font-semibold">Create Homework</h2>
          </div>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="t">Title</Label>
                <Input id="t" value={title} onChange={e => setTitle(e.target.value)} required maxLength={140} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="s">Subject</Label>
                <Input id="s" value={subject} onChange={e => setSubject(e.target.value)} required placeholder="e.g. Mathematics" maxLength={60} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="d">Instructions</Label>
              <Textarea id="d" value={description} onChange={e => setDescription(e.target.value)} rows={4} maxLength={2000} placeholder="What students need to do…" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="a">Attachment URL (PDF / image)</Label>
              <Input id="a" value={attachment} onChange={e => setAttachment(e.target.value)} placeholder="https://…" />
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Class</Label>
                <Select value={classId} onValueChange={v => { setClassId(v); setSectionId(''); }}>
                  <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                  <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Section (optional)</Label>
                <Select value={sectionId} onValueChange={setSectionId} disabled={!classId}>
                  <SelectTrigger><SelectValue placeholder="All sections" /></SelectTrigger>
                  <SelectContent>{sectionsForClass.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="due">Due date</Label>
                <Input id="due" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} required />
              </div>
            </div>
            <Button type="submit" disabled={loading}><Send className="h-4 w-4 mr-2" />{loading ? 'Publishing…' : 'Publish'}</Button>
          </form>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <h2 className="font-display text-lg font-semibold">Homework List</h2>
            <div className="flex items-center gap-2">
              <Select value={filterClass} onValueChange={setFilterClass}>
                <SelectTrigger className="h-9 w-[160px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All classes</SelectItem>
                  {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search" className="pl-9 h-9 w-[200px]" />
              </div>
            </div>
          </div>
          {filtered.length === 0 ? <p className="text-sm text-muted-foreground">No homework.</p> : (
            <div className="space-y-3">
              {filtered.map(h => (
                <div key={h.id} className="p-4 rounded-lg border bg-background">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary">{h.subject}</Badge>
                        <Badge variant="outline">{classMap[h.class_id] ?? 'Class'}</Badge>
                        {h.section_id && <Badge variant="outline">Section {sectionMap[h.section_id]}</Badge>}
                      </div>
                      <p className="font-semibold mt-1.5">{h.title}</p>
                      {h.description && <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{h.description}</p>}
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <CalendarClock className="h-3 w-3" /> Due {new Date(h.due_date).toLocaleDateString()}
                        </span>
                        {h.attachment_url && (
                          <a href={h.attachment_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                            <Paperclip className="h-3 w-3" /> Attachment
                          </a>
                        )}
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => remove(h.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
