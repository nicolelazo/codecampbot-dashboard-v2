import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const ALLOWED_STATUSES = ['completed', 'rescheduling', 'in_progress', 'activating', 'pencil_booked', 'tbc']

function dateTextFromIso(iso: string): string {
  const date = new Date(`${iso}T00:00:00Z`)
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { id, ...patch } = body

  if (!id) return NextResponse.json({ ok: false, error: 'id is required' }, { status: 400 })

  const allowed: Record<string, unknown> = {}
  if (patch.status && ALLOWED_STATUSES.includes(patch.status)) allowed.status = patch.status
  if (typeof patch.name === 'string' && patch.name.trim()) allowed.name = patch.name.trim()
  if (typeof patch.city === 'string' && patch.city.trim()) allowed.city = patch.city.trim()
  if (typeof patch.region === 'string' && patch.region.trim()) allowed.region = patch.region.trim()
  if (typeof patch.venue === 'string' && patch.venue.trim()) allowed.venue = patch.venue.trim()
  if (typeof patch.lead_name === 'string' && patch.lead_name.trim()) allowed.lead_name = patch.lead_name.trim()
  const hasDateTextPatch = typeof patch.date_text === 'string'
  if (hasDateTextPatch) {
    const text = patch.date_text.trim()
    allowed.date_text = text
  }
  if (patch.date_iso === null) {
    allowed.date_iso = null
    if (!hasDateTextPatch) allowed.date_text = 'TBD'
  } else if (typeof patch.date_iso === 'string') {
    const iso = patch.date_iso.trim()
    if (!iso) {
      allowed.date_iso = null
      if (!hasDateTextPatch) allowed.date_text = 'TBD'
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
      allowed.date_iso = iso
      if (!hasDateTextPatch) allowed.date_text = dateTextFromIso(iso)
    }
  }
  if (patch.pax_target !== undefined) {
    if (patch.pax_target === null || patch.pax_target === '') allowed.pax_target = null
    else {
      const parsed = Number(patch.pax_target)
      if (Number.isFinite(parsed)) allowed.pax_target = Math.max(0, Math.floor(parsed))
    }
  }
  if (patch.pax_actual !== undefined) {
    if (patch.pax_actual === null || patch.pax_actual === '') allowed.pax_actual = null
    else {
      const parsed = Number(patch.pax_actual)
      if (Number.isFinite(parsed)) allowed.pax_actual = Math.max(0, Math.floor(parsed))
    }
  }
  if (patch.progress_percent !== undefined) {
    const parsed = Number(patch.progress_percent)
    if (Number.isFinite(parsed)) allowed.progress_percent = Math.min(100, Math.max(0, Math.round(parsed)))
  }
  if (typeof patch.merch_status === 'string') {
    const merchStatus = patch.merch_status.trim()
    if (merchStatus) allowed.merch_status = merchStatus
  }

  if (Object.keys(allowed).length === 0) {
    return NextResponse.json({ ok: false, error: 'No valid fields to update' }, { status: 400 })
  }

  const supabase = db()
  const { error } = await supabase.from('chapters').update(allowed).eq('id', id)
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
