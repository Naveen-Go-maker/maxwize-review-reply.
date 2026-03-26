import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { DEMO_MODE, DEMO_REVIEWS } from '@/lib/demo'
import type { Location } from '@/types'

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { response_id, text, status } = body

    if (!response_id) {
      return NextResponse.json({ success: false, error: 'response_id required' }, { status: 400 })
    }

    if (DEMO_MODE) {
      const review = DEMO_REVIEWS.find((r) => r.id === params.id)
      if (!review) {
        return NextResponse.json({ success: false, error: 'Review not found' }, { status: 404 })
      }
      return NextResponse.json({
        success: true,
        data: { id: response_id, review_id: params.id, text, status },
      })
    }

    const supabase = createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Verify review ownership
    const { data: review } = await supabase
      .from('reviews')
      .select('*, location:locations(*)')
      .eq('id', params.id)
      .single()

    if (!review) {
      return NextResponse.json({ success: false, error: 'Review not found' }, { status: 404 })
    }

    const location = review.location as Location
    if (!location || location.user_id !== authUser.id) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    // Build update object
    const updateData: Record<string, unknown> = {}
    if (text !== undefined) updateData.text = text
    if (status !== undefined) updateData.status = status

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ success: false, error: 'Nothing to update' }, { status: 400 })
    }

    const { data: updated, error } = await supabase
      .from('responses')
      .update(updateData)
      .eq('id', response_id)
      .eq('review_id', params.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: updated })
  } catch (err) {
    console.error('[api/reviews/[id]/response PUT]', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
