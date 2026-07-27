 import { motion } from 'framer-motion';
 import { Calendar, MapPin, Clock } from 'lucide-react';
 import { format, isPast, isFuture } from 'date-fns';
 import type { Event } from '@/types/database';
 import { Badge } from '@/components/ui/badge';
 
 interface EventCardProps {
   event: Event;
   index: number;
 }
 
 export function EventCard({ event, index }: EventCardProps) {
   const eventDate = event.event_date ? new Date(event.event_date) : null;
   const isUpcoming = eventDate && isFuture(eventDate);
   const isPastEvent = eventDate && isPast(eventDate);
 
   return (
     <motion.div
       initial={{ opacity: 0, x: -30 }}
       whileInView={{ opacity: 1, x: 0 }}
       viewport={{ once: true }}
       transition={{ duration: 0.5, delay: index * 0.1 }}
       className="group"
     >
       <div className="flex gap-6 bg-card rounded-2xl border border-border p-6 lg:min-h-[180px] lg:py-8 hover:shadow-college-lg hover:border-accent/30 transition-all duration-300">
         {/* Date Box */}
         {eventDate && (
           <div className="flex-shrink-0 w-20 h-20 rounded-xl bg-primary flex flex-col items-center justify-center text-primary-foreground">
             <span className="text-2xl font-bold">{format(eventDate, 'd')}</span>
             <span className="text-sm uppercase">{format(eventDate, 'MMM')}</span>
           </div>
         )}
 
         {/* Content */}
         <div className="flex-1 min-w-0">
           <div className="flex items-start justify-between gap-4 mb-2">
             <h3 className="font-display text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
               {event.title}
             </h3>
             <div className="flex gap-2 flex-shrink-0">
               {event.is_featured && (
                 <Badge className="bg-accent text-accent-foreground">Featured</Badge>
               )}
               {isUpcoming && (
                 <Badge variant="outline" className="border-green-500 text-green-600">Upcoming</Badge>
               )}
               {isPastEvent && (
                 <Badge variant="outline" className="border-muted-foreground text-muted-foreground">Past</Badge>
               )}
             </div>
           </div>
 
           <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
             {event.description}
           </p>
 
           <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
             {eventDate && (
               <div className="flex items-center gap-1.5">
                 <Clock className="h-4 w-4" />
                 <span>{format(eventDate, 'h:mm a')}</span>
               </div>
             )}
             {event.location && (
               <div className="flex items-center gap-1.5">
                 <MapPin className="h-4 w-4" />
                 <span>{event.location}</span>
               </div>
             )}
           </div>
         </div>
       </div>
     </motion.div>
   );
 }