import { NextRequest, NextResponse } from 'next/server'
import { getSession, updateSessionStatus, logEvent } from '@/lib/firebase/firestore'
import { getSessionFromCookie } from '@/lib/session/cookie'

interface RouteProps {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteProps) {
  try {
    const { id } = await params

    // 1. Verify session cookie
    const cookie = await getSessionFromCookie()
    if (!cookie || cookie.session_id !== id) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 403 })
    }

    // 2. Fetch session
    const session = await getSession(id)

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // 3. If already in_progress or completed, return current status (idempotent)
    if (session.status !== 'landed') {
      return NextResponse.json({ success: true, status: session.status }, { status: 200 })
    }

    // 4. Update session status
    await updateSessionStatus(id, 'in_progress')

    // 5. Fire QUIZ_STARTED event
    await logEvent({
      sessionId: id,
      campaignId: session.campaignId,
      eventType: 'QUIZ_STARTED',
      metadata: {},
    })

    return NextResponse.json({ success: true, status: 'in_progress' }, { status: 200 })
  } catch (error) {
    console.error('Quiz start error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
