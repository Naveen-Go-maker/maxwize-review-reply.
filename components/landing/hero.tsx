import Link from 'next/link'

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-24 pb-20 px-6">
      {/* Background glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[600px] bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-5xl mx-auto text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-medium mb-8">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          AI-Powered Review Management
        </div>

        {/* Headline */}
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-text-primary leading-tight tracking-tight">
          Respond to every review
          <span className="block mt-2 bg-gradient-to-r from-accent to-accent-light bg-clip-text text-transparent">
            in seconds, not hours
          </span>
        </h1>

        {/* Subtext */}
        <p className="mt-6 text-xl text-text-muted max-w-2xl mx-auto leading-relaxed">
          ReviewReply connects to your Google Business Profile, monitors incoming reviews,
          and generates personalized, on-brand responses that you can post with one click.
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/signup"
            className="px-8 py-4 bg-accent hover:bg-accent-hover text-white font-semibold rounded-xl text-base transition-colors"
          >
            Start for free — no credit card
          </Link>
          <Link
            href="#pricing"
            className="px-8 py-4 bg-surface hover:bg-card text-text-primary font-medium rounded-xl text-base border border-border transition-colors"
          >
            View pricing
          </Link>
        </div>

        {/* Social proof */}
        <p className="mt-6 text-sm text-text-muted">
          Free forever · 5 AI replies included · Setup in 2 minutes
        </p>

        {/* Dashboard preview */}
        <div className="mt-16 relative mx-auto max-w-4xl">
          <div className="bg-card border border-border rounded-2xl p-6 shadow-2xl">
            {/* Mock dashboard UI */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-3 h-3 rounded-full bg-danger/60" />
              <div className="w-3 h-3 rounded-full bg-warning/60" />
              <div className="w-3 h-3 rounded-full bg-success/60" />
              <div className="flex-1 h-6 bg-surface rounded-lg" />
            </div>

            <div className="grid grid-cols-4 gap-3 mb-6">
              {[
                { label: 'Total Reviews', value: '248', color: 'text-accent' },
                { label: 'Response Rate', value: '94%', color: 'text-success' },
                { label: 'Avg Rating', value: '4.6 ★', color: 'text-warning' },
                { label: 'Needs Reply', value: '3', color: 'text-danger' },
              ].map((stat) => (
                <div key={stat.label} className="bg-surface rounded-xl p-4">
                  <p className="text-xs text-text-muted">{stat.label}</p>
                  <p className={`text-xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              {[
                { name: 'Priya Sharma', rating: 5, text: 'Amazing food and great service! Loved the ambiance...', status: 'Posted', statusColor: 'text-success bg-success/10' },
                { name: 'Rahul Mehta', rating: 2, text: 'Had to wait 45 minutes for my order. Very disappointing...', status: 'Draft Ready', statusColor: 'text-accent bg-accent/10' },
                { name: 'Ananya Patel', rating: 4, text: 'Good food, friendly staff. Will come back again!', status: 'Posted', statusColor: 'text-success bg-success/10' },
              ].map((review) => (
                <div key={review.name} className="flex items-start gap-3 p-3 bg-surface rounded-xl">
                  <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center text-xs font-bold text-accent shrink-0">
                    {review.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-text-primary">{review.name}</span>
                      <span className="text-xs text-warning">{'★'.repeat(review.rating)}</span>
                    </div>
                    <p className="text-xs text-text-muted mt-0.5 truncate">{review.text}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${review.statusColor}`}>
                    {review.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
