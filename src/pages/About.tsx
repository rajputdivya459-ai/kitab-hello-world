import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Target, Eye, History, Award, Users, BookOpen, Heart } from 'lucide-react';
import { PublicLayout } from '@/layouts/PublicLayout';
import { getAboutSections, getStats } from '@/services/api';
import type { AboutSection, Stat } from '@/types/database';
import { Skeleton } from '@/components/common/Skeleton';
import { useSiteSettings } from '@/hooks/useSiteSettings';

const iconMap: Record<string, typeof Target> = {
  vision: Eye,
  mission: Target,
  history: History,
  values: Heart,
};

export default function About() {
  const [sections, setSections] = useState<AboutSection[]>([]);
  const [stats, setStats] = useState<Stat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { getSetting } = useSiteSettings();

  const collegeName = getSetting('college_name', 'Mahatma Gandhi Mahavidhyala Ashta');

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const [aboutResult, statsResult] = await Promise.all([getAboutSections(), getStats()]);
        const aboutData = Array.isArray(aboutResult) ? aboutResult : [];
        const statsData = Array.isArray(statsResult) ? statsResult : [];
        if (mounted) {
          setSections(aboutData);
          setStats(statsData);
        }
      } catch (err) {
        console.error('About load error:', err);
        if (mounted) {
          setSections([]);
          setStats([]);
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="py-20 bg-gradient-hero text-primary-foreground">
        <div className="container-college">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl"
          >
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-6">
              {getSetting('about_hero_title', `About ${collegeName}`)}
            </h1>
            <p className="text-xl text-primary-foreground/80">
              {getSetting('about_hero_subtitle', `${collegeName} has been committed to academic excellence, ethical values, and creating future leaders.`)}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Sections */}
      <section className="section-padding">
        <div className="container-college">
          {isLoading ? (
            <div className="space-y-16">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex gap-8 items-center">
                  <Skeleton className="w-16 h-16 rounded-xl" />
                  <div className="flex-1 space-y-4">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-16">
              {(Array.isArray(sections) ? sections : []).map((section, index) => {
                const Icon = iconMap[section.section_key] || Target;
                const isEven = index % 2 === 0;
                
                return (
                  <motion.div
                    key={section.id}
                    initial={{ opacity: 0, x: isEven ? -30 : 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className={`flex flex-col md:flex-row gap-8 items-center ${
                      isEven ? '' : 'md:flex-row-reverse'
                    }`}
                  >
                    <div className="flex-shrink-0">
                      <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <Icon className="w-10 h-10 text-primary" />
                      </div>
                    </div>
                    <div className="flex-1 text-center md:text-left">
                      <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4">
                        {section.title}
                      </h2>
                      <p className="text-muted-foreground text-lg leading-relaxed">
                        {section.content}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 bg-primary">
        <div className="container-college">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-display text-3xl md:text-4xl font-bold text-primary-foreground text-center mb-12"
          >
            {getSetting('about_stats_title', `${collegeName} by the Numbers`)}
          </motion.h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {(Array.isArray(stats) ? stats : []).map((stat, index) => (
              <motion.div
                key={stat.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl md:text-5xl font-bold text-accent mb-2">
                  {stat.value}
                </div>
                <div className="text-primary-foreground/80">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Location */}
      <section className="section-padding">
        <div className="container-college">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Our Location
            </h2>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-card rounded-2xl border border-border p-8 text-center"
          >
            <p className="text-lg text-foreground mb-2 font-semibold">
              {collegeName}
            </p>
            <p className="text-muted-foreground">
              {getSetting('address', 'Near Mukharji Ground, Kannod Road, Ashta, District Sehore, Madhya Pradesh')}
            </p>
          </motion.div>
        </div>
      </section>
    </PublicLayout>
  );
}
