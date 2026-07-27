import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Users, GraduationCap, BookOpen, Award } from 'lucide-react';
import { getStats } from '@/services/api';
import type { Stat } from '@/types/database';
import { StatsSkeleton } from '@/components/common/Skeleton';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const iconMap: Record<string, typeof Users> = {
  users: Users,
  'graduation-cap': GraduationCap,
  'book-open': BookOpen,
  award: Award,
};

function AnimatedCounter({ value, isVisible }: { value: string; isVisible: boolean }) {
  const str = value != null ? String(value) : '';
  const numericMatch = str.match(/^(\d+)/);
  const suffix = str.replace(/^\d+/, '');
  const target = numericMatch ? parseInt(numericMatch[1], 10) : 0;

  const [count, setCount] = useState(target);

  useEffect(() => {
    if (!numericMatch) return;

    // If not visible, just show final number
    if (!isVisible) {
      setCount(target);
      return;
    }

    let start = 0;
    const duration = 1500;
    const startTime = performance.now();

    const animate = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const current = Math.floor(progress * target);
      setCount(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [target, isVisible]);

  if (!numericMatch) return <span>{str || '0'}</span>;

  return <span>{count}{suffix}</span>;
}

export function StatsSection() {
  const [stats, setStats] = useState<Stat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { ref, isVisible } = useScrollReveal<HTMLDivElement>(0);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const result = await getStats();
        const raw = Array.isArray(result) ? result : [];
        const data = raw.map((row: Record<string, unknown>) => ({
          id: String(row?.id ?? ''),
          label: String(row?.label ?? ''),
          value: String(row?.value ?? ''),
          icon: row?.icon != null ? String(row.icon) : null,
          order_index: Number(row?.order_index) ?? 0,
          is_active: row?.is_active !== false,
          created_at: String(row?.created_at ?? ''),
          updated_at: String(row?.updated_at ?? ''),
        }));
        if (mounted) setStats(data as Stat[]);
      } catch (err) {
        console.error('StatsSection load error:', err);
        if (mounted) setStats([]);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  if (isLoading) {
    return (
      <section className="py-16 bg-secondary">
        <div className="container-college">
          <StatsSkeleton />
        </div>
      </section>
    );
  }

  const statsList = Array.isArray(stats) ? stats : [];
  console.log(statsList);
  if (statsList.length === 0) {
    return (
      <section className="py-20 bg-gradient-to-b from-secondary to-background">
        <div className="container-college text-center">
          <p className="text-muted-foreground">No statistics configured. Add stats in Admin → Statistics.</p>
        </div>
      </section>
    );
  }

  return (
    <section ref={ref} className="py-20 bg-gradient-to-b from-secondary to-background">
      <div className="container-college">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {statsList.map((stat, index) => {
            const Icon = iconMap[stat.icon || 'award'] || Award;
            return (
              <motion.div
                key={stat.id}
                className="text-center group p-4 md:p-6 rounded-2xl bg-card shadow-sm border border-border/50"
                initial={{ opacity: 1, y: 50 }}
                animate={{
                  opacity: 1,
                  y: isVisible ? 0 : 50,
                }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="inline-flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-primary/10 text-primary mb-3 md:mb-4">
                  <Icon className="h-7 w-7 md:h-8 md:w-8" />
                </div>
                <h3 className="font-display text-3xl md:text-4xl font-bold text-primary mb-2">
                  <AnimatedCounter value={stat.value} isVisible={isVisible} />
                </h3>
                <p className="text-muted-foreground font-medium text-sm md:text-base">{stat.label}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
