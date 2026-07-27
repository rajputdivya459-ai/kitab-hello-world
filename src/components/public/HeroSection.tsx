import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getHomepageContent } from '@/services/api';
import type { HomepageContent } from '@/types/database';
import { HeroSkeleton } from '@/components/common/Skeleton';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { withTimeout } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

export function HeroSection() {
  const [content, setContent] = useState<HomepageContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { getSetting } = useSiteSettings();

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const result = await withTimeout(getHomepageContent(), 10000, 'Load timed out');
        const data = Array.isArray(result) ? result : [];
        const hero = data.find((item) => item.section_key === 'hero');
        if (mounted) setContent(hero || null);
      } catch (err) {
        console.error('HeroSection load error:', err);
        if (mounted) setContent(null);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  const isMobile = useIsMobile();

  if (isLoading) return <HeroSkeleton />;

  const desktopImage = content?.image_url || getSetting('hero_image_url');
  const mobileImage = (content as any)?.mobile_image_url || getSetting('hero_mobile_image_url');
  const heroImage = isMobile && mobileImage ? mobileImage : desktopImage;
  const collegeName = getSetting('college_name', 'Mahatma Gandhi Mahavidhyala Ashta');
  const address = getSetting('address', 'Near Mukharji Ground, Kannod Road, Ashta, Sehore (M.P.)');

  return (
    <section className="relative min-h-screen h-screen flex items-center overflow-hidden">
      {/* Background Image */}
      {heroImage && (
        <div className="absolute inset-0">
          <img src={heroImage} alt={collegeName} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-primary/80" />
        </div>
      )}
      {!heroImage && <div className="absolute inset-0 bg-gradient-hero" />}

      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Floating Shapes */}
      <motion.div
        className="absolute top-20 right-20 w-64 h-64 rounded-full bg-accent/20 blur-3xl"
        animate={{ y: [0, -30, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="container-college relative z-10 py-12 md:py-0">
        <div className="max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-accent/20 text-accent rounded-full text-xs md:text-sm font-medium mb-4 md:mb-6">
              <MapPin className="w-3.5 h-3.5 md:w-4 md:h-4" />
              {address}
            </span>
          </motion.div>

          <motion.h1
            className="font-display text-3xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-4 md:mb-6 leading-tight"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            {content?.title || collegeName}
          </motion.h1>

          <motion.p
            className="text-lg md:text-2xl text-primary-foreground/90 mb-3 md:mb-4 font-display"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {content?.subtitle || getSetting('tagline', 'Empowering Future Leaders Since 1995')}
          </motion.p>

          <motion.p
            className="text-base md:text-lg text-primary-foreground/70 mb-8 md:mb-10 max-w-2xl"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            {content?.content || 'Affiliated to Barkatullah University, Bhopal. Quality education in Arts, Science & Commerce.'}
          </motion.p>

          <motion.div
            className="flex flex-wrap gap-3 md:gap-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <Link to={content?.cta_link || '/departments'}>
              <Button size="lg" className="bg-accent text-accent-foreground shadow-gold hover:bg-yellow-300">
                {content?.cta_text || 'Explore Programs'}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/contact">
              <Button size="lg"  className="bg-accent text-accent-foreground shadow-gold hover:bg-yellow-300">
                Contact Us
              </Button>
            </Link>
          </motion.div>

          {/* Admissions Badge */}
          <motion.div
            className="mt-6 md:mt-8 inline-flex items-center gap-3 px-4 md:px-5 py-2.5 md:py-3 bg-primary-foreground/10 backdrop-blur-sm rounded-xl border border-primary-foreground/20"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-accent"></span>
            </span>
            <span className="text-primary-foreground font-medium text-sm md:text-base">
              🎓 Admissions Open for 2026-27 Session
            </span>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
