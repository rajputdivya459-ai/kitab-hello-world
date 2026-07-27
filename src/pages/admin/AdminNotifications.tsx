import { useEffect, useState } from 'react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Bell, Send, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AdminNotifications() {
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetType, setTargetType] = useState<'all' | 'class' | 'section' | 'student'>('all');
  const [classId, setClassId] = useState<string>('');
  const [sectionId, setSectionId] = useState<string>('');
  const [studentId, setStudentId] = useState<string>('');
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const [{ data: c }, { data: s }, { data: st }, { data: n }] = await Promise.all([
      supabase.from('classes').select('id,name').order('name'),
      supabase.from('sections').select('id,name,class_id').order('name'),
      supabase.from('students').select('id,name,admission_number').order('name'),
      supabase.from('notifications').select('*').order('created_at', { ascending: false }),
    ]);
    setClasses(c ?? []); setSections(s ?? []); setStudents(st ?? []); setItems(n ?? []);
  };

  useEffect(() => { load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;
    setLoading(true);
    const payload: any = { title: title.trim(), message: message.trim(), target_type: targetType };
    if (targetType === 'class') payload.class_id = classId || null;
    if (targetType === 'section') payload.section_id = sectionId || null;
    if (targetType === 'student') payload.student_id = studentId || null;
    const { error } = await supabase.from('notifications').insert(payload);
    setLoading(false);
    if (error) { toast({ title: 'Failed', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Notification published' });
    setTitle(''); setMessage(''); setTargetType('all'); setClassId(''); setSectionId(''); setStudentId('');
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this notification?')) return;
    await supabase.from('notifications').delete().eq('id', id);
    load();
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-4xl">
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="h-5 w-5 text-primary" />
            <h2 className="font-display text-lg font-semibold">Create Notification</h2>
          </div>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="t">Title</Label>
              <Input id="t" value={title} onChange={e => setTitle(e.target.value)} required maxLength={120} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="m">Message</Label>
              <Textarea id="m" value={message} onChange={e => setMessage(e.target.value)} required rows={3} maxLength={1000} />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Target Audience</Label>
                <Select value={targetType} onValueChange={(v: any) => setTargetType(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Everyone</SelectItem>
                    <SelectItem value="class">Specific Class</SelectItem>
                    <SelectItem value="section">Specific Section</SelectItem>
                    <SelectItem value="student">Specific Student</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {targetType === 'class' && (
                <div className="space-y-2">
                  <Label>Class</Label>
                  <Select value={classId} onValueChange={setClassId}>
                    <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                    <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
              {targetType === 'section' && (
                <div className="space-y-2">
                  <Label>Section</Label>
                  <Select value={sectionId} onValueChange={setSectionId}>
                    <SelectTrigger><SelectValue placeholder="Select section" /></SelectTrigger>
                    <SelectContent>{sections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
              {targetType === 'student' && (
                <div className="space-y-2">
                  <Label>Student</Label>
                  <Select value={studentId} onValueChange={setStudentId}>
                    <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                    <SelectContent>{students.map(s => <SelectItem key={s.id} value={s.id}>{s.name} {s.admission_number ? `(${s.admission_number})` : ''}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <Button type="submit" disabled={loading}><Send className="h-4 w-4 mr-2" />{loading ? 'Publishing…' : 'Publish'}</Button>
          </form>
        </Card>

        <Card className="p-6">
          <h2 className="font-display text-lg font-semibold mb-4">Published Notifications</h2>
          {items.length === 0 ? <p className="text-sm text-muted-foreground">No notifications yet.</p> : (
            <div className="space-y-3">
              {items.map(n => (
                <div key={n.id} className="p-4 rounded-lg border bg-background">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold">{n.title}</p>
                        <Badge variant="outline">{n.target_type}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{n.message}</p>
                      <p className="text-xs text-muted-foreground mt-2">{new Date(n.created_at).toLocaleString()}</p>
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
