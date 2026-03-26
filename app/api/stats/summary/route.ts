import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateResponseRate, calculateAverageRating, getCurrentMonth } from '@/lib/utils'
import { PLANS } from '@/lib/constants'
import { DEMO_MODE, DEMO_STATS, DEMO_USER, DEMO_USAGE } from '@/lib/demo'

export async function GET(request: Request) {
  try {
    if (DEMO_MODE) {
      const url = new URL(request.url)
      const extended = url.searchParams.get('extended') === 'true'
      const billing = url.searchParams.get('billing') === 'true'

      if (extended) {
        return NextResponse.json({
          success: true,
          data: {
            stats: { total_reviews: DEMO_STATS.total_reviews, response_rate: DEMO_STATS.response_rate, avg_rating: DEMO_STATS.avg_rating, unresponded_count: DEMO_STATS.pending_reviews, negative_count: 7, reviews_this_month: DEMO_STATS.reviews_this_month, responses_this_month: 9 },
            rating_distribution: Object.entries(DEMO_STATS.by_rating).map(([r, c]) => ({ rating: parseInt(r), count: c, percentage: (c / DEMO_STATS.total_reviews) * 100 })),
            monthly_reviews: [
              { month: '2024-10', count: 8, avg_rating: 4.0 },
              { month: '2024-11', count: 11, avg_rating: 3.8 },
              { month: '2024-12', count: 9, avg_rating: 4.2 },
              { month: '2025-01', count: 14, avg_rating: 4.1 },
              { month: '2025-02', count: 13, avg_rating: 4.3 },
              { month: '2025-03', count: 12, avg_rating: 4.1 },
            ],
          },
        })
      }

      if (billing) {
        return NextResponse.json({
          success: true,
          data: {
            stats: { total_reviews: DEMO_STATS.total_reviews, response_rate: DEMO_STATS.response_rate, avg_rating: DEMO_STATS.avg_rating, unresponded_count: DEMO_STATS.pending_reviews, negative_count: 7, reviews_this_month: DEMO_STATS.reviews_this_month, responses_this_month: 9 },
            plan: DEMO_USER.plan,
            subscription: null,
            usage: { ai_replies_used: DEMO_USAGE.ai_replies_used, ai_replies_limit: PLANS[DEMO_USER.plan].aiRepliesPerMonth },
          },
        })
      }

      return NextResponse.json({
        success: true,
        data: { total_reviews: DEMO_STATS.total_reviews, response_rate: DEMO_STATS.response_rate, avg_rating: DEMO_STATS.avg_rating, unresponded_count: DEMO_STATS.pending_reviews, negative_count: 7, reviews_this_month: DEMO_STATS.reviews_this_month, responses_this_month: 9 },
      })
    }

    const supabase = createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const extended = url.searchParams.get('extended') === 'true'
    const billing = url.searchParams.get('billing') === 'true'

    // Get user's locations
    const { data: locations } = await supabase
      .from('locations')
      .select('id')
      .eq('user_id', authUser.id)
      .eq('is_active', true)

    const locationIds = locations?.map((l) => l.id) ?? []

    if (locationIds.length === 0) {
      const emptyStats = {
        total_reviews: 0,
        response_rate: 0,
        avg_rating: 0,
        unresponded_count: 0,
        negative_count: 0,
        reviews_this_month: 0,
        responses_this_month: 0,
      }

      if (billing) {
        const { data: user } = await supabase.from('users').select('plan').eq('id', authUser.id).single()
        return NextResponse.json({
          success: true,
          data: { stats: emptyStats, plan: user?.plan ?? 'free', subscription: null, usage: { ai_replies_used: 0, ai_replies_limit: PLANS[user?.plan ?? 'free'].aiRepliesPerMonth } },
        })
      }

      return NextResponse.json({ success: true, data: emptyStats })
    }

    // Fetch all reviews with responses
    const { data: reviews } = await supabase
      .from('reviews')
      .select('id, rating, google_created_at, responses(status)')
      .in('location_id', locationIds)

    const allReviews = reviews ?? []
    const currentMonth = getCurrentMonth()

    // Calculate stats
    const totalReviews = allReviews.length
    const reviewsThisMonth = allReviews.filter((r) => r.google_created_at?.startsWith(currentMonth)).length
    const ratings = allReviews.map((r) => r.rating)
    const avgRating = calculateAverageRating(ratings)

    const respondedReviews = allReviews.filter((r) => {
      const responses = r.responses as Array<{ status: string }>
      return responses.some((resp) => resp.status === 'posted' || resp.status === 'approved')
    })

    const responseRate = calculateResponseRate(totalReviews, respondedReviews.length)

    const unrespondedCount = allReviews.filter((r) => {
      const responses = r.responses as Array<{ status: string }>
      return !responses.some((resp) =>
        resp.status === 'posted' || resp.status === 'approved' || resp.status === 'skipped'
      )
    }).length

    const negativeCount = allReviews.filter((r) => r.rating <= 2).length

    const responsesThisMonth = respondedReviews.filter(
      (r) => r.google_created_at?.startsWith(currentMonth)
    ).length

    const stats = {
      total_reviews: totalReviews,
      response_rate: responseRate,
      avg_rating: avgRating,
      unresponded_count: unrespondedCount,
      negative_count: negativeCount,
      reviews_this_month: reviewsThisMonth,
      responses_this_month: responsesThisMonth,
    }

    if (!extended && !billing) {
      return NextResponse.json({ success: true, data: stats })
    }

    // Extended: rating distribution and monthly trend
    if (extended) {
      const ratingCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      allReviews.forEach((r) => {
        if (r.rating >= 1 && r.rating <= 5) {
          ratingCounts[r.rating]++
        }
      })

      const ratingDistribution = Object.entries(ratingCounts).map(([rating, count]) => ({
        rating: parseInt(rating),
        count,
        percentage: totalReviews > 0 ? (count / totalReviews) * 100 : 0,
      }))

      // Monthly trend (last 6 months)
      const monthlyMap: Record<string, { count: number; ratings: number[] }> = {}
      allReviews.forEach((r) => {
        if (r.google_created_at) {
          const month = r.google_created_at.slice(0, 7)
          if (!monthlyMap[month]) monthlyMap[month] = { count: 0, ratings: [] }
          monthlyMap[month].count++
          monthlyMap[month].ratings.push(r.rating)
        }
      })

      const monthlyReviews = Object.entries(monthlyMap)
        .sort(([a], [b]) => b.localeCompare(a))
        .slice(0, 6)
        .map(([month, data]) => ({
          month,
          count: data.count,
          avg_rating: calculateAverageRating(data.ratings),
        }))
        .reverse()

      return NextResponse.json({
        success: true,
        data: { stats, rating_distribution: ratingDistribution, monthly_reviews: monthlyReviews },
      })
    }

    // Billing: include plan + subscription info
    if (billing) {
      const { data: user } = await supabase
        .from('users')
        .select('plan, stripe_subscription_id')
        .eq('id', authUser.id)
        .single()

      const currentMonthStr = getCurrentMonth()
      const { data: usageData } = await supabase
        .from('usage_log')
        .select('ai_replies_used')
        .eq('user_id', authUser.id)
        .eq('month', currentMonthStr)
        .single()

      const planConfig = PLANS[user?.plan ?? 'free']

      return NextResponse.json({
        success: true,
        data: {
          stats,
          plan: user?.plan ?? 'free',
          subscription: null, // Detailed subscription fetched separately
          usage: {
            ai_replies_used: usageData?.ai_replies_used ?? 0,
            ai_replies_limit: planConfig.aiRepliesPerMonth,
          },
        },
      })
    }

    return NextResponse.json({ success: true, data: stats })
  } catch (err) {
    console.error('[api/stats/summary GET]', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
