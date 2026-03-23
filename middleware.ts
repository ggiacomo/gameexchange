import { neonAuthMiddleware } from '@neondatabase/auth/next/server'
import { type NextRequest, NextResponse } from 'next/server'

const protectedMiddleware = neonAuthMiddleware({ loginUrl: '/login' })

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Redirect logged-in users away from auth pages
  if (pathname === '/login' || pathname === '/register') {
    const sessionCookie = request.cookies.get('__Secure-neon-auth.session_token')
    if (sessionCookie?.value) {
      return NextResponse.redirect(new URL('/feed', request.url))
    }
    return NextResponse.next()
  }

  // /onboarding is the OAuth callback target for new users — let neonAuthMiddleware
  // run so it can exchange the OAuth session verifier, but don't block unauthenticated
  // access (new users arrive here without a session yet).
  if (pathname.startsWith('/onboarding')) {
    const hasVerifier = request.nextUrl.searchParams.has('neon_auth_session_verifier')
    const hasChallenge = request.cookies.has('__Secure-neon-auth.session_challange')
    if (hasVerifier && hasChallenge) {
      // Let neonAuthMiddleware handle the token exchange
      return protectedMiddleware(request)
    }
    return NextResponse.next()
  }

  return protectedMiddleware(request)
}

export const config = {
  matcher: [
    '/login',
    '/register',
    '/onboarding',
    '/onboarding/:path*',
    '/feed',
    '/feed/:path*',
    '/library',
    '/library/:path*',
    '/wishlist',
    '/wishlist/:path*',
    '/proposals',
    '/proposals/:path*',
    '/inbox',
    '/inbox/:path*',
    '/notifications',
    '/notifications/:path*',
    '/settings',
    '/settings/:path*',
    '/profile/me',
    '/profile/me/:path*',
    '/admin',
    '/admin/:path*',
  ],
}
