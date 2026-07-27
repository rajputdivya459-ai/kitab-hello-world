import { useEffect, useState } from 'react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { getAllAboutSections, updateAboutSection } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { withTimeout } from '@/lib/utils';
import { Skeleton } from '@/components/common/Skeleton';
import type { AboutSection } from '@/types/database';

export default function AdminAbout() {
  const [sections, setSections] = useState<AboutSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const result = await withTimeout(getAllAboutSections(), 10000, 'Load timed out');
        const data = Array.isArray(result) ? result : [];
        if (mounted) setSections(data);
      } catch (err) {
        console.error('AdminAbout load error:', err);
        if (mounted) setSections([]);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  const handleChange = (id: string, field: string, value: string) => {
    setSections(prev => (Array.isArray(prev) ? prev : []).map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const handleSave = async (section: AboutSection) => {
    if (savingId) return;
    setSavingId(section.id);
    try {
      await withTimeout(
        updateAboutSection(section.id, {
          title: section.title,
          content: section.content,
          image_url: section.image_url,
        }),
        10000,
        'Save timed out'
      );
      toast.success(`"${section.section_key}" updated!`);
    } catch (err: unknown) {
      let msg = 'Failed to save';
      if (err instanceof Error) {
        if (err.message === 'Save timed out') {
          msg = 'Request timed out. Check your connection.';
        } else {
          msg = err.message;
        }
      }
      toast.error(msg);
      console.error('Save error:', err);
    } finally {
      setSavingId(null);
    }
  };

  if (isLoading) return <AdminLayout><div className="space-y-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-40" />)}</div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="space-y-8 max-w-4xl">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">About Section</h1>
          <p className="text-muted-foreground text-sm">Manage college description, vision, mission and values.</p>
        </div>

        {(Array.isArray(sections) ? sections : []).map(section => (
          <div key={section.id} className="bg-card rounded-xl border border-border p-6 space-y-4">
            <h2 className="font-display text-lg font-semibold text-foreground capitalize">{section.section_key.replace(/_/g, ' ')}</h2>
            <div><Label>Title</Label><Input value={section.title || ''} onChange={e => handleChange(section.id, 'title', e.target.value)} /></div>
            <div><Label>Content</Label><Textarea value={section.content || ''} onChange={e => handleChange(section.id, 'content', e.target.value)} rows={4} /></div>
            <div><Label>Image URL</Label><Input value={section.image_url || ''} onChange={e => handleChange(section.id, 'image_url', e.target.value)} /></div>
            {section.image_url && <img src={section.image_url} alt="Preview" className="h-20 rounded-lg border border-border object-cover" onError={e => (e.currentTarget.style.display = 'none')} />}
            <Button onClick={() => handleSave(section)} disabled={savingId === section.id}>
              {savingId === section.id ? 'Saving...' : 'Save'}
            </Button>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
