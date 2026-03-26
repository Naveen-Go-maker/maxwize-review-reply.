import Link from 'next/link'
import { cn } from '@/lib/utils'
import { PLANS } from '@/lib/constants'

export function Pricing() {
  const plans = [
    { key: 'free', highlighted: false },
    { key: 'pro', highlighted: true },
    { key: 'business', highlighted: false },
  ]

  return (
    <section id="pricing" className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-text-primary">Simple, transparent pricing</h2>
          <p className="mt-4 text-lg text-text-muted">
            Start free, upgrade when you need more. No contracts, cancel anytime.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map(({ key, highlighted }) => {
            const plan = PLANS[key]
            return (
              <div
                key={key}
                className={cn(
                  'relative rounded-2xl p-6 border',
                  highlighted
                    ? 'bg-accent/5 border-accent/40 ring-1 ring-accent/30'
                    : 'bg-card border-border'
                )}
              >
                {highlighted && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="bg-accent text-white text-xs font-semibold px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-lg font-bold text-text-primary">{plan.name}</h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    {plan.price === 0 ? (
                      <span className="text-4xl font-bold text-text-primary">Free</span>
                    ) : (
                      <>
                        <span className="text-4xl font-bold text-text-primary">₹{plan.price}</span>
                        <span className="text-text-muted">/month</span>
                      </>
                    )}
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        className={cn('mt-0.5 shrink-0', highlighted ? 'text-accent' : 'text-success')}
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span className="text-text-muted">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.price === 0 ? '/signup' : `/signup?plan=${key}`}
                  className={cn(
                    'block w-full text-center py-3 rounded-xl font-semibold text-sm transition-colors',
                    highlighted
                      ? 'bg-accent hover:bg-accent-hover text-white'
                      : 'bg-surface hover:bg-card text-text-primary border border-border'
                  )}
                >
                  {plan.price === 0 ? 'Get started free' : `Start ${plan.name}`}
                </Link>
              </div>
            )
          })}
        </div>

        <p className="mt-10 text-center text-sm text-text-muted">
          All plans include a 14-day free trial on paid tiers. No credit card required for Free.
        </p>
      </div>
    </section>
  )
}
