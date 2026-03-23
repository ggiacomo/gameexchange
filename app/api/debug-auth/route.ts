import { NextResponse } from 'next/server'

// Endpoint temporaneo di debug — da rimuovere dopo il fix
export async function GET() {
  const base = process.env.NEON_AUTH_BASE_URL
  if (!base) return NextResponse.json({ error: 'NEON_AUTH_BASE_URL not set' })

  // Chiama sign-in con localhost (trusted) e mostra i cookie di risposta
  const res = await fetch(`${base}/sign-in/email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'origin': 'http://localhost:3000',
    },
    body: JSON.stringify({ email: 'test@test.com', password: 'wrongpassword' }),
  })

  const body = await res.text()
  const setCookie = res.headers.get('set-cookie')
  const allHeaders: Record<string, string> = {}
  res.headers.forEach((v, k) => { allHeaders[k] = v })

  return NextResponse.json({
    status: res.status,
    body,
    setCookie,
    allHeaders,
  })
}
