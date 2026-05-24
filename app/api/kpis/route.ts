import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { id, value } = body

  if (!id || value === undefined || value === null) {
    return NextResponse.json({ ok: false, error: 'id and value are required' }, { status: 400 })
  }

  const supabase = db()
  const { error } = await supabase.from('kpis').update({ value: String(value) }).eq('id', id)
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
