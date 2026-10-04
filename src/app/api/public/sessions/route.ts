import { NextRequest, NextResponse } from 'next/server'
import { getCampaignBySlug, getCampaigns, createSession, logEvent } from '@/lib/firebase/firestore'
import { getRestaurantConfig } from '@/config/loader'
import { getSessionFromCookie, setSessionCookie } from '@/lib/session/cookie'
import { hashIp, hashUserAgent } from '@/lib/utils/hash'
import { slugSchema } from '@/lib/validation/schemas'
import { z } from 'zod'

const createSessionSchema = z.object({
  slug: slugSchema,
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const parsed = createSessionSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid campaign slug', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { slug } = parsed.data
    const config = getRestaurantConfig()

    let campaign = await getCampaignBySlug(slug)

    if (!campaign) {
      const campaigns = await getCampaigns()
      campaign = campaigns.find(c => c.active) || null
    }

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    if (!campaign.active) {
      return NextResponse.json({ error: 'Campaign is inactive' }, { status: 410 })
    }

    const existingCookie = await getSessionFromCookie()
    if (existingCookie && existingCookie.campaign_id === campaign.id) {
      const { getSession } = await import('@/lib/firebase/firestore')
      const existingSession = await getSession(existingCookie.session_id)

      if (existingSession && existingSession.status !== 'completed') {
        return NextResponse.json(
          {
            session_id: existingSession.id,
            business_name: config.name,
            logo_url: config.branding.logoUrl || undefined,
            primary_color: config.branding.primaryColor,
            welcome_message: config.welcomeMessage,
            google_review_url_exists: Boolean(config.google.reviewUrl),
          },
          { status: 200 }
        )
      }
    }

    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
    const ua = request.headers.get('user-agent')

    const newSession = await createSession({
      campaignId: campaign.id,
      language: config.settings.defaultLanguage,
      ipHash: hashIp(ip) || undefined,
      uaHash: hashUserAgent(ua) || undefined,
    })

    await setSessionCookie({
      session_id: newSession.id,
      campaign_id: campaign.id,
      business_id: 'default',
    })

    await logEvent({
      sessionId: newSession.id,
      campaignId: campaign.id,
      eventType: 'QR_SCANNED',
      metadata: { slug },
    })
    await logEvent({
      sessionId: newSession.id,
      campaignId: campaign.id,
      eventType: 'LANDING_VIEWED',
      metadata: {},
    })

    return NextResponse.json(
      {
        session_id: newSession.id,
        business_name: config.name,
        logo_url: config.branding.logoUrl,
        primary_color: config.branding.primaryColor,
        welcome_message: config.welcomeMessage,
        google_review_url_exists: Boolean(config.google.reviewUrl),
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Session creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
