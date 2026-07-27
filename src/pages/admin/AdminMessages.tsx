 import { useEffect, useState } from 'react';
 import { format } from 'date-fns';
 import { Mail, MailOpen, Trash2 } from 'lucide-react';
 import { AdminLayout } from '@/layouts/AdminLayout';
 import { Button } from '@/components/ui/button';
 import { getContactSubmissions, markContactAsRead, deleteContactSubmission } from '@/services/api';
 import type { ContactSubmission } from '@/types/database';
 import { useToast } from '@/hooks/use-toast';
 import { Skeleton } from '@/components/common/Skeleton';
 import { cn } from '@/lib/utils';
 
 export default function AdminMessages() {
   const [messages, setMessages] = useState<ContactSubmission[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [selected, setSelected] = useState<ContactSubmission | null>(null);
   const { toast } = useToast();
 
   const loadData = () => { getContactSubmissions().then(setMessages).catch(console.error).finally(() => setIsLoading(false)); };
   useEffect(() => { loadData(); }, []);
 
   const handleSelect = async (msg: ContactSubmission) => {
     setSelected(msg);
     if (!msg.is_read) { await markContactAsRead(msg.id); loadData(); }
   };
 
   const handleDelete = async (id: string) => {
     if (!confirm('Delete this message?')) return;
     await deleteContactSubmission(id);
     toast({ title: 'Message deleted' });
     setSelected(null);
     loadData();
   };
 
   return (
     <AdminLayout>
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
         <div className="lg:col-span-1 bg-card rounded-xl border overflow-hidden flex flex-col">
           <div className="p-4 border-b font-semibold">Inbox ({messages.filter(m => !m.is_read).length} unread)</div>
           <div className="flex-1 overflow-y-auto">
             {isLoading ? <Skeleton className="h-full" /> : messages.map(msg => (
               <button key={msg.id} onClick={() => handleSelect(msg)} className={cn('w-full text-left p-4 border-b hover:bg-secondary transition-colors', selected?.id === msg.id && 'bg-secondary', !msg.is_read && 'bg-accent/5')}>
                 <div className="flex items-center gap-2 mb-1">
                   {msg.is_read ? <MailOpen className="h-4 w-4 text-muted-foreground" /> : <Mail className="h-4 w-4 text-accent" />}
                   <span className={cn('font-medium truncate', !msg.is_read && 'text-foreground')}>{msg.name}</span>
                 </div>
                 <p className="text-sm text-muted-foreground truncate">{msg.subject || msg.message}</p>
                 <p className="text-xs text-muted-foreground mt-1">{format(new Date(msg.created_at), 'MMM d, h:mm a')}</p>
               </button>
             ))}
           </div>
         </div>
         <div className="lg:col-span-2 bg-card rounded-xl border p-6">
           {selected ? (
             <div>
               <div className="flex justify-between items-start mb-6">
                 <div>
                   <h2 className="font-display text-xl font-semibold">{selected.subject || 'No Subject'}</h2>
                   <p className="text-muted-foreground">From: {selected.name} ({selected.email})</p>
                   <p className="text-sm text-muted-foreground">{format(new Date(selected.created_at), 'MMMM d, yyyy h:mm a')}</p>
                 </div>
                 <Button variant="destructive" size="sm" onClick={() => handleDelete(selected.id)}><Trash2 className="h-4 w-4" /></Button>
               </div>
               <div className="prose max-w-none"><p>{selected.message}</p></div>
               {selected.phone && <p className="mt-4 text-sm text-muted-foreground">Phone: {selected.phone}</p>}
             </div>
           ) : <div className="h-full flex items-center justify-center text-muted-foreground">Select a message to read</div>}
         </div>
       </div>
     </AdminLayout>
   );
 }