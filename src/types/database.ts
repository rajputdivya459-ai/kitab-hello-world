 export interface HomepageContent {
   id: string;
   section_key: string;
   title: string | null;
   subtitle: string | null;
   content: string | null;
   image_url: string | null;
   cta_text: string | null;
   cta_link: string | null;
   order_index: number;
   is_active: boolean;
   created_at: string;
   updated_at: string;
 }
 
 export interface AboutSection {
   id: string;
   section_key: string;
   title: string | null;
   content: string | null;
   image_url: string | null;
   order_index: number;
   created_at: string;
   updated_at: string;
 }
 
 export interface Department {
   id: string;
   name: string;
   description: string | null;
   icon: string | null;
   courses: string[] | null;
   head_of_department: string | null;
   image_url: string | null;
   is_active: boolean;
   order_index: number;
   created_at: string;
   updated_at: string;
 }
 
 export interface Faculty {
   id: string;
   name: string;
   designation: string | null;
   department_id: string | null;
   email: string | null;
   phone: string | null;
   bio: string | null;
   qualifications: string[] | null;
   photo_url: string | null;
   is_active: boolean;
   order_index: number;
   created_at: string;
   updated_at: string;
   departments?: Department;
 }
 
 export interface Event {
   id: string;
   title: string;
   description: string | null;
   event_date: string | null;
   end_date: string | null;
   location: string | null;
   image_url: string | null;
   is_featured: boolean;
   is_active: boolean;
   created_at: string;
   updated_at: string;
 }
 
 export interface GalleryImage {
   id: string;
   title: string | null;
   caption: string | null;
   image_url: string;
   category: string | null;
   is_featured: boolean;
   order_index: number;
   created_at: string;
   updated_at: string;
 }
 
 export interface ContactSubmission {
   id: string;
   name: string;
   email: string;
   phone: string | null;
   subject: string | null;
   message: string;
   is_read: boolean;
   created_at: string;
 }
 
 export interface Stat {
   id: string;
   label: string;
   value: string;
   icon: string | null;
   order_index: number;
   is_active: boolean;
   created_at: string;
   updated_at: string;
 }
 
export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'member';
  created_at: string;
}

export interface Course {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Year {
  id: string;
  name: string;
  course_id: string;
  is_active: boolean;
  created_at: string;
}

export interface Semester {
  id: string;
  name: string;
  year_id: string;
  is_active: boolean;
  created_at: string;
}

export interface Member {
  id: string;
  name: string;
  designation: string;
  role_type: 'principal' | 'director' | 'management' | 'staff';
  photo_url: string | null;
  bio: string | null;
  email: string | null;
  phone: string | null;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SiteSetting {
  id: string;
  setting_key: string;
  setting_value: string | null;
  setting_type: string;
  category: string;
  label: string | null;
  created_at: string;
  updated_at: string;
}