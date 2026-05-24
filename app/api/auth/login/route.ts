import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

const ADMIN_EMAIL = 'ctambis@devcon.ph'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const password = typeof body.password === 'string' ? body.password : ''

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ ok: false, error: 'Login is unavailable.' }, { status: 500 })
  }

  if (!password) {
    return NextResponse.json({ ok: false, error: 'Password is required.' }, { status: 400 })
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
      },
    },
  })

  const { error } = await supabase.auth.signInWithPassword({ email: ADMIN_EMAIL, password })
  if (error) {
    return NextResponse.json({ ok: false, error: 'Incorrect password.' }, { status: 401 })
  }

  return NextResponse.json({ ok: true })
}
