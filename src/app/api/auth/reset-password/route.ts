import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/lib/supabase/types'
import { resolveZaikaEmail } from '@/lib/auth-helpers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { username } = body

    if (!username || typeof username !== 'string') {
      return NextResponse.json(
        { error: 'Username or email is required' },
        { status: 400 }
      )
    }

    const resolvedEmail = resolveZaikaEmail(username) || username.trim()

    // Determine canonical origin (localhost:3000 in local dev, public domain in production)
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || ''
    const isLocal = host.includes('localhost') || host.includes('127.0.0.1')
    const proto = request.headers.get('x-forwarded-proto') || (isLocal ? 'http' : 'https')

    const origin = isLocal
      ? `${proto}://${host}`
      : (process.env.NEXT_PUBLIC_APP_URL || (host ? `${proto}://${host}` : request.nextUrl.origin) || 'http://localhost:3000').replace(/\/$/, '')

    // Response prepared to capture any PKCE cookies set by supabase
    const response = NextResponse.json({
      success: true,
      message: `Password reset instructions sent to ${resolvedEmail}. Please check your email inbox (and Spam/Junk folder).`,
    })

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    const supabase = createServerClient<Database>(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, {
                ...options,
                path: '/',
                sameSite: 'lax',
                secure: process.env.NODE_ENV === 'production',
              })
            })
          },
        },
      }
    )

    // Redirect user to /auth/callback which establishes session and lands on /reset-password
    const nextPath = encodeURIComponent('/reset-password')
    const redirectUrl = `${origin}/auth/callback?next=${nextPath}`

    // Dispatch recovery email via Supabase Auth
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(resolvedEmail, {
      redirectTo: redirectUrl,
    })

    if (resetError) {
      let msg = resetError.message || 'Failed to dispatch reset link.'
      if (msg.toLowerCase().includes('rate limit')) {
        msg = 'Too many reset attempts in a short time (email rate limit reached). Please wait a few minutes before trying again.'
      }
      return NextResponse.json(
        { error: msg },
        { status: 429 }
      )
    }

    return response
  } catch (err: any) {
    console.error('Password reset error:', err)
    return NextResponse.json(
      { error: err?.message || 'Failed to process password reset.' },
      { status: 500 }
    )
  }
}
