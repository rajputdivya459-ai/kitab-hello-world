 import { cn } from '@/lib/utils';
 
 interface SkeletonProps {
   className?: string;
 }
 
 export function Skeleton({ className }: SkeletonProps) {
   return (
     <div
       className={cn(
         'animate-pulse bg-muted rounded-lg',
         className
       )}
     />
   );
 }
 
 export function CardSkeleton() {
   return (
     <div className="bg-card rounded-xl border border-border p-6 space-y-4">
       <Skeleton className="h-48 w-full" />
       <Skeleton className="h-6 w-3/4" />
       <Skeleton className="h-4 w-full" />
       <Skeleton className="h-4 w-2/3" />
     </div>
   );
 }
 
 export function HeroSkeleton() {
   return (
     <div className="min-h-[80vh] flex items-center justify-center bg-primary/5">
       <div className="text-center space-y-6 max-w-3xl px-4">
         <Skeleton className="h-16 w-3/4 mx-auto" />
         <Skeleton className="h-8 w-2/3 mx-auto" />
         <Skeleton className="h-6 w-full" />
         <Skeleton className="h-12 w-48 mx-auto" />
       </div>
     </div>
   );
 }
 
 export function StatsSkeleton() {
   return (
     <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
       {[...Array(4)].map((_, i) => (
         <div key={i} className="text-center space-y-2">
           <Skeleton className="h-12 w-24 mx-auto" />
           <Skeleton className="h-4 w-20 mx-auto" />
         </div>
       ))}
     </div>
   );
 }