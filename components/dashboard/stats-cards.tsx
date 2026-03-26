'use client'

import { cn } from '@/lib/utils'
import type { DashboardStats } from '@/types'
import { StatCardSkeleton } from '@/components/ui/skeleton'

interface StatsCardsProps {
  stats: DashboardStats | null
  loading?: boolean
}

interface StatCardProps {
  label: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  iconColor: string
  trend?: { value: number; label: string }
}

function StatCard({ label, value, subtitle, icon, iconColor, trend }: StatCardProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm text-text-muted font-medium">{label}</p>
        <div className={cn('p-2 rounded-lg', iconColor)}>{icon}</div>
      </div>
      <p className="text-2xl font-bold text-text-primary tabular-nums">{value}</p>
      {subtitle && <p className="mt-1 text-xs text-text-muted">{subtitle}</p>}
      {trend && (
        <div className={cn(
          'mt-2 flex items-center gap-1 text-xs font-medium',
          trend.value >= 0 ? 'text-success' : 'text-danger'
        )}>
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            {trend.value >= 0 ? (
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
            ) : (
              <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
            )}
          </svg>
          {trend.label}
        </div>
      )}
    </div>
  )
}

export function StatsCards({ stats, loading }: StatsCardsProps) {
  if (loading || !stats) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  const cards = [
    {
      label: 'Total Reviews',
      value: stats.total_reviews.toLocaleString(),
      subtitle: `${stats.reviews_this_month} this month`,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        </svg>
      ),
      iconColor: 'bg-accent/10 text-accent',
    },
    {
      label: 'Response Rate',
      value: `${stats.response_rate}%`,
      subtitle: stats.response_rate >= 80 ? 'Excellent!' : stats.response_rate >= 50 ? 'Good' : 'Needs attention',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      ),
      iconColor: stats.response_rate >= 80 ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning',
    },
    {
      label: 'Average Rating',
      value: stats.avg_rating.toFixed(1),
      subtitle: `${stats.total_reviews} total reviews`,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ),
      iconColor: stats.avg_rating >= 4 ? 'bg-warning/10 text-warning' : 'bg-danger/10 text-danger',
    },
    {
      label: 'Needs Reply',
      value: stats.unresponded_count,
      subtitle: stats.negative_count > 0 ? `${stats.negative_count} negative` : 'All handled',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      ),
      iconColor: stats.unresponded_count > 0 ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <StatCard key={card.label} {...card} />
      ))}
    </div>
  )
}
