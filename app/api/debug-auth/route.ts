import { NextResponse } from 'next/server'

export async function GET() {
  const base = process.env.NEON_AUTH_BASE_URL
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://gameexchange-teal.vercel.app'
  if (!base) return NextResponse.json({ error: 'NEON_AUTH_BASE_URL not set' })

  // Step 1: Signup
  const signupRes = await fetch(`${base}/sign-up/email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'origin': appUrl,
    },
    body: JSON.stringify({ email: `dbgfull${Date.now()}@mailinator.com`, password: 'Test1234!', name: 'dbguser' }),
  })

  const signupBody = await signupRes.text()
  const signupCookies: string[] = []
  if (typeof (signupRes.headers as any).getSetCookie === 'function') {
    signupCookies.push(...(signupRes.headers as any).getSetCookie())
  } else {
    const c = signupRes.headers.get('set-cookie')
    if (c) signupCookies.push(c)
  }

  // Estrai il session token dai cookie di signup
  const sessionToken = signupCookies
    .map(c => c.split(';')[0])
    .find(c => c.startsWith('__Secure-neon-auth.session_token=') || c.startsWith('neon-auth.session_token='))

  if (!sessionToken) {
    return NextResponse.json({
      signup_status: signupRes.status,
      signup_body: signupBody.slice(0, 300),
      signup_cookies: signupCookies,
      error: 'No session token found in signup cookies',
    })
  }

  // Step 2: get-session CON Origin (come fa il proxy)
  const sessionResWithOrigin = await fetch(`${base}/get-session`, {
    method: 'GET',
    headers: {
      'Cookie': sessionToken,
      'origin': appUrl,
    },
  })
  const sessionBodyWithOrigin = await sessionResWithOrigin.text()

  // Step 3: get-session SENZA Origin (come fa neonAuth() server-side)
  const sessionResNoOrigin = await fetch(`${base}/get-session`, {
    method: 'GET',
    headers: {
      'Cookie': sessionToken,
    },
  })
  const sessionBodyNoOrigin = await sessionResNoOrigin.text()

  return NextResponse.json({
    signup_status: signupRes.status,
    signup_body: signupBody.slice(0, 300),
    signup_cookies: signupCookies,
    session_token_found: sessionToken.split('=')[0],
    get_session_with_origin: {
      status: sessionResWithOrigin.status,
      body: sessionBodyWithOrigin.slice(0, 300),
    },
    get_session_no_origin: {
      status: sessionResNoOrigin.status,
      body: sessionBodyNoOrigin.slice(0, 300),
    },
  })
}
