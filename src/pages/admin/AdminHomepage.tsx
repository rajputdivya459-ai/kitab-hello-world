import { useEffect, useState } from 'react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { getAllHomepageContent, updateHomepageContent } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { withTimeout } from '@/lib/utils';
import { Skeleton } from '@/components/common/Skeleton';
import type { HomepageContent } from '@/types/database';

export default function AdminHomepage() {
  const [sections, setSections] = useState<HomepageContent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const result = await withTimeout(getAllHomepageContent(), 10000, 'Load timed out');
        const data = Array.isArray(result) ? result : [];
        if (mounted) setSections(data);
      } catch (err) {
        console.error('AdminHomepage load error:', err);
        if (mounted) setSections([]);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  const handleChange = (id: string, field: string, value: string | boolean) => {
    setSections(prev => (Array.isArray(prev) ? prev : []).map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const handleSave = async (section: HomepageContent) => {
    if (savingId) return;
    setSavingId(section.id);
    try {
      await withTimeout(
        updateHomepageContent(section.id, {
          title: section.title,
          subtitle: section.subtitle,
          content: section.content,
          image_url: section.image_url,
          mobile_image_url: (section as any).mobile_image_url,
          cta_text: section.cta_text,
          cta_link: section.cta_link,
          is_active: section.is_active,
        } as any),
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
          <h1 className="font-display text-2xl font-bold text-foreground">Homepage Content</h1>
          <p className="text-muted-foreground text-sm">Manage hero section and homepage content blocks.</p>
        </div>

        {(Array.isArray(sections) ? sections : []).map(section => (
          <div key={section.id} className="bg-card rounded-xl border border-border p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-foreground capitalize">{section.section_key.replace(/_/g, ' ')}</h2>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Active</span>
                <Switch checked={section.is_active} onCheckedChange={v => handleChange(section.id, 'is_active', v)} />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div><Label>Title</Label><Input value={section.title || ''} onChange={e => handleChange(section.id, 'title', e.target.value)} /></div>
              <div><Label>Subtitle</Label><Input value={section.subtitle || ''} onChange={e => handleChange(section.id, 'subtitle', e.target.value)} /></div>
            </div>
            <div><Label>Content</Label><Textarea value={section.content || ''} onChange={e => handleChange(section.id, 'content', e.target.value)} rows={3} /></div>
            <div><Label>Image URL (Desktop)</Label><Input value={section.image_url || ''} onChange={e => handleChange(section.id, 'image_url', e.target.value)} /></div>
            {section.image_url && <img src={section.image_url} alt="Preview" className="h-20 rounded-lg border border-border object-cover" onError={e => (e.currentTarget.style.display = 'none')} />}
            {section.section_key === 'hero' && (
              <>
                <div><Label>Image URL (Mobile)</Label><Input value={(section as any).mobile_image_url || ''} onChange={e => handleChange(section.id, 'mobile_image_url', e.target.value)} /></div>
                {(section as any).mobile_image_url && <img src={(section as any).mobile_image_url} alt="Mobile Preview" className="h-20 rounded-lg border border-border object-cover" onError={e => (e.currentTarget.style.display = 'none')} />}
              </>
            )}
            <div className="grid gap-4 md:grid-cols-2">
              <div><Label>CTA Text</Label><Input value={section.cta_text || ''} onChange={e => handleChange(section.id, 'cta_text', e.target.value)} /></div>
              <div><Label>CTA Link</Label><Input value={section.cta_link || ''} onChange={e => handleChange(section.id, 'cta_link', e.target.value)} /></div>
            </div>
            <Button onClick={() => handleSave(section)} disabled={savingId === section.id}>
              {savingId === section.id ? 'Saving...' : `Save ${section.section_key}`}
            </Button>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
