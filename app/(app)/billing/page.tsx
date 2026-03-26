'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { useToast } from '@/components/ui/toast-provider'
import { PLANS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/utils'
import type { PlanType, SubscriptionDetails } from '@/types'

interface BillingData {
  plan: PlanType
  subscription: SubscriptionDetails | null
  usage: {
    ai_replies_used: number
    ai_replies_limit: number | null
  }
}

export default function BillingPage() {
  const toast = useToast()
  const [data, setData] = useState<BillingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [subscribing, setSubscribing] = useState<string | null>(null)
  const [openingPortal, setOpeningPortal] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/stats/summary?billing=true')
        const json = await res.json()
        if (json.success) setData(json.data)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleSubscribe = async (plan: PlanType) => {
    if (plan === 'free') return

    setSubscribing(plan)
    try {
      const res = await fetch('/api/billing/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const json = await res.json()
      if (json.success && json.data?.url) {
        window.location.href = json.data.url
      } else {
        toast.error('Could not start checkout', json.error)
      }
    } catch {
      toast.error('Error starting checkout')
    } finally {
      setSubscribing(null)
    }
  }

  const handleBillingPortal = async () => {
    setOpeningPortal(true)
    try {
      const res = await fetch('/api/billing/portal')
      const json = await res.json()
      if (json.success && json.data?.url) {
        window.location.href = json.data.url
      } else {
        toast.error('Could not open billing portal', json.error)
      }
    } catch {
      toast.error('Error opening billing portal')
    } finally {
      setOpeningPortal(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Spinner size="lg" />
      </div>
    )
  }

  const currentPlan = data?.plan ?? 'free'
  const planConfig = PLANS[currentPlan]
  const usagePercent = data?.usage?.ai_replies_limit
    ? Math.min(100, ((data.usage.ai_replies_used ?? 0) / data.usage.ai_replies_limit) * 100)
    : 0

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-text-primary">Billing</h1>
        <p className="text-sm text-text-muted mt-0.5">Manage your subscription and usage</p>
      </div>

      {/* Current plan */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-text-primary">Current Plan</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl font-bold text-text-primary">{planConfig.name}</span>
              <Badge variant={currentPlan === 'free' ? 'muted' : currentPlan === 'pro' ? 'accent' : 'warning'}>
                {currentPlan === 'free' ? 'Free' : `₹${planConfig.price}/mo`}
              </Badge>
            </div>
          </div>

          {data?.subscription && (
            <Button variant="outline" size="sm" onClick={handleBillingPortal} loading={openingPortal}>
              Manage Subscription
            </Button>
          )}
        </div>

        {/* Usage */}
        {data?.usage && (
          <div className="pt-4 border-t border-border">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-text-muted">AI Replies This Month</span>
              <span className={cn(
                'font-medium tabular-nums',
                usagePercent >= 90 ? 'text-danger' : usagePercent >= 70 ? 'text-warning' : 'text-text-primary'
              )}>
                {data.usage.ai_replies_used} / {data.usage.ai_replies_limit ?? '∞'}
              </span>
            </div>
            {data.usage.ai_replies_limit && (
              <div className="h-2 bg-border rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    usagePercent >= 90 ? 'bg-danger' : usagePercent >= 70 ? 'bg-warning' : 'bg-accent'
                  )}
                  style={{ width: `${usagePercent}%` }}
                />
              </div>
            )}
          </div>
        )}

        {/* Subscription details */}
        {data?.subscription && (
          <div className="pt-4 border-t border-border space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-text-muted">Status</span>
              <Badge variant={data.subscription.status === 'active' ? 'success' : 'warning'}>
                {data.subscription.status}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Next billing date</span>
              <span className="text-text-primary">
                {formatDate(new Date(data.subscription.current_period_end * 1000).toISOString())}
              </span>
            </div>
            {data.subscription.cancel_at_period_end && (
              <div className="flex items-center gap-2 p-3 bg-warning/10 border border-warning/20 rounded-lg">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span className="text-sm text-warning">Cancels at end of billing period</span>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Plan comparison */}
      <div>
        <h2 className="text-base font-semibold text-text-primary mb-4">Upgrade Your Plan</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(['free', 'pro', 'business'] as PlanType[]).map((planKey) => {
            const plan = PLANS[planKey]
            const isCurrent = currentPlan === planKey
            const isHighlighted = planKey === 'pro'

            return (
              <div
                key={planKey}
                className={cn(
                  'relative rounded-xl p-5 border',
                  isHighlighted && !isCurrent ? 'border-accent/40 bg-accent/5' : 'border-border bg-card',
                  isCurrent && 'ring-2 ring-success/30 border-success/30'
                )}
              >
                {isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-success text-white text-xs font-semibold px-2.5 py-0.5 rounded-full">
                      Current
                    </span>
                  </div>
                )}

                <h3 className="text-sm font-bold text-text-primary">{plan.name}</h3>
                <p className="text-xl font-bold text-text-primary mt-1">
                  {plan.price === 0 ? 'Free' : `₹${plan.price}/mo`}
                </p>

                <ul className="mt-3 space-y-2">
                  {plan.features.slice(0, 4).map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-xs text-text-muted">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={isCurrent ? '#22c55e' : isHighlighted ? '#6c63ff' : '#94a3b8'}
                        strokeWidth="2.5"
                        className="mt-0.5 shrink-0"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>

                {!isCurrent && planKey !== 'free' && (
                  <Button
                    size="sm"
                    fullWidth
                    variant={isHighlighted ? 'primary' : 'outline'}
                    className="mt-4"
                    onClick={() => handleSubscribe(planKey)}
                    loading={subscribing === planKey}
                  >
                    Upgrade to {plan.name}
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
