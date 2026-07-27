 import { useEffect, useState } from 'react';
 import { motion } from 'framer-motion';
 import { PublicLayout } from '@/layouts/PublicLayout';
 import { GalleryGrid } from '@/components/public/GalleryGrid';
 import { getGalleryImages } from '@/services/api';
 import type { GalleryImage } from '@/types/database';
 import { Skeleton } from '@/components/common/Skeleton';
 
 export default function Gallery() {
   const [images, setImages] = useState<GalleryImage[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [selectedCategory, setSelectedCategory] = useState<string>('all');
 
   useEffect(() => {
     let mounted = true;
     async function load() {
       try {
         const result = await getGalleryImages();
         const data = Array.isArray(result) ? result : [];
         if (mounted) setImages(data);
       } catch (err) {
         console.error('Gallery load error:', err);
         if (mounted) setImages([]);
       } finally {
         if (mounted) setIsLoading(false);
       }
     }
     load();
     return () => { mounted = false; };
   }, []);

   const safeImages = Array.isArray(images) ? images : [];
   const categories = ['all', ...new Set(safeImages.map((img) => img.category).filter(Boolean))];

   const filteredImages = selectedCategory === 'all'
     ? safeImages
     : safeImages.filter((img) => img.category === selectedCategory);
 
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
                Campus Gallery
              </h1>
              <p className="text-xl text-primary-foreground/80">
                Explore memorable moments from campus life, events, and celebrations at MGCM.
              </p>
           </motion.div>
         </div>
       </section>
 
       {/* Gallery */}
       <section className="section-padding">
         <div className="container-college">
           {/* Category Filter */}
           {categories.length > 1 && (
             <div className="flex flex-wrap gap-2 mb-8 justify-center">
               {categories.map((cat) => (
                 <button
                   key={cat}
                   onClick={() => setSelectedCategory(cat as string)}
                   className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                     selectedCategory === cat
                       ? 'bg-primary text-primary-foreground'
                       : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                   }`}
                 >
                   {cat === 'all' ? 'All' : cat}
                 </button>
               ))}
             </div>
           )}
 
           {isLoading ? (
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
               {[...Array(6)].map((_, i) => (
                 <Skeleton key={i} className="aspect-[4/3]" />
               ))}
             </div>
           ) : filteredImages.length === 0 ? (
             <div className="text-center py-20">
               <p className="text-muted-foreground text-lg">No images in the gallery yet.</p>
             </div>
           ) : (
             <GalleryGrid images={filteredImages} />
           )}
         </div>
       </section>
     </PublicLayout>
   );
 }