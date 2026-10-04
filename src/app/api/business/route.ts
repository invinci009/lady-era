import { NextRequest, NextResponse } from 'next/server'
import { getRestaurantSettings, saveRestaurantSettings } from '@/lib/firebase/firestore'
import { getRestaurantConfig } from '@/config/loader'
import { getSessionFromRequest } from '@/lib/firebase/auth'
import { z } from 'zod'

const businessUpdateSchema = z.object({
  name: z.string().min(1).max(200),
  location: z.string().max(500).optional(),
  phone: z.string().max(50).optional().nullable(),
  secondary_phone: z.string().max(100).optional().nullable(),
  timezone: z.string().default('Asia/Kolkata'),
  logo_url: z.string().url().optional().nullable(),
  primary_color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().nullable(),
  welcome_message: z.record(z.string(), z.string()).optional(),
  google_review_url: z.string().url().optional().nullable(),
})

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionFromRequest(request)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let settings = await getRestaurantSettings()

    if (!settings) {
      const config = getRestaurantConfig()
      settings = {
        id: 'settings',
        name: config.name,
        slug: config.slug,
        contact: config.contact,
        location: config.location,
        google: config.google,
        branding: config.branding,
        features: config.features,
        settings: config.settings,
        welcomeMessage: config.welcomeMessage,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    }

    return NextResponse.json(settings, { status: 200 })
  } catch (error) {
    console.error('Business GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionFromRequest(request)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const parsed = businessUpdateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid business data', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const data = parsed.data

    await saveRestaurantSettings({
      name: data.name,
      slug: data.name.toLowerCase().replace(/\s+/g, '-'),
      contact: {
        phone: data.phone || undefined,
        email: undefined,
      },
      location: {
        address: data.location || undefined,
      },
      google: {
        reviewUrl: data.google_review_url || '',
      },
      branding: {
        logoUrl: data.logo_url || undefined,
        primaryColor: data.primary_color || '#d97706',
        secondaryColor: '#1e293b',
      },
      features: {
        aiReviews: true,
        privateFeedback: true,
        crm: true,
        campaignAnalytics: true,
        menuManagement: true,
      },
      settings: {
        defaultLanguage: 'en',
        supportedLanguages: ['en'],
        timezone: data.timezone || 'Asia/Kolkata',
      },
      welcomeMessage: data.welcome_message || { en: 'Welcome!' },
    })

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    console.error('Business POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
