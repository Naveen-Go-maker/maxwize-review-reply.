import Link from 'next/link'
import { Hero } from '@/components/landing/hero'
import { Features } from '@/components/landing/features'
import { Pricing } from '@/components/landing/pricing'
import { Testimonials } from '@/components/landing/testimonials'
import { Footer } from '@/components/landing/footer'
import { APP_NAME } from '@/lib/constants'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="white">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
            <span className="font-bold text-text-primary">{APP_NAME}</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm text-text-muted hover:text-text-primary transition-colors">
              Features
            </Link>
            <Link href="#pricing" className="text-sm text-text-muted hover:text-text-primary transition-colors">
              Pricing
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-text-muted hover:text-text-primary transition-colors px-4 py-2"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="text-sm bg-accent hover:bg-accent-hover text-white font-medium px-4 py-2 rounded-lg transition-colors"
            >
              Start free
            </Link>
          </div>
        </div>
      </nav>

      {/* Page content */}
      <main>
        <Hero />
        <Features />
        <Testimonials />
        <Pricing />
      </main>

      <Footer />
    </div>
  )
}
