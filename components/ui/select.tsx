'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  hint?: string
  options: Array<{ value: string; label: string; disabled?: boolean }>
  placeholder?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, hint, options, placeholder, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-text-primary mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={inputId}
            className={cn(
              'w-full bg-surface border rounded-lg px-3 py-2.5 text-sm text-text-primary transition-colors appearance-none cursor-pointer pr-10',
              'focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              error ? 'border-danger' : 'border-border',
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M4.646 6.146a.5.5 0 01.708 0L8 8.793l2.646-2.647a.5.5 0 01.708.708l-3 3a.5.5 0 01-.708 0l-3-3a.5.5 0 010-.708z" />
            </svg>
          </div>
        </div>
        {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
        {hint && !error && <p className="mt-1.5 text-xs text-text-muted">{hint}</p>}
      </div>
    )
  }
)

Select.displayName = 'Select'
