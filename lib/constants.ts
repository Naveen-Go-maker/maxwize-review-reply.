import type { PlanConfig } from '@/types'

// ============================================================
// PLAN CONFIGURATIONS
// ============================================================

export const PLANS: Record<string, PlanConfig> = {
  free: {
    name: 'Free',
    price: 0,
    priceId: null,
    aiRepliesPerMonth: 5,
    maxLocations: 1,
    variants: 1,
    brandVoice: false,
    perLocationBrandVoice: false,
    whatsappAlerts: false,
    unlimitedHistory: false,
    multilingual: false,
    teamMembers: 1,
    features: [
      '5 AI replies per month',
      '1 business location',
      '1 response variant',
      'Email notifications',
    ],
  },
  pro: {
    name: 'Pro',
    price: 1299,
    priceId: process.env.STRIPE_PRO_PRICE_ID || '',
    aiRepliesPerMonth: 100,
    maxLocations: 1,
    variants: 3,
    brandVoice: true,
    perLocationBrandVoice: false,
    whatsappAlerts: true,
    unlimitedHistory: true,
    multilingual: true,
    teamMembers: 1,
    features: [
      '100 AI replies per month',
      '1 business location',
      '3 response variants',
      'Brand voice customization',
      'WhatsApp alerts',
      'Unlimited history',
      'Multilingual responses',
    ],
  },
  business: {
    name: 'Business',
    price: 3299,
    priceId: process.env.STRIPE_BUSINESS_PRICE_ID || '',
    aiRepliesPerMonth: null, // unlimited
    maxLocations: 10,
    variants: 3,
    brandVoice: true,
    perLocationBrandVoice: true,
    whatsappAlerts: true,
    unlimitedHistory: true,
    multilingual: true,
    teamMembers: 5,
    features: [
      'Unlimited AI replies',
      'Up to 10 locations',
      '3 response variants per review',
      'Per-location brand voice',
      '5 team members',
      'WhatsApp alerts',
      'Priority support',
    ],
  },
}

// ============================================================
// TONES
// ============================================================

export const TONES = [
  { value: 'warm', label: 'Warm & Friendly', description: 'Personal, approachable, and caring' },
  { value: 'professional', label: 'Professional', description: 'Formal, polished, and business-like' },
  { value: 'casual', label: 'Casual', description: 'Relaxed, conversational, and natural' },
  { value: 'empathetic', label: 'Empathetic', description: 'Understanding, compassionate, and supportive' },
] as const

// ============================================================
// LANGUAGES
// ============================================================

export const LANGUAGES = [
  { value: 'en', label: 'English', nativeLabel: 'English' },
  { value: 'hi', label: 'Hindi', nativeLabel: 'हिंदी' },
  { value: 'kn', label: 'Kannada', nativeLabel: 'ಕನ್ನಡ' },
  { value: 'ta', label: 'Tamil', nativeLabel: 'தமிழ்' },
  { value: 'te', label: 'Telugu', nativeLabel: 'తెలుగు' },
  { value: 'mr', label: 'Marathi', nativeLabel: 'मराठी' },
  { value: 'gu', label: 'Gujarati', nativeLabel: 'ગુજરાતી' },
  { value: 'bn', label: 'Bengali', nativeLabel: 'বাংলা' },
] as const

// ============================================================
// REVIEW SENTIMENT
// ============================================================

export const RATING_LABELS: Record<number, string> = {
  1: 'Very Poor',
  2: 'Poor',
  3: 'Average',
  4: 'Good',
  5: 'Excellent',
}

export function getReviewSentiment(rating: number): 'positive' | 'neutral' | 'negative' {
  if (rating >= 4) return 'positive'
  if (rating === 3) return 'neutral'
  return 'negative'
}

// ============================================================
// APP CONSTANTS
// ============================================================

export const APP_NAME = 'ReviewReply'
export const APP_TAGLINE = 'AI-Powered Google Review Management'
export const COMPANY_NAME = 'Maxwize Online Pvt. Ltd.'
export const SUPPORT_EMAIL = 'support@reviewreply.app'

export const POLL_INTERVAL_MINUTES = 15
export const MAX_REVIEW_TEXT_LENGTH = 4096

export const GOOGLE_OAUTH_SCOPES = [
  'https://www.googleapis.com/auth/business.manage',
]

export const STAR_RATINGS = [1, 2, 3, 4, 5] as const

export const EMAIL_FREQUENCY_LABELS: Record<string, string> = {
  immediate: 'Immediately for every review',
  negative_only: 'Only for negative reviews (1-2 stars)',
  daily_digest: 'Daily digest summary',
}

export const RESPONSE_STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  approved: 'Approved',
  posted: 'Posted',
  skipped: 'Skipped',
}

export const RESPONSE_STATUS_COLORS: Record<string, string> = {
  draft: 'text-warning bg-warning/10 border-warning/20',
  approved: 'text-accent bg-accent/10 border-accent/20',
  posted: 'text-success bg-success/10 border-success/20',
  skipped: 'text-text-muted bg-border/50 border-border',
}
