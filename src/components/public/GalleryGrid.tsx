 import { useState } from 'react';
 import { motion, AnimatePresence } from 'framer-motion';
 import { X, ZoomIn } from 'lucide-react';
 import type { GalleryImage } from '@/types/database';
 
 interface GalleryGridProps {
   images: GalleryImage[];
 }
 
 export function GalleryGrid({ images }: GalleryGridProps) {
   const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
 
  const safeImages = Array.isArray(images) ? images : [];
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {safeImages.map((image, index) => (
           <motion.div
             key={image.id}
             initial={{ opacity: 0, scale: 0.9 }}
             whileInView={{ opacity: 1, scale: 1 }}
             viewport={{ once: true }}
             transition={{ duration: 0.4, delay: index * 0.05 }}
             className="group cursor-pointer"
             onClick={() => setSelectedImage(image)}
           >
             <div className="aspect-[4/3] relative overflow-hidden rounded-xl bg-secondary">
               <img
                 src={image.image_url}
                 alt={image.title || image.caption || 'Gallery image'}
                 className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
               />
               <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/40 transition-colors duration-300 flex items-center justify-center">
                 <ZoomIn className="h-10 w-10 text-primary-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
               </div>
               {image.category && (
                 <span className="absolute top-3 left-3 px-3 py-1 bg-accent text-accent-foreground text-xs font-medium rounded-full">
                   {image.category}
                 </span>
               )}
             </div>
             {(image.title || image.caption) && (
               <div className="mt-3">
                 {image.title && (
                   <h4 className="font-medium text-foreground">{image.title}</h4>
                 )}
                 {image.caption && (
                   <p className="text-sm text-muted-foreground">{image.caption}</p>
                 )}
               </div>
             )}
           </motion.div>
         ))}
       </div>
 
       {/* Lightbox */}
       <AnimatePresence>
         {selectedImage && (
           <motion.div
             className="fixed inset-0 z-50 flex items-center justify-center bg-primary/90 backdrop-blur-sm p-4"
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             onClick={() => setSelectedImage(null)}
           >
             <button
               className="absolute top-4 right-4 p-2 rounded-full bg-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/30 transition-colors"
               onClick={() => setSelectedImage(null)}
             >
               <X className="h-6 w-6" />
             </button>
             <motion.div
               className="max-w-4xl max-h-[80vh] w-full"
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.9, opacity: 0 }}
               onClick={(e) => e.stopPropagation()}
             >
               <img
                 src={selectedImage.image_url}
                 alt={selectedImage.title || selectedImage.caption || 'Gallery image'}
                 className="w-full h-full object-contain rounded-xl"
               />
               {(selectedImage.title || selectedImage.caption) && (
                 <div className="mt-4 text-center text-primary-foreground">
                   {selectedImage.title && (
                     <h3 className="font-display text-xl font-semibold">{selectedImage.title}</h3>
                   )}
                   {selectedImage.caption && (
                     <p className="text-primary-foreground/70 mt-1">{selectedImage.caption}</p>
                   )}
                 </div>
               )}
             </motion.div>
           </motion.div>
         )}
       </AnimatePresence>
     </>
   );
 }