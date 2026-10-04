import { type NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const next = searchParams.get('next') ?? '/reset-password'

  const proto = request.headers.get('x-forwarded-proto') || (process.env.NODE_ENV === 'production' ? 'https' : 'http')
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'localhost:3000'
  const origin = (process.env.NEXT_PUBLIC_APP_URL || `${proto}://${host}`).replace(/\/$/, '')

  // Firebase Auth handles email confirmation via its own flow
  // This route is kept for backward compatibility with old Supabase links
  return NextResponse.redirect(
    `${origin}${next}?error_code=otp_expired&error_description=${encodeURIComponent(
      'This link is from an old system. Please use the password reset option in the login page.'
    )}`
  )
}
