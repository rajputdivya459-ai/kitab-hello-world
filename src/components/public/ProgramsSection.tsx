import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Award, Users, BookOpen, Heart, Target, Landmark } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/common/Skeleton';

interface Program {
  id: string;
  title: string;
  description: string | null;
  icon: string | null;
  is_active: boolean;
  order_index: number;
}

const iconMap: Record<string, typeof Award> = {
  award: Award,
  users: Users,
  'book-open': BookOpen,
  heart: Heart,
  target: Target,
  landmark: Landmark,
};

export function ProgramsSection() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    supabase
      .from('programs_activities')
      .select('*')
      .eq('is_active', true)
      .order('order_index')
      .then(({ data, error }) => {
        if (mounted) {
          if (!error && data) setPrograms(data as Program[]);
          setIsLoading(false);
        }
      });
    return () => { mounted = false; };
  }, []);

  if (isLoading) {
    return (
      <section className="py-12 md:py-20 bg-primary/[0.03]">
        <div className="container-college">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}
          </div>
        </div>
      </section>
    );
  }

  if (!programs.length) return null;

  return (
    <section id="programs" className="py-12 md:py-20 bg-primary/[0.03]">
      <div className="container-college">
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="font-display text-3xl md:text-4xl font-bold text-primary mb-4">
            Programs & Activities
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {programs.map((item, index) => {
            const Icon = iconMap[item.icon || ''] || Award;
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center p-6 md:p-8 bg-card rounded-2xl border border-primary/10 shadow-sm"
              >
                <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto mb-5">
                  <Icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-display text-lg font-semibold text-primary mb-3">
                  {item.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
