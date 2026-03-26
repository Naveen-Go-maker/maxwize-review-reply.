'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Stars } from '@/components/ui/stars'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatRelativeDate, truncate } from '@/lib/utils'
import { RESPONSE_STATUS_LABELS, RESPONSE_STATUS_COLORS } from '@/lib/constants'
import type { ReviewWithDetails } from '@/types'
import { cn } from '@/lib/utils'

interface ReviewCardProps {
  review: ReviewWithDetails
  selected?: boolean
  onSelect?: (id: string, checked: boolean) => void
  onGenerate?: (reviewId: string) => void
  onOpenResponse?: (review: ReviewWithDetails) => void
  isGenerating?: boolean
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
        RESPONSE_STATUS_COLORS[status] ?? 'text-text-muted bg-border/50 border-border'
      )}
    >
      {RESPONSE_STATUS_LABELS[status] ?? status}
    </span>
  )
}

export function ReviewCard({
  review,
  selected,
  onSelect,
  onGenerate,
  onOpenResponse,
  isGenerating,
}: ReviewCardProps) {
  const [expanded, setExpanded] = useState(false)

  const hasResponses = review.responses && review.responses.length > 0
  const activeResponse = review.active_response
  const reviewText = review.text ?? ''
  const isLongText = reviewText.length > 200

  return (
    <div
      className={cn(
        'bg-card border rounded-xl p-5 transition-all duration-150',
        selected ? 'border-accent/50 ring-1 ring-accent/30' : 'border-border hover:border-border/80',
      )}
    >
      {/* Header row */}
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        {onSelect && (
          <input
            type="checkbox"
            checked={selected ?? false}
            onChange={(e) => onSelect(review.id, e.target.checked)}
            className="mt-1 w-4 h-4 rounded border-border bg-surface accent-accent cursor-pointer shrink-0"
          />
        )}

        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-sm font-semibold text-accent shrink-0 overflow-hidden">
          {review.reviewer_photo_url ? (
            <Image
              src={review.reviewer_photo_url}
              alt={review.reviewer_name}
              width={40}
              height={40}
              className="w-full h-full object-cover"
            />
          ) : (
            review.reviewer_name.slice(0, 1).toUpperCase()
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-text-primary">
              {review.reviewer_name}
            </span>
            {review.location && (
              <span className="text-xs text-text-muted">· {review.location.name}</span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Stars rating={review.rating} size="sm" />
            <span className="text-xs text-text-muted">
              {formatRelativeDate(review.google_created_at)}
            </span>
          </div>
        </div>

        {/* Status badge */}
        {activeResponse && (
          <StatusBadge status={activeResponse.status} />
        )}
        {!hasResponses && !activeResponse && (
          <Badge variant="warning" size="sm">Needs reply</Badge>
        )}
      </div>

      {/* Review text */}
      {reviewText && (
        <div className="mt-3 ml-0 sm:ml-[52px]">
          <p className="text-sm text-text-muted leading-relaxed">
            {isLongText && !expanded
              ? truncate(reviewText, 200)
              : reviewText}
          </p>
          {isLongText && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-1 text-xs text-accent hover:text-accent-light"
            >
              {expanded ? 'Show less' : 'Read more'}
            </button>
          )}
        </div>
      )}

      {!reviewText && (
        <p className="mt-3 ml-0 sm:ml-[52px] text-xs text-text-muted italic">
          No written review
        </p>
      )}

      {/* Active response preview */}
      {activeResponse && activeResponse.status !== 'skipped' && (
        <div className="mt-4 ml-0 sm:ml-[52px] p-3 bg-surface rounded-lg border border-border">
          <p className="text-xs text-text-muted mb-1 font-medium uppercase tracking-wide">
            {activeResponse.status === 'posted' ? 'Posted Response' : 'AI Draft Response'}
          </p>
          <p className="text-sm text-text-primary leading-relaxed">
            {truncate(activeResponse.text, 150)}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 ml-0 sm:ml-[52px] flex items-center gap-2 flex-wrap">
        {!hasResponses ? (
          <Button
            size="sm"
            variant="primary"
            loading={isGenerating}
            onClick={() => onGenerate?.(review.id)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
            Generate Reply
          </Button>
        ) : (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onOpenResponse?.(review)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            {activeResponse?.status === 'posted' ? 'View Response' : 'Review Drafts'}
          </Button>
        )}
      </div>
    </div>
  )
}
