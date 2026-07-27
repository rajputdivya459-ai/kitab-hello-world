import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SocialLink {
  id: string;
  platform_name: string;
  url: string | null;
  icon: string | null;
  is_active: boolean | null;
}

export function useSocialLinks() {
  const [links, setLinks] = useState<SocialLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const { data, error } = await supabase
          .from('social_links')
          .select('*')
          .eq('is_active', true)
          .order('order_index');

        if (error) {
          console.error('Supabase error (useSocialLinks):', error);
          if (mounted) setLinks([]);
        } else {
          const arr = Array.isArray(data) ? data : [];
          if (mounted) setLinks(arr.filter((l: SocialLink) => l.url && l.url.trim() !== ''));
        }
      } catch (err) {
        console.error('useSocialLinks load error:', err);
        if (mounted) setLinks([]);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  return { links, isLoading };
}
