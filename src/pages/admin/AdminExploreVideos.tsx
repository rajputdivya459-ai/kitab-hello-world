import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Video, Eye, EyeOff } from 'lucide-react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

interface ExploreVideo {
  id: string;
  title: string;
  youtube_url: string;
  is_active: boolean;
  order_index: number;
  created_at: string;
}

function extractYouTubeId(url: string): string {
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : '';
}

export default function AdminExploreVideos() {
  const [videos, setVideos] = useState<ExploreVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<ExploreVideo | null>(null);
  const [formData, setFormData] = useState({ title: '', youtube_url: '', order_index: 0, is_active: true });
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const fetchVideos = async () => {
    const { data, error } = await supabase.from('explore_videos').select('*').order('order_index');
    if (!error && data) setVideos(data as ExploreVideo[]);
    setIsLoading(false);
  };

  useEffect(() => { fetchVideos(); }, []);

  const resetForm = () => {
    setFormData({ title: '', youtube_url: '', order_index: 0, is_active: true });
    setEditingVideo(null);
  };

  const handleEdit = (v: ExploreVideo) => {
    setEditingVideo(v);
    setFormData({ title: v.title, youtube_url: v.youtube_url, order_index: v.order_index, is_active: v.is_active });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editingVideo) {
        const { error } = await supabase.from('explore_videos').update(formData as any).eq('id', editingVideo.id);
        if (error) throw error;
        toast({ title: 'Success', description: 'Video updated' });
      } else {
        const { error } = await supabase.from('explore_videos').insert([formData as any]);
        if (error) throw error;
        toast({ title: 'Success', description: 'Video added' });
      }
      setIsDialogOpen(false);
      resetForm();
      fetchVideos();
    } catch {
      toast({ title: 'Error', description: 'Failed to save video', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this video?')) return;
    const { error } = await supabase.from('explore_videos').delete().eq('id', id);
    if (error) toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' });
    else { toast({ title: 'Deleted' }); fetchVideos(); }
  };

  const toggleActive = async (v: ExploreVideo) => {
    await supabase.from('explore_videos').update({ is_active: !v.is_active } as any).eq('id', v.id);
    fetchVideos();
  };

  const ytId = extractYouTubeId(formData.youtube_url);

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Explore Videos</h1>
            <p className="text-muted-foreground">Manage campus tour videos</p>
          </div>
          <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Add Video
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12"><LoadingSpinner /></div>
        ) : (
          <div className="bg-card rounded-xl border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Thumbnail</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>YouTube URL</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {videos.map((v) => {
                  const vid = extractYouTubeId(v.youtube_url);
                  return (
                    <TableRow key={v.id}>
                      <TableCell>
                        {vid ? (
                          <img src={`https://img.youtube.com/vi/${vid}/default.jpg`} alt={v.title} className="w-20 h-12 rounded object-cover" />
                        ) : (
                          <div className="w-20 h-12 bg-muted rounded flex items-center justify-center"><Video className="w-5 h-5 text-muted-foreground" /></div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{v.title}</TableCell>
                      <TableCell className="text-xs max-w-[200px] truncate">{v.youtube_url}</TableCell>
                      <TableCell>{v.order_index}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 text-xs rounded-full ${v.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {v.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button variant="ghost" size="icon" onClick={() => toggleActive(v)} title={v.is_active ? 'Deactivate' : 'Activate'}>
                          {v.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(v)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(v.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingVideo ? 'Edit Video' : 'Add New Video'}</DialogTitle>
              <DialogDescription>Enter YouTube video details.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>YouTube URL *</Label>
                <Input
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={formData.youtube_url}
                  onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })}
                  required
                />
                {ytId && (
                  <img src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`} alt="Preview" className="h-32 w-auto rounded-lg border mt-2" />
                )}
              </div>
              <div className="space-y-2">
                <Label>Order</Label>
                <Input type="number" value={formData.order_index} onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) || 0 })} />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : editingVideo ? 'Update' : 'Add'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
