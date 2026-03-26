'use client'

import { cn } from '@/lib/utils'

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  description?: string
  disabled?: boolean
  size?: 'sm' | 'md'
  className?: string
}

export function Toggle({ checked, onChange, label, description, disabled, size = 'md', className }: ToggleProps) {
  const trackClass = {
    sm: 'w-9 h-5',
    md: 'w-11 h-6',
  }
  const thumbClass = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4.5 h-4.5',
  }
  const thumbTranslate = {
    sm: checked ? 'translate-x-4' : 'translate-x-0.5',
    md: checked ? 'translate-x-5' : 'translate-x-1',
  }

  return (
    <div className={cn('flex items-start gap-3', className)}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-accent/50 focus:ring-offset-1 focus:ring-offset-background',
          trackClass[size],
          checked ? 'bg-accent' : 'bg-border',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <span
          className={cn(
            'pointer-events-none inline-block rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 ease-in-out',
            size === 'sm' ? 'w-3.5 h-3.5' : 'w-[18px] h-[18px]',
            thumbTranslate[size]
          )}
        />
      </button>
      {(label || description) && (
        <div>
          {label && (
            <p className="text-sm font-medium text-text-primary leading-none">{label}</p>
          )}
          {description && (
            <p className="mt-1 text-xs text-text-muted">{description}</p>
          )}
        </div>
      )}
    </div>
  )
}
