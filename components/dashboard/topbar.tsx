'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Dropdown } from '@/components/ui/dropdown'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@/types'

interface TopbarProps {
  user: User
  title?: string
}

export function Topbar({ user, title }: TopbarProps) {
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)

  const handleSignOut = async () => {
    setLoggingOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const initials = user.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user.email.slice(0, 2).toUpperCase()

  const dropdownItems = [
    {
      label: 'Account Settings',
      onClick: () => router.push('/billing'),
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
        </svg>
      ),
    },
    {
      label: 'Notifications',
      onClick: () => router.push('/notifications'),
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 01-3.46 0" />
        </svg>
      ),
    },
    { separator: true as const },
    {
      label: loggingOut ? 'Signing out...' : 'Sign out',
      onClick: handleSignOut,
      danger: true,
      disabled: loggingOut,
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
      ),
    },
  ]

  return (
    <header className="h-16 bg-surface border-b border-border flex items-center justify-between px-6 sticky top-0 z-20">
      <div>
        {title && (
          <h1 className="text-lg font-semibold text-text-primary">{title}</h1>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Theme toggle */}
        <ThemeToggle />

        {/* Notifications bell */}
        <button className="p-2 text-text-muted hover:text-text-primary hover:bg-card rounded-lg transition-colors">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 01-3.46 0" />
          </svg>
        </button>

        {/* User menu */}
        <Dropdown
          trigger={
            <button className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-card transition-colors">
              <div className="w-8 h-8 bg-accent/20 text-accent rounded-full flex items-center justify-center text-xs font-semibold">
                {initials}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-sm font-medium text-text-primary leading-none">
                  {user.name ?? user.email.split('@')[0]}
                </p>
                <p className="text-xs text-text-muted mt-0.5">{user.email}</p>
              </div>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-text-muted"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          }
          items={dropdownItems}
          align="right"
        />
      </div>
    </header>
  )
}
