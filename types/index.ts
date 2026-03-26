// ============================================================
// ReviewReply - TypeScript Types & Interfaces
// ============================================================

export type PlanType = 'free' | 'pro' | 'business'
export type ResponseStatus = 'draft' | 'approved' | 'posted' | 'skipped'
export type ToneType = 'warm' | 'professional' | 'casual' | 'empathetic'
export type LanguageCode = 'en' | 'hi' | 'kn' | 'ta' | 'te' | 'mr' | 'gu' | 'bn'
export type EmailFrequency = 'immediate' | 'negative_only' | 'daily_digest'

// ============================================================
// DATABASE MODELS
// ============================================================

export interface User {
  id: string
  email: string
  name: string | null
  plan: PlanType
  google_access_token: string | null
  google_refresh_token: string | null
  google_account_id: string | null
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  stripe_subscription_status: string | null
  created_at: string
  updated_at: string
}

export interface Location {
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

export interface Review {
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
  // Joined fields
  location?: Location
  responses?: Response[]
}

export interface Response {
  id: string
  review_id: string
  variant_number: number
  text: string
  status: ResponseStatus
  posted_at: string | null
  created_at: string
  updated_at: string
}

export interface BrandVoice {
  id: string
  user_id: string
  location_id: string | null
  tone: ToneType
  language: LanguageCode
  owner_name: string | null
  sign_off: string | null
  custom_instructions: string | null
  created_at: string
  updated_at: string
}

export interface NotificationPrefs {
  id: string
  user_id: string
  email_enabled: boolean
  email_frequency: EmailFrequency
  whatsapp_enabled: boolean
  whatsapp_number: string | null
  weekly_summary: boolean
  created_at: string
  updated_at: string
}

export interface UsageLog {
  id: string
  user_id: string
  month: string
  ai_replies_used: number
  reviews_received: number
  created_at: string
  updated_at: string
}

// ============================================================
// API RESPONSE TYPES
// ============================================================

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  pageSize: number
  totalPages: number
}

// ============================================================
// PLAN CONFIGURATION
// ============================================================

export interface PlanConfig {
  name: string
  price: number
  priceId: string | null
  aiRepliesPerMonth: number | null // null = unlimited
  maxLocations: number
  variants: number
  brandVoice: boolean
  perLocationBrandVoice: boolean
  whatsappAlerts: boolean
  unlimitedHistory: boolean
  multilingual: boolean
  teamMembers: number
  features: string[]
}

// ============================================================
// GOOGLE BUSINESS PROFILE
// ============================================================

export interface GoogleLocation {
  name: string // format: accounts/{accountId}/locations/{locationId}
  locationName: string
  address: {
    addressLines: string[]
    locality: string
    administrativeArea: string
    postalCode: string
    regionCode: string
  }
  primaryCategory: {
    displayName: string
    categoryId: string
  }
}

export interface GoogleReview {
  name: string // format: accounts/{accountId}/locations/{locationId}/reviews/{reviewId}
  reviewId: string
  reviewer: {
    profilePhotoUrl: string
    displayName: string
    isAnonymous: boolean
  }
  starRating: 'ONE' | 'TWO' | 'THREE' | 'FOUR' | 'FIVE'
  comment: string
  createTime: string
  updateTime: string
  reviewReply?: {
    comment: string
    updateTime: string
  }
}

export interface GoogleAccount {
  name: string // accounts/{accountId}
  accountName: string
  type: string
  state: { status: string }
}

// ============================================================
// DASHBOARD & UI TYPES
// ============================================================

export interface ReviewWithDetails extends Review {
  location: Location
  responses: Response[]
  has_response: boolean
  active_response: Response | null
}

export interface DashboardStats {
  total_reviews: number
  response_rate: number
  avg_rating: number
  unresponded_count: number
  negative_count: number
  reviews_this_month: number
  responses_this_month: number
}

export interface ReviewFilters {
  location_id?: string
  rating?: number | string
  status?: string
  date_from?: string
  date_to?: string
  page?: number
  page_size?: number
}

// ============================================================
// CLAUDE AI TYPES
// ============================================================

export interface GenerateResponseInput {
  review: Review
  location: Location
  brandVoice: BrandVoice
  variantCount: number
}

export interface GeneratedVariant {
  variant_number: number
  text: string
  tone: string
}

// ============================================================
// STRIPE TYPES
// ============================================================

export interface SubscriptionDetails {
  plan: PlanType
  status: string
  current_period_end: number
  cancel_at_period_end: boolean
  price_id: string
}

// ============================================================
// WORKER TYPES
// ============================================================

export interface PollReviewsJobData {
  userId: string
  locationId: string
  googleLocationId: string
}

export interface SendNotificationJobData {
  userId: string
  reviewId: string
  type: 'new_review' | 'negative_review' | 'daily_digest' | 'weekly_summary'
}

// ============================================================
// FORM TYPES
// ============================================================

export interface BrandVoiceFormData {
  tone: ToneType
  language: LanguageCode
  owner_name: string
  sign_off: string
  custom_instructions: string
  location_id: string | null
}

export interface NotificationFormData {
  email_enabled: boolean
  email_frequency: EmailFrequency
  whatsapp_enabled: boolean
  whatsapp_number: string
  weekly_summary: boolean
}

export interface LoginFormData {
  email: string
  password: string
}

export interface SignupFormData {
  email: string
  password: string
  name: string
}
