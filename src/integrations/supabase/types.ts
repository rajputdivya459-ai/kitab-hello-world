export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      about_section: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          image_url: string | null
          order_index: number | null
          section_key: string
          title: string | null
          updated_at: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          order_index?: number | null
          section_key: string
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          order_index?: number | null
          section_key?: string
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      admission_inquiries: {
        Row: {
          created_at: string
          email: string | null
          id: string
          interested_class: string | null
          next_follow_up_date: string | null
          notes: string | null
          parent_name: string | null
          phone: string | null
          source: string | null
          status: Database["public"]["Enums"]["inquiry_status"]
          student_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          interested_class?: string | null
          next_follow_up_date?: string | null
          notes?: string | null
          parent_name?: string | null
          phone?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["inquiry_status"]
          student_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          interested_class?: string | null
          next_follow_up_date?: string | null
          notes?: string | null
          parent_name?: string | null
          phone?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["inquiry_status"]
          student_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      announcements: {
        Row: {
          banner_image_url: string | null
          created_at: string
          created_by: string | null
          id: string
          message: string
          publish_date: string
          title: string
        }
        Insert: {
          banner_image_url?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          message: string
          publish_date?: string
          title: string
        }
        Update: {
          banner_image_url?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          message?: string
          publish_date?: string
          title?: string
        }
        Relationships: []
      }
      attendance: {
        Row: {
          class_id: string | null
          created_at: string
          date: string
          id: string
          marked_by: string | null
          remarks: string | null
          section_id: string | null
          status: string
          student_id: string
        }
        Insert: {
          class_id?: string | null
          created_at?: string
          date?: string
          id?: string
          marked_by?: string | null
          remarks?: string | null
          section_id?: string | null
          status?: string
          student_id: string
        }
        Update: {
          class_id?: string | null
          created_at?: string
          date?: string
          id?: string
          marked_by?: string | null
          remarks?: string | null
          section_id?: string | null
          status?: string
          student_id?: string
        }
        Relationships: []
      }
      calendar_events: {
        Row: {
          class_id: string | null
          created_at: string
          description: string | null
          end_date: string
          event_type: Database["public"]["Enums"]["calendar_event_type"]
          id: string
          is_public: boolean
          start_date: string
          title: string
          updated_at: string
        }
        Insert: {
          class_id?: string | null
          created_at?: string
          description?: string | null
          end_date: string
          event_type?: Database["public"]["Enums"]["calendar_event_type"]
          id?: string
          is_public?: boolean
          start_date: string
          title: string
          updated_at?: string
        }
        Update: {
          class_id?: string | null
          created_at?: string
          description?: string | null
          end_date?: string
          event_type?: Database["public"]["Enums"]["calendar_event_type"]
          id?: string
          is_public?: boolean
          start_date?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      certificates: {
        Row: {
          certificate_number: string
          certificate_type: Database["public"]["Enums"]["certificate_type"]
          created_at: string
          data: Json
          id: string
          issued_by: string | null
          issued_on: string
          remarks: string | null
          student_id: string
          updated_at: string
        }
        Insert: {
          certificate_number: string
          certificate_type: Database["public"]["Enums"]["certificate_type"]
          created_at?: string
          data?: Json
          id?: string
          issued_by?: string | null
          issued_on?: string
          remarks?: string | null
          student_id: string
          updated_at?: string
        }
        Update: {
          certificate_number?: string
          certificate_type?: Database["public"]["Enums"]["certificate_type"]
          created_at?: string
          data?: Json
          id?: string
          issued_by?: string | null
          issued_on?: string
          remarks?: string | null
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          course_id: string
          created_at: string
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "classes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_submissions: {
        Row: {
          created_at: string | null
          email: string
          id: string
          is_read: boolean | null
          message: string
          name: string
          phone: string | null
          subject: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          is_read?: boolean | null
          message: string
          name: string
          phone?: string | null
          subject?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          is_read?: boolean | null
          message?: string
          name?: string
          phone?: string | null
          subject?: string | null
        }
        Relationships: []
      }
      courses: {
        Row: {
          created_at: string
          description: string | null
          id: string
          institution_type: string
          is_active: boolean
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          institution_type?: string
          is_active?: boolean
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          institution_type?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      departments: {
        Row: {
          courses: string[] | null
          created_at: string | null
          description: string | null
          head_of_department: string | null
          icon: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          order_index: number | null
          updated_at: string | null
        }
        Insert: {
          courses?: string[] | null
          created_at?: string | null
          description?: string | null
          head_of_department?: string | null
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          order_index?: number | null
          updated_at?: string | null
        }
        Update: {
          courses?: string[] | null
          created_at?: string | null
          description?: string | null
          head_of_department?: string | null
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          order_index?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      discounts: {
        Row: {
          amount: number
          created_at: string
          id: string
          reason: string | null
          student_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          reason?: string | null
          student_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          reason?: string | null
          student_id?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          created_at: string | null
          description: string | null
          end_date: string | null
          event_date: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_featured: boolean | null
          location: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          event_date?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          location?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          event_date?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          location?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      exam_subjects: {
        Row: {
          exam_id: string
          id: string
          max_marks: number
          passing_marks: number
          subject_id: string
        }
        Insert: {
          exam_id: string
          id?: string
          max_marks?: number
          passing_marks?: number
          subject_id: string
        }
        Update: {
          exam_id?: string
          id?: string
          max_marks?: number
          passing_marks?: number
          subject_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_subjects_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_subjects_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      exams: {
        Row: {
          academic_year: string
          class_id: string
          created_at: string
          end_date: string | null
          exam_type: string
          id: string
          is_published: boolean
          name: string
          section_id: string | null
          start_date: string | null
        }
        Insert: {
          academic_year?: string
          class_id: string
          created_at?: string
          end_date?: string | null
          exam_type?: string
          id?: string
          is_published?: boolean
          name: string
          section_id?: string | null
          start_date?: string | null
        }
        Update: {
          academic_year?: string
          class_id?: string
          created_at?: string
          end_date?: string | null
          exam_type?: string
          id?: string
          is_published?: boolean
          name?: string
          section_id?: string | null
          start_date?: string | null
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          date: string
          id: string
          title: string
        }
        Insert: {
          amount?: number
          category?: string
          created_at?: string
          date?: string
          id?: string
          title: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          date?: string
          id?: string
          title?: string
        }
        Relationships: []
      }
      explore_videos: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          order_index: number
          title: string
          updated_at: string
          youtube_url: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          order_index?: number
          title: string
          updated_at?: string
          youtube_url: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          order_index?: number
          title?: string
          updated_at?: string
          youtube_url?: string
        }
        Relationships: []
      }
      faculty: {
        Row: {
          bio: string | null
          created_at: string | null
          department_id: string | null
          designation: string | null
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          order_index: number | null
          phone: string | null
          photo_url: string | null
          qualifications: string[] | null
          updated_at: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string | null
          department_id?: string | null
          designation?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          order_index?: number | null
          phone?: string | null
          photo_url?: string | null
          qualifications?: string[] | null
          updated_at?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string | null
          department_id?: string | null
          designation?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          order_index?: number | null
          phone?: string | null
          photo_url?: string | null
          qualifications?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "faculty_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      fees_collection: {
        Row: {
          amount: number
          course: string | null
          created_at: string
          date: string
          id: string
          student_id: string | null
          student_name: string | null
        }
        Insert: {
          amount?: number
          course?: string | null
          created_at?: string
          date?: string
          id?: string
          student_id?: string | null
          student_name?: string | null
        }
        Update: {
          amount?: number
          course?: string | null
          created_at?: string
          date?: string
          id?: string
          student_id?: string | null
          student_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fees_collection_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      gallery: {
        Row: {
          caption: string | null
          category: string | null
          created_at: string | null
          id: string
          image_url: string
          is_featured: boolean | null
          order_index: number | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          caption?: string | null
          category?: string | null
          created_at?: string | null
          id?: string
          image_url: string
          is_featured?: boolean | null
          order_index?: number | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          caption?: string | null
          category?: string | null
          created_at?: string | null
          id?: string
          image_url?: string
          is_featured?: boolean | null
          order_index?: number | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      homepage_content: {
        Row: {
          content: string | null
          created_at: string | null
          cta_link: string | null
          cta_text: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          mobile_image_url: string | null
          order_index: number | null
          section_key: string
          subtitle: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          cta_link?: string | null
          cta_text?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          mobile_image_url?: string | null
          order_index?: number | null
          section_key: string
          subtitle?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          cta_link?: string | null
          cta_text?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          mobile_image_url?: string | null
          order_index?: number | null
          section_key?: string
          subtitle?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      homework: {
        Row: {
          attachment_url: string | null
          class_id: string
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string
          id: string
          section_id: string | null
          subject: string
          title: string
        }
        Insert: {
          attachment_url?: string | null
          class_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date: string
          id?: string
          section_id?: string | null
          subject: string
          title: string
        }
        Update: {
          attachment_url?: string | null
          class_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string
          id?: string
          section_id?: string | null
          subject?: string
          title?: string
        }
        Relationships: []
      }
      marks: {
        Row: {
          created_at: string
          exam_id: string
          id: string
          marks_obtained: number
          remarks: string | null
          student_id: string
          subject_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          exam_id: string
          id?: string
          marks_obtained?: number
          remarks?: string | null
          student_id: string
          subject_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          exam_id?: string
          id?: string
          marks_obtained?: number
          remarks?: string | null
          student_id?: string
          subject_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marks_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marks_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      members: {
        Row: {
          bio: string | null
          created_at: string | null
          designation: string
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          order_index: number | null
          phone: string | null
          photo_url: string | null
          role_type: string
          updated_at: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string | null
          designation: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          order_index?: number | null
          phone?: string | null
          photo_url?: string | null
          role_type: string
          updated_at?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string | null
          designation?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          order_index?: number | null
          phone?: string | null
          photo_url?: string | null
          role_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      notices: {
        Row: {
          attachment_url: string | null
          class_id: string | null
          created_at: string
          created_by: string | null
          id: string
          is_important: boolean
          message: string
          publish_date: string
          section_id: string | null
          student_id: string | null
          target_type: string
          title: string
        }
        Insert: {
          attachment_url?: string | null
          class_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_important?: boolean
          message: string
          publish_date?: string
          section_id?: string | null
          student_id?: string | null
          target_type?: string
          title: string
        }
        Update: {
          attachment_url?: string | null
          class_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_important?: boolean
          message?: string
          publish_date?: string
          section_id?: string | null
          student_id?: string | null
          target_type?: string
          title?: string
        }
        Relationships: []
      }
      notification_reads: {
        Row: {
          id: string
          notification_id: string
          read_at: string
          user_id: string
        }
        Insert: {
          id?: string
          notification_id: string
          read_at?: string
          user_id: string
        }
        Update: {
          id?: string
          notification_id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_reads_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          class_id: string | null
          created_at: string
          created_by: string | null
          id: string
          message: string
          section_id: string | null
          student_id: string | null
          target_type: string
          title: string
        }
        Insert: {
          class_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          message: string
          section_id?: string | null
          student_id?: string | null
          target_type: string
          title: string
        }
        Update: {
          class_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          message?: string
          section_id?: string | null
          student_id?: string | null
          target_type?: string
          title?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      programs_activities: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean
          order_index: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          order_index?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          order_index?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      reminders: {
        Row: {
          category: Database["public"]["Enums"]["reminder_category"]
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string
          id: string
          priority: Database["public"]["Enums"]["reminder_priority"]
          status: Database["public"]["Enums"]["reminder_status"]
          title: string
          updated_at: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["reminder_category"]
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date: string
          id?: string
          priority?: Database["public"]["Enums"]["reminder_priority"]
          status?: Database["public"]["Enums"]["reminder_status"]
          title: string
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["reminder_category"]
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string
          id?: string
          priority?: Database["public"]["Enums"]["reminder_priority"]
          status?: Database["public"]["Enums"]["reminder_status"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      salaries: {
        Row: {
          created_at: string
          designation: string | null
          id: string
          payment_date: string
          salary_amount: number
          staff_id: string | null
          staff_name: string
          status: string
        }
        Insert: {
          created_at?: string
          designation?: string | null
          id?: string
          payment_date?: string
          salary_amount?: number
          staff_id?: string | null
          staff_name: string
          status?: string
        }
        Update: {
          created_at?: string
          designation?: string | null
          id?: string
          payment_date?: string
          salary_amount?: number
          staff_id?: string | null
          staff_name?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "salaries_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      salary_structures: {
        Row: {
          allowances: number
          basic: number
          created_at: string
          deductions: number
          effective_from: string
          hra: number
          id: string
          staff_id: string
        }
        Insert: {
          allowances?: number
          basic?: number
          created_at?: string
          deductions?: number
          effective_from?: string
          hra?: number
          id?: string
          staff_id: string
        }
        Update: {
          allowances?: number
          basic?: number
          created_at?: string
          deductions?: number
          effective_from?: string
          hra?: number
          id?: string
          staff_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "salary_structures_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      sections: {
        Row: {
          class_id: string
          created_at: string
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          class_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          class_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "sections_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      semesters: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          year_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          year_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          year_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "semesters_year_id_fkey"
            columns: ["year_id"]
            isOneToOne: false
            referencedRelation: "years"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          category: string
          created_at: string | null
          id: string
          label: string | null
          setting_key: string
          setting_type: string
          setting_value: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string
          created_at?: string | null
          id?: string
          label?: string | null
          setting_key: string
          setting_type?: string
          setting_value?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          label?: string | null
          setting_key?: string
          setting_type?: string
          setting_value?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      social_links: {
        Row: {
          created_at: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          order_index: number | null
          platform_name: string
          updated_at: string | null
          url: string | null
        }
        Insert: {
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          order_index?: number | null
          platform_name: string
          updated_at?: string | null
          url?: string | null
        }
        Update: {
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          order_index?: number | null
          platform_name?: string
          updated_at?: string | null
          url?: string | null
        }
        Relationships: []
      }
      staff: {
        Row: {
          address: string | null
          auth_user_id: string | null
          created_at: string
          email: string | null
          experience_years: number | null
          full_name: string
          id: string
          joining_date: string | null
          phone: string | null
          photo_url: string | null
          qualification: string | null
          role: Database["public"]["Enums"]["staff_role"]
          staff_code: string | null
          staff_type: Database["public"]["Enums"]["staff_type"]
          status: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          auth_user_id?: string | null
          created_at?: string
          email?: string | null
          experience_years?: number | null
          full_name: string
          id?: string
          joining_date?: string | null
          phone?: string | null
          photo_url?: string | null
          qualification?: string | null
          role?: Database["public"]["Enums"]["staff_role"]
          staff_code?: string | null
          staff_type?: Database["public"]["Enums"]["staff_type"]
          status?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          auth_user_id?: string | null
          created_at?: string
          email?: string | null
          experience_years?: number | null
          full_name?: string
          id?: string
          joining_date?: string | null
          phone?: string | null
          photo_url?: string | null
          qualification?: string | null
          role?: Database["public"]["Enums"]["staff_role"]
          staff_code?: string | null
          staff_type?: Database["public"]["Enums"]["staff_type"]
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      staff_attendance: {
        Row: {
          created_at: string
          date: string
          id: string
          marked_by: string | null
          remarks: string | null
          staff_id: string
          status: string
        }
        Insert: {
          created_at?: string
          date?: string
          id?: string
          marked_by?: string | null
          remarks?: string | null
          staff_id: string
          status?: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          marked_by?: string | null
          remarks?: string | null
          staff_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_attendance_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_leaves: {
        Row: {
          created_at: string
          from_date: string
          id: string
          leave_type: Database["public"]["Enums"]["staff_leave_type"]
          reason: string
          reviewed_at: string | null
          reviewed_by: string | null
          staff_id: string
          status: Database["public"]["Enums"]["leave_status"]
          to_date: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          from_date: string
          id?: string
          leave_type?: Database["public"]["Enums"]["staff_leave_type"]
          reason: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          staff_id: string
          status?: Database["public"]["Enums"]["leave_status"]
          to_date: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          from_date?: string
          id?: string
          leave_type?: Database["public"]["Enums"]["staff_leave_type"]
          reason?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          staff_id?: string
          status?: Database["public"]["Enums"]["leave_status"]
          to_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_leaves_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      stats: {
        Row: {
          created_at: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          label: string
          order_index: number | null
          updated_at: string | null
          value: string
        }
        Insert: {
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          label: string
          order_index?: number | null
          updated_at?: string | null
          value: string
        }
        Update: {
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          label?: string
          order_index?: number | null
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      student_leaves: {
        Row: {
          created_at: string
          from_date: string
          id: string
          reason: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["leave_status"]
          student_id: string
          to_date: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          from_date: string
          id?: string
          reason: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["leave_status"]
          student_id: string
          to_date: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          from_date?: string
          id?: string
          reason?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["leave_status"]
          student_id?: string
          to_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_leaves_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_transport: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          pickup_point: string | null
          route_id: string
          student_id: string
          transport_fee: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          pickup_point?: string | null
          route_id: string
          student_id: string
          transport_fee?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          pickup_point?: string | null
          route_id?: string
          student_id?: string
          transport_fee?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_transport_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "transport_routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_transport_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          address: string | null
          admission_date: string
          admission_number: string | null
          admission_status: string
          auth_user_id: string | null
          class_id: string | null
          course: string
          course_id: string | null
          created_at: string
          date_of_birth: string | null
          email: string | null
          full_name: string | null
          gender: string | null
          id: string
          name: string
          paid_fees: number
          parent_auth_user_id: string | null
          parent_email: string | null
          parent_name: string | null
          parent_phone: string | null
          phone: string | null
          profile_image_url: string | null
          section_id: string | null
          semester: number
          semester_id: string | null
          student_login_email: string | null
          total_fees: number
          updated_at: string
          year: number
          year_id: string | null
        }
        Insert: {
          address?: string | null
          admission_date?: string
          admission_number?: string | null
          admission_status?: string
          auth_user_id?: string | null
          class_id?: string | null
          course: string
          course_id?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string
          name: string
          paid_fees?: number
          parent_auth_user_id?: string | null
          parent_email?: string | null
          parent_name?: string | null
          parent_phone?: string | null
          phone?: string | null
          profile_image_url?: string | null
          section_id?: string | null
          semester?: number
          semester_id?: string | null
          student_login_email?: string | null
          total_fees?: number
          updated_at?: string
          year?: number
          year_id?: string | null
        }
        Update: {
          address?: string | null
          admission_date?: string
          admission_number?: string | null
          admission_status?: string
          auth_user_id?: string | null
          class_id?: string | null
          course?: string
          course_id?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string
          name?: string
          paid_fees?: number
          parent_auth_user_id?: string | null
          parent_email?: string | null
          parent_name?: string | null
          parent_phone?: string | null
          phone?: string | null
          profile_image_url?: string | null
          section_id?: string | null
          semester?: number
          semester_id?: string | null
          student_login_email?: string | null
          total_fees?: number
          updated_at?: string
          year?: number
          year_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_semester_id_fkey"
            columns: ["semester_id"]
            isOneToOne: false
            referencedRelation: "semesters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_year_id_fkey"
            columns: ["year_id"]
            isOneToOne: false
            referencedRelation: "years"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          class_id: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          class_id: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          class_id?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      teacher_assignments: {
        Row: {
          class_id: string
          created_at: string
          id: string
          is_class_teacher: boolean
          section_id: string | null
          staff_id: string
          subject_id: string | null
        }
        Insert: {
          class_id: string
          created_at?: string
          id?: string
          is_class_teacher?: boolean
          section_id?: string | null
          staff_id: string
          subject_id?: string | null
        }
        Update: {
          class_id?: string
          created_at?: string
          id?: string
          is_class_teacher?: boolean
          section_id?: string | null
          staff_id?: string
          subject_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teacher_assignments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_assignments_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_assignments_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_assignments_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      transport_drivers: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          license_number: string | null
          name: string
          phone: string | null
          updated_at: string
          vehicle_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          license_number?: string | null
          name: string
          phone?: string | null
          updated_at?: string
          vehicle_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          license_number?: string | null
          name?: string
          phone?: string | null
          updated_at?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transport_drivers_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "transport_vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      transport_routes: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          monthly_fee: number
          pickup_points: Json
          route_name: string
          route_number: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          monthly_fee?: number
          pickup_points?: Json
          route_name: string
          route_number: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          monthly_fee?: number
          pickup_points?: Json
          route_name?: string
          route_number?: string
          updated_at?: string
        }
        Relationships: []
      }
      transport_vehicles: {
        Row: {
          capacity: number
          created_at: string
          id: string
          is_active: boolean
          route_id: string | null
          updated_at: string
          vehicle_number: string
          vehicle_type: string
        }
        Insert: {
          capacity?: number
          created_at?: string
          id?: string
          is_active?: boolean
          route_id?: string | null
          updated_at?: string
          vehicle_number: string
          vehicle_type?: string
        }
        Update: {
          capacity?: number
          created_at?: string
          id?: string
          is_active?: boolean
          route_id?: string | null
          updated_at?: string
          vehicle_number?: string
          vehicle_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "transport_vehicles_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "transport_routes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      visitors: {
        Row: {
          created_at: string
          entry_time: string
          exit_time: string | null
          id: string
          phone: string | null
          purpose: string | null
          remarks: string | null
          student_id: string | null
          updated_at: string
          visitor_name: string
        }
        Insert: {
          created_at?: string
          entry_time?: string
          exit_time?: string | null
          id?: string
          phone?: string | null
          purpose?: string | null
          remarks?: string | null
          student_id?: string | null
          updated_at?: string
          visitor_name: string
        }
        Update: {
          created_at?: string
          entry_time?: string
          exit_time?: string | null
          id?: string
          phone?: string | null
          purpose?: string | null
          remarks?: string | null
          student_id?: string | null
          updated_at?: string
          visitor_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "visitors_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      years: {
        Row: {
          course_id: string
          created_at: string
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "years_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_student_ids: { Args: never; Returns: string[] }
      current_teacher_class_ids: { Args: never; Returns: string[] }
      current_teacher_id: { Args: never; Returns: string }
      current_teacher_section_ids: { Args: never; Returns: string[] }
      current_teacher_subject_ids: { Args: never; Returns: string[] }
      current_user_class_ids: { Args: never; Returns: string[] }
      current_user_section_ids: { Args: never; Returns: string[] }
      generate_admission_number: { Args: never; Returns: string }
      generate_certificate_number: {
        Args: { _type: Database["public"]["Enums"]["certificate_type"] }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_teacher: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "member" | "parent" | "student" | "teacher"
      calendar_event_type: "holiday" | "exam" | "event" | "meeting" | "vacation"
      certificate_type: "bonafide" | "leaving" | "character"
      inquiry_status:
        | "new"
        | "contacted"
        | "follow_up"
        | "interested"
        | "admitted"
        | "closed"
      leave_status: "pending" | "approved" | "rejected"
      reminder_category:
        | "fee"
        | "admission"
        | "staff_doc"
        | "transport"
        | "exam"
        | "general"
      reminder_priority: "low" | "medium" | "high"
      reminder_status: "pending" | "completed"
      staff_leave_type: "casual" | "sick" | "earned" | "unpaid" | "other"
      staff_role:
        | "teacher"
        | "principal"
        | "coordinator"
        | "accountant"
        | "clerk"
        | "receptionist"
        | "librarian"
        | "other"
      staff_type: "teaching" | "non_teaching"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "member", "parent", "student", "teacher"],
      calendar_event_type: ["holiday", "exam", "event", "meeting", "vacation"],
      certificate_type: ["bonafide", "leaving", "character"],
      inquiry_status: [
        "new",
        "contacted",
        "follow_up",
        "interested",
        "admitted",
        "closed",
      ],
      leave_status: ["pending", "approved", "rejected"],
      reminder_category: [
        "fee",
        "admission",
        "staff_doc",
        "transport",
        "exam",
        "general",
      ],
      reminder_priority: ["low", "medium", "high"],
      reminder_status: ["pending", "completed"],
      staff_leave_type: ["casual", "sick", "earned", "unpaid", "other"],
      staff_role: [
        "teacher",
        "principal",
        "coordinator",
        "accountant",
        "clerk",
        "receptionist",
        "librarian",
        "other",
      ],
      staff_type: ["teaching", "non_teaching"],
    },
  },
} as const
