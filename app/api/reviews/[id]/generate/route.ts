import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateResponses } from '@/lib/claude'
import { PLANS } from '@/lib/constants'
import { getCurrentMonth } from '@/lib/utils'
import type { Review, Location, BrandVoice } from '@/types'
import { DEMO_MODE, DEMO_REVIEWS, DEMO_AI_RESPONSES } from '@/lib/demo'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    if (DEMO_MODE) {
      const reviewId = params.id
      const texts = DEMO_AI_RESPONSES[reviewId] ?? [
        "Thank you so much for taking the time to share your feedback! We truly appreciate your kind words and are delighted that you had a positive experience with us. Your support means a great deal to our entire team. We look forward to welcoming you again soon!",
        "We're so grateful for your wonderful review! Hearing from happy customers is what motivates our team every day. We'll make sure to share your kind words with the team. Please visit us again — we'd love to make your next experience even better!",
      ]
      const responses = texts.map((text, i) => ({
        id: `demo-resp-${reviewId}-${i + 1}`,
        review_id: reviewId,
        variant_number: i + 1,
        text,
        status: 'draft',
        posted_at: null,
        created_at: new Date().toISOString(),
      }))
      return NextResponse.json({ success: true, data: { responses } })
    }

    const supabase = createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const reviewId = params.id

    // Fetch user
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single()

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    // Check usage limits
    const planConfig = PLANS[user.plan]
    if (planConfig.aiRepliesPerMonth !== null) {
      const currentMonth = getCurrentMonth()
      const { data: usageData } = await supabase
        .from('usage_log')
        .select('ai_replies_used')
        .eq('user_id', authUser.id)
        .eq('month', currentMonth)
        .single()

      const used = usageData?.ai_replies_used ?? 0
      if (used >= planConfig.aiRepliesPerMonth) {
        return NextResponse.json(
          {
            success: false,
            error: `Monthly AI reply limit reached (${planConfig.aiRepliesPerMonth}). Please upgrade your plan.`,
          },
          { status: 403 }
        )
      }
    }

    // Fetch review with location
    const { data: review, error: reviewError } = await supabase
      .from('reviews')
      .select('*, location:locations(*)')
      .eq('id', reviewId)
      .single()

    if (reviewError || !review) {
      return NextResponse.json({ success: false, error: 'Review not found' }, { status: 404 })
    }

    // Verify the review belongs to user's location
    const location = review.location as Location
    if (!location || location.user_id !== authUser.id) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    // Fetch brand voice (location-specific or global)
    const { data: brandVoiceData } = await supabase
      .from('brand_voice')
      .select('*')
      .eq('user_id', authUser.id)
      .or(`location_id.eq.${location.id},location_id.is.null`)
      .order('location_id', { ascending: false, nullsFirst: false })
      .limit(1)
      .single()

    const brandVoice: BrandVoice = brandVoiceData ?? {
      id: '',
      user_id: authUser.id,
      location_id: null,
      tone: 'professional' as const,
      language: 'en' as const,
      owner_name: null,
      sign_off: null,
      custom_instructions: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // Delete existing draft responses for this review
    await supabase
      .from('responses')
      .delete()
      .eq('review_id', reviewId)
      .eq('status', 'draft')

    // Generate responses
    const variants = await generateResponses(
      review as unknown as Review,
      location,
      brandVoice,
      planConfig.variants
    )

    // Save generated responses
    const savedResponses = []
    for (const variant of variants) {
      const { data: saved } = await supabase
        .from('responses')
        .insert({
          review_id: reviewId,
          variant_number: variant.variant_number,
          text: variant.text,
          status: 'draft',
        })
        .select()
        .single()

      if (saved) savedResponses.push(saved)
    }

    // Increment usage
    await supabase.rpc('increment_ai_usage', { p_user_id: authUser.id, p_count: 1 })

    return NextResponse.json({
      success: true,
      data: { responses: savedResponses },
    })
  } catch (err) {
    console.error('[api/reviews/[id]/generate POST]', err)
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}
