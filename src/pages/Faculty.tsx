 import { useEffect, useState } from 'react';
 import { motion } from 'framer-motion';
 import { PublicLayout } from '@/layouts/PublicLayout';
 import { FacultyCard } from '@/components/public/FacultyCard';
 import { getFaculty, getDepartments } from '@/services/api';
 import type { Faculty as FacultyType, Department } from '@/types/database';
 import { CardSkeleton } from '@/components/common/Skeleton';
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
 
 export default function Faculty() {
   const [faculty, setFaculty] = useState<FacultyType[]>([]);
   const [departments, setDepartments] = useState<Department[]>([]);
   const [selectedDept, setSelectedDept] = useState<string>('all');
   const [isLoading, setIsLoading] = useState(true);
 
   useEffect(() => {
     let mounted = true;
     async function load() {
       try {
         const [facultyResult, deptResult] = await Promise.all([getFaculty(), getDepartments()]);
         const facultyData = Array.isArray(facultyResult) ? facultyResult : [];
         const deptData = Array.isArray(deptResult) ? deptResult : [];
         if (mounted) {
           setFaculty(facultyData);
           setDepartments(deptData);
         }
       } catch (err) {
         console.error('Faculty load error:', err);
         if (mounted) {
           setFaculty([]);
           setDepartments([]);
         }
       } finally {
         if (mounted) setIsLoading(false);
       }
     }
     load();
     return () => { mounted = false; };
   }, []);

   const safeFaculty = Array.isArray(faculty) ? faculty : [];
   const safeDepartments = Array.isArray(departments) ? departments : [];
   const filteredFaculty = selectedDept === 'all'
     ? safeFaculty
     : safeFaculty.filter((f) => f.department_id === selectedDept);
 
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
                Our Faculty
              </h1>
              <p className="text-xl text-primary-foreground/80">
                Meet our distinguished professors and educators who are experts in their fields and dedicated to student success.
              </p>
           </motion.div>
         </div>
       </section>
 
       {/* Filter & Grid */}
       <section className="section-padding">
         <div className="container-college">
           {/* Filter */}
           <div className="mb-8 flex justify-end">
             <Select value={selectedDept} onValueChange={setSelectedDept}>
               <SelectTrigger className="w-64">
                 <SelectValue placeholder="Filter by department" />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="all">All Departments</SelectItem>
                 {safeDepartments.map((dept) => (
                   <SelectItem key={dept.id} value={dept.id}>
                     {dept.name}
                   </SelectItem>
                 ))}
               </SelectContent>
             </Select>
           </div>
 
           {isLoading ? (
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
               {[...Array(8)].map((_, i) => (
                 <CardSkeleton key={i} />
               ))}
             </div>
           ) : filteredFaculty.length === 0 ? (
             <div className="text-center py-20">
               <p className="text-muted-foreground text-lg">No faculty members found.</p>
             </div>
           ) : (
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
               {filteredFaculty.map((member, index) => (
                 <FacultyCard key={member.id} faculty={member} index={index} />
               ))}
             </div>
           )}
         </div>
       </section>
     </PublicLayout>
   );
 }