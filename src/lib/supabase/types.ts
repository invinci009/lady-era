export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      businesses: {
        Row: {
          id: string
          owner_id: string
          name: string
          category: string
          location: string | null
          phone: string | null
          secondary_phone: string | null
          timezone: string
          logo_url: string | null
          primary_color: string | null
          welcome_message: Json | null
          google_review_url: string | null
          default_language: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          owner_id: string
          name: string
          category?: string
          location?: string | null
          phone?: string | null
          secondary_phone?: string | null
          timezone?: string
          logo_url?: string | null
          primary_color?: string | null
          welcome_message?: Json | null
          google_review_url?: string | null
          default_language?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          owner_id?: string
          name?: string
          category?: string
          location?: string | null
          phone?: string | null
          secondary_phone?: string | null
          timezone?: string
          logo_url?: string | null
          primary_color?: string | null
          welcome_message?: Json | null
          google_review_url?: string | null
          default_language?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          id: string
          business_id: string
          name: string
          slug: string
          active: boolean
          google_review_url_override: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          business_id: string
          name: string
          slug: string
          active?: boolean
          google_review_url_override?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          business_id?: string
          name?: string
          slug?: string
          active?: boolean
          google_review_url_override?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          }
        ]
      }
      menu_items: {
        Row: {
          id: string
          business_id: string
          name: Json
          active: boolean | null
          position: number | null
          created_at: string
        }
        Insert: {
          id?: string
          business_id: string
          name: Json
          active?: boolean | null
          position?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          name?: Json
          active?: boolean | null
          position?: number | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          }
        ]
      }
      questions: {
        Row: {
          id: string
          business_id: string
          key: string
          type: 'rating' | 'single_choice' | 'multi_choice' | 'text'
          text: Json
          config: Json | null
          required: boolean
          position: number
          active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          business_id: string
          key: string
          type: 'rating' | 'single_choice' | 'multi_choice' | 'text'
          text: Json
          config?: Json | null
          required?: boolean
          position: number
          active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          key?: string
          type?: 'rating' | 'single_choice' | 'multi_choice' | 'text'
          text?: Json
          config?: Json | null
          required?: boolean
          position?: number
          active?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          }
        ]
      }
      sessions: {
        Row: {
          id: string
          campaign_id: string
          business_id: string
          status: 'landed' | 'in_progress' | 'completed'
          language: string | null
          device_type: string | null
          started_at: string | null
          last_activity_at: string | null
          completed_at: string | null
          ip_hash: string | null
          ua_hash: string | null
          created_at: string
        }
        Insert: {
          id?: string
          campaign_id: string
          business_id: string
          status?: 'landed' | 'in_progress' | 'completed'
          language?: string | null
          device_type?: string | null
          started_at?: string | null
          last_activity_at?: string | null
          completed_at?: string | null
          ip_hash?: string | null
          ua_hash?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          campaign_id?: string
          business_id?: string
          status?: 'landed' | 'in_progress' | 'completed'
          language?: string | null
          device_type?: string | null
          started_at?: string | null
          last_activity_at?: string | null
          completed_at?: string | null
          ip_hash?: string | null
          ua_hash?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          }
        ]
      }
      answers: {
        Row: {
          id: string
          session_id: string
          question_id: string
          question_key: string
          value: Json
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          question_id: string
          question_key: string
          value: Json
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          question_id?: string
          question_key?: string
          value?: Json
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answers_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          }
        ]
      }
      review_drafts: {
        Row: {
          id: string
          session_id: string
          original_text: string | null
          final_text: string | null
          method: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          session_id: string
          original_text?: string | null
          final_text?: string | null
          method?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          session_id?: string
          original_text?: string | null
          final_text?: string | null
          method?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "review_drafts_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: true
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          }
        ]
      }
      private_feedback: {
        Row: {
          id: string
          session_id: string
          business_id: string
          category: string
          message: string
          contact_name: string | null
          contact_value: string | null
          contact_consent: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          business_id: string
          category: string
          message: string
          contact_name?: string | null
          contact_value?: string | null
          contact_consent?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          business_id?: string
          category?: string
          message?: string
          contact_name?: string | null
          contact_value?: string | null
          contact_consent?: boolean | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "private_feedback_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "private_feedback_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          }
        ]
      }
      events: {
        Row: {
          id: string
          session_id: string
          campaign_id: string | null
          business_id: string | null
          event_type: string
          client_event_id: string | null
          metadata: Json | null
          timestamp: string | null
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          campaign_id?: string | null
          business_id?: string | null
          event_type: string
          client_event_id?: string | null
          metadata?: Json | null
          timestamp?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          campaign_id?: string | null
          business_id?: string | null
          event_type?: string
          client_event_id?: string | null
          metadata?: Json | null
          timestamp?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          }
        ]
      }
      session_flags: {
        Row: {
          id: string
          session_id: string
          business_id: string | null
          reason: string
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          business_id?: string | null
          reason: string
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          business_id?: string | null
          reason?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_flags_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_flags_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: Record<string, never>
    Functions: {
      seed_default_questions: {
        Args: { p_business_id: string }
        Returns: undefined
      }
      generate_random_slug: {
        Args: { length?: number }
        Returns: string
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

export type Business = Database['public']['Tables']['businesses']['Row']
export type Campaign = Database['public']['Tables']['campaigns']['Row']
export type MenuItem = Database['public']['Tables']['menu_items']['Row']
export type Question = Database['public']['Tables']['questions']['Row']
export type Session = Database['public']['Tables']['sessions']['Row']
export type Answer = Database['public']['Tables']['answers']['Row']
export type ReviewDraft = Database['public']['Tables']['review_drafts']['Row']
export type PrivateFeedback = Database['public']['Tables']['private_feedback']['Row']
export type Event = Database['public']['Tables']['events']['Row']
export type SessionFlag = Database['public']['Tables']['session_flags']['Row']
