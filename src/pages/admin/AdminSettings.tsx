import { useEffect, useState } from 'react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Skeleton } from '@/components/common/Skeleton';
import { Settings, Globe, MessageCircle, Image as ImageIcon } from 'lucide-react';

interface SettingRow {
  id: string;
  setting_key: string;
  setting_value: string | null;
  setting_type: string;
  category: string;
  label: string | null;
}

const categoryConfig: Record<string, { title: string; icon: typeof Settings }> = {
  general: { title: 'General Settings', icon: Settings },
  college_photo: { title: 'College Photo Section', icon: ImageIcon },
  whatsapp: { title: 'WhatsApp Integration', icon: MessageCircle },
};

export default function AdminSettings() {
  const [settings, setSettings] = useState<SettingRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from('site_settings')
      .select('*')
      .order('category')
      .then(({ data, error }) => {
        if (!error && data) setSettings(data as SettingRow[]);
        setIsLoading(false);
      });
  }, []);

  const handleChange = (key: string, value: string) => {
    setSettings((prev) =>
      prev.map((s) => (s.setting_key === key ? { ...s, setting_value: value } : s))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const s of settings) {
        await supabase
          .from('site_settings')
          .update({ setting_value: s.setting_value } as any)
          .eq('id', s.id);
      }
      toast.success('Settings saved successfully!');
    } catch {
      toast.error('Failed to save settings');
    }
    setSaving(false);
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-16" />)}
        </div>
      </AdminLayout>
    );
  }

  const grouped = settings.reduce<Record<string, SettingRow[]>>((acc, s) => {
    (acc[s.category] = acc[s.category] || []).push(s);
    return acc;
  }, {});

  return (
    <AdminLayout>
      <div className="space-y-8 max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Site Settings</h1>
            <p className="text-muted-foreground text-sm">Manage all website content dynamically.</p>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save All Changes'}
          </Button>
        </div>

        {Object.entries(categoryConfig).map(([cat, config]) => {
          const items = grouped[cat];
          if (!items?.length) return null;
          const Icon = config.icon;
          return (
            <div key={cat} className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h2 className="font-display text-lg font-semibold text-foreground">{config.title}</h2>
              </div>
              <div className="grid gap-5">
                {items.map((s) => (
                  <div key={s.id}>
                    <Label className="mb-1.5 block text-sm font-medium">{s.label || s.setting_key}</Label>
                    {s.setting_type === 'textarea' ? (
                      <Textarea
                        value={s.setting_value || ''}
                        onChange={(e) => handleChange(s.setting_key, e.target.value)}
                        rows={3}
                      />
                    ) : (
                      <Input
                        type={s.setting_type === 'url' ? 'url' : 'text'}
                        value={s.setting_value || ''}
                        onChange={(e) => handleChange(s.setting_key, e.target.value)}
                      />
                    )}
                    {s.setting_type === 'url' && s.setting_value && (
                      <div className="mt-2">
                        <img
                          src={s.setting_value}
                          alt="Preview"
                          className="h-20 w-auto rounded-lg border border-border object-cover"
                          onError={(e) => (e.currentTarget.style.display = 'none')}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </AdminLayout>
  );
}
