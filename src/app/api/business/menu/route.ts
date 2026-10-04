import { NextRequest, NextResponse } from 'next/server'
import { getMenuItems, createMenuItem, updateMenuItem, deleteMenuItem } from '@/lib/firebase/firestore'
import { getSessionFromRequest } from '@/lib/firebase/auth'
import { z } from 'zod'

const addDishSchema = z.object({
  name: z.string().min(1).max(100),
})

const patchDishSchema = z.object({
  id: z.string(),
  active: z.boolean(),
})

async function authenticate(request: NextRequest) {
  return getSessionFromRequest(request)
}

export async function GET(request: NextRequest) {
  try {
    const user = await authenticate(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const items = await getMenuItems()
    return NextResponse.json(items, { status: 200 })
  } catch (error) {
    console.error('Menu GET error:', error)
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
    const parsed = addDishSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid dish name' }, { status: 400 })
    }

    const { name } = parsed.data
    const item = await createMenuItem({
      name: { en: name },
      position: 1,
    })

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    console.error('Add menu item error:', error)
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
    const parsed = patchDishSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const { id, active } = parsed.data
    await updateMenuItem(id, { active })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Update menu item error:', error)
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
      return NextResponse.json({ error: 'Missing dish id' }, { status: 400 })
    }

    await deleteMenuItem(id)
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Delete menu item error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
