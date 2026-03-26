// Supabase Database type definitions
// This provides basic typing for the Supabase client

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          plan: 'free' | 'pro' | 'business'
          google_access_token: string | null
          google_refresh_token: string | null
          google_account_id: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          stripe_subscription_status: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          plan?: 'free' | 'pro' | 'business'
          google_access_token?: string | null
          google_refresh_token?: string | null
          google_account_id?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          stripe_subscription_status?: string | null
        }
        Update: {
          email?: string
          name?: string | null
          plan?: 'free' | 'pro' | 'business'
          google_access_token?: string | null
          google_refresh_token?: string | null
          google_account_id?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          stripe_subscription_status?: string | null
        }
      }
      locations: {
        Row: {
          id: string
          user_id: string
          google_location_id: string
          name: string
          address: string | null
          category: string | null
          is_active: boolean
          last_synced_at: string | null
          created_at: string
        }
        Insert: {
          user_id: string
          google_location_id: string
          name: string
          address?: string | null
          category?: string | null
          is_active?: boolean
          last_synced_at?: string | null
        }
        Update: {
          name?: string
          address?: string | null
          category?: string | null
          is_active?: boolean
          last_synced_at?: string | null
        }
      }
      reviews: {
        Row: {
          id: string
          location_id: string
          google_review_id: string
          reviewer_name: string
          reviewer_photo_url: string | null
          rating: number
          text: string | null
          review_language: string
          google_created_at: string | null
          synced_at: string
        }
        Insert: {
          location_id: string
          google_review_id: string
          reviewer_name: string
          reviewer_photo_url?: string | null
          rating: number
          text?: string | null
          review_language?: string
          google_created_at?: string | null
        }
        Update: {
          reviewer_name?: string
          reviewer_photo_url?: string | null
          rating?: number
          text?: string | null
          review_language?: string
          google_created_at?: string | null
        }
      }
      responses: {
        Row: {
          id: string
          review_id: string
          variant_number: number
          text: string
          status: 'draft' | 'approved' | 'posted' | 'skipped'
          posted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          review_id: string
          variant_number: number
          text: string
          status?: 'draft' | 'approved' | 'posted' | 'skipped'
          posted_at?: string | null
        }
        Update: {
          text?: string
          status?: 'draft' | 'approved' | 'posted' | 'skipped'
          posted_at?: string | null
        }
      }
      brand_voice: {
        Row: {
          id: string
          user_id: string
          location_id: string | null
          tone: 'warm' | 'professional' | 'casual' | 'empathetic'
          language: 'en' | 'hi' | 'kn' | 'ta' | 'te' | 'mr' | 'gu' | 'bn'
          owner_name: string | null
          sign_off: string | null
          custom_instructions: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          location_id?: string | null
          tone?: 'warm' | 'professional' | 'casual' | 'empathetic'
          language?: 'en' | 'hi' | 'kn' | 'ta' | 'te' | 'mr' | 'gu' | 'bn'
          owner_name?: string | null
          sign_off?: string | null
          custom_instructions?: string | null
        }
        Update: {
          tone?: 'warm' | 'professional' | 'casual' | 'empathetic'
          language?: 'en' | 'hi' | 'kn' | 'ta' | 'te' | 'mr' | 'gu' | 'bn'
          owner_name?: string | null
          sign_off?: string | null
          custom_instructions?: string | null
        }
      }
      notification_prefs: {
        Row: {
          id: string
          user_id: string
          email_enabled: boolean
          email_frequency: 'immediate' | 'negative_only' | 'daily_digest'
          whatsapp_enabled: boolean
          whatsapp_number: string | null
          weekly_summary: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          email_enabled?: boolean
          email_frequency?: 'immediate' | 'negative_only' | 'daily_digest'
          whatsapp_enabled?: boolean
          whatsapp_number?: string | null
          weekly_summary?: boolean
        }
        Update: {
          email_enabled?: boolean
          email_frequency?: 'immediate' | 'negative_only' | 'daily_digest'
          whatsapp_enabled?: boolean
          whatsapp_number?: string | null
          weekly_summary?: boolean
        }
      }
      usage_log: {
        Row: {
          id: string
          user_id: string
          month: string
          ai_replies_used: number
          reviews_received: number
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          month: string
          ai_replies_used?: number
          reviews_received?: number
        }
        Update: {
          ai_replies_used?: number
          reviews_received?: number
        }
      }
    }
    Functions: {
      increment_ai_usage: {
        Args: { p_user_id: string; p_count?: number }
        Returns: void
      }
    }
  }
}
