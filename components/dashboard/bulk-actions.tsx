'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast-provider'

interface BulkActionsProps {
  selectedIds: string[]
  onClear: () => void
  onBulkComplete: () => void
}

export function BulkActions({ selectedIds, onClear, onBulkComplete }: BulkActionsProps) {
  const toast = useToast()
  const [approving, setApproving] = useState(false)

  if (selectedIds.length === 0) return null

  const handleBulkApprove = async () => {
    setApproving(true)
    try {
      const res = await fetch('/api/reviews/bulk-approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ review_ids: selectedIds }),
      })
      const data = await res.json()

      if (!data.success) throw new Error(data.error)

      toast.success(
        `${data.data?.approved ?? selectedIds.length} responses approved`,
        'They are ready to post to Google.'
      )
      onClear()
      onBulkComplete()
    } catch (err) {
      toast.error('Bulk approve failed', err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setApproving(false)
    }
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-accent/5 border border-accent/20 rounded-xl">
      <span className="text-sm text-text-primary font-medium">
        {selectedIds.length} selected
      </span>

      <div className="flex items-center gap-2 ml-auto">
        <Button
          size="sm"
          variant="primary"
          onClick={handleBulkApprove}
          loading={approving}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Approve All
        </Button>
        <Button size="sm" variant="ghost" onClick={onClear}>
          Clear
        </Button>
      </div>
    </div>
  )
}
