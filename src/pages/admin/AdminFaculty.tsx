import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, User } from 'lucide-react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { getAllFaculty, getAllDepartments, createFaculty, updateFaculty, deleteFaculty } from '@/services/api';
import type { Faculty, Department } from '@/types/database';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

export default function AdminFaculty() {
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState<Faculty | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    designation: '',
    department_id: '',
    email: '',
    phone: '',
    bio: '',
    qualifications: '',
    photo_url: '',
    order_index: 0,
    is_active: true,
  });
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const fetchData = async () => {
    try {
      const [facultyData, deptData] = await Promise.all([getAllFaculty(), getAllDepartments()]);
      setFaculty(facultyData);
      setDepartments(deptData);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to fetch data', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetForm = () => {
    setFormData({
      name: '',
      designation: '',
      department_id: '',
      email: '',
      phone: '',
      bio: '',
      qualifications: '',
      photo_url: '',
      order_index: 0,
      is_active: true,
    });
    setEditingFaculty(null);
  };

  const handleEdit = (member: Faculty) => {
    setEditingFaculty(member);
    setFormData({
      name: member.name,
      designation: member.designation || '',
      department_id: member.department_id || '',
      email: member.email || '',
      phone: member.phone || '',
      bio: member.bio || '',
      qualifications: member.qualifications?.join(', ') || '',
      photo_url: member.photo_url || '',
      order_index: member.order_index,
      is_active: member.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const facultyData = {
        ...formData,
        qualifications: formData.qualifications.split(',').map(q => q.trim()).filter(Boolean),
        department_id: formData.department_id || null,
      };

      if (editingFaculty) {
        await updateFaculty(editingFaculty.id, facultyData);
        toast({ title: 'Success', description: 'Faculty updated successfully' });
      } else {
        await createFaculty(facultyData);
        toast({ title: 'Success', description: 'Faculty added successfully' });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save faculty', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this faculty member?')) return;

    try {
      await deleteFaculty(id);
      toast({ title: 'Success', description: 'Faculty deleted successfully' });
      fetchData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete faculty', variant: 'destructive' });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Faculty</h1>
            <p className="text-muted-foreground">Manage teaching staff</p>
          </div>
          <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Add Faculty
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Photo</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {faculty.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      {member.photo_url ? (
                        <img src={member.photo_url} alt={member.name} className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                          <User className="w-5 h-5 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{member.name}</TableCell>
                    <TableCell>{member.designation}</TableCell>
                    <TableCell>{member.departments?.name || '-'}</TableCell>
                    <TableCell>{member.email || '-'}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 text-xs rounded-full ${member.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {member.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(member)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(member.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingFaculty ? 'Edit Faculty' : 'Add New Faculty'}</DialogTitle>
              <DialogDescription>Fill in the faculty details.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="designation">Designation</Label>
                  <Input
                    id="designation"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Select value={formData.department_id} onValueChange={(v) => setFormData({ ...formData, department_id: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="order">Order</Label>
                  <Input
                    id="order"
                    type="number"
                    value={formData.order_index}
                    onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="qualifications">Qualifications (comma separated)</Label>
                <Input
                  id="qualifications"
                  value={formData.qualifications}
                  onChange={(e) => setFormData({ ...formData, qualifications: e.target.value })}
                  placeholder="Ph.D., MBA, M.Tech"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="photo_url">Photo URL</Label>
                <Input
                  id="photo_url"
                  type="url"
                  placeholder="https://example.com/photo.jpg"
                  value={formData.photo_url}
                  onChange={(e) => setFormData({ ...formData, photo_url: e.target.value })}
                />
                {formData.photo_url && (
                  <img src={formData.photo_url} alt="Preview" className="h-20 w-auto rounded-lg border object-cover mt-2" onError={(e) => (e.currentTarget.style.display = 'none')} />
                )}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? 'Saving...' : editingFaculty ? 'Update' : 'Add'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
