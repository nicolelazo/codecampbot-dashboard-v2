import { NextResponse } from "next/server"

const PASSWORD = process.env.DASHBOARD_PASSWORD ?? "D3vc0n-C0hort4-2026@"

export async function POST(req: Request) {
  try {
    const { password } = await req.json()
    if (!password || password !== PASSWORD) {
      return NextResponse.json({ ok: false, error: 'Incorrect password.' }, { status: 401 })
    }
    const res = NextResponse.json({ ok: true })
    res.cookies.set('auth_session', '1', {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
    })
    return res
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request.' }, { status: 400 })
  }
}
