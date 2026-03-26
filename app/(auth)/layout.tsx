import Link from 'next/link'
import { APP_NAME } from '@/lib/constants'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="px-6 py-5 border-b border-border">
        <Link href="/" className="flex items-center gap-2 w-fit">
          <div className="w-7 h-7 bg-accent rounded-lg flex items-center justify-center">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="white">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </div>
          <span className="font-bold text-text-primary">{APP_NAME}</span>
        </Link>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {children}
        </div>
      </main>
    </div>
  )
}
