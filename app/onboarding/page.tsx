'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { TONES, LANGUAGES } from '@/lib/constants'
import { cn } from '@/lib/utils'

const STEPS = ['Connect Google', 'Brand Voice', 'All Set!'] as const

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [connecting, setConnecting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [brandVoice, setBrandVoice] = useState({
    tone: 'professional',
    language: 'en',
    owner_name: '',
    sign_off: '',
    custom_instructions: '',
  })

  const handleConnectGoogle = async () => {
    setConnecting(true)
    const res = await fetch('/api/auth/google')
    const data = await res.json()
    if (data.success && data.data?.url) {
      window.location.href = data.data.url
    } else {
      setConnecting(false)
    }
  }

  const handleSkipGoogle = () => setStep(1)

  const handleSaveBrandVoice = async () => {
    setSaving(true)
    try {
      await fetch('/api/settings/brand-voice', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(brandVoice),
      })
      setStep(2)
    } catch {
      // Continue anyway
      setStep(2)
    } finally {
      setSaving(false)
    }
  }

  const toneOptions = TONES.map((t) => ({ value: t.value, label: t.label }))
  const languageOptions = LANGUAGES.map((l) => ({ value: l.value, label: l.label }))

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex items-center gap-2.5 justify-center mb-10">
          <div className="w-9 h-9 bg-accent rounded-xl flex items-center justify-center">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="white">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </div>
          <span className="text-xl font-bold text-text-primary">ReviewReply</span>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors',
                i < step ? 'bg-success text-white' :
                i === step ? 'bg-accent text-white' :
                'bg-border text-text-muted'
              )}>
                {i < step ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span className={cn('text-xs', i === step ? 'text-text-primary' : 'text-text-muted')}>
                {s}
              </span>
              {i < STEPS.length - 1 && (
                <div className={cn('w-8 h-px', i < step ? 'bg-success' : 'bg-border')} />
              )}
            </div>
          ))}
        </div>

        {/* Step 0: Connect Google */}
        {step === 0 && (
          <div className="bg-card border border-border rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-surface rounded-2xl flex items-center justify-center mx-auto mb-5">
              <svg width="32" height="32" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-text-primary mb-2">
              Connect Google Business Profile
            </h2>
            <p className="text-sm text-text-muted mb-8 leading-relaxed">
              Grant access to your Google Business Profile so ReviewReply can monitor reviews
              and post responses on your behalf.
            </p>
            <div className="space-y-3">
              <Button fullWidth onClick={handleConnectGoogle} loading={connecting}>
                Connect with Google
              </Button>
              <Button fullWidth variant="ghost" onClick={handleSkipGoogle} className="text-text-muted">
                Skip for now
              </Button>
            </div>
          </div>
        )}

        {/* Step 1: Brand Voice */}
        {step === 1 && (
          <div className="bg-card border border-border rounded-2xl p-8">
            <h2 className="text-xl font-bold text-text-primary mb-1">Set your brand voice</h2>
            <p className="text-sm text-text-muted mb-6">
              This helps the AI generate responses that sound like you.
            </p>

            <div className="space-y-4">
              <Select
                label="Response tone"
                options={toneOptions}
                value={brandVoice.tone}
                onChange={(e) => setBrandVoice({ ...brandVoice, tone: e.target.value })}
              />
              <Select
                label="Response language"
                options={languageOptions}
                value={brandVoice.language}
                onChange={(e) => setBrandVoice({ ...brandVoice, language: e.target.value })}
              />
              <Input
                label="Your name (for sign-off)"
                placeholder="e.g., Raj Kumar"
                value={brandVoice.owner_name}
                onChange={(e) => setBrandVoice({ ...brandVoice, owner_name: e.target.value })}
                hint="Appears at the end of responses"
              />
              <Input
                label="Sign-off phrase (optional)"
                placeholder="e.g., Warm regards, Team Manager"
                value={brandVoice.sign_off}
                onChange={(e) => setBrandVoice({ ...brandVoice, sign_off: e.target.value })}
              />
              <Textarea
                label="Additional instructions (optional)"
                placeholder="e.g., Always mention our free parking, never offer refunds over reviews..."
                value={brandVoice.custom_instructions}
                onChange={(e) => setBrandVoice({ ...brandVoice, custom_instructions: e.target.value })}
                rows={3}
              />
            </div>

            <Button fullWidth className="mt-6" onClick={handleSaveBrandVoice} loading={saving}>
              Save & Continue
            </Button>
          </div>
        )}

        {/* Step 2: All Set */}
        {step === 2 && (
          <div className="bg-card border border-border rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-5">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-text-primary mb-2">You're all set!</h2>
            <p className="text-sm text-text-muted mb-8 leading-relaxed">
              Your account is configured. Head to your dashboard to start monitoring and
              responding to reviews with AI.
            </p>
            <Button fullWidth onClick={() => router.push('/dashboard')}>
              Go to Dashboard
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
