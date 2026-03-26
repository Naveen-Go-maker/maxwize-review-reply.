import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    variant?: 'primary' | 'secondary' | 'outline'
  }
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-6 text-center', className)}>
      {icon && (
        <div className="w-14 h-14 rounded-full bg-surface flex items-center justify-center text-text-muted mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-text-primary">{title}</h3>
      {description && (
        <p className="mt-2 text-sm text-text-muted max-w-sm leading-relaxed">{description}</p>
      )}
      {action && (
        <div className="mt-6">
          <Button variant={action.variant ?? 'primary'} onClick={action.onClick}>
            {action.label}
          </Button>
        </div>
      )}
    </div>
  )
}

export function NoReviewsEmptyState({ onSync }: { onSync?: () => void }) {
  return (
    <EmptyState
      icon={
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        </svg>
      }
      title="No reviews yet"
      description="Connect your Google Business Profile and sync your reviews to get started."
      action={onSync ? { label: 'Sync Reviews', onClick: onSync } : undefined}
    />
  )
}

export function NoLocationEmptyState({ onConnect }: { onConnect: () => void }) {
  return (
    <EmptyState
      icon={
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      }
      title="No locations connected"
      description="Connect your Google Business Profile to start monitoring and responding to reviews."
      action={{ label: 'Connect Google Business', onClick: onConnect }}
    />
  )
}

export function NoFilterResultsEmptyState({ onReset }: { onReset: () => void }) {
  return (
    <EmptyState
      icon={
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      }
      title="No reviews match your filters"
      description="Try adjusting or clearing your filters to see more reviews."
      action={{ label: 'Clear Filters', onClick: onReset, variant: 'outline' }}
    />
  )
}
