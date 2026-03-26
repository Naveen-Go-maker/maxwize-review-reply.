import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, parseISO } from 'date-fns'

// ============================================================
// CLASS NAME UTILITY
// ============================================================

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ============================================================
// DATE FORMATTING
// ============================================================

export function formatDate(dateString: string | null | undefined, pattern = 'MMM d, yyyy'): string {
  if (!dateString) return 'Unknown date'
  try {
    return format(parseISO(dateString), pattern)
  } catch {
    return 'Invalid date'
  }
}

export function formatRelativeDate(dateString: string | null | undefined): string {
  if (!dateString) return 'Unknown'
  try {
    return formatDistanceToNow(parseISO(dateString), { addSuffix: true })
  } catch {
    return 'Unknown'
  }
}

export function getCurrentMonth(): string {
  return format(new Date(), 'yyyy-MM')
}

// ============================================================
// RATING UTILITIES
// ============================================================

export function getRatingColor(rating: number): string {
  if (rating >= 4) return 'text-success'
  if (rating === 3) return 'text-warning'
  return 'text-danger'
}

export function getRatingBgColor(rating: number): string {
  if (rating >= 4) return 'bg-success/10 text-success border-success/20'
  if (rating === 3) return 'bg-warning/10 text-warning border-warning/20'
  return 'bg-danger/10 text-danger border-danger/20'
}

// ============================================================
// TEXT UTILITIES
// ============================================================

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trim() + '...'
}

export function capitalize(str: string): string {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// ============================================================
// PLAN UTILITIES
// ============================================================

export function formatPrice(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(cents / 100)
}

export function getUsagePercentage(used: number, limit: number | null): number {
  if (limit === null) return 0 // unlimited
  return Math.min(100, Math.round((used / limit) * 100))
}

// ============================================================
// GOOGLE REVIEW UTILITIES
// ============================================================

export function parseGoogleStarRating(starRating: string): number {
  const map: Record<string, number> = {
    ONE: 1,
    TWO: 2,
    THREE: 3,
    FOUR: 4,
    FIVE: 5,
  }
  return map[starRating] ?? 0
}

export function extractLocationId(googleLocationName: string): string {
  // Format: accounts/{accountId}/locations/{locationId}
  const parts = googleLocationName.split('/')
  return parts[parts.length - 1]
}

export function extractReviewId(googleReviewName: string): string {
  // Format: accounts/{accountId}/locations/{locationId}/reviews/{reviewId}
  const parts = googleReviewName.split('/')
  return parts[parts.length - 1]
}

// ============================================================
// VALIDATION UTILITIES
// ============================================================

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function isValidPhoneNumber(phone: string): boolean {
  return /^\+?[1-9]\d{7,14}$/.test(phone.replace(/[\s-]/g, ''))
}

// ============================================================
// ERROR UTILITIES
// ============================================================

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return 'An unexpected error occurred'
}

// ============================================================
// RESPONSE STATS
// ============================================================

export function calculateResponseRate(total: number, responded: number): number {
  if (total === 0) return 0
  return Math.round((responded / total) * 100)
}

export function calculateAverageRating(ratings: number[]): number {
  if (ratings.length === 0) return 0
  const sum = ratings.reduce((acc, r) => acc + r, 0)
  return Math.round((sum / ratings.length) * 10) / 10
}
