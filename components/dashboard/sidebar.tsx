'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import type { User, UsageLog } from '@/types'
import { PLANS } from '@/lib/constants'

interface SidebarProps {
  user: User
  usage?: UsageLog | null
}

const NAV_ITEMS = [
  {
    label: 'Inbox',
    href: '/dashboard',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 12h-6l-2 3h-4l-2-3H2" />
        <path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" />
      </svg>
    ),
  },
  {
    label: 'Analytics',
    href: '/analytics',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
  {
    label: 'Locations',
    href: '/locations',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
  },
  {
    label: 'Brand Voice',
    href: '/brand-voice',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
    ),
  },
  {
    label: 'Notifications',
    href: '/notifications',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 01-3.46 0" />
      </svg>
    ),
  },
  {
    label: 'Billing',
    href: '/billing',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
        <line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    ),
  },
]

const PLAN_BADGE_VARIANTS = {
  free: 'muted' as const,
  pro: 'accent' as const,
  business: 'warning' as const,
}

export function Sidebar({ user, usage }: SidebarProps) {
  const pathname = usePathname()
  const planConfig = PLANS[user.plan]
  const usageCount = usage?.ai_replies_used ?? 0
  const usageLimit = planConfig.aiRepliesPerMonth
  const usagePercent = usageLimit ? Math.min(100, (usageCount / usageLimit) * 100) : 0

  return (
    <aside className="w-64 bg-surface border-r border-border flex flex-col h-screen fixed left-0 top-0 z-30">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-border">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </div>
          <span className="text-base font-bold text-text-primary">ReviewReply</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-accent/10 text-accent'
                  : 'text-text-muted hover:text-text-primary hover:bg-card'
              )}
            >
              <span className={cn(isActive ? 'text-accent' : 'text-text-muted')}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Plan + Usage section */}
      <div className="px-4 py-4 border-t border-border space-y-4">
        {/* Plan badge */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-text-muted">Current Plan</span>
          <Badge variant={PLAN_BADGE_VARIANTS[user.plan]} size="sm">
            {planConfig.name}
          </Badge>
        </div>

        {/* Usage meter (only for limited plans) */}
        {usageLimit !== null && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-text-muted">AI Replies</span>
              <span className={cn(
                'font-medium',
                usagePercent >= 90 ? 'text-danger' : usagePercent >= 70 ? 'text-warning' : 'text-text-primary'
              )}>
                {usageCount} / {usageLimit}
              </span>
            </div>
            <div className="h-1.5 bg-border rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  usagePercent >= 90 ? 'bg-danger' : usagePercent >= 70 ? 'bg-warning' : 'bg-accent'
                )}
                style={{ width: `${usagePercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Upgrade CTA for free users */}
        {user.plan === 'free' && (
          <Link
            href="/billing"
            className="flex items-center justify-center gap-1.5 w-full px-3 py-2 bg-accent/10 text-accent text-xs font-medium rounded-lg hover:bg-accent/20 transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            Upgrade to Pro
          </Link>
        )}
      </div>
    </aside>
  )
}
