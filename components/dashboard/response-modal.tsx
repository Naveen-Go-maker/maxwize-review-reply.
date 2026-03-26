'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Stars } from '@/components/ui/stars'
import { useToast } from '@/components/ui/toast-provider'
import { formatRelativeDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { ReviewWithDetails, Response } from '@/types'

interface ResponseModalProps {
  review: ReviewWithDetails | null
  open: boolean
  onClose: () => void
  onResponsePosted: (reviewId: string, responseId: string) => void
  onResponseUpdated: (reviewId: string, responseId: string, text: string) => void
}

export function ResponseModal({
  review,
  open,
  onClose,
  onResponsePosted,
  onResponseUpdated,
}: ResponseModalProps) {
  const toast = useToast()
  const [selectedVariant, setSelectedVariant] = useState(0)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [posting, setPosting] = useState(false)
  const [approving, setApproving] = useState(false)
  const [saving, setSaving] = useState(false)

  if (!review) return null

  const responses = review.responses ?? []
  const activeResponse = responses[selectedVariant]

  const handleEdit = (response: Response) => {
    setEditingId(response.id)
    setEditText(response.text)
  }

  const handleSaveEdit = async () => {
    if (!editingId || !editText.trim()) return

    setSaving(true)
    try {
      const res = await fetch(`/api/reviews/${review.id}/response`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response_id: editingId, text: editText.trim() }),
      })
      const data = await res.json()

      if (!data.success) throw new Error(data.error)

      onResponseUpdated(review.id, editingId, editText.trim())
      setEditingId(null)
      toast.success('Response saved')
    } catch (err) {
      toast.error('Failed to save', err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setSaving(false)
    }
  }

  const handleApprove = async () => {
    if (!activeResponse) return

    setApproving(true)
    try {
      const res = await fetch(`/api/reviews/${review.id}/response`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response_id: activeResponse.id, status: 'approved' }),
      })
      const data = await res.json()

      if (!data.success) throw new Error(data.error)

      onResponseUpdated(review.id, activeResponse.id, activeResponse.text)
      toast.success('Response approved', 'You can post it to Google when ready.')
    } catch (err) {
      toast.error('Failed to approve', err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setApproving(false)
    }
  }

  const handlePost = async () => {
    if (!activeResponse) return

    setPosting(true)
    try {
      const res = await fetch(`/api/reviews/${review.id}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response_id: activeResponse.id }),
      })
      const data = await res.json()

      if (!data.success) throw new Error(data.error)

      onResponsePosted(review.id, activeResponse.id)
      toast.success('Posted to Google!', 'Your response is now live on Google.')
      onClose()
    } catch (err) {
      toast.error('Failed to post', err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setPosting(false)
    }
  }

  const handleSkip = async () => {
    if (!activeResponse) return

    try {
      await fetch(`/api/reviews/${review.id}/response`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response_id: activeResponse.id, status: 'skipped' }),
      })
      toast.info('Response skipped')
      onClose()
    } catch {
      toast.error('Failed to skip')
    }
  }

  const isPosted = activeResponse?.status === 'posted'

  return (
    <Modal
      open={open}
      onClose={() => {
        setEditingId(null)
        onClose()
      }}
      title="Review Response"
      size="lg"
    >
      <div className="p-6 space-y-6">
        {/* Original Review */}
        <div className="p-4 bg-surface rounded-xl border border-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center text-sm font-semibold text-accent">
              {review.reviewer_name.slice(0, 1).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">{review.reviewer_name}</p>
              <div className="flex items-center gap-2">
                <Stars rating={review.rating} size="sm" />
                <span className="text-xs text-text-muted">
                  {formatRelativeDate(review.google_created_at)}
                </span>
              </div>
            </div>
          </div>
          {review.text ? (
            <p className="text-sm text-text-muted leading-relaxed italic">"{review.text}"</p>
          ) : (
            <p className="text-xs text-text-muted italic">No written review</p>
          )}
        </div>

        {/* Variant selector */}
        {responses.length > 1 && (
          <div>
            <p className="text-xs font-medium text-text-muted uppercase tracking-wide mb-2">
              Response Variants
            </p>
            <div className="flex gap-2">
              {responses.map((r, i) => (
                <button
                  key={r.id}
                  onClick={() => {
                    setSelectedVariant(i)
                    setEditingId(null)
                  }}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border',
                    selectedVariant === i
                      ? 'bg-accent text-white border-accent'
                      : 'bg-surface text-text-muted border-border hover:border-accent/50'
                  )}
                >
                  Variant {i + 1}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Response text */}
        {activeResponse && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-text-muted uppercase tracking-wide">
                {isPosted ? 'Posted Response' : 'AI-Generated Response'}
              </p>
              {!isPosted && editingId !== activeResponse.id && (
                <button
                  onClick={() => handleEdit(activeResponse)}
                  className="text-xs text-accent hover:text-accent-light"
                >
                  Edit
                </button>
              )}
            </div>

            {editingId === activeResponse.id ? (
              <div className="space-y-3">
                <Textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  rows={6}
                  className="text-sm"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveEdit} loading={saving}>
                    Save Changes
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingId(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className={cn(
                'p-4 rounded-xl border text-sm text-text-primary leading-relaxed',
                isPosted ? 'bg-success/5 border-success/20' : 'bg-surface border-border'
              )}>
                {activeResponse.text}
              </div>
            )}
          </div>
        )}

        {responses.length === 0 && (
          <div className="text-center py-8">
            <p className="text-text-muted text-sm">No response drafts yet.</p>
          </div>
        )}

        {/* Actions */}
        {activeResponse && !isPosted && editingId !== activeResponse.id && (
          <div className="flex items-center gap-3 pt-2 border-t border-border">
            <Button
              variant="primary"
              onClick={handlePost}
              loading={posting}
              className="flex-1"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
              Post to Google
            </Button>
            {activeResponse.status !== 'approved' && (
              <Button
                variant="outline"
                onClick={handleApprove}
                loading={approving}
              >
                Approve
              </Button>
            )}
            <Button variant="ghost" onClick={handleSkip} className="text-text-muted">
              Skip
            </Button>
          </div>
        )}

        {isPosted && (
          <div className="flex items-center gap-2 text-sm text-success pt-2 border-t border-border">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            This response has been posted to Google
          </div>
        )}
      </div>
    </Modal>
  )
}
