import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured')
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function maskToken(token: string): string {
  if (!token) return ''
  if (token.length <= 8) return '••••••••'
  return token.slice(0, 6) + '••••••••••••••••••••••••••••••' + token.slice(-4)
}

export async function GET() {
  const supabase = db()
  const { data } = await supabase.from('bot_settings').select('key, value')

  const map: Record<string, string> = {}
  for (const row of (data ?? [])) map[row.key] = row.value

  const rawToken = map['telegram_bot_token'] ?? process.env.TELEGRAM_BOT_TOKEN ?? ''
  const chatId   = map['telegram_chat_id']   ?? process.env.TELEGRAM_CHAT_ID   ?? ''
  const autoStandup = map['auto_standup'] ?? 'true'

  return NextResponse.json({
    telegram_bot_token: maskToken(rawToken),
    telegram_bot_token_set: rawToken.length > 0,
    telegram_chat_id: chatId,
    auto_standup: autoStandup === 'true',
  })
}

export async function POST(req: NextRequest) {
  const body = await req.json()

  let supabase
  try {
    supabase = db()
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Database client misconfigured' }, { status: 500 })
  }

  const upserts: { key: string; value: string; updated_at: string }[] = []
  const now = new Date().toISOString()

  if (body.telegram_bot_token && !body.telegram_bot_token.includes('•')) {
    upserts.push({ key: 'telegram_bot_token', value: body.telegram_bot_token, updated_at: now })
  }
  if (typeof body.telegram_chat_id === 'string') {
    upserts.push({ key: 'telegram_chat_id', value: body.telegram_chat_id, updated_at: now })
  }
  if (typeof body.auto_standup === 'boolean') {
    upserts.push({ key: 'auto_standup', value: String(body.auto_standup), updated_at: now })
  }

  if (upserts.length === 0) {
    return NextResponse.json({ ok: false, error: 'No valid fields' }, { status: 400 })
  }

  const { error } = await supabase.from('bot_settings').upsert(upserts, { onConflict: 'key' })
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
