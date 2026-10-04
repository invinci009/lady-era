import { NextRequest, NextResponse } from 'next/server'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { getServerAuth } from '@/lib/firebase/server-auth'
import { getAdminAuth } from '@/lib/firebase/admin'
import { z } from 'zod'

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(100),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const parsed = changePasswordSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid password data. New password must be at least 8 characters.' },
        { status: 400 }
      )
    }

    const { currentPassword, newPassword } = parsed.data

    // Identify the caller from the session cookie (there is no
    // `auth.currentUser` on the server — never import the client SDK here).
    const idToken = request.cookies.get('firebase_token')?.value
    if (!idToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    let uid: string
    let email: string | undefined
    try {
      const decoded = await getAdminAuth().verifyIdToken(idToken)
      uid = decoded.uid
      email = decoded.email
    } catch {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    if (!email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Verify the current password by signing in with it
    try {
      await signInWithEmailAndPassword(getServerAuth(), email, currentPassword)
    } catch {
      return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 400 })
    }

    // Update password via Admin SDK
    await getAdminAuth().updateUser(uid, { password: newPassword })

    return NextResponse.json({ success: true, message: 'Password updated successfully' })
  } catch (error) {
    console.error('Change password error:', error)

    const errorCode = typeof error === 'object' && error !== null && 'code' in error
      ? (error as { code: unknown }).code
      : undefined
    let errorMessage = 'Failed to update password.'

    if (errorCode === 'auth/weak-password') {
      errorMessage = 'New password is too weak. Use at least 8 characters.'
    } else if (errorCode === 'auth/requires-recent-login') {
      errorMessage = 'Please log in again before changing your password.'
    }

    return NextResponse.json({ error: errorMessage }, { status: 400 })
  }
}
