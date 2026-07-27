import { useEffect, useMemo, useState } from 'react';
import { BookOpen, Paperclip, CalendarClock, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmptyState } from './EmptyState';

interface Homework {
  id: string;
  title: string;
  description: string | null;
  subject: string;
  attachment_url: string | null;
  due_date: string;
  created_at: string;
}

export function HomeworkFeed({ studentId }: { studentId?: string }) {
  const [items, setItems] = useState<Homework[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [subject, setSubject] = useState<string>('all');

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('homework')
        .select('*')
        .order('due_date', { ascending: true })
        .limit(60);
      setItems((data ?? []) as Homework[]);
      setLoading(false);
    })();
  }, [studentId]);

  const subjects = useMemo(() => Array.from(new Set(items.map(i => i.subject))).sort(), [items]);

  const filtered = items.filter(h =>
    (subject === 'all' || h.subject === subject) &&
    (!q.trim() ||
      h.title.toLowerCase().includes(q.toLowerCase()) ||
      (h.description ?? '').toLowerCase().includes(q.toLowerCase()))
  );

  const today = new Date(); today.setHours(0, 0, 0, 0);

  if (loading) return <Card className="p-4"><p className="text-sm text-muted-foreground">Loading homework…</p></Card>;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-[1fr_auto] gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search homework" className="pl-9 h-10" />
        </div>
        <Select value={subject} onValueChange={setSubject}>
          <SelectTrigger className="h-10 w-[130px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All subjects</SelectItem>
            {subjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={BookOpen} title="No homework" description="No assignments to show yet." />
      ) : filtered.map(h => {
        const due = new Date(h.due_date); due.setHours(0, 0, 0, 0);
        const overdue = due < today;
        const dueToday = due.getTime() === today.getTime();
        return (
          <Card key={h.id} className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" className="text-[10px]">{h.subject}</Badge>
                  {overdue && <Badge variant="destructive" className="text-[10px]">Overdue</Badge>}
                  {dueToday && <Badge className="text-[10px] bg-amber-500 hover:bg-amber-500">Due today</Badge>}
                </div>
                <p className="font-semibold text-sm mt-1.5">{h.title}</p>
              </div>
            </div>
            {h.description && <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">{h.description}</p>}
            <div className="flex items-center justify-between gap-3 mt-3 flex-wrap">
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <CalendarClock className="h-3.5 w-3.5" /> Due {due.toLocaleDateString()}
              </span>
              {h.attachment_url && (
                <a href={h.attachment_url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline">
                  <Paperclip className="h-3 w-3" /> Attachment
                </a>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground mt-2 italic">Submission tracking coming soon</p>
          </Card>
        );
      })}
    </div>
  );
}
