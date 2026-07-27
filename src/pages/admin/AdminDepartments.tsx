 import { useEffect, useState } from 'react';
 import { Plus, Pencil, Trash2 } from 'lucide-react';
 import { AdminLayout } from '@/layouts/AdminLayout';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Textarea } from '@/components/ui/textarea';
 import { Label } from '@/components/ui/label';
 import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
 import { getAllDepartments, createDepartment, updateDepartment, deleteDepartment } from '@/services/api';
 import type { Department } from '@/types/database';
 import { useToast } from '@/hooks/use-toast';
 import { Skeleton } from '@/components/common/Skeleton';
 
 export default function AdminDepartments() {
   const [departments, setDepartments] = useState<Department[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [isOpen, setIsOpen] = useState(false);
   const [editingDept, setEditingDept] = useState<Department | null>(null);
   const [formData, setFormData] = useState({ name: '', description: '', icon: 'book-open', courses: '' });
   const { toast } = useToast();
 
   const loadData = () => {
     getAllDepartments().then(setDepartments).catch(console.error).finally(() => setIsLoading(false));
   };
 
   useEffect(() => { loadData(); }, []);
 
   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     try {
       const data = { ...formData, courses: formData.courses.split(',').map(c => c.trim()).filter(Boolean) };
       if (editingDept) {
         await updateDepartment(editingDept.id, data);
         toast({ title: 'Department updated' });
       } else {
         await createDepartment(data);
         toast({ title: 'Department created' });
       }
       setIsOpen(false);
       setEditingDept(null);
       setFormData({ name: '', description: '', icon: 'book-open', courses: '' });
       loadData();
     } catch (error) {
       toast({ title: 'Error', description: 'Failed to save department', variant: 'destructive' });
     }
   };
 
   const handleDelete = async (id: string) => {
     if (!confirm('Delete this department?')) return;
     try {
       await deleteDepartment(id);
       toast({ title: 'Department deleted' });
       loadData();
     } catch (error) {
       toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' });
     }
   };
 
   const openEdit = (dept: Department) => {
     setEditingDept(dept);
     setFormData({ name: dept.name, description: dept.description || '', icon: dept.icon || 'book-open', courses: dept.courses?.join(', ') || '' });
     setIsOpen(true);
   };
 
   return (
     <AdminLayout>
       <div className="space-y-6">
         <div className="flex justify-between items-center">
           <h2 className="font-display text-2xl font-bold">Departments</h2>
           <Dialog open={isOpen} onOpenChange={(o) => { setIsOpen(o); if (!o) setEditingDept(null); }}>
             <DialogTrigger asChild>
               <Button className="bg-accent text-accent-foreground"><Plus className="h-4 w-4 mr-2" />Add Department</Button>
             </DialogTrigger>
             <DialogContent>
               <DialogHeader><DialogTitle>{editingDept ? 'Edit' : 'Add'} Department</DialogTitle></DialogHeader>
               <form onSubmit={handleSubmit} className="space-y-4">
                 <div><Label>Name</Label><Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required /></div>
                 <div><Label>Description</Label><Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} /></div>
                 <div><Label>Courses (comma-separated)</Label><Input value={formData.courses} onChange={e => setFormData({...formData, courses: e.target.value})} placeholder="B.Tech, M.Tech, Ph.D" /></div>
                 <Button type="submit" className="w-full">Save</Button>
               </form>
             </DialogContent>
           </Dialog>
         </div>
         {isLoading ? <Skeleton className="h-64" /> : (
           <div className="bg-card rounded-xl border">
             <table className="w-full">
               <thead className="border-b"><tr className="text-left"><th className="p-4">Name</th><th className="p-4">Description</th><th className="p-4">Actions</th></tr></thead>
               <tbody>
                 {departments.map(dept => (
                   <tr key={dept.id} className="border-b last:border-0">
                     <td className="p-4 font-medium">{dept.name}</td>
                     <td className="p-4 text-muted-foreground truncate max-w-xs">{dept.description}</td>
                     <td className="p-4 flex gap-2">
                       <Button size="sm" variant="outline" onClick={() => openEdit(dept)}><Pencil className="h-4 w-4" /></Button>
                       <Button size="sm" variant="destructive" onClick={() => handleDelete(dept.id)}><Trash2 className="h-4 w-4" /></Button>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
         )}
       </div>
     </AdminLayout>
   );
 }