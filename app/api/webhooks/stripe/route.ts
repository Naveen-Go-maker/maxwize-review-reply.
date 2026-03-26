import { NextResponse } from 'next/server'
import { constructWebhookEvent, getPlanFromPriceId } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/server'
import type Stripe from 'stripe'
import type { PlanType } from '@/types'

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = constructWebhookEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('[webhook/stripe] Signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createServiceClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const customerId = session.customer as string
        const subscriptionId = session.subscription as string
        const userId = session.metadata?.userId

        if (!userId || !subscriptionId) break

        // Get the subscription to find the price ID and plan
        const { stripe: stripeClient } = await import('@/lib/stripe')
        const subscription = await stripeClient.subscriptions.retrieve(subscriptionId, {
          expand: ['items.data.price'],
        })

        const priceId = subscription.items.data[0]?.price.id ?? ''
        const plan = getPlanFromPriceId(priceId)

        await supabase
          .from('users')
          .update({
            plan,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            stripe_subscription_status: subscription.status,
          })
          .eq('id', userId)

        console.log(`[webhook] checkout.session.completed: user ${userId} upgraded to ${plan}`)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string
        const priceId = subscription.items.data[0]?.price.id ?? ''
        const plan = getPlanFromPriceId(priceId)

        await supabase
          .from('users')
          .update({
            plan,
            stripe_subscription_id: subscription.id,
            stripe_subscription_status: subscription.status,
          })
          .eq('stripe_customer_id', customerId)

        console.log(`[webhook] customer.subscription.updated: customer ${customerId} -> ${plan}`)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        await supabase
          .from('users')
          .update({
            plan: 'free' as PlanType,
            stripe_subscription_id: null,
            stripe_subscription_status: 'cancelled',
          })
          .eq('stripe_customer_id', customerId)

        console.log(`[webhook] customer.subscription.deleted: customer ${customerId} downgraded to free`)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        await supabase
          .from('users')
          .update({ stripe_subscription_status: 'past_due' })
          .eq('stripe_customer_id', customerId)

        console.log(`[webhook] invoice.payment_failed: customer ${customerId}`)
        break
      }

      default:
        console.log(`[webhook] Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error(`[webhook/stripe] Error processing event ${event.type}:`, err)
    return NextResponse.json({ error: 'Webhook handler error' }, { status: 500 })
  }
}
