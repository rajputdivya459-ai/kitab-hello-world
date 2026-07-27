 import { useEffect, useState, useCallback } from 'react';
 import { motion } from 'framer-motion';
 import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
 import { format } from 'date-fns';
 import { getUpcomingEvents, getFeaturedEvents, getEvents } from '@/services/api';
 import type { Event } from '@/types/database';
 import { Skeleton } from '@/components/common/Skeleton';
 
 export function EventsCarousel() {
   const [events, setEvents] = useState<Event[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [currentIndex, setCurrentIndex] = useState(0);
 
   useEffect(() => {
     let mounted = true;
     async function load() {
       try {
         let result = await getUpcomingEvents();
         let data = Array.isArray(result) ? result : [];
         if (data.length === 0) {
           result = await getFeaturedEvents();
           data = Array.isArray(result) ? result : [];
         }
         if (data.length === 0) {
           result = await getEvents();
           data = Array.isArray(result) ? result.slice(0, 5) : [];
         }
         if (mounted) setEvents(data);
       } catch (err) {
         console.error('EventsCarousel load error:', err);
         if (mounted) setEvents([]);
       } finally {
         if (mounted) setIsLoading(false);
       }
     }
     load();
     return () => { mounted = false; };
   }, []);
 
   const nextSlide = useCallback(() => {
     setCurrentIndex((prev) => (prev + 1) % events.length);
   }, [events.length]);
 
   const prevSlide = useCallback(() => {
     setCurrentIndex((prev) => (prev - 1 + events.length) % events.length);
   }, [events.length]);
 
   useEffect(() => {
     if (events.length > 1) {
       const interval = setInterval(nextSlide, 5000);
       return () => clearInterval(interval);
     }
   }, [events.length, nextSlide]);
 
   if (isLoading) {
     return (
       <div className="relative h-64 lg:h-80 bg-secondary rounded-2xl overflow-hidden">
         <Skeleton className="w-full h-full" />
       </div>
     );
   }
 
   if (events.length === 0) {
     return (
       <div className="relative h-64 lg:h-80 bg-secondary rounded-2xl flex items-center justify-center">
         <p className="text-muted-foreground">No events yet</p>
       </div>
     );
   }
 
   return (
     <div className="relative overflow-hidden rounded-2xl bg-primary">
       <div className="relative h-80 lg:h-[28rem] min-h-[20rem]">
         {events.map((event, index) => (
           <motion.div
             key={event.id}
             className="absolute inset-0 p-6 md:p-8 flex flex-col justify-end"
             initial={{ opacity: 0, x: 100 }}
             animate={{
               opacity: index === currentIndex ? 1 : 0,
               x: index === currentIndex ? 0 : 100,
             }}
             transition={{ duration: 0.5 }}
           >
             {event.image_url ? (
               <img
                 src={event.image_url}
                 alt={event.title}
                 className="absolute inset-0 w-full h-full object-cover opacity-40"
               />
             ) : (
               <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/80" />
             )}
             <div className="relative z-10">
               {event.is_featured && (
                 <span className="inline-block px-3 py-1 bg-accent text-accent-foreground text-xs font-medium rounded-full mb-4">
                   Featured Event
                 </span>
               )}
               <h3 className="font-display text-2xl md:text-3xl font-bold text-primary-foreground mb-2">
                 {event.title}
               </h3>
               {event.event_date && (
                 <div className="flex items-center gap-2 text-primary-foreground/80">
                   <Calendar className="h-4 w-4" />
                   <span>{format(new Date(event.event_date), 'EEEE, MMMM d, yyyy')}</span>
                 </div>
               )}
               <p className="text-primary-foreground/70 mt-2 line-clamp-2 max-w-2xl">
                 {event.description}
               </p>
             </div>
           </motion.div>
         ))}
       </div>
 
       {/* Navigation */}
       {events.length > 1 && (
         <>
           <button
             onClick={prevSlide}
             className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/30 transition-colors"
           >
             <ChevronLeft className="h-6 w-6" />
           </button>
           <button
             onClick={nextSlide}
             className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/30 transition-colors"
           >
             <ChevronRight className="h-6 w-6" />
           </button>
 
           {/* Dots */}
           <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
             {events.map((_, index) => (
               <button
                 key={index}
                 onClick={() => setCurrentIndex(index)}
                 className={`w-2 h-2 rounded-full transition-colors ${
                   index === currentIndex
                     ? 'bg-accent'
                     : 'bg-primary-foreground/30'
                 }`}
               />
             ))}
           </div>
         </>
       )}
     </div>
   );
 }