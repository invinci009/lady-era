import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/reset-password'
  const errorParam = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')
  const errorCode = searchParams.get('error_code')

  // Resolve external public origin safely
  const forwardedProto = request.headers.get('x-forwarded-proto') || (process.env.NODE_ENV === 'production' ? 'https' : 'http')
  const forwardedHost = request.headers.get('x-forwarded-host') || request.headers.get('host')
  const origin = (process.env.NEXT_PUBLIC_APP_URL || (forwardedHost ? `${forwardedProto}://${forwardedHost}` : new URL(request.url).origin)).replace(/\/$/, '')

  if (errorParam || errorCode) {
    const dest = next.includes('reset-password') ? '/reset-password' : '/login'
    const q = new URLSearchParams()
    if (errorCode) q.set('error_code', errorCode)
    if (errorDescription) q.set('error_description', errorDescription)
    if (errorParam) q.set('error', errorParam)
    return NextResponse.redirect(`${origin}${dest}?${q.toString()}`)
  }

  if (code) {
    try {
      const supabase = await createClient()
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (!error) {
        return NextResponse.redirect(`${origin}${next}`)
      }
      console.error('Supabase auth callback exchange error:', error)
      const q = new URLSearchParams({
        error_code: 'otp_expired',
        error_description: error.message || 'Email link is invalid or has expired',
      })
      const dest = next.includes('reset-password') ? '/reset-password' : '/login'
      return NextResponse.redirect(`${origin}${dest}?${q.toString()}`)
    } catch (err: any) {
      console.error('Unexpected error in auth callback:', err)
    }
  }

  // If code exchange failed or no code was provided
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
