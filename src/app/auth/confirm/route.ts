import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/reset-password'

  const proto = request.headers.get('x-forwarded-proto') || (process.env.NODE_ENV === 'production' ? 'https' : 'http')
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'localhost:3000'
  const origin = (process.env.NEXT_PUBLIC_APP_URL || `${proto}://${host}`).replace(/\/$/, '')

  if (token_hash && type) {
    try {
      const supabase = await createClient()

      const { error } = await supabase.auth.verifyOtp({
        type,
        token_hash,
      })

      if (!error) {
        return NextResponse.redirect(`${origin}${next}`)
      }

      console.error('Supabase auth/confirm verifyOtp error:', error)
      return NextResponse.redirect(
        `${origin}/reset-password?error_code=otp_expired&error_description=${encodeURIComponent(
          error.message || 'Email link is invalid or has expired'
        )}`
      )
    } catch (err: any) {
      console.error('Unexpected error in auth/confirm route:', err)
    }
  }

  return NextResponse.redirect(
    `${origin}/reset-password?error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired`
  )
}
