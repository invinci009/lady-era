import { NextRequest, NextResponse } from 'next/server'
import { submitPrivateFeedback, logEvent } from '@/lib/firebase/firestore'
import { getSessionFromCookie } from '@/lib/session/cookie'
import { privateFeedbackSchema } from '@/lib/validation/schemas'

interface RouteProps {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteProps) {
  try {
    const { id } = await params

    const cookie = await getSessionFromCookie()
    if (!cookie || cookie.session_id !== id) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const parsed = privateFeedbackSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid private feedback payload', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { category, message, contact_name, contact_value, contact_consent } = parsed.data

    await submitPrivateFeedback({
      sessionId: id,
      category,
      message,
      contactName: contact_name || undefined,
      contactValue: contact_value || undefined,
      contactConsent: contact_consent,
    })

    await logEvent({
      sessionId: id,
      eventType: 'PRIVATE_FEEDBACK_SUBMITTED',
      metadata: { category, has_contact: Boolean(contact_value) },
    })

    return NextResponse.json(
      { success: true, message: 'Private feedback received' },
      { status: 201 }
    )
  } catch (error) {
    console.error('Private feedback error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
