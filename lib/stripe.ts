import Stripe from 'stripe'
import { PLANS } from './constants'
import type { PlanType } from '@/types'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
  typescript: true,
})

// ============================================================
// CUSTOMER MANAGEMENT
// ============================================================

export async function getOrCreateStripeCustomer(
  userId: string,
  email: string,
  name?: string | null
): Promise<string> {
  // Search for existing customer
  const customers = await stripe.customers.list({ email, limit: 1 })

  if (customers.data.length > 0) {
    return customers.data[0].id
  }

  // Create new customer
  const customer = await stripe.customers.create({
    email,
    name: name ?? undefined,
    metadata: { userId },
  })

  return customer.id
}

// ============================================================
// SUBSCRIPTION MANAGEMENT
// ============================================================

export async function createCheckoutSession(
  customerId: string,
  priceId: string,
  userId: string,
  successUrl: string,
  cancelUrl: string
): Promise<string> {
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    currency: 'inr',
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { userId },
    subscription_data: {
      metadata: { userId },
    },
    allow_promotion_codes: true,
    billing_address_collection: 'required',
  })

  return session.url!
}

export async function createBillingPortalSession(
  customerId: string,
  returnUrl: string
): Promise<string> {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })

  return session.url
}

// ============================================================
// WEBHOOK HELPERS
// ============================================================

export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string,
  secret: string
): Stripe.Event {
  return stripe.webhooks.constructEvent(payload, signature, secret)
}

// ============================================================
// PLAN FROM PRICE ID
// ============================================================

export function getPlanFromPriceId(priceId: string): PlanType {
  if (priceId === process.env.STRIPE_PRO_PRICE_ID) return 'pro'
  if (priceId === process.env.STRIPE_BUSINESS_PRICE_ID) return 'business'
  return 'free'
}

export function getPriceIdForPlan(plan: PlanType): string | null {
  return PLANS[plan]?.priceId || null
}

// ============================================================
// SUBSCRIPTION DETAILS
// ============================================================

export async function getSubscriptionDetails(subscriptionId: string) {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ['items.data.price'],
  })

  const priceId = subscription.items.data[0]?.price.id ?? ''
  const plan = getPlanFromPriceId(priceId)

  return {
    plan,
    status: subscription.status,
    current_period_end: subscription.current_period_end,
    cancel_at_period_end: subscription.cancel_at_period_end,
    price_id: priceId,
  }
}
