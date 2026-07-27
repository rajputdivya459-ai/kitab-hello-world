import { motion } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSiteSettings } from '@/hooks/useSiteSettings';

const defaultDesktop = 'https://i.pinimg.com/736x/cb/f7/3e/cbf73e976099716e0afe01b6eb78ff53.jpg';
const defaultMobile = 'https://i.pinimg.com/736x/cb/f7/3e/cbf73e976099716e0afe01b6eb78ff53.jpg';

export function CollegePhotoSection() {
  const isMobile = useIsMobile();
  const { getSetting } = useSiteSettings();

  const imageUrl = isMobile
    ? getSetting('college_photo_mobile', defaultMobile)
    : getSetting('college_photo_desktop', defaultDesktop);
  const title = getSetting('college_photo_title', 'Mahatma Gandhi Mahavidhyala Ashta');
  const tagline = getSetting('college_photo_tagline', 'Empowering Minds, Building Futures Since 1995');

  return (
    <section className="relative w-full h-screen overflow-hidden">
      <motion.div
        className="relative w-full h-full"
        initial={{ opacity: 0, scale: 1.05 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
      >
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-end pb-12 md:pb-16 px-4 text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <h2 className="font-display text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-2 md:mb-3 drop-shadow-lg">
            {title}
          </h2>
          <p className="text-white/90 text-sm md:text-lg lg:text-xl font-medium drop-shadow-md max-w-2xl">
            {tagline}
          </p>
        </motion.div>
      </motion.div>
    </section>
  );
}
