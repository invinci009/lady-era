import { NextResponse } from 'next/server'

export async function POST() {
  // Login happens server-side (see login/route.ts), so the browser holds no
  // Firebase user session — clearing the session cookie is the full sign-out.
  // Never import '@/lib/firebase/client' here ('use client' boundary).
  const response = NextResponse.json({ success: true })
  response.cookies.set('firebase_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })

  return response
}
