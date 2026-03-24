import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/server'

export async function GET() {
  const base = process.env.NEON_AUTH_BASE_URL
  if (!base) return NextResponse.json({ error: 'NEON_AUTH_BASE_URL not set' })

  // 1. Signup — vediamo i Set-Cookie headers
  const signupRes = await fetch(`${base}/sign-up/email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'origin': `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://gameexchange-teal.vercel.app'}`,
    },
    body: JSON.stringify({ email: `dbgfull${Date.now()}@mailinator.com`, password: 'Test1234!', name: 'dbguser' }),
  })

  const signupBody = await signupRes.text()
  const signupCookies: string[] = []
  // getSetCookie() ritorna array di tutti i Set-Cookie
  if (typeof (signupRes.headers as any).getSetCookie === 'function') {
    signupCookies.push(...(signupRes.headers as any).getSetCookie())
  } else {
    const c = signupRes.headers.get('set-cookie')
    if (c) signupCookies.push(c)
  }

  return NextResponse.json({
    signup_status: signupRes.status,
    signup_body: signupBody.slice(0, 300),
    signup_cookies: signupCookies,
  })
}
