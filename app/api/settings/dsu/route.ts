import { NextResponse } from 'next/server'
import { unstable_noStore } from 'next/cache'
import { createClient } from '@supabase/supabase-js'
import { buildDsuOverview } from '@/lib/telegram/bot'

const noStoreFetch: typeof fetch = (input, init) =>
  fetch(input, { ...init, cache: 'no-store', next: { revalidate: 0 } } as RequestInit & { next: { revalidate: 0 } })

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { global: { fetch: noStoreFetch } }
  )
}

async function getSettings() {
  const supabase = db()
  const { data } = await supabase.from('bot_settings').select('key, value')
  const map: Record<string, string> = {}
  for (const row of (data ?? [])) map[row.key] = row.value
  return {
    token:  map['telegram_bot_token'] ?? process.env.TELEGRAM_BOT_TOKEN ?? '',
    chatId: map['telegram_chat_id']   ?? process.env.TELEGRAM_CHAT_ID   ?? '',
  }
}

// GET — preview DSU message
export async function GET() {
  unstable_noStore()
  const overview = await buildDsuOverview()
  return NextResponse.json({ ok: true, text: overview.text, keyboard: overview.keyboard })
}

// POST — send DSU now
export async function POST() {
  unstable_noStore()
  const { token, chatId } = await getSettings()
  if (!token)  return NextResponse.json({ ok: false, error: 'No bot token configured' }, { status: 400 })
  if (!chatId) return NextResponse.json({ ok: false, error: 'No chat ID configured' }, { status: 400 })

  const overview = await buildDsuOverview()

  async function tgSend(text: string, replyMarkup?: object) {
    const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', ...(replyMarkup ? { reply_markup: replyMarkup } : {}) }),
    })
    return r.json() as Promise<{ ok: boolean; description?: string }>
  }

  const TELEGRAM_MAX = 4096
  let result: { ok: boolean; description?: string }

  if (overview.text.length <= TELEGRAM_MAX) {
    result = await tgSend(overview.text, overview.keyboard)
  } else {
    const marker = '\n\n<b>✅ Urgent Tasks</b>'
    const markerIdx = overview.text.indexOf(marker)
    const splitAt = (markerIdx > 0 && markerIdx < TELEGRAM_MAX)
      ? markerIdx
      : overview.text.slice(0, TELEGRAM_MAX).lastIndexOf('\n\n')
    const cut = splitAt > 1000 ? splitAt : TELEGRAM_MAX
    await tgSend(overview.text.slice(0, cut))
    result = await tgSend(overview.text.slice(cut).replace(/^\n+/, ''), overview.keyboard)
  }

  if (!result.ok) return NextResponse.json({ ok: false, error: result.description }, { status: 500 })

  return NextResponse.json({ ok: true })
}
