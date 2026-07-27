import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Image as ImageIcon } from 'lucide-react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { getAllGalleryImages, createGalleryImage, updateGalleryImage, deleteGalleryImage } from '@/services/api';
import type { GalleryImage } from '@/types/database';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

export default function AdminGallery() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingImage, setEditingImage] = useState<GalleryImage | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    caption: '',
    category: '',
    image_url: '',
    is_featured: false,
    order_index: 0,
  });
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const fetchImages = async () => {
    try {
      const data = await getAllGalleryImages();
      setImages(data);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to fetch images', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  const resetForm = () => {
    setFormData({
      title: '',
      caption: '',
      category: '',
      image_url: '',
      is_featured: false,
      order_index: 0,
    });
    setEditingImage(null);
  };

  const handleEdit = (image: GalleryImage) => {
    setEditingImage(image);
    setFormData({
      title: image.title || '',
      caption: image.caption || '',
      category: image.category || '',
      image_url: image.image_url,
      is_featured: image.is_featured,
      order_index: image.order_index,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingImage && !formData.image_url) {
      toast({ title: 'Error', description: 'Please enter an image URL', variant: 'destructive' });
      return;
    }
    
    setIsSaving(true);

    try {
      const imageData = { ...formData };

      if (editingImage) {
        await updateGalleryImage(editingImage.id, imageData);
        toast({ title: 'Success', description: 'Image updated successfully' });
      } else {
        await createGalleryImage(imageData);
        toast({ title: 'Success', description: 'Image added successfully' });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchImages();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save image', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (image: GalleryImage) => {
    if (!confirm('Are you sure you want to delete this image?')) return;

    try {
      await deleteGalleryImage(image.id);
      toast({ title: 'Success', description: 'Image deleted successfully' });
      fetchImages();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete image', variant: 'destructive' });
    }
  };

  const categories = [...new Set(images.map(img => img.category).filter(Boolean))];

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gallery</h1>
            <p className="text-muted-foreground">Manage campus and event photos</p>
          </div>
          <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Add Image
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : images.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-xl border border-border">
            <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No images yet</h3>
            <p className="text-muted-foreground mb-4">Start by adding photos to your gallery</p>
            <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" /> Add First Image
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image) => (
              <div key={image.id} className="group relative bg-card rounded-xl border border-border overflow-hidden">
                <img
                  src={image.image_url}
                  alt={image.title || 'Gallery image'}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button variant="secondary" size="icon" onClick={() => handleEdit(image)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="destructive" size="icon" onClick={() => handleDelete(image)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="p-3">
                  <h3 className="font-medium text-foreground truncate">{image.title || 'Untitled'}</h3>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-muted-foreground">{image.category || 'Uncategorized'}</span>
                    {image.is_featured && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-accent/20 text-accent">Featured</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingImage ? 'Edit Image' : 'Add New Image'}</DialogTitle>
              <DialogDescription>Fill in the image details.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="image_url">Image URL {!editingImage && '*'}</Label>
                <Input
                  id="image_url"
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  required={!editingImage}
                />
                {formData.image_url && (
                  <img src={formData.image_url} alt="Preview" className="w-full h-32 object-cover rounded-lg mt-2" onError={(e) => (e.currentTarget.style.display = 'none')} />
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="caption">Caption</Label>
                <Input
                  id="caption"
                  value={formData.caption}
                  onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g., Campus, Events"
                    list="categories"
                  />
                  <datalist id="categories">
                    {categories.map((cat) => (
                      <option key={cat} value={cat!} />
                    ))}
                  </datalist>
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
              <div className="flex items-center space-x-2">
                <Switch
                  id="featured"
                  checked={formData.is_featured}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                />
                <Label htmlFor="featured">Featured Image</Label>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? 'Saving...' : editingImage ? 'Update' : 'Add'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
