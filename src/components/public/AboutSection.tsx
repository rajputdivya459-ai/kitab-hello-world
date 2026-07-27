import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Target, Eye, History, Heart, BookOpen, Award, Users, Landmark } from 'lucide-react';
import { getAboutSections } from '@/services/api';
import type { AboutSection as AboutSectionType } from '@/types/database';
import { Skeleton } from '@/components/common/Skeleton';
import { ProgramsSection } from '@/components/public/ProgramsSection';

const iconMap: Record<string, typeof Target> = {
  vision: Eye,
  mission: Target,
  history: History,
  values: Heart,
};

export function AboutSection() {
  const [sections, setSections] = useState<AboutSectionType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const result = await getAboutSections();
        const data = Array.isArray(result) ? result : [];
        if (mounted) setSections(data);
      } catch (err) {
        console.error('AboutSection load error:', err);
        if (mounted) setSections([]);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  return (
    <>
      {/* About College */}
      <section id="about" className="py-12 md:py-20 bg-primary/5">
        <div className="container-college">
          <motion.div
            className="text-center mb-10"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold text-primary mb-4">
              About Our College
            </h2>
            <p className="text-muted-foreground max-w-3xl mx-auto text-base md:text-lg leading-relaxed">
              Mahatma Gandhi Mahavidhyala Ashta, affiliated to Barkatullah University Bhopal,
              has been a beacon of quality education since 1995. Located near Mukharji Ground,
              Kannod Road, Ashta, District Sehore, Madhya Pradesh — we are committed to 
              nurturing students in Arts, Science, and Commerce streams.
            </p>
          </motion.div>

          {isLoading ? (
            <div className="space-y-12">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex gap-6 items-center">
                  <Skeleton className="w-14 h-14 rounded-xl" />
                  <div className="flex-1 space-y-3">
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-10">
              {(Array.isArray(sections) ? sections : []).map((section, index) => {
                const Icon = iconMap[section.section_key] || Target;
                return (
                  <motion.div
                    key={section.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start bg-card rounded-2xl p-6 border border-primary/10 shadow-sm"
                  >
                    <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-primary/15 flex items-center justify-center">
                      <Icon className="w-7 h-7 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-display text-xl md:text-2xl font-bold text-primary mb-2">
                        {section.title}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {section.content}
                      </p>
                    </div>
                    {section.image_url && (
                      <img
                        src={section.image_url}
                        alt={section.title || 'About section'}
                        className="w-full sm:w-40 md:w-52 h-40 sm:h-28 md:h-36 rounded-xl object-cover flex-shrink-0 border border-primary/10"
                        onError={(e) => (e.currentTarget.style.display = 'none')}
                      />
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Programs & Activities - Dynamic */}
      <ProgramsSection />
    </>
  );
}
