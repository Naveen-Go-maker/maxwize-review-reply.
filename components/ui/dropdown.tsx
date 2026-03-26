'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface DropdownItem {
  label: string
  onClick: () => void
  icon?: React.ReactNode
  danger?: boolean
  disabled?: boolean
  separator?: false
}

interface DropdownSeparator {
  separator: true
}

type DropdownEntry = DropdownItem | DropdownSeparator

interface DropdownProps {
  trigger: React.ReactNode
  items: DropdownEntry[]
  align?: 'left' | 'right'
  className?: string
}

export function Dropdown({ trigger, items, align = 'right', className }: DropdownProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    if (open) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open])

  return (
    <div ref={containerRef} className={cn('relative inline-block', className)}>
      <div onClick={() => setOpen((prev) => !prev)}>{trigger}</div>

      {open && (
        <div
          className={cn(
            'absolute top-full mt-1.5 z-50 min-w-[180px] bg-card border border-border rounded-xl shadow-2xl py-1',
            align === 'right' ? 'right-0' : 'left-0'
          )}
        >
          {items.map((item, index) => {
            if ('separator' in item && item.separator) {
              return <div key={`sep-${index}`} className="my-1 border-t border-border" />
            }

            const { label, onClick, icon, danger, disabled } = item as DropdownItem

            return (
              <button
                key={label}
                onClick={() => {
                  if (!disabled) {
                    onClick()
                    setOpen(false)
                  }
                }}
                disabled={disabled}
                className={cn(
                  'flex items-center gap-2.5 w-full px-3 py-2 text-sm text-left transition-colors',
                  danger
                    ? 'text-danger hover:bg-danger/10'
                    : 'text-text-primary hover:bg-surface',
                  disabled && 'opacity-50 cursor-not-allowed'
                )}
              >
                {icon && <span className="w-4 h-4 shrink-0">{icon}</span>}
                {label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
