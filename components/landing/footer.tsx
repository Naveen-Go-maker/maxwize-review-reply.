import Link from 'next/link'
import { APP_NAME, COMPANY_NAME, SUPPORT_EMAIL } from '@/lib/constants'

export function Footer() {
  return (
    <footer className="bg-surface border-t border-border py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-accent rounded-lg flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
              <span className="font-bold text-text-primary">{APP_NAME}</span>
            </div>
            <p className="text-xs text-text-muted leading-relaxed">
              AI-powered Google review management for local businesses.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-sm font-semibold text-text-primary mb-3">Product</h4>
            <ul className="space-y-2 text-sm text-text-muted">
              <li><Link href="#features" className="hover:text-text-primary transition-colors">Features</Link></li>
              <li><Link href="#pricing" className="hover:text-text-primary transition-colors">Pricing</Link></li>
              <li><Link href="/signup" className="hover:text-text-primary transition-colors">Get Started</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-sm font-semibold text-text-primary mb-3">Company</h4>
            <ul className="space-y-2 text-sm text-text-muted">
              <li><span className="text-text-muted">{COMPANY_NAME}</span></li>
              <li>
                <a href={`mailto:${SUPPORT_EMAIL}`} className="hover:text-text-primary transition-colors">
                  {SUPPORT_EMAIL}
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm font-semibold text-text-primary mb-3">Legal</h4>
            <ul className="space-y-2 text-sm text-text-muted">
              <li><Link href="/privacy" className="hover:text-text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-text-primary transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-text-muted">
            © {new Date().getFullYear()} {COMPANY_NAME}. All rights reserved.
          </p>
          <p className="text-xs text-text-muted">
            Built with ❤️ for local businesses
          </p>
        </div>
      </div>
    </footer>
  )
}
