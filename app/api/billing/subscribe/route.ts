import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getOrCreateStripeCustomer,
  createCheckoutSession,
  getPriceIdForPlan,
} from '@/lib/stripe'
import type { PlanType } from '@/types'
import { DEMO_MODE } from '@/lib/demo'

export async function POST(request: Request) {
  try {
    if (DEMO_MODE) {
      return NextResponse.json({
        success: false,
        error: 'Payments are disabled in demo mode. Connect Stripe to enable subscriptions.',
      }, { status: 400 })
    }

    const supabase = createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { plan } = body as { plan: PlanType }

    if (!plan || plan === 'free') {
      return NextResponse.json({ success: false, error: 'Invalid plan' }, { status: 400 })
    }

    const priceId = getPriceIdForPlan(plan)
    if (!priceId) {
      return NextResponse.json({ success: false, error: 'Price ID not configured for this plan' }, { status: 400 })
    }

    // Fetch user details
    const { data: user } = await supabase
      .from('users')
      .select('email, name, stripe_customer_id')
      .eq('id', authUser.id)
      .single()

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    // Get or create Stripe customer
    let customerId = user.stripe_customer_id

    if (!customerId) {
      customerId = await getOrCreateStripeCustomer(authUser.id, user.email, user.name)
      await supabase
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', authUser.id)
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

    const checkoutUrl = await createCheckoutSession(
      customerId,
      priceId,
      authUser.id,
      `${appUrl}/billing?success=true`,
      `${appUrl}/billing?cancelled=true`
    )

    return NextResponse.json({ success: true, data: { url: checkoutUrl } })
  } catch (err) {
    console.error('[api/billing/subscribe POST]', err)
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to create checkout session',
      },
      { status: 500 }
    )
  }
}
