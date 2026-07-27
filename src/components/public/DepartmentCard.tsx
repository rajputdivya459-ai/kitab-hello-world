 import { motion } from 'framer-motion';
 import { Laptop, Briefcase, Settings, Palette, BookOpen } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
 import type { Department } from '@/types/database';
 
 const iconMap: Record<string, typeof Laptop> = {
   laptop: Laptop,
   briefcase: Briefcase,
   settings: Settings,
   palette: Palette,
   'book-open': BookOpen,
 };
 
 interface DepartmentCardProps {
   department: Department;
   index: number;
 }
 
 export function DepartmentCard({ department, index }: DepartmentCardProps) {
   const Icon = iconMap[department.icon || 'book-open'] || BookOpen;
 
   return (
     <motion.div
       initial={{ opacity: 0, y: 30 }}
       whileInView={{ opacity: 1, y: 0 }}
       viewport={{ once: true }}
       transition={{ duration: 0.5, delay: index * 0.1 }}
       className="group"
     >
        <div className="bg-card rounded-2xl border border-border p-6 md:p-8 h-full shadow-sm">
          <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
            <Icon className="h-7 w-7 text-primary" />
          </div>
         
         <h3 className="font-display text-xl font-semibold text-foreground mb-3">
           {department.name}
         </h3>
         
         <p className="text-muted-foreground mb-6 line-clamp-3">
           {department.description}
         </p>
 
         <Dialog>
           <DialogTrigger asChild>
             <Button variant="outline" className="w-full">
               View Details
             </Button>
           </DialogTrigger>
           <DialogContent className="max-w-lg">
             <DialogHeader>
               <DialogTitle className="font-display text-2xl flex items-center gap-3">
                 <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                   <Icon className="h-5 w-5 text-primary" />
                 </div>
                 {department.name}
               </DialogTitle>
             </DialogHeader>
             <div className="space-y-4 mt-4">
               <p className="text-muted-foreground">{department.description}</p>
               
               {department.head_of_department && (
                 <div>
                   <h4 className="font-semibold text-sm text-foreground mb-1">Head of Department</h4>
                   <p className="text-muted-foreground">{department.head_of_department}</p>
                 </div>
               )}
 
               {Array.isArray(department.courses) && department.courses.length > 0 && (
                 <div>
                   <h4 className="font-semibold text-sm text-foreground mb-2">Programs Offered</h4>
                   <ul className="space-y-2">
                     {department.courses.map((course, i) => (
                       <li key={i} className="flex items-center gap-2 text-muted-foreground">
                         <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                         {course}
                       </li>
                     ))}
                   </ul>
                 </div>
               )}
             </div>
           </DialogContent>
         </Dialog>
       </div>
     </motion.div>
   );
 }