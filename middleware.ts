import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// Routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/analytics',
  '/locations',
  '/brand-voice',
  '/notifications',
  '/billing',
  '/onboarding',
]

// Routes that are only for unauthenticated users
const authRoutes = ['/login', '/signup']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Demo mode: skip all auth checks, allow everything through
  if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
    return NextResponse.next()
  }

  // Supabase not configured: allow landing + auth pages, block protected routes
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl || supabaseUrl.includes('your-project')) {
    const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))
    if (isProtectedRoute) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return NextResponse.next()
  }

  // Update the session (handles token refresh)
  const { supabaseResponse, user } = await updateSession(request)

  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  )
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route))

  // Redirect unauthenticated users to login
  if (isProtectedRoute && !user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect authenticated users away from auth pages
  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
