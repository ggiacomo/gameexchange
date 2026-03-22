import { type NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check for better-auth session cookie
  const sessionToken = request.cookies.get('better-auth.session_token')

  const isAuthPage = pathname === '/login' || pathname === '/register'
  const isPublicPath =
    isAuthPage ||
    pathname.startsWith('/api/auth') ||
    pathname === '/onboarding' ||
    pathname.startsWith('/auth/')

  const isProtectedPath =
    !isPublicPath &&
    !pathname.startsWith('/_next') &&
    !pathname.startsWith('/api/games') &&
    pathname !== '/favicon.ico'

  if (!sessionToken && isProtectedPath) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (sessionToken && isAuthPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
