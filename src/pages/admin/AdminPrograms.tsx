import { useEffect, useState } from 'react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Skeleton } from '@/components/common/Skeleton';
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react';

interface Program {
  id: string;
  title: string;
  description: string | null;
  icon: string | null;
  is_active: boolean;
  order_index: number;
}

const emptyProgram: Omit<Program, 'id'> = {
  title: '',
  description: '',
  icon: 'award',
  is_active: true,
  order_index: 0,
};

export default function AdminPrograms() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Program, 'id'>>(emptyProgram);
  const [isAdding, setIsAdding] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data, error } = await supabase
      .from('programs_activities')
      .select('*')
      .order('order_index');
    if (!error && data) setPrograms(data as Program[]);
    setIsLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    setSaving(true);
    try {
      if (editingId) {
        const { error } = await supabase
          .from('programs_activities')
          .update({ title: form.title, description: form.description, icon: form.icon, is_active: form.is_active, order_index: form.order_index } as any)
          .eq('id', editingId);
        if (error) throw error;
        toast.success('Program updated!');
      } else {
        const { error } = await supabase
          .from('programs_activities')
          .insert([{ title: form.title, description: form.description, icon: form.icon, is_active: form.is_active, order_index: form.order_index } as any]);
        if (error) throw error;
        toast.success('Program added!');
      }
      setEditingId(null);
      setIsAdding(false);
      setForm(emptyProgram);
      await load();
    } catch {
      toast.error('Failed to save');
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this program?')) return;
    const { error } = await supabase.from('programs_activities').delete().eq('id', id);
    if (error) { toast.error('Failed to delete'); return; }
    toast.success('Deleted!');
    await load();
  };

  const startEdit = (p: Program) => {
    setEditingId(p.id);
    setIsAdding(false);
    setForm({ title: p.title, description: p.description, icon: p.icon, is_active: p.is_active, order_index: p.order_index });
  };

  const cancel = () => { setEditingId(null); setIsAdding(false); setForm(emptyProgram); };

  if (isLoading) return <AdminLayout><div className="space-y-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20" />)}</div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Programs & Activities</h1>
            <p className="text-muted-foreground text-sm">Manage programs displayed on the homepage.</p>
          </div>
          <Button onClick={() => { setIsAdding(true); setEditingId(null); setForm(emptyProgram); }} disabled={isAdding}>
            <Plus className="h-4 w-4 mr-2" />Add Program
          </Button>
        </div>

        {(isAdding || editingId) && (
          <div className="bg-card rounded-xl border border-border p-6 space-y-4">
            <h2 className="font-display text-lg font-semibold">{editingId ? 'Edit Program' : 'New Program'}</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div><Label>Title</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
              <div><Label>Icon Key</Label><Input value={form.icon || ''} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} placeholder="award, users, book-open, heart, target" /></div>
            </div>
            <div><Label>Description</Label><Textarea value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} /></div>
            <div className="grid gap-4 md:grid-cols-2">
              <div><Label>Order</Label><Input type="number" value={form.order_index} onChange={e => setForm(f => ({ ...f, order_index: Number(e.target.value) }))} /></div>
              <div className="flex items-center gap-2 pt-6"><Label>Active</Label><Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} /></div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving}><Check className="h-4 w-4 mr-1" />{saving ? 'Saving...' : 'Save'}</Button>
              <Button variant="outline" onClick={cancel}><X className="h-4 w-4 mr-1" />Cancel</Button>
            </div>
          </div>
        )}

        <div className="grid gap-4">
          {programs.map(p => (
            <div key={p.id} className="flex items-center gap-4 bg-card rounded-xl border border-border p-4">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground">{p.title}</p>
                <p className="text-sm text-muted-foreground truncate">{p.description}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${p.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {p.is_active ? 'Active' : 'Inactive'}
              </span>
              <Button variant="ghost" size="icon" onClick={() => startEdit(p)}><Pencil className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
