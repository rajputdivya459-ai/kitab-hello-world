import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { PublicLayout } from '@/layouts/PublicLayout';
import { HeroSection } from '@/components/public/HeroSection';
import { CollegePhotoSection } from '@/components/public/CollegePhotoSection';
import { StatsSection } from '@/components/public/StatsSection';
import { AboutSection } from '@/components/public/AboutSection';
import { DepartmentCard } from '@/components/public/DepartmentCard';
import { EventsCarousel } from '@/components/public/EventsCarousel';
import { AutoScrollImages } from '@/components/public/AutoScrollImages';
import { MembersCarousel } from '@/components/public/MembersCarousel';
import { ExploreCampusSection } from '@/components/public/ExploreCampusSection';
import { Button } from '@/components/ui/button';
import { getDepartments } from '@/services/api';
import type { Department } from '@/types/database';
import { CardSkeleton } from '@/components/common/Skeleton';
import { useSiteSettings } from '@/hooks/useSiteSettings';

const Index = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { getSetting } = useSiteSettings();

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const result = await getDepartments();
        const data = Array.isArray(result) ? result : [];
        if (mounted) setDepartments(data.slice(0, 4));
      } catch (err) {
        console.error('Index load error:', err);
        if (mounted) setDepartments([]);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  const collegeName = getSetting('college_name', 'Mahatma Gandhi Mahavidhyala Ashta');

  return (
    <PublicLayout>
      <HeroSection />
      <CollegePhotoSection />
      <StatsSection />
      <AboutSection />
      <AutoScrollImages />
      <MembersCarousel />

      {/* Featured Departments */}
      <section className="py-12 md:py-20">
        <div className="container-college">
          <motion.div
            className="text-center mb-10 md:mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              {getSetting('departments_section_title', 'Our Departments')}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {getSetting('departments_section_subtitle', 'Explore our diverse range of academic programs in Arts, Science, and Commerce.')}
            </p>
          </motion.div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {(Array.isArray(departments) ? departments : []).map((dept, index) => (
                <DepartmentCard key={dept.id} department={dept} index={index} />
              ))}
            </div>
          )}

          <div className="text-center mt-8 md:mt-10">
            <Link to="/departments">
              <Button variant="outline" size="lg">
                View All Departments
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <ExploreCampusSection />

      {/* Events Section */}
      <section className="py-12 md:py-20">
        <div className="container-college">
          <motion.div
            className="text-center mb-10 md:mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              {getSetting('events_section_title', 'Upcoming Events')}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {getSetting('events_section_subtitle', `Stay updated with the latest happenings at ${collegeName}.`)}
            </p>
          </motion.div>

          <EventsCarousel />

          <div className="text-center mt-8 md:mt-10">
            <Link to="/events">
              <Button variant="outline" size="lg">
                View All Events
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-20 bg-primary">
        <div className="container-college text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
              {getSetting('cta_title', 'Ready to Start Your Journey?')}
            </h2>
            <p className="text-primary-foreground/80 mb-6 md:mb-8 text-base md:text-lg">
              {getSetting('cta_description', `Join our vibrant academic community at ${collegeName}. Quality education in Arts, Science & Commerce.`)}
            </p>
            <div className="flex flex-wrap justify-center gap-3 md:gap-4">
              <Link to="/contact">
                <Button size="lg" className="bg-accent text-accent-foreground shadow-gold hover:bg-yellow-200">
                  {getSetting('cta_button_text', 'Apply Now')}
                </Button>
              </Link>
              <a href={getSetting('university_link', 'https://bubhopal.ac.in/1068/Home')} target="_blank" rel="noopener noreferrer">
                <Button size="lg" className="bg-accent text-accent-foreground shadow-gold hover:bg-yellow-200">
                  {getSetting('university_button_text', 'Visit University')}
                </Button>
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default Index;
