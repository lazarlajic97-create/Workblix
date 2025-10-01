import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error('Missing VITE_SUPABASE_URL environment variable')
}

if (!supabaseKey) {
  throw new Error('Missing VITE_SUPABASE_ANON_KEY environment variable')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          user_id: string
          email: string | null
          full_name: string | null
          plan: 'free' | 'premium'
          plan_status: 'active' | 'canceled' | 'past_due' | 'incomplete' | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          current_period_end: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          email?: string | null
          full_name?: string | null
          plan?: 'free' | 'premium'
          plan_status?: 'active' | 'canceled' | 'past_due' | 'incomplete' | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          current_period_end?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          email?: string | null
          full_name?: string | null
          plan?: 'free' | 'premium'
          plan_status?: 'active' | 'canceled' | 'past_due' | 'incomplete' | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          current_period_end?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      usage_scans: {
        Row: {
          id: string
          user_id: string
          month_start: string
          scans_count: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          month_start: string
          scans_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          month_start?: string
          scans_count?: number
          created_at?: string
        }
      }
      applications: {
        Row: {
          id: string
          user_id: string
          job_title: string | null
          company: string | null
          location: string | null
          content_html: string | null
          source_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          job_title?: string | null
          company?: string | null
          location?: string | null
          content_html?: string | null
          source_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          job_title?: string | null
          company?: string | null
          location?: string | null
          content_html?: string | null
          source_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      cvs: {
        Row: {
          id: string
          user_id: string
          title: string | null
          data: any | null
          template_key: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title?: string | null
          data?: any | null
          template_key?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string | null
          data?: any | null
          template_key?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
