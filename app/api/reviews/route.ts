import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { DEMO_MODE, DEMO_REVIEWS } from '@/lib/demo'

export async function GET(request: Request) {
  try {
    if (DEMO_MODE) {
      const url = new URL(request.url)
      const locationId = url.searchParams.get('location_id')
      const rating = url.searchParams.get('rating')
      const status = url.searchParams.get('status')
      const page = parseInt(url.searchParams.get('page') ?? '1')
      const pageSize = parseInt(url.searchParams.get('page_size') ?? '20')

      let filtered = [...DEMO_REVIEWS]
      if (locationId) filtered = filtered.filter((r) => r.location_id === locationId)
      if (rating) filtered = filtered.filter((r) => r.rating === parseInt(rating))
      if (status === 'needs_reply') filtered = filtered.filter((r) => !r.has_response)
      else if (status === 'posted') filtered = filtered.filter((r) => r.active_response?.status === 'posted')
      else if (status === 'draft') filtered = filtered.filter((r) => r.active_response?.status === 'draft')

      const start = (page - 1) * pageSize
      return NextResponse.json({
        success: true,
        data: { reviews: filtered.slice(start, start + pageSize), count: filtered.length, page, page_size: pageSize },
      })
    }

    const supabase = createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const locationId = url.searchParams.get('location_id')
    const rating = url.searchParams.get('rating')
    const status = url.searchParams.get('status')
    const dateFrom = url.searchParams.get('date_from')
    const dateTo = url.searchParams.get('date_to')
    const page = parseInt(url.searchParams.get('page') ?? '1')
    const pageSize = parseInt(url.searchParams.get('page_size') ?? '20')
    const offset = (page - 1) * pageSize

    // Get user's location IDs first
    let locationQuery = supabase
      .from('locations')
      .select('id')
      .eq('user_id', authUser.id)
      .eq('is_active', true)

    if (locationId) {
      locationQuery = locationQuery.eq('id', locationId)
    }

    const { data: userLocations } = await locationQuery

    if (!userLocations || userLocations.length === 0) {
      return NextResponse.json({
        success: true,
        data: { reviews: [], count: 0 },
      })
    }

    const locationIds = userLocations.map((l) => l.id)

    // Build reviews query
    let reviewsQuery = supabase
      .from('reviews')
      .select(`
        *,
        location:locations(id, name, address, google_location_id),
        responses(*)
      `, { count: 'exact' })
      .in('location_id', locationIds)

    if (rating) {
      reviewsQuery = reviewsQuery.eq('rating', parseInt(rating))
    }

    if (dateFrom) {
      reviewsQuery = reviewsQuery.gte('google_created_at', dateFrom)
    }

    if (dateTo) {
      reviewsQuery = reviewsQuery.lte('google_created_at', dateTo + 'T23:59:59Z')
    }

    // Filter by response status
    if (status === 'needs_reply') {
      // Reviews with no responses or only skipped responses — we'll filter in JS
    } else if (status && status !== 'needs_reply') {
      // We filter by response status — need a different approach
    }

    reviewsQuery = reviewsQuery
      .order('google_created_at', { ascending: false })
      .range(offset, offset + pageSize - 1)

    const { data: reviews, error, count } = await reviewsQuery

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    // Enrich reviews with derived fields
    const enrichedReviews = (reviews ?? []).map((review) => {
      const responses = review.responses ?? []
      const activeResponse =
        responses.find((r: { status: string }) => r.status === 'posted') ??
        responses.find((r: { status: string }) => r.status === 'approved') ??
        responses.find((r: { status: string }) => r.status === 'draft') ??
        null

      return {
        ...review,
        has_response: responses.some((r: { status: string }) => r.status !== 'skipped'),
        active_response: activeResponse,
      }
    })

    // Filter by status if needed
    let filtered = enrichedReviews
    if (status === 'needs_reply') {
      filtered = enrichedReviews.filter((r) => !r.has_response)
    } else if (status === 'draft') {
      filtered = enrichedReviews.filter((r) => r.active_response?.status === 'draft')
    } else if (status === 'approved') {
      filtered = enrichedReviews.filter((r) => r.active_response?.status === 'approved')
    } else if (status === 'posted') {
      filtered = enrichedReviews.filter((r) => r.active_response?.status === 'posted')
    } else if (status === 'skipped') {
      filtered = enrichedReviews.filter((r) => r.active_response?.status === 'skipped')
    }

    return NextResponse.json({
      success: true,
      data: {
        reviews: filtered,
        count: count ?? filtered.length,
        page,
        page_size: pageSize,
      },
    })
  } catch (err) {
    console.error('[api/reviews GET]', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
