const FEATURES = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M8.56 2.75c4.37 6.03 6.02 9.42 8.03 17.72m2.54-15.38c-3.72 4.35-8.94 5.66-16.88 5.85m19.5 1.9c-3.5-.93-6.63-.82-8.94 0-2.58.92-5.01 2.86-7.44 6.32" />
      </svg>
    ),
    title: 'Google Business Profile Integration',
    description:
      'Connect your Google Business Profile in 60 seconds via secure OAuth. We automatically sync all existing reviews and monitor for new ones every 15 minutes.',
    color: 'bg-accent/10 text-accent',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    title: 'AI-Generated Responses',
    description:
      'Claude AI generates authentic, personalized responses that reference specific review details. Get up to 3 tone variants — warm, professional, or apologetic — for every review.',
    color: 'bg-warning/10 text-warning',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
    ),
    title: 'Brand Voice Customization',
    description:
      'Define your business tone, preferred language, owner name, and sign-off. The AI stays consistent with your brand identity across every response.',
    color: 'bg-success/10 text-success',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 01-3.46 0" />
      </svg>
    ),
    title: 'Instant Alerts',
    description:
      'Get email and WhatsApp notifications the moment a new review arrives — especially urgent for negative reviews where a fast response matters most.',
    color: 'bg-danger/10 text-danger',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
    title: 'Analytics Dashboard',
    description:
      'Track review volume, response rates, average rating trends, and review sentiment over time. Make data-driven decisions about your reputation strategy.',
    color: 'bg-accent/10 text-accent',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
    title: 'Multi-Location Support',
    description:
      'Manage reviews across all your Google Business Profile locations from a single dashboard. Business plan supports up to 10 locations with per-location brand voice.',
    color: 'bg-success/10 text-success',
  },
]

export function Features() {
  return (
    <section id="features" className="py-24 px-6 bg-surface">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-text-primary">
            Everything you need to manage your reputation
          </h2>
          <p className="mt-4 text-lg text-text-muted max-w-2xl mx-auto">
            From automatic review monitoring to one-click posting — ReviewReply handles the entire
            review response workflow so you can focus on running your business.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="bg-card border border-border rounded-xl p-6 hover:border-accent/30 transition-colors"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${feature.color}`}>
                {feature.icon}
              </div>
              <h3 className="text-base font-semibold text-text-primary mb-2">{feature.title}</h3>
              <p className="text-sm text-text-muted leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
