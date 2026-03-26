'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { StatCardSkeleton } from '@/components/ui/skeleton'
import { Stars } from '@/components/ui/stars'
import type { DashboardStats } from '@/types'

interface RatingDistribution {
  rating: number
  count: number
  percentage: number
}

interface AnalyticsData {
  stats: DashboardStats
  rating_distribution: RatingDistribution[]
  monthly_reviews: Array<{ month: string; count: number; avg_rating: number }>
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/stats/summary?extended=true')
        const json = await res.json()
        if (json.success) setData(json.data)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="max-w-4xl space-y-6">
        <h1 className="text-xl font-bold text-text-primary">Analytics</h1>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
      </div>
    )
  }

  const stats = data?.stats
  const distribution = data?.rating_distribution ?? []
  const monthly = data?.monthly_reviews ?? []

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-xl font-bold text-text-primary">Analytics</h1>
        <p className="text-sm text-text-muted mt-0.5">Overview of your review performance</p>
      </div>

      {/* Summary stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Reviews', value: stats.total_reviews.toLocaleString(), color: 'text-accent' },
            { label: 'Response Rate', value: `${stats.response_rate}%`, color: stats.response_rate >= 80 ? 'text-success' : 'text-warning' },
            { label: 'Average Rating', value: `${stats.avg_rating.toFixed(1)} ★`, color: stats.avg_rating >= 4 ? 'text-success' : 'text-warning' },
            { label: 'This Month', value: stats.reviews_this_month.toString(), color: 'text-text-primary' },
          ].map((s) => (
            <Card key={s.label} className="space-y-1">
              <p className="text-xs text-text-muted">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </Card>
          ))}
        </div>
      )}

      {/* Rating distribution */}
      {distribution.length > 0 && (
        <Card>
          <h2 className="text-base font-semibold text-text-primary mb-5">Rating Distribution</h2>
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map((rating) => {
              const row = distribution.find((d) => d.rating === rating)
              const count = row?.count ?? 0
              const percentage = row?.percentage ?? 0
              return (
                <div key={rating} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-16 shrink-0">
                    <Stars rating={rating} max={rating} size="sm" />
                  </div>
                  <div className="flex-1 h-2.5 bg-border rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        rating >= 4 ? 'bg-success' : rating === 3 ? 'bg-warning' : 'bg-danger'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="w-20 text-right text-sm text-text-muted tabular-nums">
                    {count} ({Math.round(percentage)}%)
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Monthly trend */}
      {monthly.length > 0 && (
        <Card>
          <h2 className="text-base font-semibold text-text-primary mb-5">Monthly Review Trend</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-border">
                  <th className="pb-3 text-text-muted font-medium">Month</th>
                  <th className="pb-3 text-text-muted font-medium">Reviews</th>
                  <th className="pb-3 text-text-muted font-medium">Avg Rating</th>
                </tr>
              </thead>
              <tbody>
                {monthly.map((row) => (
                  <tr key={row.month} className="border-b border-border/50 last:border-0">
                    <td className="py-3 text-text-primary font-medium">{row.month}</td>
                    <td className="py-3 text-text-muted tabular-nums">{row.count}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-1.5">
                        <span className={`font-medium tabular-nums ${row.avg_rating >= 4 ? 'text-success' : row.avg_rating >= 3 ? 'text-warning' : 'text-danger'}`}>
                          {row.avg_rating.toFixed(1)}
                        </span>
                        <Stars rating={Math.round(row.avg_rating)} size="sm" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {!stats && !loading && (
        <div className="text-center py-16 text-text-muted">
          <p>No analytics data yet. Sync your reviews to get started.</p>
        </div>
      )}
    </div>
  )
}
