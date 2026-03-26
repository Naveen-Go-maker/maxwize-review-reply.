'use client'

import { useCallback, useEffect, useState } from 'react'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { ReviewCard } from '@/components/dashboard/review-card'
import { ResponseModal } from '@/components/dashboard/response-modal'
import { Filters } from '@/components/dashboard/filters'
import { BulkActions } from '@/components/dashboard/bulk-actions'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { NoReviewsEmptyState, NoLocationEmptyState, NoFilterResultsEmptyState } from '@/components/dashboard/empty-state'
import { ReviewCardSkeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/toast-provider'
import type { DashboardStats, Location, ReviewFilters, ReviewWithDetails } from '@/types'
import { useRouter } from 'next/navigation'

const DEFAULT_FILTERS: ReviewFilters = {
  page: 1,
  page_size: 20,
}

export default function DashboardPage() {
  const toast = useToast()
  const router = useRouter()

  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [reviews, setReviews] = useState<ReviewWithDetails[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [filters, setFilters] = useState<ReviewFilters>(DEFAULT_FILTERS)
  const [totalCount, setTotalCount] = useState(0)
  const [statsLoading, setStatsLoading] = useState(true)
  const [reviewsLoading, setReviewsLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [generatingIds, setGeneratingIds] = useState<Set<string>>(new Set())
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [activeReview, setActiveReview] = useState<ReviewWithDetails | null>(null)
  const [hasLocations, setHasLocations] = useState<boolean | null>(null)

  const fetchStats = useCallback(async () => {
    setStatsLoading(true)
    try {
      const res = await fetch('/api/stats/summary')
      const data = await res.json()
      if (data.success) setStats(data.data)
    } finally {
      setStatsLoading(false)
    }
  }, [])

  const fetchReviews = useCallback(async (currentFilters: ReviewFilters) => {
    setReviewsLoading(true)
    try {
      const params = new URLSearchParams()
      if (currentFilters.location_id) params.set('location_id', currentFilters.location_id)
      if (currentFilters.rating) params.set('rating', String(currentFilters.rating))
      if (currentFilters.status) params.set('status', currentFilters.status)
      if (currentFilters.date_from) params.set('date_from', currentFilters.date_from)
      if (currentFilters.date_to) params.set('date_to', currentFilters.date_to)
      params.set('page', String(currentFilters.page ?? 1))
      params.set('page_size', String(currentFilters.page_size ?? 20))

      const res = await fetch(`/api/reviews?${params}`)
      const data = await res.json()
      if (data.success) {
        setReviews(data.data.reviews)
        setTotalCount(data.data.count)
      }
    } finally {
      setReviewsLoading(false)
    }
  }, [])

  const fetchLocations = useCallback(async () => {
    const res = await fetch('/api/locations')
    const data = await res.json()
    if (data.success) {
      setLocations(data.data)
      setHasLocations(data.data.length > 0)
    } else {
      setHasLocations(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
    fetchLocations()
  }, [fetchStats, fetchLocations])

  useEffect(() => {
    fetchReviews(filters)
  }, [filters, fetchReviews])

  const handleSync = async () => {
    setSyncing(true)
    try {
      const res = await fetch('/api/locations/sync', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        toast.success('Sync complete', `Found ${data.data?.new_reviews ?? 0} new reviews`)
        fetchStats()
        fetchReviews(filters)
        fetchLocations()
      } else {
        if (data.error?.includes('not connected')) {
          toast.error('Google not connected', 'Please connect your Google Business Profile first.')
        } else {
          toast.error('Sync failed', data.error)
        }
      }
    } catch {
      toast.error('Sync failed', 'Could not connect to server')
    } finally {
      setSyncing(false)
    }
  }

  const handleGenerate = async (reviewId: string) => {
    setGeneratingIds((prev) => new Set(prev).add(reviewId))
    try {
      const res = await fetch(`/api/reviews/${reviewId}/generate`, { method: 'POST' })
      const data = await res.json()

      if (!data.success) {
        if (data.error?.includes('limit')) {
          toast.error('Usage limit reached', 'Upgrade your plan for more AI replies.')
        } else {
          toast.error('Generation failed', data.error)
        }
        return
      }

      // Update review in list
      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId
            ? { ...r, responses: data.data.responses, has_response: true, active_response: data.data.responses[0] }
            : r
        )
      )

      toast.success('Responses generated', `${data.data.responses.length} variant(s) ready for review`)
    } finally {
      setGeneratingIds((prev) => {
        const next = new Set(prev)
        next.delete(reviewId)
        return next
      })
    }
  }

  const handleSelect = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  const handleFiltersChange = (newFilters: ReviewFilters) => {
    setSelectedIds(new Set())
    setFilters(newFilters)
  }

  const handleFiltersReset = () => {
    setSelectedIds(new Set())
    setFilters(DEFAULT_FILTERS)
  }

  const handleResponsePosted = (reviewId: string, responseId: string) => {
    setReviews((prev) =>
      prev.map((r) =>
        r.id === reviewId
          ? {
              ...r,
              responses: r.responses?.map((resp) =>
                resp.id === responseId ? { ...resp, status: 'posted' as const } : resp
              ),
              active_response:
                r.active_response?.id === responseId
                  ? { ...r.active_response, status: 'posted' as const }
                  : r.active_response,
            }
          : r
      )
    )
    fetchStats()
  }

  const handleResponseUpdated = (reviewId: string, responseId: string, text: string) => {
    setReviews((prev) =>
      prev.map((r) =>
        r.id === reviewId
          ? {
              ...r,
              responses: r.responses?.map((resp) =>
                resp.id === responseId ? { ...resp, text } : resp
              ),
            }
          : r
      )
    )
  }

  const totalPages = Math.ceil(totalCount / (filters.page_size ?? 20))

  if (hasLocations === false) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-text-primary">Review Inbox</h1>
        </div>
        <div className="bg-card border border-border rounded-2xl">
          <NoLocationEmptyState onConnect={() => router.push('/onboarding')} />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Review Inbox</h1>
          {totalCount > 0 && (
            <p className="text-sm text-text-muted mt-0.5">{totalCount} reviews total</p>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={handleSync} loading={syncing}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
          </svg>
          Sync Reviews
        </Button>
      </div>

      {/* Stats */}
      <StatsCards stats={stats} loading={statsLoading} />

      {/* Filters */}
      {locations.length > 0 && (
        <Filters
          filters={filters}
          locations={locations}
          onChange={handleFiltersChange}
          onReset={handleFiltersReset}
        />
      )}

      {/* Bulk actions */}
      <BulkActions
        selectedIds={Array.from(selectedIds)}
        onClear={() => setSelectedIds(new Set())}
        onBulkComplete={() => {
          fetchReviews(filters)
          fetchStats()
        }}
      />

      {/* Review list */}
      {reviewsLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <ReviewCardSkeleton key={i} />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl">
          {Object.keys(filters).some(k => k !== 'page' && k !== 'page_size' && filters[k as keyof ReviewFilters]) ? (
            <NoFilterResultsEmptyState onReset={handleFiltersReset} />
          ) : (
            <NoReviewsEmptyState onSync={handleSync} />
          )}
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {reviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                selected={selectedIds.has(review.id)}
                onSelect={handleSelect}
                onGenerate={handleGenerate}
                onOpenResponse={setActiveReview}
                isGenerating={generatingIds.has(review.id)}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-text-muted">
                Page {filters.page ?? 1} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={(filters.page ?? 1) <= 1}
                  onClick={() => setFilters((prev) => ({ ...prev, page: (prev.page ?? 1) - 1 }))}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={(filters.page ?? 1) >= totalPages}
                  onClick={() => setFilters((prev) => ({ ...prev, page: (prev.page ?? 1) + 1 }))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Response modal */}
      <ResponseModal
        review={activeReview}
        open={Boolean(activeReview)}
        onClose={() => setActiveReview(null)}
        onResponsePosted={handleResponsePosted}
        onResponseUpdated={handleResponseUpdated}
      />
    </div>
  )
}
