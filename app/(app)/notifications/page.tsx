'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Toggle } from '@/components/ui/toggle'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { useToast } from '@/components/ui/toast-provider'
import { EMAIL_FREQUENCY_LABELS } from '@/lib/constants'
import type { NotificationPrefs } from '@/types'

const frequencyOptions = Object.entries(EMAIL_FREQUENCY_LABELS).map(([value, label]) => ({
  value,
  label,
}))

export default function NotificationsPage() {
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [prefs, setPrefs] = useState<Partial<NotificationPrefs>>({
    email_enabled: true,
    email_frequency: 'immediate',
    whatsapp_enabled: false,
    whatsapp_number: '',
    weekly_summary: true,
  })

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/settings/notifications')
        const data = await res.json()
        if (data.success && data.data) {
          setPrefs(data.data)
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/settings/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefs),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Notification preferences saved')
      } else {
        toast.error('Save failed', data.error)
      }
    } catch {
      toast.error('Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-text-primary">Notifications</h1>
        <p className="text-sm text-text-muted mt-0.5">
          Control how and when you get notified about new reviews
        </p>
      </div>

      {/* Email Notifications */}
      <Card className="space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div>
            <h2 className="text-base font-semibold text-text-primary">Email Notifications</h2>
            <p className="text-xs text-text-muted mt-0.5">
              Receive email alerts when new reviews come in
            </p>
          </div>
          <Toggle
            checked={prefs.email_enabled ?? true}
            onChange={(v) => setPrefs({ ...prefs, email_enabled: v })}
          />
        </div>

        {prefs.email_enabled && (
          <Select
            label="Notification frequency"
            options={frequencyOptions}
            value={prefs.email_frequency ?? 'immediate'}
            onChange={(e) =>
              setPrefs({ ...prefs, email_frequency: e.target.value as NotificationPrefs['email_frequency'] })
            }
          />
        )}

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div>
            <p className="text-sm font-medium text-text-primary">Weekly summary email</p>
            <p className="text-xs text-text-muted mt-0.5">
              Receive a weekly digest of your review performance
            </p>
          </div>
          <Toggle
            checked={prefs.weekly_summary ?? true}
            onChange={(v) => setPrefs({ ...prefs, weekly_summary: v })}
          />
        </div>
      </Card>

      {/* WhatsApp Notifications */}
      <Card className="space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div>
            <h2 className="text-base font-semibold text-text-primary">WhatsApp Alerts</h2>
            <p className="text-xs text-text-muted mt-0.5">
              Get instant WhatsApp messages for negative reviews
            </p>
            <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded-full bg-accent/10 text-accent text-xs font-medium">
              Pro & Business
            </span>
          </div>
          <Toggle
            checked={prefs.whatsapp_enabled ?? false}
            onChange={(v) => setPrefs({ ...prefs, whatsapp_enabled: v })}
          />
        </div>

        {prefs.whatsapp_enabled && (
          <Input
            type="tel"
            label="WhatsApp number"
            placeholder="+91 98765 43210"
            value={prefs.whatsapp_number ?? ''}
            onChange={(e) => setPrefs({ ...prefs, whatsapp_number: e.target.value })}
            hint="Include country code (e.g., +91 for India)"
          />
        )}
      </Card>

      <Button onClick={handleSave} loading={saving}>
        Save Preferences
      </Button>
    </div>
  )
}
