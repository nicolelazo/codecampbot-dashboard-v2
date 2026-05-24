import { NextResponse, type NextRequest } from "next/server"

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const isAuthPage = pathname.startsWith('/auth') || pathname.startsWith('/login')
  const isAuthenticated = req.cookies.has('auth_session')

  if (!isAuthenticated && !isAuthPage) {
    return NextResponse.redirect(new URL('/auth/login', req.url))
  }

  if (isAuthenticated && pathname === '/auth/login') {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
