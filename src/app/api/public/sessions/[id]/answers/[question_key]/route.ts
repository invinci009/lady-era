import { NextRequest, NextResponse } from 'next/server'
import { getSession, saveAnswer, logEvent } from '@/lib/firebase/firestore'
import { getSessionFromCookie } from '@/lib/session/cookie'
import {
  overallRatingSchema,
  foodRatingSchema,
  serviceRatingSchema,
  likedSchema,
  orderedSchema,
  commentSchema,
  returnIntentSchema,
} from '@/lib/validation/schemas'

interface RouteProps {
  params: Promise<{ id: string; question_key: string }>
}

function validateAnswer(key: string, body: unknown) {
  switch (key) {
    case 'overall_rating':
      return overallRatingSchema.safeParse(body)
    case 'food_rating':
      return foodRatingSchema.safeParse(body)
    case 'service_rating':
      return serviceRatingSchema.safeParse(body)
    case 'liked':
      return likedSchema.safeParse(body)
    case 'ordered':
      return orderedSchema.safeParse(body)
    case 'comment':
      return commentSchema.safeParse(body)
    case 'return_intent':
      return returnIntentSchema.safeParse(body)
    default:
      return { success: true, data: body } as const
  }
}

export async function PUT(request: NextRequest, { params }: RouteProps) {
  try {
    const { id, question_key } = await params

    // 1. Verify session cookie
    const cookie = await getSessionFromCookie()
    if (!cookie || cookie.session_id !== id) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const validation = validateAnswer(question_key, body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid answer value', details: !validation.success ? validation.error.flatten() : undefined },
        { status: 400 }
      )
    }

    // 2. Verify session exists and is not completed
    const session = await getSession(id)

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    if (session.status === 'completed') {
      return NextResponse.json(
        { error: 'Session is already completed and answers cannot be modified' },
        { status: 400 }
      )
    }

    // 3. Save answer (unwrap { value } payloads, pass through raw values otherwise)
    const rawData: unknown = validation.data
    const answerValue =
      typeof rawData === 'object' && rawData !== null && 'value' in rawData
        ? (rawData as { value: unknown }).value ?? rawData
        : rawData

    await saveAnswer({
      sessionId: id,
      questionKey: question_key,
      value: answerValue,
    })

    // 4. Record QUESTION_ANSWERED event (session activity is tracked via events)
    await logEvent({
      sessionId: id,
      campaignId: session.campaignId,
      eventType: 'QUESTION_ANSWERED',
      metadata: { question_key, value: answerValue },
    })

    return NextResponse.json({ success: true, question_key }, { status: 200 })
  } catch (error) {
    console.error('Save answer error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
