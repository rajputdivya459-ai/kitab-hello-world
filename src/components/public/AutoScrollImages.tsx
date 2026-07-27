import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getGalleryImages } from '@/services/api';
import type { GalleryImage } from '@/types/database';

export function AutoScrollImages() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const result = await getGalleryImages();
        const data = Array.isArray(result) ? result : [];
        if (mounted) setImages(data.filter(img => img.is_featured));
      } catch (err) {
        console.error('AutoScrollImages load error:', err);
        if (mounted) setImages([]);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="animate-pulse flex space-x-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="w-72 h-48 bg-muted rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (images.length === 0) {
    return null;
  }

  // Duplicate images for infinite scroll effect
  const duplicatedImages = [...images, ...images, ...images];

  return (
    <section className="py-16 bg-secondary/30 overflow-hidden">
      <div className="container-college mb-8">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Campus Life
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Experience the vibrant atmosphere at Mahatma Gandhi College of Management
          </p>
        </motion.div>
      </div>

      <div className="relative group">
        <motion.div
          className="flex gap-6 py-4"
          animate={{
            x: [0, -100 * images.length],
          }}
          transition={{
            x: {
              repeat: Infinity,
              repeatType: "loop",
              duration: images.length * 5,
              ease: "linear",
            },
          }}
          whileHover={{ animationPlayState: 'paused' }}
        >
          {duplicatedImages.map((image, index) => (
            <div
              key={`${image.id}-${index}`}
              className="flex-shrink-0 w-72 md:w-96 group/card"
            >
              <div className="relative overflow-hidden rounded-2xl shadow-md">
                <img
                  src={image.image_url}
                  alt={image.title || 'Campus image'}
                  className="w-full h-48 md:h-64 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent">
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-white font-semibold text-sm md:text-lg">{image.title}</h3>
                    {image.caption && (
                      <p className="text-white/80 text-xs md:text-sm mt-1">{image.caption}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
