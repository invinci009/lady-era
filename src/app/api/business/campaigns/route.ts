import { NextRequest, NextResponse } from 'next/server'
import { getCampaigns, createCampaign, updateCampaign, deleteCampaign } from '@/lib/firebase/firestore'
import { getSessionFromRequest } from '@/lib/firebase/auth'
import { campaignCreateSchema } from '@/lib/validation/schemas'
import { generateRandomSlug } from '@/lib/utils/slug'
import { z } from 'zod'

const patchCampaignSchema = z.object({
  id: z.string(),
  active: z.boolean().optional(),
  name: z.string().min(1).max(200).optional(),
})

// Helper to extract and verify auth token (Bearer header or session cookie)
async function authenticate(request: NextRequest) {
  return getSessionFromRequest(request)
}

export async function GET(request: NextRequest) {
  try {
    const user = await authenticate(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const campaigns = await getCampaigns()
    return NextResponse.json(campaigns, { status: 200 })
  } catch (error) {
    console.error('Campaigns GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await authenticate(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const parsed = campaignCreateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid campaign data', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { name, slug } = parsed.data
    const campaignSlug = slug || generateRandomSlug(8)

    const campaign = await createCampaign({
      name,
      slug: campaignSlug,
      active: true,
    })

    return NextResponse.json(campaign, { status: 201 })
  } catch (error) {
    console.error('Campaign creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await authenticate(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const parsed = patchCampaignSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const { id, active, name } = parsed.data
    await updateCampaign(id, { active, name })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Campaign update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await authenticate(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Missing campaign id' }, { status: 400 })
    }

    await deleteCampaign(id)
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Campaign deletion error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
