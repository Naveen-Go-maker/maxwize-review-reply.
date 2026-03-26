import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { APP_NAME, APP_TAGLINE, COMPANY_NAME } from '@/lib/constants'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: `${APP_NAME} — ${APP_TAGLINE}`,
    template: `%s | ${APP_NAME}`,
  },
  description:
    'AI-powered Google Business Profile review management. Generate personalized responses, post with one click, and protect your online reputation.',
  keywords: ['review management', 'Google Business Profile', 'AI responses', 'reputation management'],
  authors: [{ name: COMPANY_NAME }],
  openGraph: {
    title: APP_NAME,
    description: `${APP_TAGLINE} by ${COMPANY_NAME}`,
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="night" suppressHydrationWarning>
      <head>
        {/* Apply saved theme before first paint to avoid flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('theme');var h=document.documentElement;if(t==='day'){h.classList.remove('night');h.classList.add('day');}else{h.classList.remove('day');h.classList.add('night');}})();`,
          }}
        />
      </head>
      <body className={`${inter.className} bg-background text-text-primary antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
