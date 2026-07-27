import { supabase } from '@/integrations/supabase/client';
import type {
  HomepageContent,
  AboutSection,
  Department,
  Faculty,
  Event,
  GalleryImage,
  ContactSubmission,
  Stat,
  Member,
} from '@/types/database';
 
// Homepage Content
export async function getHomepageContent() {
  try {
    const { data, error } = await supabase
      .from('homepage_content')
      .select('*')
      .eq('is_active', true)
      .order('order_index');

    if (error) {
      console.error('Supabase error (getHomepageContent):', error);
      return [];
    }
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('Supabase error (getHomepageContent):', err);
    return [];
  }
}
 
 // About Section
 export async function getAboutSections() {
   try {
     const { data, error } = await supabase
       .from('about_section')
       .select('*')
       .order('order_index');

     if (error) {
       console.error('Supabase error (getAboutSections):', error);
       return [];
     }
     return Array.isArray(data) ? data : [];
   } catch (err) {
     console.error('Supabase error (getAboutSections):', err);
     return [];
   }
 }
 
 // Departments
 export async function getDepartments() {
   try {
     const { data, error } = await supabase
       .from('departments')
       .select('*')
       .eq('is_active', true)
       .order('order_index');

     if (error) {
       console.error('Supabase error (getDepartments):', error);
       return [];
     }
     return Array.isArray(data) ? data : [];
   } catch (err) {
     console.error('Supabase error (getDepartments):', err);
     return [];
   }
 }
 
 export async function getDepartmentById(id: string) {
   try {
     const { data, error } = await supabase
       .from('departments')
       .select('*')
       .eq('id', id)
       .single();

     if (error) {
       console.error('Supabase error (getDepartmentById):', error);
       return null;
     }
     return data as Department | null;
   } catch (err) {
     console.error('Supabase error (getDepartmentById):', err);
     return null;
   }
 }
 
 // Faculty
 export async function getFaculty() {
   try {
     const { data, error } = await supabase
       .from('faculty')
       .select('*, departments(*)')
       .eq('is_active', true)
       .order('order_index');

     if (error) {
       console.error('Supabase error (getFaculty):', error);
       return [];
     }
     return Array.isArray(data) ? data : [];
   } catch (err) {
     console.error('Supabase error (getFaculty):', err);
     return [];
   }
 }
 
 export async function getFacultyByDepartment(departmentId: string) {
   try {
     const { data, error } = await supabase
       .from('faculty')
       .select('*, departments(*)')
       .eq('department_id', departmentId)
       .eq('is_active', true)
       .order('order_index');

     if (error) {
       console.error('Supabase error (getFacultyByDepartment):', error);
       return [];
     }
     return Array.isArray(data) ? data : [];
   } catch (err) {
     console.error('Supabase error (getFacultyByDepartment):', err);
     return [];
   }
 }
 
 // Events
 export async function getEvents() {
   try {
     const { data, error } = await supabase
       .from('events')
       .select('*')
       .eq('is_active', true)
       .order('event_date', { ascending: true });

     if (error) {
       console.error('Supabase error (getEvents):', error);
       return [];
     }
     return Array.isArray(data) ? data : [];
   } catch (err) {
     console.error('Supabase error (getEvents):', err);
     return [];
   }
 }
 
 export async function getUpcomingEvents() {
   try {
     const { data, error } = await supabase
       .from('events')
       .select('*')
       .eq('is_active', true)
       .gte('event_date', new Date().toISOString())
       .order('event_date', { ascending: true })
       .limit(5);

     if (error) {
       console.error('Supabase error (getUpcomingEvents):', error);
       return [];
     }
     return Array.isArray(data) ? data : [];
   } catch (err) {
     console.error('Supabase error (getUpcomingEvents):', err);
     return [];
   }
 }
 
 export async function getFeaturedEvents() {
   try {
     const { data, error } = await supabase
       .from('events')
       .select('*')
       .eq('is_active', true)
       .eq('is_featured', true)
       .order('event_date', { ascending: true });

     if (error) {
       console.error('Supabase error (getFeaturedEvents):', error);
       return [];
     }
     return Array.isArray(data) ? data : [];
   } catch (err) {
     console.error('Supabase error (getFeaturedEvents):', err);
     return [];
   }
 }
 
 // Gallery
 export async function getGalleryImages() {
   try {
     const { data, error } = await supabase
       .from('gallery')
       .select('*')
       .order('order_index');

     if (error) {
       console.error('Supabase error (getGalleryImages):', error);
       return [];
     }
     return Array.isArray(data) ? data : [];
   } catch (err) {
     console.error('Supabase error (getGalleryImages):', err);
     return [];
   }
 }
 
 export async function getFeaturedGalleryImages() {
   try {
     const { data, error } = await supabase
       .from('gallery')
       .select('*')
       .eq('is_featured', true)
       .order('order_index')
       .limit(6);

     if (error) {
       console.error('Supabase error (getFeaturedGalleryImages):', error);
       return [];
     }
     return Array.isArray(data) ? data : [];
   } catch (err) {
     console.error('Supabase error (getFeaturedGalleryImages):', err);
     return [];
   }
 }
 
 // Stats
 export async function getStats() {
   try {
     const { data, error } = await supabase
       .from('stats')
       .select('*')
       .order('order_index');

     if (error) {
       console.error('Supabase error (getStats):', error);
       return [];
     }
     const rows = Array.isArray(data) ? data : [];
     return rows.filter((row: { is_active?: boolean | null }) => row.is_active !== false);
   } catch (err) {
     console.error('Supabase error (getStats):', err);
     return [];
   }
 }

// Members
export async function getMembers() {
  try {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('is_active', true)
      .order('order_index');

    if (error) {
      console.error('Supabase error (getMembers):', error);
      return [];
    }
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('Supabase error (getMembers):', err);
    return [];
  }
}

export async function getAllMembers() {
  try {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .order('order_index');

    if (error) {
      console.error('Supabase error (getAllMembers):', error);
      return [];
    }
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('Supabase error (getAllMembers):', err);
    return [];
  }
}

// Contact
export async function submitContactForm(data: {
   name: string;
   email: string;
   phone?: string;
   subject?: string;
   message: string;
 }) {
   const { error } = await supabase
     .from('contact_submissions')
     .insert([data]);
   
   if (error) throw error;
 }
 
 // Admin Functions
 export async function getContactSubmissions() {
   try {
     const { data, error } = await supabase
       .from('contact_submissions')
       .select('*')
       .order('created_at', { ascending: false });

     if (error) {
       console.error('Supabase error (getContactSubmissions):', error);
       return [];
     }
     return Array.isArray(data) ? data : [];
   } catch (err) {
     console.error('Supabase error (getContactSubmissions):', err);
     return [];
   }
 }
 
 export async function markContactAsRead(id: string) {
   const { error } = await supabase
     .from('contact_submissions')
     .update({ is_read: true })
     .eq('id', id);
   
   if (error) throw error;
 }
 
// CRUD operations for specific tables
export async function createDepartment(data: Partial<Department>) {
  const { data: result, error } = await supabase
    .from('departments')
    .insert([data as any])
    .select()
    .single();
  if (error) throw error;
  return result;
}

export async function updateDepartment(id: string, data: Partial<Department>) {
  const { data: result, error } = await supabase
    .from('departments')
    .update(data as any)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return result;
}

export async function deleteDepartment(id: string) {
  const { error } = await supabase.from('departments').delete().eq('id', id);
  if (error) throw error;
}

export async function createFaculty(data: Partial<Faculty>) {
  const { data: result, error } = await supabase
    .from('faculty')
    .insert([data as any])
    .select()
    .single();
  if (error) throw error;
  return result;
}

export async function updateFaculty(id: string, data: Partial<Faculty>) {
  const { data: result, error } = await supabase
    .from('faculty')
    .update(data as any)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return result;
}

export async function deleteFaculty(id: string) {
  const { error } = await supabase.from('faculty').delete().eq('id', id);
  if (error) throw error;
}

export async function createEvent(data: Partial<Event>) {
  const { data: result, error } = await supabase
    .from('events')
    .insert([data as any])
    .select()
    .single();
  if (error) throw error;
  return result;
}

export async function updateEvent(id: string, data: Partial<Event>) {
  const { data: result, error } = await supabase
    .from('events')
    .update(data as any)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return result;
}

export async function deleteEvent(id: string) {
  const { error } = await supabase.from('events').delete().eq('id', id);
  if (error) throw error;
}

export async function createGalleryImage(data: Partial<GalleryImage>) {
  const { data: result, error } = await supabase
    .from('gallery')
    .insert([data as any])
    .select()
    .single();
  if (error) throw error;
  return result;
}

export async function updateGalleryImage(id: string, data: Partial<GalleryImage>) {
  const { data: result, error } = await supabase
    .from('gallery')
    .update(data as any)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return result;
}

export async function deleteGalleryImage(id: string) {
  const { error } = await supabase.from('gallery').delete().eq('id', id);
  if (error) throw error;
}

export async function getAllHomepageContent() {
  try {
    const { data, error } = await supabase
      .from('homepage_content')
      .select('*')
      .order('order_index');

    if (error) {
      console.error('Supabase error (getAllHomepageContent):', error);
      return [];
    }
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('Supabase error (getAllHomepageContent):', err);
    return [];
  }
}

export async function updateHomepageContent(id: string, data: Partial<HomepageContent>) {
  try {
    const { data: result, error } = await supabase
      .from('homepage_content')
      .update(data as any)
      .eq('id', id)
      .select()
      .single();
    if (error) {
      console.error('Supabase updateHomepageContent:', error);
      throw new Error(error.message || 'Update failed');
    }
    return result;
  } catch (err) {
    if (err instanceof Error) throw err;
    throw new Error('Update failed');
  }
}

export async function getAllAboutSections() {
  try {
    const { data, error } = await supabase
      .from('about_section')
      .select('*')
      .order('order_index');

    if (error) {
      console.error('Supabase error (getAllAboutSections):', error);
      return [];
    }
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('Supabase error (getAllAboutSections):', err);
    return [];
  }
}

export async function updateAboutSection(id: string, data: Partial<AboutSection>) {
  try {
    const { data: result, error } = await supabase
      .from('about_section')
      .update(data as any)
      .eq('id', id)
      .select()
      .single();
    if (error) {
      console.error('Supabase updateAboutSection:', error);
      throw new Error(error.message || 'Update failed');
    }
    return result;
  } catch (err) {
    if (err instanceof Error) throw err;
    throw new Error('Update failed');
  }
}

export async function getAllDepartments() {
  try {
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .order('order_index');

    if (error) {
      console.error('Supabase error (getAllDepartments):', error);
      return [];
    }
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('Supabase error (getAllDepartments):', err);
    return [];
  }
}

export async function getAllFaculty() {
  try {
    const { data, error } = await supabase
      .from('faculty')
      .select('*, departments(*)')
      .order('order_index');

    if (error) {
      console.error('Supabase error (getAllFaculty):', error);
      return [];
    }
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('Supabase error (getAllFaculty):', err);
    return [];
  }
}

export async function getAllEvents() {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error (getAllEvents):', error);
      return [];
    }
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('Supabase error (getAllEvents):', err);
    return [];
  }
}

export async function getAllGalleryImages() {
  try {
    const { data, error } = await supabase
      .from('gallery')
      .select('*')
      .order('order_index');

    if (error) {
      console.error('Supabase error (getAllGalleryImages):', error);
      return [];
    }
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('Supabase error (getAllGalleryImages):', err);
    return [];
  }
}

export async function deleteContactSubmission(id: string) {
  const { error } = await supabase.from('contact_submissions').delete().eq('id', id);
  if (error) throw error;
}

// Members CRUD
export async function createMember(data: Partial<Member>) {
  const { data: result, error } = await supabase
    .from('members')
    .insert([data as any])
    .select()
    .single();
  if (error) throw error;
  return result;
}

export async function updateMember(id: string, data: Partial<Member>) {
  const { data: result, error } = await supabase
    .from('members')
    .update(data as any)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return result;
}

export async function deleteMember(id: string) {
  const { error } = await supabase.from('members').delete().eq('id', id);
  if (error) throw error;
}
// Social Links
export async function getSocialLinks() {
  try {
    const { data, error } = await supabase
      .from('social_links')
      .select('*')
      .eq('is_active', true)
      .order('order_index');

    if (error) {
      console.error('Supabase error (getSocialLinks):', error);
      return [];
    }
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('Supabase error (getSocialLinks):', err);
    return [];
  }
}