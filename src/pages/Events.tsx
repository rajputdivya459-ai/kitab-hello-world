 import { useEffect, useState } from 'react';
 import { motion } from 'framer-motion';
 import { PublicLayout } from '@/layouts/PublicLayout';
 import { EventCard } from '@/components/public/EventCard';
 import { getEvents } from '@/services/api';
 import type { Event } from '@/types/database';
 import { Skeleton } from '@/components/common/Skeleton';
 import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
 import { isFuture, isPast } from 'date-fns';
 
 export default function Events() {
   const [events, setEvents] = useState<Event[]>([]);
   const [isLoading, setIsLoading] = useState(true);
 
   useEffect(() => {
     let mounted = true;
     async function load() {
       try {
         const result = await getEvents();
         const data = Array.isArray(result) ? result : [];
         if (mounted) setEvents(data);
       } catch (err) {
         console.error('Events load error:', err);
         if (mounted) setEvents([]);
       } finally {
         if (mounted) setIsLoading(false);
       }
     }
     load();
     return () => { mounted = false; };
   }, []);

   const safeEvents = Array.isArray(events) ? events : [];
   const upcomingEvents = safeEvents.filter((e) => e.event_date && isFuture(new Date(e.event_date)));
   const pastEvents = safeEvents.filter((e) => e.event_date && isPast(new Date(e.event_date)));
 
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
                Events & Announcements
              </h1>
              <p className="text-xl text-primary-foreground/80">
                Stay informed about upcoming events, seminars, placement drives, and cultural activities at MGCM.
              </p>
           </motion.div>
         </div>
       </section>
 
       {/* Events List */}
       <section className="section-padding">
         <div className="container-college">
           {isLoading ? (
             <div className="space-y-6">
               {[...Array(4)].map((_, i) => (
                 <Skeleton key={i} className="h-32 w-full" />
               ))}
             </div>
           ) : safeEvents.length === 0 ? (
             <div className="text-center py-20">
               <p className="text-muted-foreground text-lg">No events available yet.</p>
             </div>
           ) : (
             <Tabs defaultValue="upcoming">
               <TabsList className="mb-8">
                 <TabsTrigger value="upcoming">
                   Upcoming ({upcomingEvents.length})
                 </TabsTrigger>
                 <TabsTrigger value="past">
                   Past ({pastEvents.length})
                 </TabsTrigger>
                 <TabsTrigger value="all">
                   All ({safeEvents.length})
                 </TabsTrigger>
               </TabsList>
 
               <TabsContent value="upcoming" className="space-y-6">
                 {upcomingEvents.length === 0 ? (
                   <p className="text-center py-10 text-muted-foreground">No upcoming events.</p>
                 ) : (
                   upcomingEvents.map((event, index) => (
                     <EventCard key={event.id} event={event} index={index} />
                   ))
                 )}
               </TabsContent>
 
               <TabsContent value="past" className="space-y-6">
                 {pastEvents.length === 0 ? (
                   <p className="text-center py-10 text-muted-foreground">No past events.</p>
                 ) : (
                   pastEvents.map((event, index) => (
                     <EventCard key={event.id} event={event} index={index} />
                   ))
                 )}
               </TabsContent>
 
               <TabsContent value="all" className="space-y-6">
                 {safeEvents.map((event, index) => (
                   <EventCard key={event.id} event={event} index={index} />
                 ))}
               </TabsContent>
             </Tabs>
           )}
         </div>
       </section>
     </PublicLayout>
   );
 }