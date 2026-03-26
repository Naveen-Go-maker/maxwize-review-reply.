import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { DEMO_MODE } from '@/lib/demo'

export async function POST(request: Request) {
  try {
    if (DEMO_MODE) {
      const body = await request.json()
      const { review_ids } = body
      return NextResponse.json({
        success: true,
        data: { approved: review_ids?.length ?? 0, total: review_ids?.length ?? 0 },
      })
    }

    const supabase = createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { review_ids } = body

    if (!Array.isArray(review_ids) || review_ids.length === 0) {
      return NextResponse.json({ success: false, error: 'review_ids array required' }, { status: 400 })
    }

    // Verify reviews belong to user
    const { data: userLocations } = await supabase
      .from('locations')
      .select('id')
      .eq('user_id', authUser.id)

    const locationIds = userLocations?.map((l) => l.id) ?? []

    const { data: reviews } = await supabase
      .from('reviews')
      .select('id')
      .in('id', review_ids)
      .in('location_id', locationIds)

    const validReviewIds = reviews?.map((r) => r.id) ?? []

    if (validReviewIds.length === 0) {
      return NextResponse.json({ success: false, error: 'No valid reviews found' }, { status: 400 })
    }

    // For each review, approve the best draft response
    let approvedCount = 0

    for (const reviewId of validReviewIds) {
      const { data: draftResponse } = await supabase
        .from('responses')
        .select('id')
        .eq('review_id', reviewId)
        .eq('status', 'draft')
        .order('variant_number', { ascending: true })
        .limit(1)
        .single()

      if (draftResponse) {
        await supabase
          .from('responses')
          .update({ status: 'approved' })
          .eq('id', draftResponse.id)
        approvedCount++
      }
    }

    return NextResponse.json({
      success: true,
      data: { approved: approvedCount, total: validReviewIds.length },
    })
  } catch (err) {
    console.error('[api/reviews/bulk-approve POST]', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
