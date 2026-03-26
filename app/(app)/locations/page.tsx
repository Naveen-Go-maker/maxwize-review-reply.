'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { useToast } from '@/components/ui/toast-provider'
import { formatDate } from '@/lib/utils'
import type { Location } from '@/types'

export default function LocationsPage() {
  const toast = useToast()
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [connectingGoogle, setConnectingGoogle] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/locations')
        const data = await res.json()
        if (data.success) setLocations(data.data)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleSyncFromGoogle = async () => {
    setSyncing(true)
    try {
      const res = await fetch('/api/locations/sync', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        toast.success('Locations synced', `Found ${data.data?.locations?.length ?? 0} locations`)
        setLocations(data.data?.locations ?? [])
      } else {
        if (data.error?.includes('not connected')) {
          toast.error('Google not connected', 'Please connect your Google Business Profile first.')
        } else {
          toast.error('Sync failed', data.error)
        }
      }
    } catch {
      toast.error('Sync failed')
    } finally {
      setSyncing(false)
    }
  }

  const handleConnectGoogle = async () => {
    setConnectingGoogle(true)
    const res = await fetch('/api/auth/google')
    const data = await res.json()
    if (data.success && data.data?.url) {
      window.location.href = data.data.url
    } else {
      setConnectingGoogle(false)
    }
  }

  const handleToggleActive = async (location: Location) => {
    const res = await fetch(`/api/locations`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: location.id, is_active: !location.is_active }),
    })
    const data = await res.json()
    if (data.success) {
      setLocations((prev) =>
        prev.map((l) => (l.id === location.id ? { ...l, is_active: !l.is_active } : l))
      )
      toast.success(location.is_active ? 'Location deactivated' : 'Location activated')
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
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Locations</h1>
          <p className="text-sm text-text-muted mt-0.5">
            Manage your Google Business Profile locations
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleConnectGoogle} loading={connectingGoogle}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
            </svg>
            Connect Google
          </Button>
          <Button variant="secondary" size="sm" onClick={handleSyncFromGoogle} loading={syncing}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
            </svg>
            Sync Locations
          </Button>
        </div>
      </div>

      {locations.length === 0 ? (
        <Card className="text-center py-12">
          <div className="w-14 h-14 bg-surface rounded-full flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-muted">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-text-primary">No locations yet</h3>
          <p className="mt-2 text-sm text-text-muted">
            Connect your Google Business Profile and sync your locations.
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <Button size="sm" onClick={handleConnectGoogle} loading={connectingGoogle}>
              Connect Google Business
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {locations.map((location) => (
            <Card key={location.id} className="flex items-start gap-4">
              <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6c63ff" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-semibold text-text-primary">{location.name}</h3>
                  <Badge variant={location.is_active ? 'success' : 'muted'} size="sm">
                    {location.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                {location.address && (
                  <p className="text-xs text-text-muted mt-1">{location.address}</p>
                )}
                {location.category && (
                  <p className="text-xs text-text-muted mt-0.5">{location.category}</p>
                )}
                {location.last_synced_at && (
                  <p className="text-xs text-text-muted mt-1">
                    Last synced: {formatDate(location.last_synced_at, 'MMM d, yyyy h:mm a')}
                  </p>
                )}
              </div>

              <Button
                size="sm"
                variant={location.is_active ? 'outline' : 'secondary'}
                onClick={() => handleToggleActive(location)}
              >
                {location.is_active ? 'Deactivate' : 'Activate'}
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
