import { cn } from '@/lib/utils'

interface StarsProps {
  rating: number
  max?: number
  size?: 'sm' | 'md' | 'lg'
  showCount?: boolean
  className?: string
}

const sizeClasses = {
  sm: 'w-3.5 h-3.5',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
}

export function Stars({ rating, max = 5, size = 'md', showCount, className }: StarsProps) {
  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      {Array.from({ length: max }).map((_, i) => {
        const filled = i < rating
        const half = !filled && i < rating + 0.5
        return (
          <svg
            key={i}
            className={cn(
              sizeClasses[size],
              filled ? 'text-warning' : half ? 'text-warning' : 'text-border'
            )}
            viewBox="0 0 24 24"
            fill={filled || half ? 'currentColor' : 'none'}
            stroke={filled || half ? 'currentColor' : 'currentColor'}
            strokeWidth="1.5"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        )
      })}
      {showCount && (
        <span className="ml-1 text-sm text-text-muted">{rating.toFixed(1)}</span>
      )}
    </div>
  )
}

interface RatingBadgeProps {
  rating: number
  className?: string
}

export function RatingBadge({ rating, className }: RatingBadgeProps) {
  const colorClass =
    rating >= 4 ? 'text-success bg-success/10 border-success/20' :
    rating === 3 ? 'text-warning bg-warning/10 border-warning/20' :
    'text-danger bg-danger/10 border-danger/20'

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border',
        colorClass,
        className
      )}
    >
      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
      {rating}
    </span>
  )
}
