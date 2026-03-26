'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { useToast } from '@/components/ui/toast-provider'
import { TONES, LANGUAGES } from '@/lib/constants'
import type { BrandVoice, Location } from '@/types'

export default function BrandVoicePage() {
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [locations, setLocations] = useState<Location[]>([])
  const [brandVoice, setBrandVoice] = useState<Partial<BrandVoice>>({
    tone: 'professional',
    language: 'en',
    owner_name: '',
    sign_off: '',
    custom_instructions: '',
    location_id: null,
  })

  const toneOptions = TONES.map((t) => ({ value: t.value, label: `${t.label} — ${t.description}` }))
  const languageOptions = LANGUAGES.map((l) => ({
    value: l.value,
    label: `${l.label} (${l.nativeLabel})`,
  }))

  useEffect(() => {
    async function load() {
      try {
        const [bvRes, locRes] = await Promise.all([
          fetch('/api/settings/brand-voice'),
          fetch('/api/locations'),
        ])
        const bvData = await bvRes.json()
        const locData = await locRes.json()

        if (bvData.success && bvData.data) {
          setBrandVoice(bvData.data)
        }
        if (locData.success) {
          setLocations(locData.data)
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
      const res = await fetch('/api/settings/brand-voice', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(brandVoice),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Brand voice saved')
        if (data.data) setBrandVoice(data.data)
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

  const locationOptions = [
    { value: '', label: 'Global (all locations)' },
    ...locations.map((l) => ({ value: l.id, label: l.name })),
  ]

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-text-primary">Brand Voice</h1>
        <p className="text-sm text-text-muted mt-0.5">
          Configure how the AI should sound when responding on your behalf
        </p>
      </div>

      <Card className="space-y-5">
        {locations.length > 1 && (
          <Select
            label="Applies to"
            options={locationOptions}
            value={brandVoice.location_id ?? ''}
            onChange={(e) =>
              setBrandVoice({ ...brandVoice, location_id: e.target.value || null })
            }
            hint="Set a global voice or customize per location"
          />
        )}

        <Select
          label="Response tone"
          options={toneOptions}
          value={brandVoice.tone ?? 'professional'}
          onChange={(e) =>
            setBrandVoice({ ...brandVoice, tone: e.target.value as BrandVoice['tone'] })
          }
        />

        <Select
          label="Response language"
          options={languageOptions}
          value={brandVoice.language ?? 'en'}
          onChange={(e) =>
            setBrandVoice({ ...brandVoice, language: e.target.value as BrandVoice['language'] })
          }
          hint="The AI will generate responses in this language"
        />

        <Input
          label="Owner / Manager name"
          placeholder="e.g., Rahul Sharma"
          value={brandVoice.owner_name ?? ''}
          onChange={(e) => setBrandVoice({ ...brandVoice, owner_name: e.target.value })}
          hint="This name will appear in response sign-offs"
        />

        <Input
          label="Sign-off phrase"
          placeholder="e.g., Warm regards, The Team"
          value={brandVoice.sign_off ?? ''}
          onChange={(e) => setBrandVoice({ ...brandVoice, sign_off: e.target.value })}
          hint="Optional custom closing phrase"
        />

        <Textarea
          label="Custom instructions"
          placeholder="e.g., Always mention that we offer free parking. Never promise refunds in public responses. Mention our loyalty program for returning customers."
          value={brandVoice.custom_instructions ?? ''}
          onChange={(e) =>
            setBrandVoice({ ...brandVoice, custom_instructions: e.target.value })
          }
          rows={4}
          hint="Additional context or rules for the AI to follow"
        />
      </Card>

      {/* Preview */}
      <Card className="border-accent/20 bg-accent/5">
        <h3 className="text-sm font-semibold text-text-primary mb-3">Voice Preview</h3>
        <div className="space-y-1.5">
          <div className="flex gap-2 text-sm">
            <span className="text-text-muted w-24 shrink-0">Tone:</span>
            <span className="text-text-primary capitalize">{brandVoice.tone}</span>
          </div>
          <div className="flex gap-2 text-sm">
            <span className="text-text-muted w-24 shrink-0">Language:</span>
            <span className="text-text-primary">
              {LANGUAGES.find((l) => l.value === brandVoice.language)?.label ?? 'English'}
            </span>
          </div>
          {brandVoice.owner_name && (
            <div className="flex gap-2 text-sm">
              <span className="text-text-muted w-24 shrink-0">Signs as:</span>
              <span className="text-text-primary">{brandVoice.owner_name}</span>
            </div>
          )}
          {brandVoice.sign_off && (
            <div className="flex gap-2 text-sm">
              <span className="text-text-muted w-24 shrink-0">Sign-off:</span>
              <span className="text-text-primary">{brandVoice.sign_off}</span>
            </div>
          )}
        </div>
      </Card>

      <Button onClick={handleSave} loading={saving}>
        Save Brand Voice
      </Button>
    </div>
  )
}
