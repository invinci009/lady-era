import { NextResponse, type NextRequest } from 'next/server'
import { botFilterMiddleware } from '@/lib/middleware/bot-filter'
import { rateLimitMiddleware } from '@/lib/middleware/rate-limit'
import { validateSession } from '@/lib/firebase/auth'

// ==============================================================================
// ReviewPulse — Proxy (Next.js 16 Middleware)
// ==============================================================================
// Handles bot filtering, rate limiting, and authentication checks.
// In Next.js 16, middleware.ts has been renamed to proxy.ts.
// ==============================================================================

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. Bot filter for customer routes (cheapest check first)
  if (pathname.startsWith('/r/') || pathname.startsWith('/api/public/')) {
    const botResponse = botFilterMiddleware(request)
    if (botResponse) return botResponse
  }

  // 2. Rate limiting for public API routes
  if (pathname.startsWith('/api/public/')) {
    const rateLimitResponse = await rateLimitMiddleware(request)
    if (rateLimitResponse) return rateLimitResponse
  }

  // 3. Firebase Auth session check for dashboard routes
  const response = NextResponse.next({ request: { headers: request.headers } })

  if (pathname.startsWith('/dashboard') || pathname.startsWith('/api/dashboard')) {
    // Check for Firebase ID token in Authorization header or cookie
    const authHeader = request.headers.get('authorization')
    const idToken = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : request.cookies.get('firebase_token')?.value

    if (!idToken) {
      // No token found, redirect to login
      if (pathname.startsWith('/dashboard')) {
        return NextResponse.redirect(new URL('/login', request.url))
      }
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify the Firebase ID token
    const user = await validateSession(idToken)
    if (!user) {
      if (pathname.startsWith('/dashboard')) {
        return NextResponse.redirect(new URL('/login', request.url))
      }
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Add user info to headers for downstream use
    response.headers.set('x-user-id', user.uid)
    response.headers.set('x-user-email', user.email || '')
  }

  return response
}

export const config = {
  matcher: [
    '/r/:path*',
    '/api/public/:path*',
    '/dashboard/:path*',
    '/api/dashboard/:path*',
  ],
}
