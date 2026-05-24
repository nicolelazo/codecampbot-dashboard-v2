import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

function db() {
  return createAdminClient()
}

function normalizeDbError(message: string): string {
  if (/row-level security policy/i.test(message) && /chapter[-_]tasks/i.test(message)) {
    return `${message}. Check SUPABASE_SERVICE_ROLE_KEY: it must be the service_role key, not anon.`
  }
  return message
}

const CHAPTER_CODES: Record<string, string> = {
  manila:   'MNL',
  tacloban: 'TCL',
  iloilo:   'ILO',
  bukidnon: 'BKD',
  pampanga: 'PMP',
  laguna:   'LGN',
}

async function generateShortId(supabase: ReturnType<typeof db>, chapter_id: string): Promise<string> {
  const code = CHAPTER_CODES[chapter_id.toLowerCase()] ?? chapter_id.slice(0, 3).toUpperCase()
  const { count } = await supabase
    .from('chapter_tasks')
    .select('*', { count: 'exact', head: true })
    .eq('chapter_id', chapter_id.toLowerCase())
  return `${code}-t${(count ?? 0) + 1}`
}

export async function POST(req: NextRequest) {
  let supabase
  try {
    supabase = db()
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Database client misconfigured' }, { status: 500 })
  }

  const body = await req.json()
  const { chapter_id, owner, description } = body

  if (!chapter_id || !owner?.trim() || !description?.trim()) {
    return NextResponse.json({ ok: false, error: 'chapter_id, owner, and description are required' }, { status: 400 })
  }

  const short_id = await generateShortId(supabase, chapter_id)

  const { data, error } = await supabase
    .from('chapter_tasks')
    .insert({ chapter_id: chapter_id.toLowerCase(), owner: owner.trim(), description: description.trim(), status: 'pending', short_id })
    .select()
    .single()

  if (error) return NextResponse.json({ ok: false, error: normalizeDbError(error.message) }, { status: 500 })
  return NextResponse.json({ ok: true, data })
}

export async function PATCH(req: NextRequest) {
  let supabase
  try {
    supabase = db()
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Database client misconfigured' }, { status: 500 })
  }

  const body = await req.json()
  const { id, ...patch } = body

  if (!id) return NextResponse.json({ ok: false, error: 'id is required' }, { status: 400 })

  const allowed: Record<string, unknown> = {}
  if (patch.status)      allowed.status      = patch.status
  if (patch.owner)       allowed.owner       = patch.owner.trim()
  if (patch.description) allowed.description = patch.description.trim()

  if (Object.keys(allowed).length === 0) {
    return NextResponse.json({ ok: false, error: 'No valid fields to update' }, { status: 400 })
  }

  const { error } = await supabase.from('chapter_tasks').update(allowed).eq('id', id)
  if (error) return NextResponse.json({ ok: false, error: normalizeDbError(error.message) }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  let supabase
  try {
    supabase = db()
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Database client misconfigured' }, { status: 500 })
  }

  const body = await req.json()
  const { id } = body

  if (!id) return NextResponse.json({ ok: false, error: 'id is required' }, { status: 400 })

  const { error } = await supabase.from('chapter_tasks').delete().eq('id', id)
  if (error) return NextResponse.json({ ok: false, error: normalizeDbError(error.message) }, { status: 500 })
  return NextResponse.json({ ok: true })
}
