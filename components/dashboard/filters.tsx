'use client'

import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { Location, ReviewFilters } from '@/types'

interface FiltersProps {
  filters: ReviewFilters
  locations: Location[]
  onChange: (filters: ReviewFilters) => void
  onReset: () => void
}

const RATING_OPTIONS = [
  { value: '', label: 'All Ratings' },
  { value: '5', label: '5 Stars' },
  { value: '4', label: '4 Stars' },
  { value: '3', label: '3 Stars' },
  { value: '2', label: '2 Stars' },
  { value: '1', label: '1 Star' },
]

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'needs_reply', label: 'Needs Reply' },
  { value: 'draft', label: 'Draft' },
  { value: 'approved', label: 'Approved' },
  { value: 'posted', label: 'Posted' },
  { value: 'skipped', label: 'Skipped' },
]

const SENTIMENT_OPTIONS = [
  { value: '', label: 'All Sentiments' },
  { value: 'positive', label: 'Positive (4-5 stars)' },
  { value: 'neutral', label: 'Neutral (3 stars)' },
  { value: 'negative', label: 'Negative (1-2 stars)' },
]

export function Filters({ filters, locations, onChange, onReset }: FiltersProps) {
  const locationOptions = [
    { value: '', label: 'All Locations' },
    ...locations.map((l) => ({ value: l.id, label: l.name })),
  ]

  const hasActiveFilters =
    filters.location_id ||
    filters.rating ||
    filters.status ||
    filters.date_from ||
    filters.date_to

  return (
    <div className="flex items-end gap-3 flex-wrap">
      {locations.length > 1 && (
        <div className="w-40">
          <Select
            options={locationOptions}
            value={filters.location_id ?? ''}
            onChange={(e) => onChange({ ...filters, location_id: e.target.value || undefined, page: 1 })}
            label="Location"
          />
        </div>
      )}

      <div className="w-40">
        <Select
          options={STATUS_OPTIONS}
          value={filters.status ?? ''}
          onChange={(e) => onChange({ ...filters, status: e.target.value || undefined, page: 1 })}
          label="Status"
        />
      </div>

      <div className="w-36">
        <Select
          options={RATING_OPTIONS}
          value={filters.rating?.toString() ?? ''}
          onChange={(e) =>
            onChange({ ...filters, rating: e.target.value ? Number(e.target.value) : undefined, page: 1 })
          }
          label="Rating"
        />
      </div>

      <div className="w-40">
        <Input
          type="date"
          label="From Date"
          value={filters.date_from ?? ''}
          onChange={(e) => onChange({ ...filters, date_from: e.target.value || undefined, page: 1 })}
        />
      </div>

      <div className="w-40">
        <Input
          type="date"
          label="To Date"
          value={filters.date_to ?? ''}
          onChange={(e) => onChange({ ...filters, date_to: e.target.value || undefined, page: 1 })}
        />
      </div>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="self-end mb-0.5"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
          Clear filters
        </Button>
      )}
    </div>
  )
}
