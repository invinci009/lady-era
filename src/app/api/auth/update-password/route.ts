import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { newPassword, accessToken } = body

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
      return NextResponse.json(
        { error: 'New password must be at least 8 characters long.' },
        { status: 400 }
      )
    }

    let targetUserId: string | null = null

    // 1. Check session from server cookies
    const supabase = await createClient()
    const {
      data: { user: sessionUser },
    } = await supabase.auth.getUser()

    if (sessionUser?.id) {
      targetUserId = sessionUser.id
    }

    // 2. If no cookie session, check client-provided accessToken (from hash token recovery)
    if (!targetUserId && accessToken && typeof accessToken === 'string') {
      const {
        data: { user: tokenUser },
      } = await supabase.auth.getUser(accessToken)

      if (tokenUser?.id) {
        targetUserId = tokenUser.id
      }
    }

    if (!targetUserId) {
      return NextResponse.json(
        {
          error:
            'Your password recovery session has expired or is invalid. Please request a fresh reset link.',
        },
        { status: 401 }
      )
    }

    // 3. Update password authoritatively using Admin Client
    const admin = createAdminClient()
    const { error: updateError } = await admin.auth.admin.updateUserById(targetUserId, {
      password: newPassword,
    })

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message || 'Failed to update password.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully. You can now log in with your new password.',
    })
  } catch (err: any) {
    console.error('Update password error:', err)
    return NextResponse.json(
      { error: err?.message || 'Server error while resetting password.' },
      { status: 500 }
    )
  }
}
