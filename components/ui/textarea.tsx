'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-text-primary mb-1.5">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            'w-full bg-surface border rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted/60 transition-colors resize-y min-h-[100px]',
            'focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error ? 'border-danger focus:ring-danger/50 focus:border-danger' : 'border-border',
            className
          )}
          {...props}
        />
        {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
        {hint && !error && <p className="mt-1.5 text-xs text-text-muted">{hint}</p>}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'
