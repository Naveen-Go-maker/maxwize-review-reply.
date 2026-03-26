import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createBillingPortalSession } from '@/lib/stripe'
import { DEMO_MODE } from '@/lib/demo'

export async function GET() {
  try {
    if (DEMO_MODE) {
      return NextResponse.json({
        success: false,
        error: 'Billing portal is disabled in demo mode.',
      }, { status: 400 })
    }

    const supabase = createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { data: user } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', authUser.id)
      .single()

    if (!user?.stripe_customer_id) {
      return NextResponse.json(
        { success: false, error: 'No billing account found. Please subscribe first.' },
        { status: 400 }
      )
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const portalUrl = await createBillingPortalSession(
      user.stripe_customer_id,
      `${appUrl}/billing`
    )

    return NextResponse.json({ success: true, data: { url: portalUrl } })
  } catch (err) {
    console.error('[api/billing/portal GET]', err)
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to create billing portal session',
      },
      { status: 500 }
    )
  }
}
