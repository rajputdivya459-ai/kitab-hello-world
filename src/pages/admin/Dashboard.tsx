 import { useEffect, useState } from 'react';
 import { motion } from 'framer-motion';
import { Building2, Users, Calendar, Image, MessageSquare, Eye, UserCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '@/layouts/AdminLayout';
import {
  getAllDepartments,
  getAllFaculty,
  getAllEvents,
  getAllGalleryImages,
  getContactSubmissions,
  getAllMembers,
} from '@/services/api';
 import { Skeleton } from '@/components/common/Skeleton';
 import { DashboardWidgets } from '@/components/admin/DashboardWidgets';
 import { ExecutiveKPIs } from '@/components/admin/ExecutiveKPIs';

 
 interface StatCardProps {
   title: string;
   value: number;
   icon: typeof Building2;
   href: string;
   index: number;
 }
 
 function StatCard({ title, value, icon: Icon, href, index }: StatCardProps) {
   return (
     <motion.div
       initial={{ opacity: 0, y: 20 }}
       animate={{ opacity: 1, y: 0 }}
       transition={{ delay: index * 0.1 }}
     >
       <Link to={href}>
         <div className="bg-card rounded-xl border border-border p-6 hover:shadow-college-lg hover:border-accent/30 transition-all">
           <div className="flex items-center justify-between mb-4">
             <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
               <Icon className="h-6 w-6 text-primary" />
             </div>
             <Eye className="h-5 w-5 text-muted-foreground" />
           </div>
           <h3 className="text-3xl font-bold text-foreground mb-1">{value}</h3>
           <p className="text-muted-foreground">{title}</p>
         </div>
       </Link>
     </motion.div>
   );
 }
 
 export default function Dashboard() {
  const [stats, setStats] = useState({
    departments: 0,
    faculty: 0,
    events: 0,
    gallery: 0,
    messages: 0,
    unreadMessages: 0,
    members: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getAllDepartments(),
      getAllFaculty(),
      getAllEvents(),
      getAllGalleryImages(),
      getContactSubmissions(),
      getAllMembers(),
    ])
      .then(([departments, faculty, events, gallery, messages, members]) => {
        setStats({
          departments: departments.length,
          faculty: faculty.length,
          events: events.length,
          gallery: gallery.length,
          messages: messages.length,
          unreadMessages: messages.filter((m) => !m.is_read).length,
          members: members.length,
        });
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);
 
  const statCards = [
    { title: 'Departments', value: stats.departments, icon: Building2, href: '/admin/departments' },
    { title: 'Members', value: stats.members, icon: UserCheck, href: '/admin/members' },
    { title: 'Faculty', value: stats.faculty, icon: Users, href: '/admin/faculty' },
    { title: 'Events', value: stats.events, icon: Calendar, href: '/admin/events' },
    { title: 'Gallery', value: stats.gallery, icon: Image, href: '/admin/gallery' },
    { title: 'Messages', value: stats.messages, icon: MessageSquare, href: '/admin/messages' },
  ];
 
   return (
     <AdminLayout>
       <div className="space-y-8">
         {/* Welcome */}
         <div>
           <h1 className="font-display text-3xl font-bold text-foreground mb-2">
             Welcome to Admin Dashboard
           </h1>
           <p className="text-muted-foreground">
             Manage your college website content from here.
           </p>
         </div>
 
          <ExecutiveKPIs />

          {/* Stats Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-36" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
              {statCards.map((card, index) => (
                <StatCard key={card.title} {...card} index={index} />
              ))}
            </div>
          )}

          <DashboardWidgets />


 
         {/* Unread Messages Alert */}
         {stats.unreadMessages > 0 && (
           <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             className="bg-accent/10 border border-accent/30 rounded-xl p-6"
           >
             <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
                 <MessageSquare className="h-6 w-6 text-accent-foreground" />
               </div>
               <div className="flex-1">
                 <h3 className="font-semibold text-foreground">
                   You have {stats.unreadMessages} unread message{stats.unreadMessages > 1 ? 's' : ''}
                 </h3>
                 <p className="text-muted-foreground text-sm">
                   Check your inbox to respond to inquiries.
                 </p>
               </div>
               <Link
                 to="/admin/messages"
                 className="px-4 py-2 bg-accent text-accent-foreground rounded-lg font-medium hover:bg-accent/90 transition-colors"
               >
                 View Messages
               </Link>
             </div>
           </motion.div>
         )}
 
         {/* Quick Actions */}
         <div>
           <h2 className="font-display text-xl font-semibold text-foreground mb-4">
             Quick Actions
           </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {[
                { label: 'Add Department', href: '/admin/departments' },
                { label: 'Add Member', href: '/admin/members' },
                { label: 'Add Faculty', href: '/admin/faculty' },
                { label: 'Create Event', href: '/admin/events' },
                { label: 'Upload to Gallery', href: '/admin/gallery' },
              ].map((action) => (
               <Link
                 key={action.label}
                 to={action.href}
                 className="p-4 bg-card rounded-xl border border-border text-center hover:border-primary hover:bg-primary/5 transition-colors"
               >
                 <span className="font-medium text-foreground">{action.label}</span>
               </Link>
             ))}
           </div>
         </div>
       </div>
     </AdminLayout>
   );
 }