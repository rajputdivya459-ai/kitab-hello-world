import { useEffect, useState } from 'react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Skeleton } from '@/components/common/Skeleton';
import { Facebook, Instagram, Twitter, Linkedin, Youtube, Globe } from 'lucide-react';

interface SocialLink {
  id: string;
  platform_name: string;
  url: string | null;
  icon: string | null;
  order_index: number | null;
  is_active: boolean | null;
}

const iconMap: Record<string, typeof Globe> = {
  facebook: Facebook,
  instagram: Instagram,
  twitter: Twitter,
  linkedin: Linkedin,
  youtube: Youtube,
};

export default function AdminSocialLinks() {
  const [links, setLinks] = useState<SocialLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from('social_links')
      .select('*')
      .order('order_index')
      .then(({ data, error }) => {
        if (!error && data) setLinks(data as SocialLink[]);
        setIsLoading(false);
      });
  }, []);

  const handleChange = (id: string, field: string, value: string | boolean) => {
    setLinks((prev) =>
      prev.map((l) => (l.id === id ? { ...l, [field]: value } : l))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const l of links) {
        await supabase
          .from('social_links')
          .update({ url: l.url, is_active: l.is_active } as any)
          .eq('id', l.id);
      }
      toast.success('Social links saved!');
    } catch {
      toast.error('Failed to save');
    }
    setSaving(false);
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16" />)}
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Social Links</h1>
            <p className="text-muted-foreground text-sm">Manage your social media links.</p>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save All'}
          </Button>
        </div>

        <div className="grid gap-4">
          {links.map((link) => {
            const Icon = iconMap[link.icon || ''] || Globe;
            return (
              <div key={link.id} className="flex items-center gap-4 bg-card rounded-xl border border-border p-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <Label className="text-sm font-medium mb-1 block">{link.platform_name}</Label>
                  <Input
                    type="url"
                    placeholder={`https://${link.icon || 'example'}.com/...`}
                    value={link.url || ''}
                    onChange={(e) => handleChange(link.id, 'url', e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Label className="text-xs text-muted-foreground">Active</Label>
                  <Switch
                    checked={link.is_active ?? true}
                    onCheckedChange={(v) => handleChange(link.id, 'is_active', v)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
}
