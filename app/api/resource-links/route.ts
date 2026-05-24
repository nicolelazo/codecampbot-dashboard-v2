import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const VALID_COLORS = ['blue', 'teal', 'yellow', 'purple'] as const
type IconColor = (typeof VALID_COLORS)[number]

export async function GET() {
  const supabase = db()
  const { data, error } = await supabase
    .from('resource_links')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, data: data ?? [] })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, description, url, icon, icon_color, category } = body

  if (!name?.trim() || !url?.trim()) {
    return NextResponse.json({ ok: false, error: 'name and url are required' }, { status: 400 })
  }

  const color: IconColor = VALID_COLORS.includes(icon_color) ? (icon_color as IconColor) : 'blue'

  const supabase = db()

  // Deduplicate: block exact name+url+category duplicates
  const { data: existing } = await supabase
    .from('resource_links')
    .select('id, name, url, category')

  const normalizedName = name.trim().toLowerCase()
  const normalizedUrl = url.trim().toLowerCase()
  const normalizedCat = (category ?? '').trim().toLowerCase()

  const duplicate = (existing ?? []).find(
    (r) =>
      r.name.trim().toLowerCase() === normalizedName &&
      r.url.trim().toLowerCase() === normalizedUrl &&
      r.category.trim().toLowerCase() === normalizedCat
  )

  if (duplicate) {
    return NextResponse.json(
      { ok: false, error: 'A link with this name, URL and category already exists', duplicateId: duplicate.id },
      { status: 409 }
    )
  }

  const { data, error } = await supabase
    .from('resource_links')
    .insert({
      name: name.trim(),
      description: description?.trim() ?? '',
      url: url.trim(),
      icon: icon?.trim() || '🔗',
      icon_color: color,
      category: category?.trim() || 'General',
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
  if (patch.name)        allowed.name        = patch.name.trim()
  if (patch.description !== undefined) allowed.description = patch.description?.trim() ?? ''
  if (patch.url)         allowed.url         = patch.url.trim()
  if (patch.icon)        allowed.icon        = patch.icon.trim()
  if (patch.icon_color && VALID_COLORS.includes(patch.icon_color)) allowed.icon_color = patch.icon_color
  if (patch.category)    allowed.category    = patch.category.trim()

  if (Object.keys(allowed).length === 0) {
    return NextResponse.json({ ok: false, error: 'No valid fields to update' }, { status: 400 })
  }

  const supabase = db()
  const { error } = await supabase.from('resource_links').update(allowed).eq('id', id)
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const body = await req.json()
  const { id } = body

  if (!id) return NextResponse.json({ ok: false, error: 'id is required' }, { status: 400 })

  const supabase = db()
  const { error } = await supabase.from('resource_links').delete().eq('id', id)
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
