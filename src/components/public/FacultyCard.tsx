 import { motion } from 'framer-motion';
 import { Mail, Phone, User } from 'lucide-react';
 import type { Faculty } from '@/types/database';
 
 interface FacultyCardProps {
   faculty: Faculty;
   index: number;
 }
 
 export function FacultyCard({ faculty, index }: FacultyCardProps) {
   return (
     <motion.div
       initial={{ opacity: 0, scale: 0.95 }}
       whileInView={{ opacity: 1, scale: 1 }}
       viewport={{ once: true }}
       transition={{ duration: 0.4, delay: index * 0.05 }}
       className="group"
     >
       <div className="bg-card rounded-2xl border border-border overflow-hidden hover:shadow-college-lg transition-all duration-300 hover:-translate-y-1">
         <div className="aspect-[4/5] relative overflow-hidden bg-secondary">
           {faculty.photo_url ? (
             <img
               src={faculty.photo_url}
               alt={faculty.name}
               className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
             />
           ) : (
             <div className="w-full h-full flex items-center justify-center">
               <User className="w-20 h-20 text-muted-foreground/30" />
             </div>
           )}
           <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
         </div>
         
         <div className="p-5">
           <h3 className="font-display text-lg font-semibold text-foreground mb-1">
             {faculty.name}
           </h3>
           <p className="text-accent text-sm font-medium mb-2">
             {faculty.designation}
           </p>
           {faculty.departments && (
             <p className="text-muted-foreground text-sm mb-3">
               {faculty.departments.name}
             </p>
           )}
           
           <div className="flex gap-2 pt-3 border-t border-border">
             {faculty.email && (
               <a
                 href={`mailto:${faculty.email}`}
                 className="p-2 rounded-lg bg-secondary hover:bg-primary hover:text-primary-foreground transition-colors"
                 aria-label="Email"
               >
                 <Mail className="h-4 w-4" />
               </a>
             )}
             {faculty.phone && (
               <a
                 href={`tel:${faculty.phone}`}
                 className="p-2 rounded-lg bg-secondary hover:bg-primary hover:text-primary-foreground transition-colors"
                 aria-label="Phone"
               >
                 <Phone className="h-4 w-4" />
               </a>
             )}
           </div>
         </div>
       </div>
     </motion.div>
   );
 }