import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const next = searchParams.get('next') ?? '/reset-password'
  const errorParam = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')
  const errorCode = searchParams.get('error_code')

  const forwardedProto = request.headers.get('x-forwarded-proto') || (process.env.NODE_ENV === 'production' ? 'https' : 'http')
  const forwardedHost = request.headers.get('x-forwarded-host') || request.headers.get('host')
  const origin = (process.env.NEXT_PUBLIC_APP_URL || (forwardedHost ? `${forwardedProto}://${forwardedHost}` : new URL(request.url).origin)).replace(/\/$/, '')

  // Firebase Auth handles callbacks via its own SDK
  // This route is kept for backward compatibility
  if (errorParam || errorCode) {
    const dest = next.includes('reset-password') ? '/reset-password' : '/login'
    const q = new URLSearchParams()
    if (errorCode) q.set('error_code', errorCode)
    if (errorDescription) q.set('error_description', errorDescription)
    if (errorParam) q.set('error', errorParam)
    return NextResponse.redirect(`${origin}${dest}?${q.toString()}`)
  }

  // If there's a code parameter (old Supabase flow), redirect to login
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
