import { NextRequest, NextResponse } from 'next/server'
import { handleUpdate } from '@/lib/telegram/bot'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(req: NextRequest) {
  const body = await req.json()
  await handleUpdate(body)
  return NextResponse.json({ ok: true })
}
