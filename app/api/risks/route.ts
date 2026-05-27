import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET() {
  const supabase = db()
  const { data, error } = await supabase
    .from('risks')
    .select('id, code, title, chapter_tag, severity, status, owner')
    .order('code')
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, data })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { title, description, owner, chapter_tag, severity, risk_type, eta } = body

  if (!title?.trim() || !severity) {
    return NextResponse.json({ ok: false, error: 'title and severity are required' }, { status: 400 })
  }

  const supabase = db()
  const normalizedTitle = title.trim().toLowerCase()
  const normalizedChapterTag = (chapter_tag?.trim() ?? 'All').toLowerCase()

  // Prevent duplicate active risks (open, in_progress, or blocked) with the same title + chapter
  const { data: activeRisks, error: activeRisksError } = await supabase
    .from('risks')
    .select('id, title, chapter_tag')
    .in('status', ['open', 'in_progress', 'blocked'])

  if (activeRisksError) {
    return NextResponse.json({ ok: false, error: activeRisksError.message }, { status: 500 })
  }

  const duplicate = (activeRisks ?? []).find(r =>
    r.title.trim().toLowerCase() === normalizedTitle &&
    r.chapter_tag.trim().toLowerCase() === normalizedChapterTag
  )

  if (duplicate) {
    return NextResponse.json(
      { ok: false, error: 'A risk with this title already exists for this chapter', duplicateId: duplicate.id },
      { status: 409 }
    )
  }

  // Auto-generate risk code
  const { data: existing } = await supabase
    .from('risks')
    .select('code')
    .order('created_at', { ascending: false })
    .limit(1)

  const lastCode = existing?.[0]?.code ?? 'R0'
  const nextNum  = (parseInt(lastCode.replace(/^R/i, '')) || 0) + 1
  const code     = `R${nextNum}`

  const { data, error } = await supabase
    .from('risks')
    .insert({
      code,
      title:       title.trim(),
      description: description?.trim() ?? '',
      owner:       owner?.trim() ?? 'HQ',
      chapter_tag: chapter_tag?.trim() ?? 'All',
      severity,
      status:      'open',
      risk_type:   risk_type?.trim() ?? 'Logistical',
      eta:         eta?.trim() || null,
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

  const VALID_STATUSES = ['open', 'in_progress', 'blocked', 'resolved']

  const allowed: Record<string, unknown> = {}
  if (patch.severity)                              allowed.severity  = patch.severity
  if (patch.status && VALID_STATUSES.includes(patch.status)) allowed.status = patch.status
  if (patch.title)                                 allowed.title     = patch.title.trim()
  if (patch.owner)                                 allowed.owner     = patch.owner.trim()
  if (patch.risk_type)                             allowed.risk_type = patch.risk_type.trim()
  if ('eta' in patch)                              allowed.eta       = patch.eta?.trim() || null

  if (Object.keys(allowed).length === 0) {
    return NextResponse.json({ ok: false, error: 'No valid fields to update' }, { status: 400 })
  }

  const supabase = db()
  const { error } = await supabase.from('risks').update(allowed).eq('id', id)
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const body = await req.json()
  const { id } = body

  if (!id) return NextResponse.json({ ok: false, error: 'id is required' }, { status: 400 })

  const supabase = db()
  const { error } = await supabase.from('risks').delete().eq('id', id)
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
