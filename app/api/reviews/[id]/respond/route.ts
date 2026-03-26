import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { postResponse } from '@/lib/google'
import type { Location } from '@/types'
import { DEMO_MODE } from '@/lib/demo'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    if (DEMO_MODE) {
      const body = await request.json()
      const { response_id } = body
      return NextResponse.json({
        success: true,
        data: {
          response: {
            id: response_id,
            review_id: params.id,
            status: 'posted',
            posted_at: new Date().toISOString(),
          },
        },
      })
    }

    const supabase = createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { response_id } = body

    if (!response_id) {
      return NextResponse.json({ success: false, error: 'response_id required' }, { status: 400 })
    }

    // Fetch the response
    const { data: response, error: responseError } = await supabase
      .from('responses')
      .select('*')
      .eq('id', response_id)
      .eq('review_id', params.id)
      .single()

    if (responseError || !response) {
      return NextResponse.json({ success: false, error: 'Response not found' }, { status: 404 })
    }

    // Fetch review with location
    const { data: review } = await supabase
      .from('reviews')
      .select('*, location:locations(*)')
      .eq('id', params.id)
      .single()

    if (!review) {
      return NextResponse.json({ success: false, error: 'Review not found' }, { status: 404 })
    }

    const location = review.location as Location

    // Verify ownership
    if (!location || location.user_id !== authUser.id) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    // Fetch user tokens
    const { data: user } = await supabase
      .from('users')
      .select('google_access_token, google_refresh_token, google_account_id')
      .eq('id', authUser.id)
      .single()

    if (!user?.google_access_token || !user?.google_account_id) {
      return NextResponse.json(
        { success: false, error: 'Google Business Profile not connected' },
        { status: 400 }
      )
    }

    // Post to Google
    await postResponse(
      user.google_access_token,
      user.google_refresh_token ?? '',
      user.google_account_id,
      location.google_location_id,
      review.google_review_id,
      response.text
    )

    // Update response status to posted
    const { data: updated } = await supabase
      .from('responses')
      .update({
        status: 'posted',
        posted_at: new Date().toISOString(),
      })
      .eq('id', response_id)
      .select()
      .single()

    return NextResponse.json({
      success: true,
      data: { response: updated },
    })
  } catch (err) {
    console.error('[api/reviews/[id]/respond POST]', err)
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to post response',
      },
      { status: 500 }
    )
  }
}
