/**
 * ReviewReply Background Worker - Review Poller
 *
 * Uses BullMQ to poll Google Business Profile for new reviews every 15 minutes.
 * Run with: npm run worker
 */

import { Queue, Worker } from 'bullmq'
import IORedis from 'ioredis'
import { createServiceClient } from '../lib/supabase/service'
import { fetchAllReviews } from '../lib/google'
import { generateResponses } from '../lib/claude'
import {
  sendNewReviewEmail,
  sendNegativeReviewAlert,
  sendWhatsAppNotification,
} from '../lib/resend'
import { parseGoogleStarRating, getCurrentMonth } from '../lib/utils'
import { PLANS, POLL_INTERVAL_MINUTES } from '../lib/constants'
import type { PollReviewsJobData, User, Location, Review, BrandVoice, NotificationPrefs } from '../types'

// ============================================================
// REDIS CONNECTION
// ============================================================

const connection = new IORedis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
  tls: process.env.REDIS_URL?.startsWith('rediss://') ? {} : undefined,
})

// ============================================================
// QUEUES
// ============================================================

export const reviewPollQueue = new Queue<PollReviewsJobData>('review-poll', {
  connection,
  defaultJobOptions: {
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
  },
})

// ============================================================
// POLL REVIEWS JOB HANDLER
// ============================================================

async function processReviewPollJob(data: PollReviewsJobData): Promise<void> {
  const supabase = createServiceClient()
  const { userId, locationId, googleLocationId } = data

  console.log(`[poll] Processing location ${locationId} for user ${userId}`)

  // Fetch user with tokens
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (userError || !user) {
    throw new Error(`User not found: ${userId}`)
  }

  if (!user.google_access_token || !user.google_refresh_token) {
    console.log(`[poll] User ${userId} has no Google tokens — skipping`)
    return
  }

  if (!user.google_account_id) {
    console.log(`[poll] User ${userId} has no Google account ID — skipping`)
    return
  }

  // Fetch location
  const { data: location, error: locError } = await supabase
    .from('locations')
    .select('*')
    .eq('id', locationId)
    .eq('is_active', true)
    .single()

  if (locError || !location) {
    console.log(`[poll] Location ${locationId} not found or inactive — skipping`)
    return
  }

  // Fetch reviews from Google
  let googleReviews
  try {
    googleReviews = await fetchAllReviews(
      user.google_access_token,
      user.google_refresh_token,
      user.google_account_id,
      googleLocationId
    )
  } catch (error) {
    console.error(`[poll] Failed to fetch reviews from Google: ${error}`)
    // Attempt token refresh
    const { data: refreshed } = await supabase
      .from('users')
      .select('google_refresh_token')
      .eq('id', userId)
      .single()

    if (refreshed?.google_refresh_token) {
      try {
        const { refreshAccessToken } = await import('../lib/google')
        const newTokens = await refreshAccessToken(refreshed.google_refresh_token)
        await supabase
          .from('users')
          .update({ google_access_token: newTokens.access_token })
          .eq('id', userId)

        googleReviews = await fetchAllReviews(
          newTokens.access_token,
          refreshed.google_refresh_token,
          user.google_account_id,
          googleLocationId
        )
      } catch (refreshError) {
        throw new Error(`Token refresh and retry failed: ${refreshError}`)
      }
    } else {
      throw error
    }
  }

  // Get existing review IDs to find new ones
  const { data: existingReviews } = await supabase
    .from('reviews')
    .select('google_review_id')
    .eq('location_id', locationId)

  const existingIds = new Set(existingReviews?.map((r) => r.google_review_id) ?? [])

  const newGoogleReviews = googleReviews.filter(
    (r) => !existingIds.has(r.reviewId)
  )

  console.log(`[poll] Found ${newGoogleReviews.length} new reviews for location ${locationId}`)

  if (newGoogleReviews.length === 0) {
    // Update last_synced_at
    await supabase
      .from('locations')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('id', locationId)
    return
  }

  // Fetch user plan config
  const planConfig = PLANS[user.plan]

  // Fetch usage for rate limiting
  const currentMonth = getCurrentMonth()
  const { data: usageData } = await supabase
    .from('usage_log')
    .select('ai_replies_used')
    .eq('user_id', userId)
    .eq('month', currentMonth)
    .single()

  let aiUsed = usageData?.ai_replies_used ?? 0

  // Fetch brand voice
  const { data: brandVoiceData } = await supabase
    .from('brand_voice')
    .select('*')
    .eq('user_id', userId)
    .or(`location_id.eq.${locationId},location_id.is.null`)
    .order('location_id', { ascending: false, nullsFirst: false })
    .limit(1)
    .single()

  const brandVoice = brandVoiceData ?? {
    id: '',
    user_id: userId,
    location_id: null,
    tone: 'professional' as const,
    language: 'en' as const,
    owner_name: null,
    sign_off: null,
    custom_instructions: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  // Fetch notification prefs
  const { data: notifPrefs } = await supabase
    .from('notification_prefs')
    .select('*')
    .eq('user_id', userId)
    .single()

  // Process each new review
  for (const googleReview of newGoogleReviews) {
    try {
      const rating = parseGoogleStarRating(googleReview.starRating)

      // Insert review
      const { data: insertedReview, error: insertError } = await supabase
        .from('reviews')
        .insert({
          location_id: locationId,
          google_review_id: googleReview.reviewId,
          reviewer_name: googleReview.reviewer.isAnonymous
            ? 'Anonymous'
            : googleReview.reviewer.displayName,
          reviewer_photo_url: googleReview.reviewer.isAnonymous
            ? null
            : googleReview.reviewer.profilePhotoUrl,
          rating,
          text: googleReview.comment || null,
          review_language: 'en', // Will be detected later
          google_created_at: googleReview.createTime,
        })
        .select()
        .single()

      if (insertError || !insertedReview) {
        console.error(`[poll] Failed to insert review: ${insertError?.message}`)
        continue
      }

      // Update usage counter
      await supabase.rpc('increment_ai_usage', { p_user_id: userId, p_count: 0 })
      await supabase
        .from('usage_log')
        .upsert({
          user_id: userId,
          month: currentMonth,
          reviews_received: 1,
          ai_replies_used: aiUsed,
        }, { onConflict: 'user_id,month', ignoreDuplicates: false })

      // Generate AI responses if within usage limit
      const canGenerate =
        planConfig.aiRepliesPerMonth === null ||
        aiUsed < planConfig.aiRepliesPerMonth

      if (canGenerate) {
        try {
          const variants = await generateResponses(
            insertedReview as Review,
            location as unknown as Location,
            brandVoice as unknown as BrandVoice,
            planConfig.variants
          )

          // Insert response drafts
          for (const variant of variants) {
            await supabase.from('responses').insert({
              review_id: insertedReview.id,
              variant_number: variant.variant_number,
              text: variant.text,
              status: 'draft',
            })
          }

          // Update usage
          aiUsed += 1
          await supabase.rpc('increment_ai_usage', { p_user_id: userId, p_count: 1 })

          console.log(`[poll] Generated ${variants.length} AI responses for review ${insertedReview.id}`)
        } catch (aiError) {
          console.error(`[poll] AI generation failed for review ${insertedReview.id}: ${aiError}`)
        }
      }

      // Send notifications
      if (notifPrefs) {
        await sendNotificationsForReview(
          user as unknown as User,
          insertedReview as unknown as Review,
          location as unknown as Location,
          notifPrefs,
          rating
        )
      }
    } catch (reviewError) {
      console.error(`[poll] Error processing review ${googleReview.reviewId}: ${reviewError}`)
    }
  }

  // Update last_synced_at
  await supabase
    .from('locations')
    .update({ last_synced_at: new Date().toISOString() })
    .eq('id', locationId)

  console.log(`[poll] Completed processing for location ${locationId}`)
}

// ============================================================
// NOTIFICATION HELPER
// ============================================================

async function sendNotificationsForReview(
  user: User,
  review: Review,
  location: Location,
  prefs: NotificationPrefs,
  rating: number
): Promise<void> {
  const isNegative = rating <= 2

  try {
    if (prefs.email_enabled) {
      if (prefs.email_frequency === 'immediate') {
        await sendNewReviewEmail(user, review, location)
      } else if (prefs.email_frequency === 'negative_only' && isNegative) {
        await sendNegativeReviewAlert(user, review, location)
      }
    }

    if (prefs.whatsapp_enabled && prefs.whatsapp_number && isNegative) {
      const msg = `⚠️ New ${rating}-star review from ${review.reviewer_name} on ${location.name}${review.text ? `:\n"${review.text.slice(0, 150)}..."` : '.'}\n\nRespond: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
      await sendWhatsAppNotification(prefs.whatsapp_number, msg)
    }
  } catch (notifError) {
    console.error(`[poll] Notification failed: ${notifError}`)
  }
}

// ============================================================
// SCHEDULER: Enqueue jobs for all active users
// ============================================================

async function scheduleAllUsers(): Promise<void> {
  const supabase = createServiceClient()

  // Get all users with active Google connections
  const { data: users, error } = await supabase
    .from('users')
    .select('id, google_access_token, google_account_id')
    .not('google_access_token', 'is', null)
    .not('google_account_id', 'is', null)

  if (error) {
    console.error('[scheduler] Failed to fetch users:', error)
    return
  }

  for (const user of users ?? []) {
    const { data: locations } = await supabase
      .from('locations')
      .select('id, google_location_id')
      .eq('user_id', user.id)
      .eq('is_active', true)

    for (const location of locations ?? []) {
      await reviewPollQueue.add(
        `poll:${user.id}:${location.id}`,
        {
          userId: user.id,
          locationId: location.id,
          googleLocationId: location.google_location_id,
        },
        {
          jobId: `poll:${user.id}:${location.id}:${Date.now()}`,
        }
      )
    }
  }

  console.log(`[scheduler] Enqueued jobs for ${users?.length ?? 0} users`)
}

// ============================================================
// WORKER
// ============================================================

const worker = new Worker<PollReviewsJobData>(
  'review-poll',
  async (job) => {
    await processReviewPollJob(job.data)
  },
  {
    connection,
    concurrency: 5,
  }
)

worker.on('completed', (job) => {
  console.log(`[worker] Job ${job.id} completed`)
})

worker.on('failed', (job, error) => {
  console.error(`[worker] Job ${job?.id} failed:`, error)
})

worker.on('error', (error) => {
  console.error('[worker] Worker error:', error)
})

// ============================================================
// MAIN: Start worker + schedule recurring jobs
// ============================================================

async function main() {
  console.log(`[ReviewReply Worker] Starting review poller...`)
  console.log(`[ReviewReply Worker] Poll interval: ${POLL_INTERVAL_MINUTES} minutes`)

  // Run immediately on start
  await scheduleAllUsers()

  // Then run every POLL_INTERVAL_MINUTES
  setInterval(async () => {
    console.log(`[scheduler] Running scheduled poll for all users`)
    await scheduleAllUsers()
  }, POLL_INTERVAL_MINUTES * 60 * 1000)

  console.log('[ReviewReply Worker] Worker is running. Press Ctrl+C to stop.')
}

main().catch((error) => {
  console.error('[ReviewReply Worker] Fatal error:', error)
  process.exit(1)
})
