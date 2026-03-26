const TESTIMONIALS = [
  {
    quote:
      "ReviewReply cut the time I spend on reviews from 2 hours a week to under 10 minutes. The AI responses are so good that my customers think I wrote them personally.",
    name: 'Siddharth Nair',
    title: 'Owner, The Spice Garden Restaurant',
    rating: 5,
    initials: 'SN',
    color: 'bg-accent/20 text-accent',
  },
  {
    quote:
      "I was losing sleep over a string of negative reviews. ReviewReply helped me respond professionally to each one, and my rating went from 3.8 to 4.4 in 3 months.",
    name: 'Dr. Kavitha Reddy',
    title: 'Dermatologist, Glow Skin Clinic',
    rating: 5,
    initials: 'KR',
    color: 'bg-success/20 text-success',
  },
  {
    quote:
      "Managing reviews for 6 salon locations used to need a dedicated person. Now one team member handles all of it in 15 minutes each morning.",
    name: 'Arjun Khanna',
    title: 'Operations Head, Luxe Salon Chain',
    rating: 5,
    initials: 'AK',
    color: 'bg-warning/20 text-warning',
  },
]

export function Testimonials() {
  return (
    <section className="py-24 px-6 bg-surface">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-text-primary">
            Trusted by business owners across India
          </h2>
          <p className="mt-4 text-lg text-text-muted">
            See how ReviewReply is transforming reputation management for local businesses.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="bg-card border border-border rounded-2xl p-6"
            >
              {/* Stars */}
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill="#f59e0b">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ))}
              </div>

              {/* Quote */}
              <p className="text-sm text-text-muted leading-relaxed italic">"{t.quote}"</p>

              {/* Author */}
              <div className="mt-5 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${t.color}`}>
                  {t.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary">{t.name}</p>
                  <p className="text-xs text-text-muted">{t.title}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
