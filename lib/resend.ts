import { Resend } from 'resend'
import { APP_NAME, SUPPORT_EMAIL } from './constants'
import type { Review, Location, User } from '@/types'
import { formatDate } from './utils'

const resend = new Resend(process.env.RESEND_API_KEY!)

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? `noreply@reviewreply.app`

// ============================================================
// EMAIL TEMPLATES (HTML)
// ============================================================

function baseTemplate(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${APP_NAME}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f1117; color: #f1f5f9; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .logo { font-size: 24px; font-weight: 700; color: #6c63ff; margin-bottom: 32px; }
    .card { background: #1a1d27; border: 1px solid #2d3149; border-radius: 12px; padding: 24px; margin-bottom: 24px; }
    .rating { font-size: 24px; margin: 8px 0; }
    .reviewer { font-size: 14px; color: #94a3b8; }
    .review-text { font-size: 15px; line-height: 1.6; color: #f1f5f9; margin: 16px 0; font-style: italic; }
    .btn { display: inline-block; background: #6c63ff; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px; }
    .footer { margin-top: 40px; font-size: 12px; color: #94a3b8; border-top: 1px solid #2d3149; padding-top: 20px; }
    .negative { color: #ef4444; }
    .neutral { color: #f59e0b; }
    .positive { color: #22c55e; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">${APP_NAME}</div>
    ${content}
    <div class="footer">
      <p>You're receiving this because you have email notifications enabled.</p>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/notifications" style="color: #6c63ff;">Manage notification preferences</a></p>
      <p>© ${new Date().getFullYear()} Maxwize Online Pvt. Ltd.</p>
    </div>
  </div>
</body>
</html>`
}

function getRatingStars(rating: number): string {
  return '★'.repeat(rating) + '☆'.repeat(5 - rating)
}

function getRatingClass(rating: number): string {
  if (rating >= 4) return 'positive'
  if (rating === 3) return 'neutral'
  return 'negative'
}

// ============================================================
// NEW REVIEW NOTIFICATION
// ============================================================

export async function sendNewReviewEmail(
  user: User,
  review: Review,
  location: Location
): Promise<void> {
  const ratingClass = getRatingClass(review.rating)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL

  const html = baseTemplate(`
    <div class="card">
      <h2 style="margin-top: 0; margin-bottom: 8px;">New Review Received</h2>
      <p class="reviewer">${location.name} · ${formatDate(review.google_created_at)}</p>
      <div class="rating ${ratingClass}">${getRatingStars(review.rating)} ${review.rating}/5</div>
      <p style="font-weight: 600; color: #f1f5f9; margin-bottom: 4px;">${review.reviewer_name}</p>
      ${review.text ? `<p class="review-text">"${review.text}"</p>` : '<p class="reviewer">(No review text)</p>'}
      <a href="${appUrl}/dashboard" class="btn">View & Respond →</a>
    </div>
    <p style="color: #94a3b8; font-size: 14px;">AI response drafts have been generated for your approval.</p>
  `)

  await resend.emails.send({
    from: `${APP_NAME} <${FROM_EMAIL}>`,
    to: user.email,
    subject: `${review.rating >= 4 ? '⭐' : '⚠️'} New ${review.rating}-star review from ${review.reviewer_name}`,
    html,
  })
}

// ============================================================
// NEGATIVE REVIEW ALERT
// ============================================================

export async function sendNegativeReviewAlert(
  user: User,
  review: Review,
  location: Location
): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL

  const html = baseTemplate(`
    <div class="card" style="border-color: rgba(239,68,68,0.3);">
      <h2 style="margin-top: 0; color: #ef4444;">⚠️ Negative Review Alert</h2>
      <p class="reviewer">${location.name} · ${formatDate(review.google_created_at)}</p>
      <div class="rating negative">${getRatingStars(review.rating)} ${review.rating}/5</div>
      <p style="font-weight: 600; color: #f1f5f9; margin-bottom: 4px;">${review.reviewer_name}</p>
      ${review.text ? `<p class="review-text">"${review.text}"</p>` : ''}
      <p style="color: #94a3b8; font-size: 14px; margin-top: 16px;">Responding to negative reviews quickly can help protect your reputation. We've prepared AI response drafts for you.</p>
      <a href="${appUrl}/dashboard" class="btn" style="background: #ef4444;">Respond Now →</a>
    </div>
  `)

  await resend.emails.send({
    from: `${APP_NAME} <${FROM_EMAIL}>`,
    to: user.email,
    subject: `🚨 Urgent: ${review.rating}-star negative review from ${review.reviewer_name}`,
    html,
  })
}

// ============================================================
// DAILY DIGEST
// ============================================================

export async function sendDailyDigest(
  user: User,
  summary: {
    newReviews: number
    pendingResponses: number
    avgRating: number
    locations: string[]
  }
): Promise<void> {
  if (summary.newReviews === 0) return

  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  const today = formatDate(new Date().toISOString(), 'EEEE, MMMM d')

  const html = baseTemplate(`
    <div class="card">
      <h2 style="margin-top: 0;">Daily Review Summary</h2>
      <p style="color: #94a3b8;">${today}</p>

      <div style="display: grid; gap: 16px; margin-top: 16px;">
        <div style="display: flex; justify-content: space-between; padding: 12px; background: #21253a; border-radius: 8px;">
          <span>New reviews today</span>
          <strong style="color: #6c63ff;">${summary.newReviews}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 12px; background: #21253a; border-radius: 8px;">
          <span>Pending responses</span>
          <strong style="color: #f59e0b;">${summary.pendingResponses}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 12px; background: #21253a; border-radius: 8px;">
          <span>Average rating today</span>
          <strong style="color: ${summary.avgRating >= 4 ? '#22c55e' : summary.avgRating >= 3 ? '#f59e0b' : '#ef4444'};">${summary.avgRating.toFixed(1)} ★</strong>
        </div>
      </div>

      ${summary.pendingResponses > 0 ? `<a href="${appUrl}/dashboard" class="btn">Review ${summary.pendingResponses} Pending Responses →</a>` : `<a href="${appUrl}/dashboard" class="btn">View Dashboard →</a>`}
    </div>
  `)

  await resend.emails.send({
    from: `${APP_NAME} <${FROM_EMAIL}>`,
    to: user.email,
    subject: `📊 Daily digest: ${summary.newReviews} new review${summary.newReviews !== 1 ? 's' : ''} today`,
    html,
  })
}

// ============================================================
// WEEKLY SUMMARY
// ============================================================

export async function sendWeeklySummary(
  user: User,
  summary: {
    totalReviews: number
    responded: number
    avgRating: number
    responseRate: number
    ratingBreakdown: Record<number, number>
  }
): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL

  const html = baseTemplate(`
    <div class="card">
      <h2 style="margin-top: 0;">Weekly Performance Summary</h2>
      <p style="color: #94a3b8;">Here's how you performed this week</p>

      <div style="display: grid; gap: 12px; margin: 20px 0;">
        <div style="display: flex; justify-content: space-between; padding: 12px; background: #21253a; border-radius: 8px;">
          <span>Total reviews received</span>
          <strong>${summary.totalReviews}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 12px; background: #21253a; border-radius: 8px;">
          <span>Response rate</span>
          <strong style="color: ${summary.responseRate >= 80 ? '#22c55e' : '#f59e0b'};">${summary.responseRate}%</strong>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 12px; background: #21253a; border-radius: 8px;">
          <span>Average rating</span>
          <strong style="color: ${summary.avgRating >= 4 ? '#22c55e' : '#f59e0b'};">${summary.avgRating.toFixed(1)} ★</strong>
        </div>
      </div>

      <a href="${appUrl}/analytics" class="btn">View Full Analytics →</a>
    </div>
  `)

  await resend.emails.send({
    from: `${APP_NAME} <${FROM_EMAIL}>`,
    to: user.email,
    subject: `📈 Your weekly review performance summary`,
    html,
  })
}

// ============================================================
// WHATSAPP NOTIFICATION (via Twilio)
// ============================================================

export async function sendWhatsAppNotification(
  phoneNumber: string,
  message: string
): Promise<void> {
  const accountSid = process.env.WHATSAPP_ACCOUNT_SID
  const authToken = process.env.WHATSAPP_AUTH_TOKEN
  const fromNumber = process.env.WHATSAPP_FROM_NUMBER

  if (!accountSid || !authToken || !fromNumber) {
    console.warn('WhatsApp credentials not configured')
    return
  }

  const url = `${process.env.WHATSAPP_API_URL}/Accounts/${accountSid}/Messages.json`
  const toNumber = phoneNumber.startsWith('whatsapp:')
    ? phoneNumber
    : `whatsapp:${phoneNumber}`

  const body = new URLSearchParams({
    From: fromNumber,
    To: toNumber,
    Body: message,
  })

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`WhatsApp notification failed: ${error}`)
  }
}
