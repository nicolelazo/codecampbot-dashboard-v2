import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { calculateProgressPercent } from '@/lib/checklist-data'

const SETTINGS_KEY = 'chapter_checklist_overrides'

interface ChecklistOverrideEntry {
  date_status?: string
  activity_status?: string
}

type ChapterOverrideMap = Record<string, ChecklistOverrideEntry>
type ChecklistOverrides = Record<string, ChapterOverrideMap>

function normalizeChapterMap(raw: unknown): ChapterOverrideMap {
  if (!raw || typeof raw !== 'object') return {}
  const map = raw as Record<string, unknown>
  const normalized: ChapterOverrideMap = {}

  for (const [index, value] of Object.entries(map)) {
    if (typeof value === 'string') {
      // Backward compatibility with legacy overrides that stored one status string.
      normalized[index] = { date_status: value }
      continue
    }
    if (!value || typeof value !== 'object') continue
    const entry = value as Record<string, unknown>
    const date_status = typeof entry.date_status === 'string' ? entry.date_status : undefined
    const activity_status = typeof entry.activity_status === 'string' ? entry.activity_status : undefined
    normalized[index] = { date_status, activity_status }
  }

  return normalized
}

function parseOverrides(raw: string | null | undefined): ChecklistOverrides {
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return {}
    const top = parsed as Record<string, unknown>
    const normalized: ChecklistOverrides = {}
    for (const [chapterId, chapterRaw] of Object.entries(top)) {
      normalized[chapterId] = normalizeChapterMap(chapterRaw)
    }
    return normalized
  } catch {
    return {}
  }
}

export async function GET(req: NextRequest) {
  const chapterId = req.nextUrl.searchParams.get('chapter_id')?.trim().toLowerCase()
  if (!chapterId) {
    return NextResponse.json({ ok: false, error: 'chapter_id is required' }, { status: 400 })
  }

  let supabase
  try {
    supabase = createAdminClient()
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Database client misconfigured' }, { status: 500 })
  }

  const { data, error } = await supabase
    .from('bot_settings')
    .select('value')
    .eq('key', SETTINGS_KEY)
    .maybeSingle()

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })

  const overrides = parseOverrides(data?.value)
  return NextResponse.json({ ok: true, data: overrides[chapterId] ?? {} })
}

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const chapterId = typeof body.chapter_id === 'string' ? body.chapter_id.trim().toLowerCase() : ''
  const itemIndex = typeof body.item_index === 'number' ? String(body.item_index) : typeof body.item_index === 'string' ? body.item_index.trim() : ''
  const dateStatus = typeof body.date_status === 'string'
    ? body.date_status.trim()
    : typeof body.status === 'string'
      ? body.status.trim()
      : ''
  const activityStatus = typeof body.activity_status === 'string' ? body.activity_status.trim() : ''

  if (!chapterId) return NextResponse.json({ ok: false, error: 'chapter_id is required' }, { status: 400 })
  if (!itemIndex) return NextResponse.json({ ok: false, error: 'item_index is required' }, { status: 400 })
  if (!dateStatus && !activityStatus) {
    return NextResponse.json({ ok: false, error: 'At least one status field is required' }, { status: 400 })
  }

  let supabase
  try {
    supabase = createAdminClient()
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Database client misconfigured' }, { status: 500 })
  }

  const { data: existing, error: getError } = await supabase
    .from('bot_settings')
    .select('value')
    .eq('key', SETTINGS_KEY)
    .maybeSingle()
  if (getError) return NextResponse.json({ ok: false, error: getError.message }, { status: 500 })

  const overrides = parseOverrides(existing?.value)
  const chapterOverrides = overrides[chapterId] ?? {}
  const currentEntry = chapterOverrides[itemIndex] ?? {}
  chapterOverrides[itemIndex] = {
    date_status: dateStatus || currentEntry.date_status,
    activity_status: activityStatus || currentEntry.activity_status,
  }
  overrides[chapterId] = chapterOverrides

  const upsertRow = {
    key: SETTINGS_KEY,
    value: JSON.stringify(overrides),
    updated_at: new Date().toISOString(),
  }

  const { error: upsertError } = await supabase
    .from('bot_settings')
    .upsert([upsertRow], { onConflict: 'key' })
  if (upsertError) return NextResponse.json({ ok: false, error: upsertError.message }, { status: 500 })

  const newProgress = calculateProgressPercent(chapterId, overrides[chapterId] ?? {})
  const { error: progressError } = await supabase
    .from('chapters')
    .update({ progress_percent: newProgress })
    .eq('id', chapterId)
  if (progressError) console.error('progress_percent update failed:', progressError.message)

  return NextResponse.json({ ok: true, progress_percent: newProgress })
}
