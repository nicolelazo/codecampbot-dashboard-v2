import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, quantity, distribution, status, category } = body

  if (!name?.trim() || !category) {
    return NextResponse.json({ ok: false, error: 'name and category are required' }, { status: 400 })
  }

  const supabase = db()
  const normalizedCategory = String(category).trim().toLowerCase()
  const normalizedName = name.trim().toLowerCase()

  // Prevent duplicate item creates when seed data or requests repeat.
  const { data: existingItems, error: existingItemsError } = await supabase
    .from('merch_items')
    .select('id, category, name')

  if (existingItemsError) return NextResponse.json({ ok: false, error: existingItemsError.message }, { status: 500 })

  const duplicate = (existingItems ?? []).find(item =>
    item.category.trim().toLowerCase() === normalizedCategory &&
    item.name.trim().toLowerCase() === normalizedName
  )

  if (duplicate) {
    return NextResponse.json({ ok: false, error: 'Duplicate merch item already exists', duplicateId: duplicate.id }, { status: 409 })
  }

  const { data, error } = await supabase
    .from('merch_items')
    .insert({
      name: name.trim(),
      quantity: Number(quantity) || 0,
      distribution: distribution?.trim() ?? '',
      status: status ?? 'pending',
      category: normalizedCategory,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, data })
}

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { id, ...patch } = body

  if (!id) return NextResponse.json({ ok: false, error: 'id is required' }, { status: 400 })

  const allowed: Record<string, unknown> = {}
  if (patch.name)              allowed.name         = patch.name.trim()
  if (patch.quantity !== undefined) allowed.quantity = Number(patch.quantity)
  if (patch.distribution !== undefined) allowed.distribution = patch.distribution.trim()
  if (patch.status)            allowed.status       = patch.status
  if (patch.category)          allowed.category     = patch.category

  if (Object.keys(allowed).length === 0) {
    return NextResponse.json({ ok: false, error: 'No valid fields to update' }, { status: 400 })
  }

  const supabase = db()
  const { error } = await supabase.from('merch_items').update(allowed).eq('id', id)
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const body = await req.json()
  const { id } = body

  if (!id) return NextResponse.json({ ok: false, error: 'id is required' }, { status: 400 })

  const supabase = db()
  const { error } = await supabase.from('merch_items').delete().eq('id', id)
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
